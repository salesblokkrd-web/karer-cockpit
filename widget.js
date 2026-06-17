// Кокпит Карьер — виджет для Scriptable (iOS)
// Поддерживает ДВА места:
//   • экран БЛОКИРОВКИ (lock screen, accessoryRectangular) — компактные строки
//   • домашний экран (medium) — полупрозрачный «стеклянный» блок
const URL = "https://salesblokkrd-web.github.io/karer-cockpit/cockpit.json";

function spaces(n){
  let s = Math.abs(Math.round(Number(n))).toString(), out = "", c = 0;
  for (let i = s.length - 1; i >= 0; i--){ out = s[i] + out; if (++c % 3 === 0 && i) out = " " + out; }
  return (n < 0 ? "−" : "") + out;
}
function rub(n){ return spaces(n) + " ₽"; }
// короткий формат для тесного экрана блокировки: 1 250 000 → 1,25 млн
function rubShort(n){
  n = Number(n) || 0;
  if (Math.abs(n) >= 1e6) return (n/1e6).toFixed(2).replace(".", ",") + " млн";
  if (Math.abs(n) >= 1e4) return Math.round(n/1e3) + " тыс";
  return spaces(n) + " ₽";
}
function num(n){ return Number(n).toLocaleString("ru-RU", {maximumFractionDigits:1}); }

let d;
try { d = await new Request(URL).loadJSON(); } catch (e) { d = null; }

const fam = config.widgetFamily;            // 'accessoryRectangular' | 'medium' | ...
const isLock = fam && String(fam).startsWith("accessory");

if (isLock) { renderLock(); } else { renderHome(); }

// ── ЭКРАН БЛОКИРОВКИ (компактно, iOS тонирует сам) ──
function renderLock(){
  const w = new ListWidget();
  w.addAccessoryWidgetBackground = true;
  w.setPadding(2, 4, 2, 4);
  if (!d){ w.addText("Кокпит · нет связи").font = Font.mediumSystemFont(11); finish(w); return; }
  const a = w.addText("Выр " + rubShort(d.rev_today)); a.font = Font.boldSystemFont(14);
  const b = w.addText("Касса " + rubShort(d.kassa_nal_today)); b.font = Font.systemFont(11);
  const c = w.addText("Отгр " + num(d.tons_today) + " т"); c.font = Font.systemFont(11);
  finish(w);
}

// ── ДОМАШНИЙ ЭКРАН (стеклянный блок) ──
function renderHome(){
  const w = new ListWidget();
  const grad = new LinearGradient();
  grad.colors = [new Color("#0b1020", 0.80), new Color("#16224a", 0.62)];
  grad.locations = [0, 1];
  w.backgroundGradient = grad;
  w.setPadding(12, 14, 12, 12);

  if (!d){ const t = w.addText("Кокпит · нет связи"); t.textColor = Color.white(); t.font = Font.mediumSystemFont(13); finish(w); return; }

  const target = (d.breakeven_m3 || 17547) * 361;
  const ratio = (d.rev_month || 0) / target;
  let col, status;
  if (ratio >= 0.9){ col = new Color("#27c281"); status = "В норме"; }
  else if (ratio >= 0.4){ col = new Color("#f5b53d"); status = "Ниже плана"; }
  else { col = new Color("#ef5b6b"); status = "Ниже безубыт."; }
  const mut = new Color("#8da0c8");

  const head = w.addStack(); head.centerAlignContent();
  const dot = SFSymbol.named("circle.fill"); dot.applyFont(Font.systemFont(13));
  const di = head.addImage(dot.image); di.imageSize = new Size(13,13); di.tintColor = col;
  head.addSpacer(6);
  const ttl = head.addText("КОКПИТ · КАРЬЕР"); ttl.textColor = Color.white(); ttl.font = Font.semiboldSystemFont(12);
  head.addSpacer();
  const st = head.addText(status); st.textColor = col; st.font = Font.boldSystemFont(12);
  w.addSpacer(8);

  function row(label, value, big){
    const s = w.addStack(); s.centerAlignContent();
    const l = s.addText(label); l.textColor = mut; l.font = Font.systemFont(big?12:11);
    s.addSpacer();
    const v = s.addText(value); v.textColor = Color.white();
    v.font = big ? Font.boldSystemFont(16) : Font.semiboldSystemFont(13);
    w.addSpacer(big?5:3);
  }
  row("Выручка сегодня", rub(d.rev_today || 0), true);
  row("Наличка касса", rub(d.kassa_nal_today || 0));
  row("Безнал сегодня", rub(d.pay_beznal_today || 0));
  row("Отгрузка сегодня", num(d.tons_today || 0) + " т");

  w.addSpacer(4);
  const upd = w.addText("обновлено " + (d.updated || "—"));
  upd.textColor = mut; upd.font = Font.systemFont(9);
  finish(w);
}

function finish(w){
  w.refreshAfterDate = new Date(Date.now() + 30*60*1000);
  Script.setWidget(w);
  if (!config.runsInWidget) w.presentMedium();
  Script.complete();
}

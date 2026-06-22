// Кокпит Карьер — модуль виджета (Scriptable, iOS)
//   Загружается лоадером, который сам тянет свежую версию с GitHub.
//   Поддерживает: экран БЛОКИРОВКИ (accessoryRectangular) + домашний (medium).
const URL = "https://salesblokkrd-web.github.io/karer-cockpit/cockpit.json";

function spaces(n){
  let s = Math.abs(Math.round(Number(n))).toString(), out = "", c = 0;
  for (let i = s.length - 1; i >= 0; i--){ out = s[i] + out; if (++c % 3 === 0 && i) out = " " + out; }
  return (n < 0 ? "−" : "") + out;
}
function rub(n){ return spaces(n) + " ₽"; }
function rubShort(n){
  n = Number(n) || 0;
  if (Math.abs(n) >= 1e6) return (n/1e6).toFixed(2).replace(".", ",") + " млн";
  if (Math.abs(n) >= 1e4) return Math.round(n/1e3) + " тыс";
  return spaces(n) + " ₽";
}
function num(n){ return Number(n||0).toLocaleString("ru-RU", {maximumFractionDigits:1}); }

// надёжная загрузка: таймаут + 2 повтора (лечит «нет связи»)
async function loadData(){
  for (let attempt = 0; attempt < 3; attempt++){
    try {
      const r = new Request(URL);
      r.timeoutInterval = 12;
      return await r.loadJSON();
    } catch (e) {
      if (attempt === 2) return null;
    }
  }
  return null;
}

module.exports.run = async function(){
  const d = await loadData();
  const isLock = config.widgetFamily && String(config.widgetFamily).startsWith("accessory");
  if (isLock) renderLock(d); else renderHome(d);
};

// ── ЭКРАН БЛОКИРОВКИ ──
function renderLock(d){
  const w = new ListWidget();
  w.addAccessoryWidgetBackground = true;
  w.setPadding(2, 4, 2, 4);
  if (!d){ w.addText("Кокпит · обновляется…").font = Font.mediumSystemFont(11); finish(w); return; }
  const a = w.addText("Выр.мес " + rubShort(d.rev_month)); a.font = Font.boldSystemFont(14);
  const b = w.addText("Отгр " + num(d.tons_month) + " т"); b.font = Font.systemFont(11);
  const c = w.addText("Долг " + rubShort(d.debt_total)); c.font = Font.systemFont(11);
  finish(w);
}

// ── ДОМАШНИЙ ЭКРАН ──
function renderHome(d){
  const w = new ListWidget();
  const grad = new LinearGradient();
  grad.colors = [new Color("#0b1020", 0.80), new Color("#16224a", 0.62)];
  grad.locations = [0, 1];
  w.backgroundGradient = grad;
  w.setPadding(12, 14, 12, 12);
  if (!d){ const t = w.addText("Кокпит · обновляется…"); t.textColor = Color.white(); t.font = Font.mediumSystemFont(13); finish(w); return; }

  // светофор по прогнозу месяца (как на дашборде)
  const now = new Date();
  const dim = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const forecast = now.getDate() > 0 ? (d.rev_month||0)/now.getDate()*dim : (d.rev_month||0);
  const target = (d.breakeven_m3 || 17547) * 361;
  const ratio = forecast / target;
  let col, status;
  if (ratio >= 0.9){ col = new Color("#27c281"); status = "В норме"; }
  else if (ratio >= 0.55){ col = new Color("#f5b53d"); status = "Ниже безубыт."; }
  else { col = new Color("#ef5b6b"); status = "Сильно ниже"; }
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
  row("Выручка, месяц", rub(d.rev_month), true);
  row("Поступило, месяц", rub(d.pay_month));
  row("Отгрузка, месяц", num(d.tons_month) + " т");
  row("Долги клиентов", rub(d.debt_total));

  w.addSpacer(4);
  const today = w.addText("сегодня: выр " + spaces(d.rev_today||0) + " · отгр " + num(d.tons_today) + " т");
  today.textColor = mut; today.font = Font.systemFont(9);
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

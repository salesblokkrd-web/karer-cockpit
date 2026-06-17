// Кокпит Карьер — виджет для Scriptable (iOS)
// Читает живые цифры с GitHub Pages. Полупрозрачный «стеклянный» фон.
const URL = "https://salesblokkrd-web.github.io/karer-cockpit/cockpit.json";

// ── деньги/числа с пробелами ──
function rub(n){ return spaces(Math.round(Number(n))) + " ₽"; }
function spaces(n){
  let s = Math.abs(n).toString(), out = "", c = 0;
  for (let i = s.length - 1; i >= 0; i--){ out = s[i] + out; if (++c % 3 === 0 && i) out = " " + out; }
  return (n < 0 ? "−" : "") + out;
}
function num(n){ return Number(n).toLocaleString("ru-RU", {maximumFractionDigits:0}); }

// ── данные ──
let d;
try { d = await new Request(URL).loadJSON(); }
catch (e) { d = null; }

const w = new ListWidget();
// полупрозрачный тёмный градиент (стекло)
const g = new LinearGradient();
g.colors = [new Color("#0b1020", 0.80), new Color("#16224a", 0.62)];
g.locations = [0, 1];
w.backgroundGradient = g;
w.setPadding(12, 14, 12, 12);

if (!d){
  const t = w.addText("Кокпит · нет связи");
  t.textColor = Color.white(); t.font = Font.mediumSystemFont(13);
  Script.setWidget(w);
  if (!config.runsInWidget) w.presentMedium();
  Script.complete();
  return;
}

// ── светофор ──
const target = (d.breakeven_m3 || 17547) * 361;       // ориентир в деньгах
const ratio = (d.rev_month || 0) / target;
let col, status;
if (ratio >= 0.9){ col = new Color("#27c281"); status = "В норме"; }
else if (ratio >= 0.4){ col = new Color("#f5b53d"); status = "Ниже плана"; }
else { col = new Color("#ef5b6b"); status = "Ниже безубыт."; }

const mut = new Color("#8da0c8");

// шапка: точка + заголовок + статус
const head = w.addStack(); head.centerAlignContent();
const dot = SFSymbol.named("circle.fill"); dot.applyFont(Font.systemFont(13));
const di = head.addImage(dot.image); di.imageSize = new Size(13,13); di.tintColor = col;
head.addSpacer(6);
const ttl = head.addText("КОКПИТ · КАРЬЕР"); ttl.textColor = Color.white(); ttl.font = Font.semiboldSystemFont(12);
head.addSpacer();
const st = head.addText(status); st.textColor = col; st.font = Font.boldSystemFont(12);
w.addSpacer(8);

// строка-метрика: подпись слева, значение справа
function row(label, value, big){
  const s = w.addStack(); s.centerAlignContent();
  const l = s.addText(label); l.textColor = mut; l.font = Font.systemFont(big?12:11);
  s.addSpacer();
  const v = s.addText(value); v.textColor = Color.white();
  v.font = big ? Font.boldSystemFont(17) : Font.semiboldSystemFont(13);
  w.addSpacer(big?5:3);
}

row("Выручка, месяц", rub(d.rev_month), true);
row("Безнал, месяц", rub(d.pay_beznal_month || 0));
row("Нал без чека, мес", rub(d.nal_nocheck_month || 0));
row("Отгрузка, месяц", num(d.tons_month) + " т");
row("Долги клиентов", rub(d.debt_total));

w.addSpacer(4);
const upd = w.addText("обновлено " + (d.updated || "—"));
upd.textColor = mut; upd.font = Font.systemFont(9);

w.refreshAfterDate = new Date(Date.now() + 30*60*1000); // обновлять ~раз в 30 мин
Script.setWidget(w);
if (config.runsInWidget) {} else { w.presentMedium(); }
Script.complete();

const pptxgen = require("pptxgenjs");

const slideConfig = { type: "content", index: 5, title: "这个模块在记什么" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("这个模块在记什么", { x: 0.6, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
  slide.addText("仓库铜线领用表：以「生产任务单」为单位，逐条登记线径规格的领出、回库、报废，系统自动算出实际用量。", { x: 0.6, y: 1.12, w: 8.8, h: 0.5, fontSize: 13.5, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left" });

  const header = ["日期", "生产任务单号", "线径规格", "领出(kg)", "回库(kg)", "报废线头(kg)", "实际用量(kg)", "填写人"];
  const row = ["2026-07-28", "RW20260728-01", "Φ0.50", "12.5000", "1.2000", "0.3000", "11.0000", "王伟"];
  const rows = [
    header.map(h => ({ text: h, options: { fill: { color: theme.primary }, color: "FFFFFF", bold: true, fontSize: 11.5, align: "center", valign: "middle", fontFace: "Microsoft YaHei" } })),
    row.map((c, i) => ({ text: c, options: { fill: { color: "FFFFFF" }, color: i === 6 ? theme.accent : "2E2E2E", bold: i === 6, fontSize: 11.5, align: "center", valign: "middle", fontFace: "Microsoft YaHei" } }))
  ];
  slide.addTable(rows, { x: 0.6, y: 1.85, w: 8.8, colW: [1.15, 1.55, 1.0, 1.0, 1.0, 1.25, 1.25, 0.9], rowH: [0.45, 0.45], border: { type: "solid", color: "D9D2C7", pt: 1 }, valign: "middle" });

  // 三个业务场景 chip
  const chips = [
    ["领出", "车间从仓库领走的铜线重量", theme.accent],
    ["回库", "没用完退回仓库的重量", theme.secondary],
    ["报废线头", "损耗 / 无法使用的废料", theme.light]
  ];
  const cw = 2.86, gap = 0.1, x0 = 0.6, y = 3.55;
  chips.forEach((c, i) => {
    const x = x0 + i * (cw + gap);
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x, y: y, w: cw, h: 1.0, fill: { color: "FFFFFF" }, line: { color: c[2], width: 1.5 }, rectRadius: 0.08 });
    slide.addShape(pres.shapes.RECTANGLE, { x: x, y: y, w: 0.1, h: 1.0, fill: { color: c[2] }, line: { type: "none" } });
    slide.addText(c[0], { x: x + 0.22, y: y + 0.12, w: cw - 0.4, h: 0.4, fontSize: 16, fontFace: "Microsoft YaHei", color: c[2], bold: true, align: "left" });
    slide.addText(c[1], { x: x + 0.22, y: y + 0.52, w: cw - 0.4, h: 0.4, fontSize: 12, fontFace: "Microsoft YaHei", color: "4A4A4A", align: "left" });
  });

  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.75, w: 8.8, h: 0.6, fill: { color: theme.primary }, line: { type: "none" }, rectRadius: 0.08 });
  slide.addText("📌 实际用量 = 领出 − 回库 − 报废线头，系统自动计算，无需手填", { x: 0.85, y: 4.75, w: 8.3, h: 0.6, fontSize: 13.5, fontFace: "Microsoft YaHei", color: "FFFFFF", bold: true, align: "left", valign: "middle" });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("5", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-05-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

const pptxgen = require("pptxgenjs");

const slideConfig = { type: "content", index: 10, title: "这个模块在记什么" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("这个模块在记什么", { x: 0.6, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
  slide.addText("生产车间型号重量对比表：以「生产任务单」为单位，逐条登记该型号用到的每种漆包线规格，对比 BOM 标准重量与实际重量。", { x: 0.6, y: 1.12, w: 8.8, h: 0.5, fontSize: 13.5, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left" });

  const header = ["日期", "生产任务单号", "BOM号", "类型", "规格型号", "BOM重量(kg)", "实际重量(kg)", "差重(kg)"];
  const rowA = ["2026-07-28", "RW20260728-01", "3.05.04.07.0006", "单相", "QZY-2/Φ0.50", "12.5000", "12.4800", "-0.0200"];
  const rowB = ["2026-07-28", "RW20260728-01", "3.05.04.07.0006", "单相", "QZY-2/Φ0.80", "8.3000", "8.3000", "0.0000"];
  const rowC = ["2026-07-28", "RW20260728-02", "3.05.04.08.0011", "三相", "QZY-2/Φ1.00", "20.1000", "20.2500", "+0.1500"];
  const mk = (c, hot) => ({ text: c, options: { fill: { color: "FFFFFF" }, color: hot ? theme.accent : "2E2E2E", bold: hot, fontSize: 10.5, align: "center", valign: "middle", fontFace: "Microsoft YaHei" } });
  const rows = [
    header.map(h => ({ text: h, options: { fill: { color: theme.primary }, color: "FFFFFF", bold: true, fontSize: 10.5, align: "center", valign: "middle", fontFace: "Microsoft YaHei" } })),
    rowA.map(c => mk(c, c.startsWith("-") || c.startsWith("+"))),
    rowB.map(c => ({ text: c, options: { fill: { color: "F1ECE4" }, color: "2E2E2E", fontSize: 10.5, align: "center", valign: "middle", fontFace: "Microsoft YaHei" } })),
    rowC.map(c => mk(c, c.startsWith("+"))),
  ];
  slide.addTable(rows, { x: 0.6, y: 1.85, w: 8.8, colW: [1.05, 1.5, 1.45, 0.65, 1.35, 1.1, 1.1, 0.95], rowH: [0.42, 0.42, 0.42, 0.42], border: { type: "solid", color: "D9D2C7", pt: 1 }, valign: "middle" });

  // 差重提示条
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 3.75, w: 8.8, h: 0.55, fill: { color: theme.accent }, line: { type: "none" }, rectRadius: 0.08 });
  slide.addText("差重 = 实际重量 − BOM重量；|差重| ≥ 10g（0.01kg）标红并提示「需修改BOM」", { x: 0.85, y: 3.75, w: 8.3, h: 0.55, fontSize: 13, fontFace: "Microsoft YaHei", color: "FFFFFF", bold: true, align: "left", valign: "middle" });

  // 类型说明 chip
  const chips = [
    ["单相", "录入「主线线模 + 副线线模」两列", theme.accent],
    ["三相 / 永磁", "录入「线模尺寸」一列", theme.secondary],
  ];
  const cw = 4.35, gap = 0.1, x0 = 0.6, y = 4.5;
  chips.forEach((c, i) => {
    const x = x0 + i * (cw + gap);
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x, y: y, w: cw, h: 0.8, fill: { color: "FFFFFF" }, line: { color: c[2], width: 1.5 }, rectRadius: 0.08 });
    slide.addShape(pres.shapes.RECTANGLE, { x: x, y: y, w: 0.1, h: 0.8, fill: { color: c[2] }, line: { type: "none" } });
    slide.addText(c[0], { x: x + 0.22, y: y + 0.1, w: cw - 0.4, h: 0.35, fontSize: 15, fontFace: "Microsoft YaHei", color: c[2], bold: true, align: "left" });
    slide.addText(c[1], { x: x + 0.22, y: y + 0.45, w: cw - 0.4, h: 0.3, fontSize: 12, fontFace: "Microsoft YaHei", color: "4A4A4A", align: "left" });
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("10", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-10-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

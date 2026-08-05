const pptxgen = require("pptxgenjs");

const slideConfig = { type: "content", index: 17, title: "六大类别与四种状态" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("六大类别与四种状态", { x: 0.6, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
  slide.addText("选对类别，编号前缀自动带；看状态标签，一眼知工具去向。", { x: 0.6, y: 1.12, w: 8.8, h: 0.4, fontSize: 13.5, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left" });

  // 类别
  slide.addText("📂 六大类别（编号前缀）", { x: 0.6, y: 1.7, w: 5, h: 0.4, fontSize: 16, fontFace: "Microsoft YaHei", color: theme.accent, bold: true, align: "left" });
  const cats = [
    ["电动工具", "DZ"], ["手动工具", "SD"], ["量具", "LJ"],
    ["刀具", "DJ"], ["易耗品", "YH"], ["其他", "QT"],
  ];
  const cw = 1.42, gap = 0.12, x0 = 0.6, y = 2.15;
  cats.forEach((c, i) => {
    const x = x0 + i * (cw + gap);
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x, y: y, w: cw, h: 1.0, fill: { color: "FFFFFF" }, line: { color: theme.secondary, width: 1.2 }, rectRadius: 0.08 });
    slide.addText(c[0], { x: x, y: y + 0.14, w: cw, h: 0.4, fontSize: 12.5, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "center", valign: "middle" });
    slide.addText(c[1], { x: x, y: y + 0.52, w: cw, h: 0.38, fontSize: 14, fontFace: "Arial", color: theme.accent, bold: true, align: "center", valign: "middle" });
  });

  // 状态
  slide.addText("🏷️ 四种状态（彩色标签）", { x: 0.6, y: 3.45, w: 5, h: 0.4, fontSize: 16, fontFace: "Microsoft YaHei", color: theme.accent, bold: true, align: "left" });
  const stats = [
    ["在库", "1E7B34", "工具在架，随时可用"],
    ["借出", "2E6FB0", "已被借走，见借还记录"],
    ["维修中", "C8732B", "送修或保养中"],
    ["已报废", "8A8A8A", "停用，不再流转"],
  ];
  const sw = 2.15, sgap = 0.12, sx0 = 0.6, sy = 3.95;
  stats.forEach((s, i) => {
    const x = sx0 + i * (sw + sgap);
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x, y: sy, w: sw, h: 1.05, fill: { color: "FFFFFF" }, line: { color: s[1], width: 1.2 }, rectRadius: 0.08 });
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.18, y: sy + 0.18, w: 1.0, h: 0.38, fill: { color: s[1] }, line: { type: "none" }, rectRadius: 0.2 });
    slide.addText(s[0], { x: x + 0.18, y: sy + 0.18, w: 1.0, h: 0.38, fontSize: 12, fontFace: "Microsoft YaHei", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    slide.addText(s[2], { x: x + 0.15, y: sy + 0.62, w: sw - 0.3, h: 0.38, fontSize: 10.5, fontFace: "Microsoft YaHei", color: "4A4A4A", align: "center", valign: "middle" });
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("17", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-17-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

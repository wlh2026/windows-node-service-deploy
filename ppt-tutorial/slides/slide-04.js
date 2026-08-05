const pptxgen = require("pptxgenjs");

const slideConfig = { type: "section", index: 4, title: "模块一 · 铜线出入库台账" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.primary };

  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.22, h: 5.625, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("模块一", { x: 0.9, y: 1.7, w: 4, h: 0.6, fontSize: 22, fontFace: "Microsoft YaHei", color: theme.light, bold: true, align: "left" });
  slide.addText("铜线出入库台账", { x: 0.9, y: 2.25, w: 8, h: 1.0, fontSize: 44, fontFace: "Microsoft YaHei", color: "FFFFFF", bold: true, align: "left" });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.92, y: 3.35, w: 3.2, h: 0.06, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("仓库管理员在这里记录铜线的领出、回库与报废，自动算出实际用量", { x: 0.9, y: 3.6, w: 8.2, h: 0.5, fontSize: 15, fontFace: "Microsoft YaHei", color: "D9DEE6", align: "left" });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("4", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-04-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

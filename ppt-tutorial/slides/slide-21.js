const pptxgen = require("pptxgenjs");

const slideConfig = { type: "content", index: 21, title: "如何录入 / 调整库存" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("如何录入 / 调整库存", { x: 0.6, y: 0.4, w: 8.5, h: 0.7, fontSize: 30, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
  slide.addText("填规格 + 库存量保存即可；同一规格再保存会自动累加。", { x: 0.6, y: 1.12, w: 8.8, h: 0.4, fontSize: 13.5, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left" });

  const steps = [
    ["①", "选规格", "在「铜线规格型号」输入关键字模糊快选，如输 0.50 即出 QZ-2-130L-0.50mm。"],
    ["②", "填本次入库量", "填这次到货的重量（kg）；首次保存即新建该规格库存。"],
    ["③", "点「保存」", "系统提示「已累计入库：规格 最新库存 X kg」。"],
    ["④", "同规格再入库", "再保存一次就累加：原库存 + 本次入库 = 最新库存。"],
  ];
  const y0 = 1.72, rh = 0.62;
  steps.forEach((s, i) => {
    const y = y0 + i * rh;
    slide.addShape(pres.shapes.OVAL, { x: 0.62, y: y, w: 0.54, h: 0.54, fill: { color: theme.accent }, line: { type: "none" } });
    slide.addText(s[0], { x: 0.62, y: y, w: 0.54, h: 0.54, fontSize: 18, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.32, y: y - 0.04, w: 8.08, h: 0.58, fill: { color: "FFFFFF" }, line: { color: theme.light, width: 1 }, rectRadius: 0.08 });
    slide.addText(s[1], { x: 1.5, y: y, w: 2.0, h: 0.5, fontSize: 14, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left", valign: "middle" });
    slide.addText(s[2], { x: 3.5, y: y, w: 5.75, h: 0.5, fontSize: 11.5, fontFace: "Microsoft YaHei", color: "4A4A4A", align: "left", valign: "middle" });
  });

  // 累计示例 callout
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.45, w: 8.8, h: 0.85, fill: { color: theme.primary }, line: { type: "none" }, rectRadius: 0.1 });
  slide.addText("📈 累计示例（规格 QZ-2-130L-0.50mm）", { x: 0.85, y: 4.53, w: 8.3, h: 0.35, fontSize: 13.5, fontFace: "Microsoft YaHei", color: theme.light, bold: true, align: "left" });
  slide.addText("首次入库 50  →  再入库 30（累计 80）  →  再入库 −5（累计 75）；列表里该规格始终只有一行。", { x: 0.85, y: 4.88, w: 8.4, h: 0.38, fontSize: 13, fontFace: "Microsoft YaHei", color: "FFFFFF", align: "left", valign: "middle" });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("21", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-21-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

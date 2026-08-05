const pptxgen = require("pptxgenjs");

const slideConfig = { type: "content", index: 16, title: "如何新增一件工具档案" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("如何新增一件工具档案", { x: 0.6, y: 0.4, w: 8.5, h: 0.7, fontSize: 30, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
  slide.addText("点「＋ 新增工具」，按提示填完即可建档；编号系统自动生成，不用手填。", { x: 0.6, y: 1.12, w: 8.8, h: 0.4, fontSize: 13.5, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left" });

  const steps = [
    ["①", "点「＋ 新增工具」", "在工具台账右上角，打开新增弹窗。"],
    ["②", "选类别，编号自动出", "选 电动/手动/量具/刀具/易耗品/其他，系统自动生成编号（如 DZ0001）。"],
    ["③", "填名称与信息", "填名称、型号、品牌、存放位置，上传一张实物照片。"],
    ["④", "点「保存」建档", "保存后列表出现该工具；删除仅管理员可操作，谨慎使用。"],
  ];
  const y0 = 1.75, rh = 0.86;
  steps.forEach((s, i) => {
    const y = y0 + i * rh;
    slide.addShape(pres.shapes.OVAL, { x: 0.62, y: y, w: 0.62, h: 0.62, fill: { color: theme.accent }, line: { type: "none" } });
    slide.addText(s[0], { x: 0.62, y: y, w: 0.62, h: 0.62, fontSize: 20, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.45, y: y - 0.04, w: 7.95, h: 0.72, fill: { color: "FFFFFF" }, line: { color: theme.light, width: 1 }, rectRadius: 0.08 });
    slide.addText(s[1], { x: 1.65, y: y, w: 3.0, h: 0.62, fontSize: 15, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left", valign: "middle" });
    slide.addText(s[2], { x: 4.7, y: y, w: 4.6, h: 0.62, fontSize: 12.5, fontFace: "Microsoft YaHei", color: "4A4A4A", align: "left", valign: "middle" });
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("16", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-16-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

const pptxgen = require("pptxgenjs");

const slideConfig = { type: "content", index: 15, title: "给每件工具建一张「身份证」" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("给每件工具建一张「身份证」", { x: 0.6, y: 0.4, w: 8.5, h: 0.7, fontSize: 30, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
  slide.addText("每件工具一条档案：系统自动生成编号，录入照片、位置、类别、状态，找工具不再靠记忆。", { x: 0.6, y: 1.12, w: 8.8, h: 0.4, fontSize: 13.5, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left" });

  // 档案卡示意（左）
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.75, w: 3.7, h: 3.1, fill: { color: "FFFFFF" }, line: { color: theme.light, width: 1.5 }, rectRadius: 0.1 });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.75, w: 3.7, h: 0.6, fill: { color: theme.primary }, line: { type: "none" } });
  slide.addText("工具档案卡", { x: 0.6, y: 1.75, w: 3.7, h: 0.6, fontSize: 15, fontFace: "Microsoft YaHei", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.85, y: 2.55, w: 1.0, h: 1.0, fill: { color: "F1ECE4" }, line: { color: theme.light, width: 1 }, rectRadius: 0.06 });
  slide.addText("📷", { x: 0.85, y: 2.55, w: 1.0, h: 1.0, fontSize: 28, fontFace: "Microsoft YaHei", color: "8A8A8A", align: "center", valign: "middle" });
  const cardLines = [
    ["编号", "DZ0001"],
    ["名称", "数显卡尺"],
    ["类别", "量具(LJ)"],
    ["位置", "A架-2层-3号箱"],
    ["状态", "在库"],
  ];
  let cy = 2.6;
  cardLines.forEach(l => {
    slide.addText(l[0], { x: 2.0, y: cy, w: 0.9, h: 0.36, fontSize: 11, fontFace: "Microsoft YaHei", color: "8A8A8A", align: "left", valign: "middle" });
    slide.addText(l[1], { x: 2.9, y: cy, w: 1.3, h: 0.36, fontSize: 11.5, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left", valign: "middle" });
    cy += 0.46;
  });

  // 字段说明（右）
  const fields = [
    ["工具编号", "系统按类别自动生成，如 DZ0001，编辑时锁定"],
    ["名称 / 型号 / 品牌", "工具叫什么、规格、牌子"],
    ["类别", "电动/手动/量具/刀具/易耗品/其他"],
    ["存放位置", "如 A架-2层-3号箱，方便查找"],
    ["实物照片", "上传一张照片，列表直接看脸"],
    ["状态", "在库 / 借出 / 维修中 / 已报废"],
  ];
  const y0 = 1.8, rh = 0.5;
  fields.forEach((f, i) => {
    const y = y0 + i * rh;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.55, y: y, w: 4.85, h: 0.44, fill: { color: i % 2 === 0 ? "FFFFFF" : "F1ECE4" }, line: { type: "none" }, rectRadius: 0.06 });
    slide.addText(f[0], { x: 4.75, y: y, w: 1.9, h: 0.44, fontSize: 12.5, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left", valign: "middle" });
    slide.addText(f[1], { x: 6.65, y: y, w: 2.65, h: 0.44, fontSize: 11, fontFace: "Microsoft YaHei", color: "4A4A4A", align: "left", valign: "middle" });
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("15", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-15-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

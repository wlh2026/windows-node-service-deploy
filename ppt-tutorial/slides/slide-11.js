const pptxgen = require("pptxgenjs");

const slideConfig = { type: "content", index: 11, title: "如何新增一条生产对比记录" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("如何新增一条生产对比记录", { x: 0.6, y: 0.4, w: 8.5, h: 0.7, fontSize: 30, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
  slide.addText("一个生产任务单可包含多种漆包线规格，逐条「＋ 添加一行规格」后一次性保存。", { x: 0.6, y: 1.12, w: 8.8, h: 0.4, fontSize: 13.5, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left" });

  const steps = [
    ["①", "填表头信息", "填写日期（默认今天）、生产任务单号、BOM号。"],
    ["②", "添加规格并选类型", "点「＋ 添加一行规格」，每行填一种漆包线规格；选 单相/三相/永磁，系统按类型显示对应线模列。"],
    ["③", "填重量，看差重", "输入 BOM重量 与 实际重量；差重自动算出，变红即「需修改BOM」。"],
    ["④", "点「💾 保存全部」", "保存后下方列表立即出现该记录；填错可「编辑 / 删除」。"],
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
  slide.addText("11", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-11-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

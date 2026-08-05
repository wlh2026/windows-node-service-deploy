const pptxgen = require("pptxgenjs");

const slideConfig = { type: "cover", index: 1, title: "四福车间管理系统 · 操作教程" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // 左侧深蓝主色块
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 3.55, h: 5.625,
    fill: { color: theme.primary }, line: { type: "none" }
  });
  // 主色块上的铜色竖条装饰
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625,
    fill: { color: theme.accent }, line: { type: "none" }
  });
  // 主色块内“台账”堆叠装饰
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 1.0, w: 2.4, h: 0.62, fill: { color: theme.secondary }, line: { type: "none" }, rectRadius: 0.06 });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 1.78, w: 2.4, h: 0.62, fill: { color: theme.light }, line: { type: "none" }, rectRadius: 0.06 });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 2.56, w: 2.4, h: 0.62, fill: { color: theme.accent }, line: { type: "none" }, rectRadius: 0.06 });
  slide.addText("台账\nLEDGER", { x: 0.55, y: 3.5, w: 2.4, h: 1.2, fontSize: 22, fontFace: "Arial Black", color: "FFFFFF", bold: true, align: "center", valign: "middle", lineSpacingMultiple: 0.9 });

  // 右侧标题区
  slide.addText("四福车间管理系统", {
    x: 3.95, y: 1.35, w: 5.6, h: 0.7,
    fontSize: 30, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left"
  });
  slide.addText("铜线出入库 · 生产对比 · 铜线库存 · 小型工具 · 物料重量统计", {
    x: 3.95, y: 2.15, w: 5.7, h: 0.55,
    fontSize: 18, fontFace: "Microsoft YaHei", color: theme.accent, bold: true, align: "left"
  });
  slide.addShape(pres.shapes.RECTANGLE, { x: 3.95, y: 2.95, w: 4.6, h: 0.05, fill: { color: theme.light }, line: { type: "none" } });
  slide.addText("操作教程", {
    x: 3.95, y: 3.15, w: 5.6, h: 0.6,
    fontSize: 26, fontFace: "Microsoft YaHei", color: theme.secondary, bold: true, align: "left"
  });
  slide.addText("面向仓库管理员与一线员工 —— 一看就懂、照着就能做", {
    x: 3.95, y: 3.95, w: 5.6, h: 0.4,
    fontSize: 14, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left"
  });

  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-01-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

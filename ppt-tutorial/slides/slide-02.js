const pptxgen = require("pptxgenjs");

const slideConfig = { type: "toc", index: 2, title: "目录" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("目录", {
    x: 0.6, y: 0.5, w: 4, h: 0.8,
    fontSize: 36, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left"
  });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.62, y: 1.32, w: 1.1, h: 0.06, fill: { color: theme.accent }, line: { type: "none" } });

  const items = [
    ["01", "系统入口与登录", "打开网页、登录账号、按角色看到对应模块"],
    ["02", "铜线出入库台账", "新增领用记录、规格模糊快选、查询导出打印"],
    ["03", "生产车间型号重量对比表", "填 BOM 与实际重量、看差重、按 BOM 汇总"],
    ["04", "铜线库存表", "同规格累计入库、领用自动扣减、看板排行"],
    ["05", "小型工具管理台账", "给每件工具建档案、分类状态、标签与导出"],
    ["06", "物料重量统计（品质部）", "来料称重、批次/物料名、±3% 异常提醒"],
    ["07", "手机端如何使用", "表头吸顶、左右滑看宽表、规格模糊输入"],
    ["08", "操作要点与常见问题", "易错点提醒与快速排查"]
  ];
  const y0 = 1.5, rh = 0.52;
  items.forEach((it, i) => {
    const y = y0 + i * rh;
    slide.addShape(pres.shapes.OVAL, { x: 0.62, y: y, w: 0.5, h: 0.5, fill: { color: theme.primary }, line: { type: "none" } });
    slide.addText(it[0], { x: 0.62, y: y, w: 0.5, h: 0.5, fontSize: 16, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    slide.addText(it[1], { x: 1.3, y: y - 0.04, w: 4.6, h: 0.36, fontSize: 16.5, fontFace: "Microsoft YaHei", color: theme.secondary, bold: true, align: "left", valign: "middle" });
    slide.addText(it[2], { x: 1.3, y: y + 0.3, w: 7.2, h: 0.24, fontSize: 11.5, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left", valign: "middle" });
  });

  // 右侧装饰：铜色卡片堆叠
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.0, y: 1.9, w: 1.4, h: 1.0, fill: { color: theme.light }, line: { type: "none" }, rectRadius: 0.08 });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.2, y: 2.95, w: 1.4, h: 1.0, fill: { color: theme.accent }, line: { type: "none" }, rectRadius: 0.08 });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.0, y: 4.0, w: 1.4, h: 1.0, fill: { color: theme.secondary }, line: { type: "none" }, rectRadius: 0.08 });

  // 页码
  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("2", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });

  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-02-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

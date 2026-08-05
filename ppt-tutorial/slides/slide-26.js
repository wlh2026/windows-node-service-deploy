const pptxgen = require("pptxgenjs");

const slideConfig = { type: "summary", index: 26, title: "操作要点与常见问题" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("操作要点与常见问题", { x: 0.6, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });

  // 左：要点
  slide.addText("✅ 记住这几句话", { x: 0.6, y: 1.25, w: 4.3, h: 0.4, fontSize: 16, fontFace: "Microsoft YaHei", color: theme.accent, bold: true, align: "left" });
  const tips = [
    "铜线领用：领出/回库/报废按实填，实际用量系统自动算。",
    "铜线库存：同规格入库自动累加，领用自动扣减。",
    "生产对比：填 BOM 与实际重量，看差重是否需要改 BOM。",
    "工具：先建档案再使用，编号自动、状态一目了然。",
    "物料重量（品质部）：来料称重，超 ±3% 自动提醒异常。",
    "数据每天 15:00 自动备份，放心用、错了找管理员。",
  ];
  let ty = 1.7;
  const th = 0.56;
  tips.forEach(t => {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: ty, w: 4.3, h: th, fill: { color: "FFFFFF" }, line: { color: theme.light, width: 1 }, rectRadius: 0.08 });
    slide.addText(t, { x: 0.78, y: ty + 0.04, w: 4.0, h: th - 0.08, fontSize: 11.5, fontFace: "Microsoft YaHei", color: "3A3A3A", align: "left", valign: "middle", lineSpacingMultiple: 1.02 });
    ty += th + 0.06;
  });

  // 右：常见问题
  slide.addText("❓ 常见问题", { x: 5.2, y: 1.25, w: 4.2, h: 0.4, fontSize: 16, fontFace: "Microsoft YaHei", color: theme.accent, bold: true, align: "left" });
  const faq = [
    ["规格选不到？", "在规格框输入关键字（如 0.50）模糊快选，别在长列表里翻。"],
    ["库存怎么变多了？", "同规格重复保存是「累加」不是覆盖；想改值用行内【编辑】。"],
    ["来料标了异常？", "同 BOM 号重量偏差超 ±3%，核对供应商/批次是否一致。"],
    ["实际用量算不对？", "检查领出/回库/报废是否填对，公式自动计算。"],
    ["误删了记录？", "联系管理员，系统每日备份可恢复。"],
  ];
  let fy = 1.7;
  const fh = 0.66;
  faq.forEach(q => {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.2, y: fy, w: 4.2, h: fh, fill: { color: "F1ECE4" }, line: { type: "none" }, rectRadius: 0.06 });
    slide.addText("Q " + q[0], { x: 5.4, y: fy + 0.05, w: 3.9, h: 0.28, fontSize: 12, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
    slide.addText("A " + q[1], { x: 5.4, y: fy + 0.33, w: 3.9, h: 0.3, fontSize: 10.5, fontFace: "Microsoft YaHei", color: "4A4A4A", align: "left" });
    fy += fh + 0.06;
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("26", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-26-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

const pptxgen = require("pptxgenjs");

const slideConfig = { type: "content", index: 24, title: "异常提醒 · 统计报表导出" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("异常提醒 · 统计报表导出", { x: 0.6, y: 0.4, w: 8.6, h: 0.7, fontSize: 30, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
  slide.addText("保存时超差自动提醒；可按供应商、按物料(规格)汇总导出美观 Excel 报表。", { x: 0.6, y: 1.12, w: 8.8, h: 0.4, fontSize: 13.5, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left" });

  const items = [
    ["🔔 超差提醒", "同 BOM 号新重量与历史基准偏差 ＞ ±3% 时，保存前弹窗确认，记录标红「⚠异常」。"],
    ["🔍 查询筛选", "按日期、BOM号、规格、供应商组合筛选；可勾选「仅看异常」快速排查。"],
    ["📊 按供应商统计", "切换「按供应商」页签：看每家供应商来料总重、平均重、异常数、涉及 BOM 数。"],
    ["📊 按物料统计", "切换「按物料(规格)」页签：看每种规格来料总重与异常，并列出对应物料名称。"],
    ["📤 导出Excel", "导出台账或统计报表（含标题、合计、签字栏，异常行红字标注），便于上报。"],
    ["🖨️ 打印", "直接打印当前台账作为纸质来料记录。"],
  ];
  const y0 = 1.72, rh = 0.58;
  items.forEach((it, i) => {
    const y = y0 + i * rh;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: y, w: 8.8, h: 0.5, fill: { color: i % 2 === 0 ? "FFFFFF" : "F1ECE4" }, line: { type: "none" }, rectRadius: 0.06 });
    slide.addText(it[0], { x: 0.8, y: y, w: 2.6, h: 0.5, fontSize: 13.5, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left", valign: "middle" });
    slide.addText(it[1], { x: 3.4, y: y, w: 5.8, h: 0.5, fontSize: 11.5, fontFace: "Microsoft YaHei", color: "4A4A4A", align: "left", valign: "middle" });
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("24", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-24-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

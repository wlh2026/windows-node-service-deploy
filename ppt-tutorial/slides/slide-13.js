const pptxgen = require("pptxgenjs");

const slideConfig = { type: "content", index: 13, title: "查询 · 汇总 · 导出 · 打印" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("查询 · 汇总 · 导出 · 打印", { x: 0.6, y: 0.4, w: 8.5, h: 0.7, fontSize: 30, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
  slide.addText("录完数据后，用顶部工具栏快速筛选、按 BOM 汇总、导出 Excel 或打印纸质台账。", { x: 0.6, y: 1.12, w: 8.8, h: 0.4, fontSize: 13.5, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left" });

  // 工具栏示意条
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.7, w: 8.8, h: 0.7, fill: { color: "FFFFFF" }, line: { color: theme.light, width: 1 }, rectRadius: 0.08 });
  const btns = [["🔍 查询", theme.primary], ["重置", theme.secondary], ["📤 导出Excel", theme.accent], ["🖨️ 打印", theme.secondary]];
  let bx = 0.85;
  btns.forEach(b => {
    const w = 0.42 + b[0].length * 0.16;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: bx, y: 1.88, w: w, h: 0.36, fill: { color: b[1] }, line: { type: "none" }, rectRadius: 0.05 });
    slide.addText(b[0], { x: bx, y: 1.88, w: w, h: 0.36, fontSize: 12, fontFace: "Microsoft YaHei", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    bx += w + 0.18;
  });

  const items = [
    ["🔍 查询", "按「开始/结束日期、任务单号、BOM号」筛选；不填则显示全部。"],
    ["📊 按 BOM 汇总", "系统按 BOM号 自动汇总：同任务单内合计、跨任务单取平均，一眼看出哪个 BOM 差重大。"],
    ["📤 导出Excel", "导出含合计行与签字栏；另含「BOM汇总」工作表，便于存档分析。"],
    ["🖨️ 打印", "直接打印当前列表，自动带「制表人 / 车间主任 / 审核」签字位。"],
    ["✏️ 编辑 / 🗑️ 删除", "每行右侧可改或删；删除需确认，谨慎操作。"],
  ];
  const y0 = 2.6, rh = 0.55;
  items.forEach((it, i) => {
    const y = y0 + i * rh;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: y, w: 8.5, h: 0.48, fill: { color: i % 2 === 0 ? "FFFFFF" : "F1ECE4" }, line: { type: "none" }, rectRadius: 0.06 });
    slide.addText(it[0], { x: 0.8, y: y, w: 2.4, h: 0.48, fontSize: 13.5, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left", valign: "middle" });
    slide.addText(it[1], { x: 3.2, y: y, w: 5.7, h: 0.48, fontSize: 12, fontFace: "Microsoft YaHei", color: "4A4A4A", align: "left", valign: "middle" });
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("13", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-13-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

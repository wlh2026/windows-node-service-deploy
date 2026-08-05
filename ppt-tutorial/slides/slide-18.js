const pptxgen = require("pptxgenjs");

const slideConfig = { type: "content", index: 18, title: "查询筛选 · 二维码标签 · 导出" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("查询筛选 · 二维码标签 · 导出", { x: 0.6, y: 0.4, w: 8.6, h: 0.7, fontSize: 30, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
  slide.addText("顶部工具栏支持按关键字、类别、状态筛选；还能打印二维码标签、导出 Excel。", { x: 0.6, y: 1.12, w: 8.8, h: 0.4, fontSize: 13.5, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left" });

  const items = [
    ["🔍 查询", "按「关键字（编号/名称/型号）+ 类别 + 状态」组合筛选；不填则显示全部。"],
    ["🏷️ 打印二维码标签", "勾选工具 → 点「打印二维码标签」，生成可贴工具上的二维码（扫码即知身份）。"],
    ["📤 导出Excel", "把当前列表导出为 Excel，含全部字段，便于盘点与上报。"],
    ["🖨️ 打印", "直接打印当前列表作为纸质工具台账。"],
    ["✏️ 编辑 / 🗑️ 删除", "每行右侧可编辑；删除仅管理员可见，删除前需确认。"],
  ];
  const y0 = 1.75, rh = 0.64;
  items.forEach((it, i) => {
    const y = y0 + i * rh;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: y, w: 8.8, h: 0.56, fill: { color: i % 2 === 0 ? "FFFFFF" : "F1ECE4" }, line: { type: "none" }, rectRadius: 0.06 });
    slide.addText(it[0], { x: 0.8, y: y, w: 2.5, h: 0.56, fontSize: 14, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left", valign: "middle" });
    slide.addText(it[1], { x: 3.3, y: y, w: 5.9, h: 0.56, fontSize: 12, fontFace: "Microsoft YaHei", color: "4A4A4A", align: "left", valign: "middle" });
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("18", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-18-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

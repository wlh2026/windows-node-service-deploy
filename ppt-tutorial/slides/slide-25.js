const pptxgen = require("pptxgenjs");

const slideConfig = { type: "content", index: 25, title: "手机端如何使用" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("手机端如何使用", { x: 0.6, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
  slide.addText("电脑、平板、手机都适配。几个手机上的小技巧，记一下更顺手。", { x: 0.6, y: 1.12, w: 8.8, h: 0.4, fontSize: 13.5, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left" });

  const cards = [
    ["📌 表头吸顶", "长表格向下滚时，列名（日期/规格/重量…）会停在顶部，再也不用一个手指按表头一个手指看数据。"],
    ["👈 宽表左右滑", "生产对比表 14 列较宽，手指左右滑动看后面的列；表格上方有「👈 左右滑动查看更多 👉」提示。"],
    ["🔎 规格模糊输入", "手机上规格框同样能输入关键字快选，如输 0.50 即出相关规格，不用在长列表里翻。"],
    ["🔢 看板三列排", "总览看板的指标在手机上排成 3 列，省高度，库存表头更容易进入首屏。"],
    ["📱 弹窗自动单列", "新增/编辑弹窗在手机上自动变单列，按钮加大，方便点按。"],
    ["🔄 看不全先刷新", "改版后若页面没变，手机浏览器下拉硬刷新（或 Ctrl+F5）即可加载新样式。"],
  ];
  const cw = 4.35, ch = 1.18, gx = 0.6, gy = 1.7, gap = 0.18;
  cards.forEach((c, i) => {
    const x = gx + (i % 2) * (cw + gap);
    const y = gy + Math.floor(i / 2) * (ch + gap);
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x, y: y, w: cw, h: ch, fill: { color: "FFFFFF" }, line: { color: theme.light, width: 1.2 }, rectRadius: 0.1 });
    slide.addText(c[0], { x: x + 0.2, y: y + 0.12, w: cw - 0.4, h: 0.38, fontSize: 14.5, fontFace: "Microsoft YaHei", color: theme.accent, bold: true, align: "left" });
    slide.addText(c[1], { x: x + 0.2, y: y + 0.5, w: cw - 0.4, h: 0.6, fontSize: 11.5, fontFace: "Microsoft YaHei", color: "4A4A4A", align: "left", valign: "top", lineSpacingMultiple: 1.02 });
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("25", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-25-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

const pptxgen = require("pptxgenjs");

const slideConfig = { type: "content", index: 3, title: "系统入口与登录" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("系统入口与登录", { x: 0.6, y: 0.45, w: 6, h: 0.7, fontSize: 32, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
  slide.addText("三步进入系统，按角色自动显示可用模块", { x: 0.6, y: 1.2, w: 8, h: 0.4, fontSize: 14, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left" });

  const steps = [
    ["1", "打开浏览器访问", "电脑/手机浏览器地址栏输入服务器地址：\nhttp://服务器IP:8090"],
    ["2", "输入账号密码", "用各自角色账号登录；\n不清楚账号请向系统管理员索取"],
    ["3", "进入工作台", "系统按角色自动显示模块：\n仓库/生产/品质/管理各看各的"]
  ];
  const cw = 2.86, gap = 0.2, x0 = 0.6, y = 1.85, ch = 2.1;
  steps.forEach((s, i) => {
    const x = x0 + i * (cw + gap);
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x, y: y, w: cw, h: ch, fill: { color: "FFFFFF" }, line: { color: theme.light, width: 1 }, rectRadius: 0.1 });
    slide.addShape(pres.shapes.OVAL, { x: x + 0.25, y: y + 0.25, w: 0.6, h: 0.6, fill: { color: theme.accent }, line: { type: "none" } });
    slide.addText(s[0], { x: x + 0.25, y: y + 0.25, w: 0.6, h: 0.6, fontSize: 24, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    slide.addText(s[1], { x: x + 0.25, y: y + 0.95, w: cw - 0.5, h: 0.4, fontSize: 16, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
    slide.addText(s[2], { x: x + 0.25, y: y + 1.32, w: cw - 0.5, h: 0.7, fontSize: 12.5, fontFace: "Microsoft YaHei", color: "4A4A4A", align: "left", lineSpacingMultiple: 1.05 });
  });

  // 底部角色说明条
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.25, w: 8.8, h: 0.95, fill: { color: theme.primary }, line: { type: "none" }, rectRadius: 0.1 });
  slide.addText("不同角色 · 看到不同模块", { x: 0.85, y: 4.36, w: 3.0, h: 0.35, fontSize: 13, fontFace: "Microsoft YaHei", color: theme.light, bold: true, align: "left" });
  slide.addText("管理员：全部模块　|　仓库：铜线领用·铜线库存·工具台账　|　生产车间：铜线领用·生产对比　|　品质部：物料重量统计", { x: 0.85, y: 4.72, w: 8.5, h: 0.4, fontSize: 12, fontFace: "Microsoft YaHei", color: "FFFFFF", align: "left" });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("3", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-03-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

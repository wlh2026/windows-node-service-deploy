const pptxgen = require("pptxgenjs");

const slideConfig = { type: "content", index: 7, title: "字段含义速查" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("字段含义速查", { x: 0.6, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
  slide.addText("录一行就懂一行，重量单位都是 kg。", { x: 0.6, y: 1.12, w: 8, h: 0.4, fontSize: 13.5, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left" });

  const h = ["字段", "含义", "必填", "说明"];
  const data = [
    ["日期", "领用发生的日期", "必填", "默认今天，可改"],
    ["生产任务单号", "对应的生产任务单", "选填", "一个单号可登记多种线径"],
    ["线径规格", "铜线直径，如 Φ0.50", "必填", "输入关键字模糊快选（如输 0.50 即出）"],
    ["领出重量(kg)", "车间从仓库领走的重量", "建议", "回库时再扣减"],
    ["回库重量(kg)", "没用完退回仓库的重量", "选填", "没有就留空"],
    ["报废重量·线头(kg)", "损耗 / 无法使用的废料", "选填", "没有就留空"],
    ["实际用量(kg)", "系统算出 = 领出 − 回库 − 报废", "自动", "不可手填"],
    ["备注", "补充说明（用途、班次等）", "选填", "自由填写"]
  ];
  const rows = [ h.map(c => ({ text: c, options: { fill: { color: theme.primary }, color: "FFFFFF", bold: true, fontSize: 12, align: "center", valign: "middle", fontFace: "Microsoft YaHei" } })) ];
  data.forEach((r, idx) => {
    rows.push(r.map((c, ci) => ({
      text: c,
      options: {
        fill: { color: idx % 2 === 0 ? "FFFFFF" : "F1ECE4" },
        color: ci === 0 ? theme.primary : (ci === 2 && c === "必填" ? theme.accent : "2E2E2E"),
        bold: ci === 0 || ci === 2, fontSize: 11.5, align: ci === 2 ? "center" : "left", valign: "middle", fontFace: "Microsoft YaHei"
      }
    })));
  });
  slide.addTable(rows, { x: 0.6, y: 1.7, w: 8.8, colW: [2.3, 3.1, 1.0, 2.4], rowH: 0.36, border: { type: "solid", color: "D9D2C7", pt: 1 }, valign: "middle" });

  // 公式 callout
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.78, w: 8.8, h: 0.6, fill: { color: theme.accent }, line: { type: "none" }, rectRadius: 0.08 });
  slide.addText("实际用量  =  领出  −  回库  −  报废线头", { x: 0.6, y: 4.78, w: 8.8, h: 0.6, fontSize: 16, fontFace: "Microsoft YaHei", color: "FFFFFF", bold: true, align: "center", valign: "middle" });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("7", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-07-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

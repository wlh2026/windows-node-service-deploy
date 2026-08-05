const pptxgen = require("pptxgenjs");

const slideConfig = { type: "content", index: 20, title: "库存表在记什么 · 同规格自动累计" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("库存表在记什么 · 同规格自动累计", { x: 0.6, y: 0.4, w: 9, h: 0.7, fontSize: 28, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
  slide.addText("每行一个规格，记录当前库存量；入库累加、领用扣减，库存永远是「最新剩余」。", { x: 0.6, y: 1.1, w: 8.9, h: 0.4, fontSize: 13.5, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left" });

  const h = ["字段", "含义", "必填", "说明"];
  const data = [
    ["铜线规格型号", "漆包线规格，如 QZ-2-130L-0.50mm", "必填", "输入关键字模糊快选预设规格"],
    ["库存量", "该规格当前剩余重量", "必填", "单位 kg"],
    ["单位", "重量单位", "选填", "默认 kg"],
    ["备注", "供应商 / 批号等", "选填", "自由填写"],
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
  slide.addTable(rows, { x: 0.6, y: 1.65, w: 8.8, colW: [2.4, 3.2, 1.0, 2.2], rowH: 0.42, border: { type: "solid", color: "D9D2C7", pt: 1 }, valign: "middle" });

  // 累计逻辑 callout
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 3.7, w: 8.8, h: 1.55, fill: { color: "FFFFFF" }, line: { color: theme.light, width: 1.2 }, rectRadius: 0.1 });
  slide.addText("🔁 入库 = 累计，不是覆盖", { x: 0.85, y: 3.85, w: 8, h: 0.4, fontSize: 15, fontFace: "Microsoft YaHei", color: theme.accent, bold: true, align: "left" });
  slide.addText([
    { text: "同一规格重复保存：", options: { bold: true, color: theme.primary } },
    { text: "新库存 = 原库存 + 本次入库，系统自动累加，不会另起一行。", options: {} },
  ], { x: 0.85, y: 4.28, w: 8.3, h: 0.4, fontSize: 12.5, fontFace: "Microsoft YaHei", align: "left", valign: "middle" });
  slide.addText([
    { text: "车间领用铜线：", options: { bold: true, color: theme.primary } },
    { text: "在「铜线出入库台账」领出后，系统自动按 净变动（回库 − 领出）扣减对应规格库存。", options: {} },
  ], { x: 0.85, y: 4.7, w: 8.3, h: 0.4, fontSize: 12.5, fontFace: "Microsoft YaHei", align: "left", valign: "middle" });
  slide.addText([
    { text: "想直接改成某个值？", options: { bold: true, color: theme.primary } },
    { text: "用该行的【编辑】，会整体覆盖为填写值（用于修正错误录入）。", options: {} },
  ], { x: 0.85, y: 5.1, w: 8.3, h: 0.4, fontSize: 12.5, fontFace: "Microsoft YaHei", align: "left", valign: "middle" });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("20", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-20-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

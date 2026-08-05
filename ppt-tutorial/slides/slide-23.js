const pptxgen = require("pptxgenjs");

const slideConfig = { type: "content", index: 23, title: "来料重量在记什么" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("来料重量在记什么", { x: 0.6, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
  slide.addText("每批来料一行，重量单位 kg；同 BOM 号历史重量偏差超 ±3% 自动标「异常」。", { x: 0.6, y: 1.12, w: 8.8, h: 0.4, fontSize: 13.5, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left" });

  const h = ["字段", "含义", "必填", "说明"];
  const data = [
    ["来料日期", "来料发生的日期", "必填", "默认今天，可改"],
    ["BOM号", "物料清单编号", "必填", "同 BOM 号用于比对历史重量"],
    ["批次号", "来料批次，如 20260729-A", "选填", "便于追溯每批"],
    ["物料名称", "来料物料，如 漆包线", "选填", "自由填写，不限铜线"],
    ["规格型号", "物料规格，如 QZ-2-130L-0.50mm", "选填", "品质部自由文本录入"],
    ["重量(kg)", "该批实际称重", "必填", "如实填写"],
    ["供应商", "来料供应商", "选填", "用于按供应商统计"],
    ["备注", "补充说明", "选填", "自由填写"],
  ];
  const rows = [ h.map(c => ({ text: c, options: { fill: { color: theme.primary }, color: "FFFFFF", bold: true, fontSize: 12, align: "center", valign: "middle", fontFace: "Microsoft YaHei" } })) ];
  data.forEach((r, idx) => {
    rows.push(r.map((c, ci) => ({
      text: c,
      options: {
        fill: { color: idx % 2 === 0 ? "FFFFFF" : "F1ECE4" },
        color: ci === 0 ? theme.primary : (ci === 2 && c === "必填" ? theme.accent : "2E2E2E"),
        bold: ci === 0 || ci === 2, fontSize: 11, align: ci === 2 ? "center" : "left", valign: "middle", fontFace: "Microsoft YaHei"
      }
    })));
  });
  slide.addTable(rows, { x: 0.6, y: 1.6, w: 8.8, colW: [2.2, 3.1, 0.9, 2.6], rowH: 0.33, border: { type: "solid", color: "D9D2C7", pt: 1 }, valign: "middle" });

  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.0, w: 8.5, h: 0.5, fill: { color: theme.accent }, line: { type: "none" }, rectRadius: 0.08 });
  slide.addText("⚠ 同一 BOM 号：新重量与历史基准偏差 ＞ ±3% 时，保存前弹窗提醒并标记「异常」", { x: 0.6, y: 5.0, w: 8.5, h: 0.5, fontSize: 13.5, fontFace: "Microsoft YaHei", color: "FFFFFF", bold: true, align: "center", valign: "middle" });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("23", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-23-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

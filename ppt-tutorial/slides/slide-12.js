const pptxgen = require("pptxgenjs");

const slideConfig = { type: "content", index: 12, title: "字段含义速查" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("字段含义速查", { x: 0.6, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: "Microsoft YaHei", color: theme.primary, bold: true, align: "left" });
  slide.addText("录一行就懂一行，重量单位都是 kg。", { x: 0.6, y: 1.12, w: 8, h: 0.4, fontSize: 13.5, fontFace: "Microsoft YaHei", color: "6B6B6B", align: "left" });

  const h = ["字段", "含义", "必填", "说明"];
  const data = [
    ["日期", "生产发生的日期", "必填", "默认今天，可改"],
    ["生产任务单号", "对应的生产任务单", "必填", "一个单号可登记多种规格"],
    ["BOM号", "物料清单编号", "选填", "用于按 BOM 汇总对比"],
    ["类型", "单相 / 三相 / 永磁", "选填", "决定「线模」列显示方式"],
    ["主线/副线线模", "线模尺寸，如 φ1.2", "选填", "单相填两列；三相/永磁填一列"],
    ["铜线规格型号", "漆包线规格，如 QZY-2/Φ0.50", "必填", "输入关键字模糊快选（如输 0.50 即出）"],
    ["BOM重量(kg)", "标准应耗铜重", "必填", "取自 BOM 理论值"],
    ["实际重量(kg)", "车间实际用掉的重量", "必填", "如实填写"],
    ["差重(kg)", "= 实际 − BOM", "自动", "|差重|≥10g 标红「需修改BOM」"],
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
  slide.addTable(rows, { x: 0.6, y: 1.65, w: 8.8, colW: [2.25, 3.05, 0.95, 2.55], rowH: 0.30, border: { type: "solid", color: "D9D2C7", pt: 1 }, valign: "middle" });

  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.02, w: 8.5, h: 0.5, fill: { color: theme.accent }, line: { type: "none" }, rectRadius: 0.08 });
  slide.addText("差重  =  实际重量  −  BOM重量    |  若 ≥ 10g（0.01kg）标红：「需修改BOM」", { x: 0.6, y: 5.02, w: 8.5, h: 0.5, fontSize: 14, fontFace: "Microsoft YaHei", color: "FFFFFF", bold: true, align: "center", valign: "middle" });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { type: "none" } });
  slide.addText("12", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center", valign: "middle" });
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "1F3A5F", secondary: "335C81", accent: "C8732B", light: "E7A861", bg: "F6F3EE" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-12-preview.pptx" });
}
module.exports = { createSlide, slideConfig };

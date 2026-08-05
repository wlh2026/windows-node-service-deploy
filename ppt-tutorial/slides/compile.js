const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";

const theme = {
  primary: "1F3A5F",
  secondary: "335C81",
  accent: "C8732B",
  light: "E7A861",
  bg: "F6F3EE"
};

const total = 26;
for (let i = 1; i <= total; i++) {
  const num = String(i).padStart(2, "0");
  const mod = require(`./slide-${num}.js`);
  mod.createSlide(pres, theme);
}

pres.writeFile({ fileName: "../output/四福车间管理系统-操作教程.pptx" }).then(f => {
  console.log("WROTE:", f);
}).catch(e => {
  console.error("ERROR:", e);
  process.exit(1);
});

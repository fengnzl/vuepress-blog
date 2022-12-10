const path = require("path");
const bubble = require("@rollup/plugin-buble");

const resolve = (filePath) => path.join(__dirname, "..", filePath);

module.exports = {
  input: resolve("src/index.js"),
  output: [
    {
      file: resolve("dist/index.js"),
      format: "iife",
      banner: "// welcome to fengnzl.github.io",
      footer: "// powered by fengnzl",
    },
    {
      file: resolve("dist/index-cjs.js"),
      format: "cjs",
      banner: "// welcome to fengnzl.github.io",
      footer: "// powered by fengnzl",
    },
    {
      file: resolve("dist/index-es.js"),
      format: "es",
      banner: "// welcome to fengnzl.github.io",
      footer: "// powered by fengnzl",
    },
    {
      file: resolve("dist/index-umd.js"),
      format: "umd",
      banner: "// welcome to fengnzl.github.io",
      footer: "// powered by fengnzl",
    },
  ],
  plugins: [bubble()],
};

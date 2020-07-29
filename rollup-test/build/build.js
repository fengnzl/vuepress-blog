const rollup = require('rollup');
const config = require('./rollup.config');

const inputOptions = config;
const outputOptions = config.output;

async function build (inputOptions, outputOptions) {
  // create a bundle
  const bundle = await rollup.rollup(inputOptions); // 根据 input 配置进行打包

  console.log(`[INFO] 开始编译 ${inputOptions.input}`);

  // generate code and a sourcemap
  const { code, map } = await bundle.generate(outputOptions);

  console.log(`[SUCCESS] 编译结束 ${outputOptions.file}`);

  // or write the bundle to disk
  await bundle.write(outputOptions); // 根据 output 输出文件

  console.log(`${outputOptions.file}生成成功！`)
}

(async function () {
  for (let i = 0; i < outputOptions.length; i++) {
    await build(inputOptions, outputOptions[i])
  }
})()

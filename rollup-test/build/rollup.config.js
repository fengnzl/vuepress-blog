const path = require('path');
const bubble = require('@rollup/plugin-buble');

const resolve = filePath => path.join(__dirname, '..', filePath);

module.exports = {
  input: resolve('src/index.js'),
  output: [
    {
      file: resolve('dist/index.js'),
      format: 'iife',
      banner: '// welcome to recoveryMonster.github.io',
      footer: '// powered by recoveryMonster'
    },
    {
      file: resolve('dist/index-cjs.js'),
      format: 'cjs',
      banner: '// welcome to recoveryMonster.github.io',
      footer: '// powered by recoveryMonster'
    },
    {
      file: resolve('dist/index-es.js'),
      format: 'es',
      banner: '// welcome to recoveryMonster.github.io',
      footer: '// powered by recoveryMonster'
    },
    {
      file: resolve('dist/index-umd.js'),
      format: 'umd',
      banner: '// welcome to recoveryMonster.github.io',
      footer: '// powered by recoveryMonster'
    }
  ],
  plugins: [
    bubble()
  ]
}
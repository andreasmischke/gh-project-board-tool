const package = require('./package.json');
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: `${package.name}.js`,
    library: package.name,
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  resolve: {
    extensions: [
      '.mjs',
      '.ts',
      '.js',
      '.json',
    ],
  },
  target: 'web',
  mode: 'production',
};

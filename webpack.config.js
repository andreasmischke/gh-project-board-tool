const package = require('./package.json');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: `content-script.js`,
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
  plugins: [
    new CopyPlugin([
      { from: 'manifest.json' },
      { from: 'img/icon*.png' },
      { from: 'styles/*' },
    ]),
  ],
  target: 'web',
  mode: 'production',
};

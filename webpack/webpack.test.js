const merge = require('webpack-merge');
const commonWebpack = require('./webpack.common');
const loaders = require('./loaders');
const _ = require('lodash');

const testConfig = merge.smart(commonWebpack, {
  devtool: 'inline-source-map',
  entry: {},
  module: {
    loaders: [_.merge(loaders.scss, {
      loader: 'null',
    })],
    postLoaders: [
      loaders.instrument,
    ],
  },
  ts: {
    compilerOptions: {
      sourceMap: false,
      inlineSourceMap: true,
    },
  },
  output: {},
});

console.log('testConfig', testConfig.module.loaders);

module.exports = testConfig;

import CircularDependencyPlugin = require("circular-dependency-plugin");
import { WebpackPluginFunction } from "webpack";
import { WebpackConfiguration } from "webpack-cli";

import { paths } from "./webpack.parts";

export const common: WebpackConfiguration = {
  entry: paths.entry,
  mode: "none",
  optimization: {
    minimize: true,
    emitOnErrors: false,
  },
  plugins: [
    new CircularDependencyPlugin({
      // exclude detection of files based on a RegExp
      exclude: /a\.js|node_modules/,
      // include specific files based on a RegExp
      include: /src/,
      // add errors to webpack instead of warnings
      failOnError: false,
      // allow import cycles that include an asynchronous import,
      // e.g. via import(/* webpackMode: "weak" */ './file.js')
      allowAsyncCycles: false,
      // set the current working directory for displaying module paths
      cwd: process.cwd(),
    }) as WebpackPluginFunction,
  ],
  resolve: {
    extensions: [".js"],
    modules: ["node_modules"],
    fallback: {
      os: false,
      crypto: false,
      url: false,
      https: false,
      http: false,
      assert: false,
      path: false,
      stream: false,
      zlib: false,
      fs: false,
    },
  },
};

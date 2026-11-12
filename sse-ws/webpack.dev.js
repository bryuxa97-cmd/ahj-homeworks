const { merge } = require("webpack-merge");
const { attachChat } = require("./server");
const common = require("./webpack.common");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    historyApiFallback: true,
    open: false,
    compress: true,
    hot: true,
    port: 8080,
    setupMiddlewares(middlewares, devServer) {
      if (devServer.server) attachChat(devServer.server);
      return middlewares;
    },
  },
});

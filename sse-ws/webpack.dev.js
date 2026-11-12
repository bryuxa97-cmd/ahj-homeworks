const { merge } = require("webpack-merge");
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
    proxy: [
      {
        context: ["/chat"],
        target: "http://localhost:7070",
        ws: true,
      },
    ],
  },
});

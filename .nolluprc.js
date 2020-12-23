const path = require("path");

const isSvench = !!process.env.SVENCH;

module.exports = {
  ...(isSvench
    ? {
        config: path.resolve(`rollup.config.svench.js`),
        port: 42421,
      }
    : {
        config: path.resolve(`rollup.config.js`),
        contentBase: "public",
        port: 5000,
      }),
  hot: true,
  watch: ["src", ".svench"],
};

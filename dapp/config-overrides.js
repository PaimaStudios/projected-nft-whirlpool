/* config-overrides.js */

const webpack = require("webpack");

module.exports = function override(config, env) {
  const wasmExtensionRegExp = /\.wasm$/;
  config.resolve.extensions.push(".wasm");
  config.experiments = {
    asyncWebAssembly: true,
  };
  config.resolve.fallback = {
    buffer: require.resolve("buffer/"),
    stream: false,
  };
  config.module.rules.forEach((rule) => {
    (rule.oneOf || []).forEach((oneOf) => {
      if (oneOf.type === "asset/resource") {
        oneOf.exclude.push(wasmExtensionRegExp);
      }
    });
  });
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
  );
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
  config.ignoreWarnings = [/Failed to parse source map/];
  return config;
};

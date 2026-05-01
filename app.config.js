const appJson = require("./app.json");

module.exports = ({ config }) => {
  const baseConfig = config || appJson.expo;
  const plugins = Array.isArray(baseConfig.plugins) ? [...baseConfig.plugins] : [];

  plugins.push([
    "expo-build-properties",
    {
      android: {
        compileSdkVersion: 35,
        targetSdkVersion: 35,
      },
    },
  ]);

  return {
    ...baseConfig,
    plugins,
  };
};

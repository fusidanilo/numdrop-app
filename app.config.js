const appJson = require("./app.json");

module.exports = ({ config }) => {
  const baseConfig = config || appJson.expo;
  const plugins = Array.isArray(baseConfig.plugins) ? [...baseConfig.plugins] : [];
  const androidAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || "ca-app-pub-3940256099942544~3347511713";
  const iosAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || "ca-app-pub-3940256099942544~1458002511";

  plugins.push([
    "expo-build-properties",
    {
      android: {
        compileSdkVersion: 35,
        targetSdkVersion: 35,
        kotlinVersion: "1.9.24",
      },
    },
  ]);
  plugins.push([
    "react-native-google-mobile-ads",
    {
      androidAppId,
      iosAppId,
      delayAppMeasurementInit: true,
      userTrackingUsageDescription:
        "This identifier will be used to deliver personalized ads to you.",
    },
  ]);
  plugins.push("./plugins/withAndroidComposeKotlinCompat");

  const androidVersionCode =
    Number(process.env.ANDROID_VERSION_CODE) ||
    Number(process.env.EAS_BUILD_ANDROID_VERSION_CODE) ||
    2;

  return {
    ...baseConfig,
    newArchEnabled: false,
    plugins,
    android: {
      ...baseConfig.android,
      // Play Console: must increase on every upload (default was 1).
      versionCode: androidVersionCode,
    },
    ios: {
      ...baseConfig.ios,
      buildNumber: String(
        process.env.IOS_BUILD_NUMBER ||
          process.env.EAS_BUILD_IOS_BUILD_NUMBER ||
          androidVersionCode,
      ),
    },
  };
};

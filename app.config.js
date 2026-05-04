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
  plugins.push("./plugins/withGooglePlayGames");

  const existingExtra =
    typeof baseConfig.extra === "object" && baseConfig.extra !== null && !Array.isArray(baseConfig.extra)
      ? baseConfig.extra
      : {};

  return {
    ...baseConfig,
    newArchEnabled: false,
    plugins,
    extra: {
      ...existingExtra,
      playGamesLeaderboardId: (process.env.EXPO_PUBLIC_PLAY_GAMES_LEADERBOARD_ID ?? "").trim(),
      playGamesSnapshotName:
        (process.env.EXPO_PUBLIC_PLAY_GAMES_SNAPSHOT_NAME ?? "").trim() || "numdrop-progress",
    },
  };
};

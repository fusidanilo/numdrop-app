const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
  withMainApplication,
  withStringsXml,
} = require("expo/config-plugins");

const PLAY_GAMES_META_NAME = "com.google.android.gms.games.APP_ID";
const STRING_RESOURCE_NAME = "game_services_project_id";
const PLACEHOLDER_PROJECT_ID = "000000000000";

function firstNonEmptyString(...candidates) {
  for (const c of candidates) {
    if (c == null) continue;
    const s = String(c).trim();
    if (s.length > 0) {
      return s;
    }
  }
  return null;
}

function getProjectId(config, props = {}) {
  return (
    firstNonEmptyString(
      props.projectId,
      process.env.EXPO_PUBLIC_PLAY_GAMES_PROJECT_ID,
      process.env.PLAY_GAMES_PROJECT_ID,
      config?.extra?.playGamesProjectId
    ) ?? PLACEHOLDER_PROJECT_ID
  );
}

function withPlayGamesStrings(config, { projectId }) {
  return withStringsXml(config, (modConfig) => {
    modConfig.modResults = AndroidConfig.Resources.ensureDefaultResourceXML(modConfig.modResults);
    modConfig.modResults = AndroidConfig.Strings.setStringItem(
      [
        AndroidConfig.Resources.buildResourceItem({
          name: STRING_RESOURCE_NAME,
          value: projectId,
          translatable: false,
        }),
      ],
      modConfig.modResults
    );
    return modConfig;
  });
}

function withPlayGamesManifest(config) {
  return withAndroidManifest(config, (modConfig) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(modConfig.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      PLAY_GAMES_META_NAME,
      `@string/${STRING_RESOURCE_NAME}`,
      "value"
    );
    return modConfig;
  });
}

function withPlayGamesMainApplication(config) {
  return withMainApplication(config, (modConfig) => {
    let contents = modConfig.modResults.contents;
    if (contents.includes("PlayGamesSdk.initialize")) {
      return modConfig;
    }
    contents = contents.replace(
      "import expo.modules.ApplicationLifecycleDispatcher",
      "import com.google.android.gms.games.PlayGamesSdk\nimport expo.modules.ApplicationLifecycleDispatcher"
    );
    if (!contents.includes("import com.google.android.gms.games.PlayGamesSdk")) {
      contents = contents.replace(
        "import expo.modules.ReactNativeHostWrapper",
        "import com.google.android.gms.games.PlayGamesSdk\nimport expo.modules.ReactNativeHostWrapper"
      );
    }
    contents = contents.replace(
      /override fun onCreate\(\) \{\s*\n\s*super\.onCreate\(\)\s*\n/,
      "override fun onCreate() {\n    super.onCreate()\n    PlayGamesSdk.initialize(this)\n"
    );
    modConfig.modResults.contents = contents;
    return modConfig;
  });
}

/**
 * Google Play Games Services v2 (Android): project id string, manifest meta-data, PlayGamesSdk init.
 * Set EXPO_PUBLIC_PLAY_GAMES_PROJECT_ID (numeric id from Play Console → Play Games Services → Configuration).
 */
const withGooglePlayGames = (config, props = {}) => {
  const projectId = getProjectId(config, props);
  config = withPlayGamesStrings(config, { projectId });
  config = withPlayGamesManifest(config);
  config = withPlayGamesMainApplication(config);
  return config;
};

module.exports = createRunOncePlugin(withGooglePlayGames, "with-google-play-games");

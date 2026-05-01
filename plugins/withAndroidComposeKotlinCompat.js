const { withGradleProperties, withProjectBuildGradle } = require("expo/config-plugins");

/**
 * Ensures local/remote prebuilds always inject the Compose-Kotlin compatibility
 * suppression flag, regardless of regenerated android directories.
 */
module.exports = function withAndroidComposeKotlinCompat(config) {
  const withGradleProps = withGradleProperties(config, (configWithProps) => {
    const key = "androidx.compose.compiler.plugins.kotlin.suppressKotlinVersionCompatibilityCheck";
    const value = "1.9.25";
    const existing = configWithProps.modResults.find((item) => item.type === "property" && item.key === key);

    if (existing) {
      existing.value = value;
      return configWithProps;
    }

    configWithProps.modResults.push({
      type: "property",
      key,
      value,
    });

    return configWithProps;
  });

  return withProjectBuildGradle(withGradleProps, (configWithGradle) => {
    const marker = "suppressKotlinVersionCompatibilityCheck";
    const kotlinPinMarker = "details.requested.group == \"org.jetbrains.kotlin\"";
    if (configWithGradle.modResults.contents.includes(marker) && configWithGradle.modResults.contents.includes(kotlinPinMarker)) {
      return configWithGradle;
    }

    configWithGradle.modResults.contents += `

subprojects {
  configurations.all {
    resolutionStrategy.eachDependency { details ->
      if (details.requested.group == "org.jetbrains.kotlin") {
        details.useVersion("1.9.24")
      }
    }
  }
}

subprojects {
  tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
      freeCompilerArgs += [
        "-P",
        "plugin:androidx.compose.compiler.plugins.kotlin:suppressKotlinVersionCompatibilityCheck=true"
      ]
    }
  }
}
`;

    return configWithGradle;
  });
};

const { createRunOncePlugin, withSettingsGradle } = require('expo/config-plugins');

/**
 * Ensures pluginManagement can resolve Kotlin/Android plugin artifacts from
 * Google/Maven Central when plugins.gradle.org is unreachable.
 */
function withGradlePluginRepos(config) {
  return withSettingsGradle(config, (cfg) => {
    const marker = 'Prefer Maven Central / Google so plugin deps';
    if (cfg.modResults.contents.includes(marker)) {
      return cfg;
    }

    cfg.modResults.contents = cfg.modResults.contents.replace(
      /pluginManagement\s*\{/,
      `pluginManagement {
  // Prefer Maven Central / Google so plugin deps (e.g. kotlin-compiler-embeddable)
  // still resolve when plugins.gradle.org DNS is flaky.
  repositories {
    google()
    mavenCentral()
    gradlePluginPortal()
  }
`,
    );
    return cfg;
  });
}

module.exports = createRunOncePlugin(withGradlePluginRepos, 'with-gradle-plugin-repos', '1.0.0');

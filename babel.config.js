module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated / Worklets Babel plugins are injected by babel-preset-expo (do not add reanimated/plugin here — duplicate causes "runtime not ready" with Reanimated 4).
  };
};

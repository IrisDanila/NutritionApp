const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * We add `onnx`, `ort` and `bin` to assetExts so the bundler treats model
 * weights as static assets, and remove them from sourceExts.
 */
const defaultConfig = getDefaultConfig(__dirname);

/** @type {import('@react-native/metro-config').MetroConfig} */
const config = {
  resolver: {
    assetExts: [...defaultConfig.resolver.assetExts, 'onnx', 'ort', 'bin'],
  },
};

module.exports = mergeConfig(defaultConfig, config);

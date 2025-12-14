const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules: {
      stream: require.resolve('readable-stream'),
      util: require.resolve('util'),
      events: require.resolve('events'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

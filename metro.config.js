const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const path = require('path');

const config = {
  resolver: {
    assetExts: ['bin', 'txt', 'jpg', 'png', 'json', 'mp4', 'ttf', 'otf', 'woff', 'woff2'],
    // Alias react-native-keep-awake to a safe shim to avoid crashes in bridgeless mode
    extraNodeModules: {
      'react-native-keep-awake': path.resolve(__dirname, 'shims/keepAwake.js'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react-native/asset-registry' ||
    moduleName === 'react-native/Libraries/Image/AssetRegistry'
  ) {
    return {
      filePath: path.resolve(__dirname, 'node_modules/react-native/src/asset-registry.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;


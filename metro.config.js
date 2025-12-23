// metro.config.js (React Native 0.78 / non-Expo)
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const {assetExts, sourceExts} = defaultConfig.resolver;

module.exports = mergeConfig(defaultConfig, {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg').concat(['ttf', 'woff', 'woff2']),
    sourceExts: [...sourceExts, 'svg'],
  },
});

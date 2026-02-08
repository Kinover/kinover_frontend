// metro.config.js
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;
const srcPath = path.resolve(projectRoot, 'src');

const defaultConfig = getDefaultConfig(projectRoot);
const {assetExts, sourceExts} = defaultConfig.resolver;

const axiosBrowserEntry = require.resolve('axios/dist/browser/axios.cjs');

module.exports = mergeConfig(defaultConfig, {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    getTransformOptions: async () => ({
      transform: {experimentalImportSupport: false, inlineRequires: true},
    }),
  },

  resolver: {
    unstable_enablePackageExports: false,
    resolverMainFields: ['react-native', 'browser', 'main'],

    // ✅ 핵심: axios는 무조건 browser 엔트리로 보냄
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'axios') {
        return {
          type: 'sourceFile',
          filePath: axiosBrowserEntry,
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },

    extraNodeModules: {
      '@': srcPath,
    },

    watchFolders: [srcPath],

    assetExts: assetExts.filter(ext => ext !== 'svg').concat(['ttf', 'woff', 'woff2']),
    sourceExts: [...sourceExts, 'svg'],
  },
});

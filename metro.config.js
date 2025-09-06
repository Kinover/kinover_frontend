// metro.config.js (React Native 0.78 / non-Expo)
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

module.exports = mergeConfig(defaultConfig, {
  transformer: {
    // SVG를 JS로 변환
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    // ⚠️ SVG는 assetExts에서 제거하고 sourceExts에 추가해야 함
    assetExts: assetExts.filter(ext => ext !== 'svg').concat(['ttf', 'woff', 'woff2']),
    sourceExts: [...sourceExts, 'svg'],
  },
  server: {
    port: 8081,
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        if (req.url.startsWith('/api')) {
          req.url = req.url.replace('/api', '');
          req.headers['host'] = 'localhost';
          next();
        } else {
          middleware(req, res, next);
        }
      };
    },
  },
});

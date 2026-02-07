// metro.config.js (React Native 0.78 / non-Expo)
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

// ✅ 프로젝트 루트 기준
const projectRoot = __dirname;

// ✅ @ alias를 src로 연결 (너 프로젝트가 src 구조인 전제)
const srcPath = path.resolve(projectRoot, 'src');

const defaultConfig = getDefaultConfig(projectRoot);
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
    // ❗ axios가 node 엔트리로 가는 것 방지
    unstable_enablePackageExports: false,

    // RN / browser 우선
    resolverMainFields: ['react-native', 'browser', 'main'],

    /**
     * ✅ 핵심 1) Metro에서도 alias를 잡아줘야
     * - require('@/...') 같은 정적 에셋 경로가 Android에서 안정적으로 동작함
     * - babel module-resolver만 믿으면 require에서 깨지는 케이스가 종종 있음
     */
    extraNodeModules: {
      // 🔥 핵심: axios를 browser 빌드로 강제
      axios: path.resolve(projectRoot, 'node_modules/axios/dist/browser/axios.cjs'),

      // ✅ @ alias
      '@': srcPath,
    },

    /**
     * ✅ 핵심 2) Metro가 @로 시작하는 import/require를
     * 실제 파일 시스템에서 찾도록 watchFolders에 src를 추가
     */
    watchFolders: [srcPath],

    assetExts: assetExts
      .filter(ext => ext !== 'svg')
      .concat(['ttf', 'woff', 'woff2']),
    sourceExts: [...sourceExts, 'svg'],
  },
});

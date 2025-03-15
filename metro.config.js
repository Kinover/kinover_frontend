const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');


// 기본 설정 가져오기
const defaultConfig = getDefaultConfig(__dirname);

const {
  resolver: { sourceExts, assetExts },
} = getDefaultConfig(__dirname);

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    // SVG 파일을 변환할 transformer 지정
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    // SVG는 assetExts에서 제거하고, sourceExts에서 추가
    assetExts: [...assetExts, 'ttf', 'woff', 'woff2'], // 폰트 파일 확장자 추가
    sourceExts: [...sourceExts, 'svg'], // SVG를 sourceExts에 추가
  },
  server: {
    port: 8081, // 원하는 포트 번호로 변경
  },
};

module.exports = mergeConfig(defaultConfig, config);
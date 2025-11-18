module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],          // ✅ 기준 경로
        alias: {
          '@': './src',           // ✅ "@/..." → "src/..."
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      },
    ],
    [
      'react-native-reanimated/plugin',
      {
        relativeSourceLocation: true,
      },
    ], // ⛔ reanimated는 꼭 맨 마지막!
  ],
};

// babel.config.js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          store: './src/store',
          features: './src/features',
          utils: './src/utils',
          assets: './src/assets',
          app: './src/app',
          components: './src/components',
          hooks: './src/hooks',
          styles: './src/styles',
          api: './src/api',
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      },
    ],
    [
      'react-native-reanimated/plugin',
      {relativeSourceLocation: true},
    ],
  ],
};

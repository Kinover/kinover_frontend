// babel.config.js
const path = require('path');

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        cwd: path.resolve(__dirname),
        root: ['./src'],
        alias: {
          '@': './src',
          config: './src/config',
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
  env: {
    production: {
      plugins: [
        ['transform-remove-console', {exclude: ['error', 'warn']}],
      ],
    },
  },
};


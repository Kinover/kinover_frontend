// .eslintrc.js
module.exports = {
  root: true,
  env: {
    es2021: true,
    'react-native/react-native': true,
  },
  plugins: ['react', 'react-native', 'unused-imports', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    ecmaFeatures: {jsx: true},
  },
  rules: {
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    'react/prop-types': 'off',
    'no-unused-vars': 'off',

    // 모듈 자체 못 찾는 건 에러
    'import/no-unresolved': 'error',

    // ✅ default / named 임포트 꼬인 건 계속 잡기
    'import/default': 'error',
    'import/named': 'error',

    // ❌ react-native 타입 파일 때문에 자꾸 깨져서 끔
    'import/namespace': 'off',
  },

  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src'],
      },
    },
    'import/ignore': [
      'react-native-picker-select(/.*)?',
    ],
  },
};

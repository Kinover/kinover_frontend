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

    // ⬇️ 모듈 자체를 못 찾는 건 계속 잡게 두고
    'import/no-unresolved': 'error',

    // ⬇️ export 타입 헷갈려서 자꾸 시비 거는 애들만 끔
    'import/namespace': 'off',
    'import/default': 'off',
    'import/named': 'off',
  },

  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src'],
      },
    },
    'import/ignore': [
      // picker-select는 계속 무시
      'react-native-picker-select(/.*)?',
      // 필요하면 여기다 다른 패키지도 추가 가능
    ],
  },
};

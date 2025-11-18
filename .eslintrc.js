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
    'import/no-unresolved': 'error',
    'import/namespace': 'off', // ⬅️ 이 줄 추가

  },

  // 🔽 이 부분 추가
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src'], 
        // ⬆️ 여기서 'src'를 모듈 루트로 취급 → 'features/...'를 'src/features/...'로 해석
      },
    },
  },
};

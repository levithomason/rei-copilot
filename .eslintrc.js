const prettierConfig = require('./prettier.config')

module.exports = {
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
      classes: true,
      jsx: true,
    },
  },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'prettier', 'prettier/react'],
  plugins: ['json', 'prettier', 'react'],
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  rules: {
    'prettier/prettier': ['error', prettierConfig],
  }
}
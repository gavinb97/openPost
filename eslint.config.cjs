const eslintJs = require('@eslint/js');
const reactPlugin = require('eslint-plugin-react');
const babelParser = require('@babel/eslint-parser');
const prettierConfig = require('eslint-config-prettier');

const { configs } = eslintJs;

module.exports = [
  {
    files: ["**/*.js", "**/*.jsx"],  // Target both .js and .jsx files
    languageOptions: {
      ecmaVersion: 2021,             // Specify ECMAScript version for modern JavaScript
      sourceType: "module",          // Support for ES modules
      parser: babelParser,           // Use Babel parser directly
    },
    plugins: {
      react: reactPlugin,
    },
    rules: {
      ...configs.recommended.rules,  // Apply ESLint recommended rules
      ...reactPlugin.configs.recommended.rules,  // Apply React recommended rules
      ...prettierConfig.rules,        // Apply Prettier rules
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'react/prop-types': 'off',
      'no-constant-condition': 'off',
      'indent': ['error', 2],         // Set indentation to 2 spaces
      'linebreak-style': ['error', 'unix'], // Use Unix line breaks
      'quotes': ['error', 'single'],  // Use single quotes
      'semi': ['error', 'always'],    // Enforce semicolons
      'no-mixed-spaces-and-tabs': 'error', // No mixed spaces and tabs
      'space-before-function-paren': ['error', 'always'] // Space before function parenthesis
    },
  },
];

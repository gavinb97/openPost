const eslintJs = require('@eslint/js'); // Import as a CommonJS module
const reactPlugin = require('eslint-plugin-react');
const babelParser = require('@babel/eslint-parser');

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
      react: reactPlugin
    },
    rules: {
      ...configs.recommended.rules,  // Apply ESLint recommended rules
      ...reactPlugin.configs.recommended.rules,  // Apply React recommended rules
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'react/prop-types': 'off'

    }
  }
];

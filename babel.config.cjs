module.exports = {
  presets: [
    '@babel/preset-env', // For modern JavaScript features
    '@babel/preset-react', // For React JSX support
  ],
  parserOpts: {
    plugins: [
      'jsx', // To support JSX syntax
    ],
  },
};

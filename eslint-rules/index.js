/** Plugin ESLint local : garde-fous du design system v3.1. */
module.exports = {
  meta: { name: 'eslint-plugin-pulsefit' },
  rules: {
    'no-literal-style': require('./no-literal-style'),
    'no-classname': require('./no-classname'),
  },
};

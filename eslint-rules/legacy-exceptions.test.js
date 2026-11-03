/** @jest-environment node */
const fs = require('fs');
const path = require('path');
const { Linter } = require('eslint');

const pulsefit = require('./index');
const { STEPS } = require('./legacy-exceptions');

const ROOT = path.join(__dirname, '..');
const RULE_OF = { className: 'pulsefit/no-classname', literalStyle: 'pulsefit/no-literal-style' };

const linter = new Linter();
const violatedRules = (file) => {
  const messages = linter.verify(
    fs.readFileSync(path.join(ROOT, file), 'utf8'),
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: { pulsefit },
      rules: Object.fromEntries(Object.values(RULE_OF).map((rule) => [rule, 'error'])),
    },
    { filename: file },
  );
  return new Set(messages.map((m) => m.ruleId));
};

const entries = Object.values(STEPS).flatMap((files) => Object.entries(files));

describe('exceptions temporaires du design system', () => {
  it('ne liste aucun fichier deux fois', () => {
    const files = entries.map(([file]) => file);
    expect(new Set(files).size).toBe(files.length);
  });

  it.each(entries)('%s existe et viole encore chaque règle exemptée', (file, rules) => {
    expect(fs.existsSync(path.join(ROOT, file))).toBe(true);
    const violated = violatedRules(file);
    for (const rule of rules) expect([rule, violated.has(RULE_OF[rule])]).toEqual([rule, true]);
  });
});

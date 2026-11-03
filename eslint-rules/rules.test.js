/** @jest-environment node */
const { RuleTester } = require('eslint');

const noLiteralStyle = require('./no-literal-style');
const noClassName = require('./no-classname');

const tester = new RuleTester({
  languageOptions: {
    parser: require('@typescript-eslint/parser'),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run('no-literal-style', noLiteralStyle, {
  valid: [
    'const s = { padding: t.space.screen, borderRadius: t.radius.card, fontSize: t.typography.body.fontSize };',
    'const s = { margin: 0, flex: 1, width: 48, opacity: 0.5 };',
    '<View style={{ backgroundColor: theme.colors.surface }} />',
    'const id = "#hashtag-not-a-color"; const anchor = "#section";',
    'const label = "rgb du pixel";',
  ],
  invalid: [
    { code: 'const c = "#fff";', errors: [{ messageId: 'color' }] },
    { code: 'const c = "#4F46E5CC";', errors: [{ messageId: 'color' }] },
    { code: 'const c = "rgba(0, 0, 0, 0.4)";', errors: [{ messageId: 'color' }] },
    { code: 'const c = `#0B0D12`;', errors: [{ messageId: 'color' }] },
    { code: '<Path fill="#16A34A" />', errors: [{ messageId: 'color' }] },
    { code: 'const s = { fontSize: 13 };', errors: [{ messageId: 'number' }] },
    { code: 'const s = { borderTopLeftRadius: 24 };', errors: [{ messageId: 'number' }] },
    { code: 'const s = { paddingHorizontal: 20, marginTop: -8 };', errors: [{ messageId: 'number' }, { messageId: 'number' }] },
    { code: 'const s = { gap: "12px" };', errors: [{ messageId: 'number' }] },
    { code: 'const s = { "padding": big ? 16 : t.space.sm };', errors: [{ messageId: 'number' }] },
    { code: 'const s = { lineHeight: size ?? 22 };', errors: [{ messageId: 'number' }] },
    { code: '<View style={{ margin: 4 }} />', errors: [{ messageId: 'number' }] },
    { code: '<SvgText fontSize={12} />', errors: [{ messageId: 'number' }] },
  ],
});

tester.run('no-classname', noClassName, {
  valid: ['<View style={styles.card} />', '<View testID="className" />'],
  invalid: [
    { code: '<View className="p-4" />', errors: [{ messageId: 'className' }] },
    { code: '<ScrollView contentContainerClassName="gap-2" />', errors: [{ messageId: 'className' }] },
  ],
});

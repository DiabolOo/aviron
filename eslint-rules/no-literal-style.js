/**
 * Refuse toute valeur de style littérale : elle doit venir de src/design/theme.ts.
 * - couleur littérale (hex, rgb(a), hsl(a)) où qu'elle soit ;
 * - nombre littéral non nul pour une taille de texte, un rayon, un padding, une marge ou un écart.
 */
const COLOR = /^(?:#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(?:rgba?|hsla?)\(.*\))$/i;
const STYLE_PROP = /^(?:fontSize|lineHeight|letterSpacing|border\w*Radius|padding\w*|margin\w*|gap|rowGap|columnGap)$/;
const NUMERIC_STRING = /^-?\d+(?:\.\d+)?(?:px)?$/;

const isLiteralNumber = (node) => {
  if (node.type === 'UnaryExpression' && node.operator === '-') return isLiteralNumber(node.argument);
  if (node.type !== 'Literal') return false;
  if (typeof node.value === 'number') return node.value !== 0;
  return typeof node.value === 'string' && NUMERIC_STRING.test(node.value) && parseFloat(node.value) !== 0;
};

/** Valeurs littérales atteignables (y compris dans `cond ? 12 : 14` et `a ?? 12`). */
const literalNumbers = (node) => {
  if (!node) return [];
  switch (node.type) {
    case 'ConditionalExpression':
      return [...literalNumbers(node.consequent), ...literalNumbers(node.alternate)];
    case 'LogicalExpression':
      return [...literalNumbers(node.left), ...literalNumbers(node.right)];
    case 'JSXExpressionContainer':
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
      return literalNumbers(node.expression);
    default:
      return isLiteralNumber(node) ? [node] : [];
  }
};

const keyName = (key) => (key.type === 'Identifier' ? key.name : key.type === 'Literal' ? String(key.value) : null);

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Interdit les valeurs de style littérales hors de src/design/.' },
    schema: [],
    messages: {
      color: 'Couleur littérale « {{value}} » : utiliser theme.colors (src/design/theme.ts).',
      number: 'Valeur littérale pour « {{prop}} » : utiliser un token de src/design/theme.ts (space, radius, typography).',
    },
  },
  create(context) {
    const reportNumbers = (prop, value) => {
      for (const node of literalNumbers(value)) context.report({ node, messageId: 'number', data: { prop } });
    };
    const checkColor = (node, value) => {
      if (typeof value === 'string' && COLOR.test(value.trim())) {
        context.report({ node, messageId: 'color', data: { value } });
      }
    };
    return {
      Literal(node) {
        checkColor(node, node.value);
      },
      TemplateElement(node) {
        checkColor(node, node.value.cooked);
      },
      Property(node) {
        const name = keyName(node.key);
        if (name && STYLE_PROP.test(name)) reportNumbers(name, node.value);
      },
      JSXAttribute(node) {
        const name = node.name.type === 'JSXIdentifier' ? node.name.name : null;
        if (name && STYLE_PROP.test(name)) reportNumbers(name, node.value);
      },
    };
  },
};

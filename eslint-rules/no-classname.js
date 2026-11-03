/**
 * NativeWind est gelé (ADR-011) : le nouveau code style avec makeStyles / StyleSheet dérivés
 * des tokens de src/design/, jamais avec `className` ni `*ClassName`.
 */
/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Interdit className (NativeWind) hors des fichiers antérieurs à la v3.1.' },
    schema: [],
    messages: {
      className: '« {{name}} » : NativeWind est gelé (ADR-011). Utiliser makeStyles de src/design/.',
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        const name = node.name.type === 'JSXIdentifier' ? node.name.name : null;
        if (name && /^(?:className|\w+ClassName)$/.test(name)) {
          context.report({ node, messageId: 'className', data: { name } });
        }
      },
    };
  },
};

// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/src/data/mock*", "@/src/data/adapters/*", "**/src/data/mock*", "**/src/data/adapters/*"],
          message: "L'UI ne doit pas importer les mocks ni les adaptateurs : passer par les repositories (src/data).",
        }],
      }],
    },
  }
]);

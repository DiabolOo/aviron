// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");
const pulsefit = require("./eslint-rules");
const legacy = require("./eslint-rules/legacy-exceptions");

// Design system v3.1 (ADR-011) : toute valeur de style vient de src/design/.
const DESIGN_SCOPE = ["{app,components,constants,lib,src}/**/*.{js,jsx,ts,tsx}"];
const DESIGN_SOURCE = ["src/design/**"];
const literalPaths = (files) => files.map((file) => file.replace(/[()[\]{}*?!+@]/g, "\\$&"));

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
  },
  {
    files: DESIGN_SCOPE,
    ignores: [...DESIGN_SOURCE, ...literalPaths(legacy.literalStyle)],
    plugins: { pulsefit },
    rules: { "pulsefit/no-literal-style": "error" },
  },
  {
    files: DESIGN_SCOPE,
    ignores: literalPaths(legacy.className),
    plugins: { pulsefit },
    rules: { "pulsefit/no-classname": "error" },
  },
]);

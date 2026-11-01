const plugin = require('tailwindcss/plugin');
const { palettes } = require('./constants/theme.ts');

/** Une seule source : `constants/theme.ts`. Les jetons hex deviennent des variables CSS (« r g b »), clair puis sombre. */
const kebab = (key) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const hexKeys = Object.keys(palettes.light).filter((key) => /^#[0-9a-f]{6}$/i.test(palettes.light[key]));
const rgbTriple = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ');
const cssVars = (palette) => Object.fromEntries(hexKeys.map((key) => [`--${kebab(key)}`, rgbTriple(palette[key])]));
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: Object.fromEntries(hexKeys.map((key) => [kebab(key), token(kebab(key))])),
      fontSize: {
        xs: ['13px', '18px'],
        sm: ['15px', '21px'],
        base: ['17px', '24px'],
      },
      fontFamily: {
        mono: ['SpaceMono'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '28px',
        '4xl': '32px',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': { '--css-interop-darkMode': 'class dark', ...cssVars(palettes.light) },
        '.dark:root': cssVars(palettes.dark),
      });
    }),
  ],
};

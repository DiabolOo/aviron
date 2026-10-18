/** @type {import('tailwindcss').Config} */
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
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        fg: token('fg'),
        muted: token('muted'),
        accent: token('accent'),
        'accent-fg': token('accent-fg'),
        aqua: token('aqua'),
        iris: token('iris'),
      },
      fontFamily: {
        mono: ['SpaceMono'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
    },
  },
  plugins: [],
};

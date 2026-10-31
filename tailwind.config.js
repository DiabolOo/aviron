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
        chip: token('chip'),
        track: token('track'),
        sport: token('sport'),
        'sport-tint': token('sport-tint'),
        nutri: token('nutri'),
        'nutri-tint': token('nutri-tint'),
      },
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
  plugins: [],
};

export const palettes = {
  light: {
    canvas: '#F4F5F7',
    surface: '#FFFFFF',
    fg: '#0A0B0D',
    muted: '#6E7380',
    accent: '#A8E10C',
    accentFg: '#0A0B0D',
    aqua: '#0891B2',
    iris: '#7C3AED',
    track: 'rgba(10,11,13,0.07)',
  },
  dark: {
    canvas: '#07080B',
    surface: '#111318',
    fg: '#F4F5F7',
    muted: '#7C8190',
    accent: '#C6F432',
    accentFg: '#0A0B0D',
    aqua: '#5EE1E6',
    iris: '#A78BFA',
    track: 'rgba(244,245,247,0.08)',
  },
} as const;

export type Scheme = keyof typeof palettes;
export type Palette = (typeof palettes)[Scheme];

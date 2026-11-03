import type { Scheme } from '@/constants/theme';

export const AI_GRADIENT = ['#6D5AE6', '#E5588A'] as const;
export const FLAME_GRADIENT = ['#FF4D2E', '#FFA23A'] as const;
export const NUTRI_GRADIENT = ['#FFB08F', '#FF6A45'] as const;
export const FORME_GRADIENT = ['#5EE0CF', '#0EA394'] as const;

export type Tone = 'home' | 'plan' | 'agent' | 'suivi';

export const AURORA: Record<Tone, readonly { color: string; cx: number; cy: number }[]> = {
  home: [
    { color: '#E3F6BD', cx: 10, cy: 0 },
    { color: '#FFDCCB', cx: 100, cy: 4 },
  ],
  plan: [
    { color: '#DAD8FF', cx: 85, cy: 0 },
    { color: '#E3F6BD', cx: 0, cy: 6 },
  ],
  agent: [
    { color: '#E4DAFF', cx: 20, cy: 0 },
    { color: '#FFD9E6', cx: 100, cy: 8 },
  ],
  suivi: [
    { color: '#FFE0CF', cx: 80, cy: 0 },
    { color: '#FDF1C4', cx: 0, cy: 8 },
  ],
};

export const DARK_GLOW = '#1B2030';

export const CARD_TINT: Record<'sport' | 'nutri' | 'forme' | 'ai' | 'data', string> = {
  data: '#34527D',
  sport: '#7C6CF2',
  nutri: '#FF7A59',
  forme: '#14B8A6',
  ai: '#E5588A',
};

export function isDark(scheme: Scheme): boolean {
  return scheme === 'dark';
}

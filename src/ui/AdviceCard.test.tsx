import { fireEvent, render, screen } from '@testing-library/react-native';

import { AdviceCard } from '@/components/ui/AdviceCard';
import { palettes } from '@/constants/theme';

jest.mock('lucide-react-native', () => ({
  __esModule: true,
  ...Object.fromEntries(['ChevronDown', 'BarChart3', 'Sparkles'].map((n) => [n, () => null])),
}));
jest.mock('@/src/ui/motion/useReducedMotion', () => ({ useReducedMotion: () => true }));

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('AdviceCard', () => {
  it('data : étiquette « D’après tes données », phrase sous le titre, « Pourquoi ? » fermé', async () => {
    await render(<AdviceCard source="data" title="Titre" summary="+6,2 % plus lent" why={['Détail']} />);
    expect(screen.getByTestId('advice-card-data')).toBeTruthy();
    expect(screen.getByTestId('advice-source').props.children).toBe('D’après tes données');
    expect(screen.getByText('+6,2\u00a0% plus lent')).toBeTruthy();
    expect(screen.queryByText('Détail')).toBeNull();
    await fireEvent.press(screen.getByText('Pourquoi ?'));
    expect(screen.getByText('Détail')).toBeTruthy();
  });

  it('ai : étiquette « Analyse IA »', async () => {
    await render(<AdviceCard source="ai" title="Titre" summary="Phrase" />);
    expect(screen.getByTestId('advice-card-ai')).toBeTruthy();
    expect(screen.getByTestId('advice-source').props.children).toBe('Analyse IA');
    expect(screen.queryByText('Pourquoi ?')).toBeNull();
  });
});

describe('contraste des encarts (AA, texte normal ≥ 4,5)', () => {
  it.each(['light', 'dark'] as const)('%s : étiquette, texte principal et secondaire sur chaque teinte', (scheme) => {
    const p = palettes[scheme];
    for (const [accent, tint] of [
      [p.insightData, p.insightDataTint],
      [p.insightAi, p.insightAiTint],
    ]) {
      expect(contrast(accent, tint)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.fg, tint)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.muted, tint)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('teintes distinctes entre elles et de Nutrition', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const p = palettes[scheme];
      expect(new Set([p.insightDataTint, p.insightAiTint, p.nutriTint]).size).toBe(3);
      expect(new Set([p.insightData, p.insightAi, p.nutri]).size).toBe(3);
    }
  });
});

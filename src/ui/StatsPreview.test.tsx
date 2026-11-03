import { render, screen } from '@testing-library/react-native';

import { StatsPreviewScreen } from './StatsPreview';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const dev = globalThis as unknown as { __DEV__: boolean };

describe('StatsPreviewScreen', () => {
  it('affiche les états de la carte en mode dev', async () => {
    await render(<StatsPreviewScreen />);
    expect(screen.getByText('1 · Tout vide')).toBeTruthy();
    expect(screen.getByText('5 · Cas réel (sans FC récente)')).toBeTruthy();
  });

  it('ne rend rien hors mode dev', async () => {
    const prev = dev.__DEV__;
    dev.__DEV__ = false;
    try {
      const r = await render(<StatsPreviewScreen />);
      expect(r.toJSON()).toBeNull();
    } finally {
      dev.__DEV__ = prev;
    }
  });
});

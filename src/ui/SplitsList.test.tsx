import { render, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import { SplitsList } from '@/components/sport/SplitsList';
import type { ActivitySplit } from '@/src/core/types';

const WALK: ActivitySplit[] = [
  { km: 1, pace: '15:12', paceSec: 912, elevationGain: 37, avgHr: 104 },
  { km: 2, pace: '14:58', paceSec: 898, elevationGain: 4, avgHr: 108 },
  { km: 3, pace: '56:40', paceSec: 3400, elevationGain: 0 },
  { km: 4, pace: '16:05', paceSec: 965, elevationGain: 12, avgHr: 99 },
];

describe('SplitsList', () => {
  it('marche à allures de 2 chiffres : colonnes sur une ligne, arrêt sans barre', async () => {
    await render(<SplitsList splits={WALK} />);
    expect(screen.getByText('Allure (min/km)')).toBeTruthy();
    expect(screen.getByText('15:12').props.numberOfLines).toBe(1);
    expect(screen.getByText('15:12').props.ellipsizeMode).toBe('clip');
    expect(screen.getByText('37 m')).toBeTruthy();
    expect(screen.getAllByText('arrêt')).toHaveLength(1);
    expect(screen.queryByText('56:40')).toBeNull();
    expect(screen.getAllByTestId('split-bar')).toHaveLength(3);
  });

  it('petit écran : la barre disparaît, les colonnes restent', async () => {
    const spy = jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 320, height: 640, scale: 2, fontScale: 1 });
    await render(<SplitsList splits={WALK} />);
    expect(screen.queryAllByTestId('split-bar')).toHaveLength(0);
    expect(screen.getByText('15:12')).toBeTruthy();
    expect(screen.getAllByText('arrêt')).toHaveLength(1);
    spy.mockRestore();
  });
});

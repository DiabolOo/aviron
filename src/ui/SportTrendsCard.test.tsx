import { render, screen } from '@testing-library/react-native';

import type { Activity } from '@/src/core/schemas';
import { buildSportTrends } from '@/src/core/training/engine';
import { SportTrendsCard } from '@/src/modules/sport/SportTrendsCard';

const TODAY = '2026-11-04';

function run(id: string, date: string, km: number, avgHr?: number): Activity {
  return { id, name: 'Sortie', type: 'run', date, startTime: '08:00', durationMin: km * 5, distanceKm: km, avgHr };
}

const week = (hr?: number) => [
  run('a', '2026-10-30', 10, hr),
  run('b', '2026-10-23', 8, hr),
  run('c', '2026-10-16', 12, hr),
  run('d', '2026-10-09', 7, hr),
];

describe('SportTrendsCard', () => {
  it('écrit les fenêtres de chaque section', async () => {
    await render(<SportTrendsCard trends={buildSportTrends({ activities: week(150), today: TODAY, configuredMaxHr: 190 })} />);
    expect(screen.getByText('· 8 semaines')).toBeTruthy();
    expect(screen.getByText('· 12 semaines')).toBeTruthy();
    expect(screen.getByText('· 6 mois')).toBeTruthy();
    // part estimée > mesurée : « estimation » est affichée en marqueur
    expect(screen.getByText('estimation')).toBeTruthy();
  });

  it('remplace Intensités et Efficacité par une seule ligne quand la FC est absente', async () => {
    const activities = [run('old', '2026-06-03', 10, 150), ...week(undefined)];
    await render(<SportTrendsCard trends={buildSportTrends({ activities, today: TODAY })} />);
    expect(screen.getByText('FC absente depuis le 3 juin')).toBeTruthy();
    expect(screen.queryByText('Intensités')).toBeNull();
    expect(screen.queryByText('Efficacité aérobie')).toBeNull();
    expect(screen.getByText('Volume')).toBeTruthy();
  });

  it('réaffiche les sections dès qu’une course de plus de 5 km a une FC', async () => {
    const activities = [...week(undefined), run('hr', '2026-11-01', 7, 150)];
    await render(<SportTrendsCard trends={buildSportTrends({ activities, today: TODAY })} />);
    expect(screen.queryByText(/FC absente/)).toBeNull();
    expect(screen.getByText('Intensités')).toBeTruthy();
    expect(screen.getByText('Efficacité aérobie')).toBeTruthy();
  });
});

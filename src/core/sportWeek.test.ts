import { activityDurationDisplay, formatClock } from '@/src/core/sportFormat';
import { groupByMonth, selectWeek, shiftWeek } from '@/src/core/sportWeek';
import type { StravaActivity } from '@/src/core/types';

const act = (id: string, date: string, distanceKm: number, durationMin: number): StravaActivity =>
  ({ id, date, type: 'run', name: id, distanceKm, durationMin }) as StravaActivity;

const list = [
  act('a', '2025-03-03', 10, 60),
  act('b', '2025-03-09', 5, 30),
  act('c', '2025-03-10', 8, 45),
  act('d', '2025-02-28', 4, 20),
];


describe('sportWeek', () => {
  it('total = somme des durées affichées (déplacement ; chrono pour les courses)', () => {
    const acts = [
      { ...act('a', '2026-10-12', 9.1, 49.2167), movingTimeSec: 2718 },
      { ...act('b', '2026-10-14', 5, 30.4), movingTimeSec: 1700 },
      { ...act('semi', '2026-10-18', 21.3, 113.15), movingTimeSec: 6785 },
    ];
    const week = selectWeek(acts, '2026-10-12', new Set(['semi']));
    const shown = week.activities.map((a) => activityDurationDisplay(a, a.id === 'semi').main);
    const toSec = (c: string) => c.split(':').reduce((t, n) => t * 60 + Number(n), 0);
    expect(shown).toEqual(['1:53:09', '28:20', '45:18']);
    expect(week.durationSec).toBe(shown.map(toSec).reduce((a, b) => a + b, 0));
    expect(formatClock(week.durationSec)).toBe('3:06:47');
    expect(selectWeek(acts, '2026-10-12').durationSec).toBe(2718 + 1700 + 6785);
  });

  it('sélectionne lundi → dimanche', () => {
    const w = selectWeek(list, '2025-03-05');
    expect(w.start).toBe('2025-03-03');
    expect(w.end).toBe('2025-03-09');
    expect(w.count).toBe(2);
    expect(w.km).toBe(15);
    expect(w.durationSec).toBe(5400);
    expect(w.activities[0].id).toBe('b');
  });

  it('navigue entre semaines', () => {
    expect(shiftWeek('2025-03-03', -1)).toBe('2025-02-24');
    expect(selectWeek(list, '2025-03-17').count).toBe(0);
  });

  it('groupe par mois, plus récent d’abord', () => {
    const g = groupByMonth(list);
    expect(g.map((x) => x.key)).toEqual(['2025-03', '2025-02']);
    expect(g[0].items).toHaveLength(3);
  });
});

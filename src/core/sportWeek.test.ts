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
  it('sélectionne lundi → dimanche', () => {
    const w = selectWeek(list, '2025-03-05');
    expect(w.start).toBe('2025-03-03');
    expect(w.end).toBe('2025-03-09');
    expect(w.count).toBe(2);
    expect(w.km).toBe(15);
    expect(w.durationMin).toBe(90);
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

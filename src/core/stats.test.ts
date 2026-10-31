import { buildNutritionStats, buildSportStats, daysBetween } from './stats';

const act = (date: string, distanceKm: number) => ({ date: `${date}T08:00:00`, distanceKm });

describe('daysBetween', () => {
  it('compte les jours calendaires', () => {
    expect(daysBetween('2026-10-01', '2026-10-30')).toBe(29);
    expect(daysBetween('2026-10-30', '2026-10-30')).toBe(0);
  });
});

describe('buildSportStats', () => {
  const today = '2026-10-30';

  it('totalise km et séances sur la période et compare à la précédente', () => {
    const stats = buildSportStats({
      period: 'month',
      today,
      activities: [act('2026-10-28', 10), act('2026-10-10', 20), act('2026-09-20', 15), act('2025-01-01', 99)],
    });
    expect(stats).toMatchObject({ km: 30, sessions: 2, deltaPct: 100 });
    expect(stats.bars).toHaveLength(5);
    expect(stats.bars[4].current).toBe(true);
  });

  it('renvoie 7 barres pour la semaine et 12 pour l’année', () => {
    expect(buildSportStats({ period: 'week', today, activities: [] }).bars).toHaveLength(7);
    expect(buildSportStats({ period: 'year', today, activities: [] }).bars).toHaveLength(12);
  });

  it('delta nul sans période précédente', () => {
    expect(
      buildSportStats({ period: 'week', today, activities: [act('2026-10-29', 5)] }).deltaPct,
    ).toBeNull();
  });
});

describe('buildNutritionStats', () => {
  it('moyenne par jour renseigné', () => {
    const macros = { calories: 1000, protein: 0, carbs: 0, fat: 0 };
    const stats = buildNutritionStats({
      period: 'week',
      today: '2026-10-30',
      targetKcal: 2000,
      meals: [
        { loggedAt: '2026-10-30T12:00:00', macros },
        { loggedAt: '2026-10-30T19:00:00', macros },
        { loggedAt: '2026-10-29T12:00:00', macros },
      ],
    });
    expect(stats.avgKcal).toBe(1500);
    expect(stats.points).toHaveLength(7);
    expect(stats.points[6]).toBe(2000);
  });
});

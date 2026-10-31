import { parseObjective } from './objective';

describe('parseObjective', () => {
  it('comprend une prépa semi avec temps, durée et séances', () => {
    const goal = parseObjective(
      'Semi en 1 h 45 dans 10 semaines, 4 séances par semaine, pas le mercredi',
      '2026-10-30',
    );
    expect(goal).toMatchObject({
      type: 'race_prep',
      targetName: 'Semi-marathon',
      targetValue: '1h45',
      targetDate: '2027-01-08',
      weeklySessionsCount: 4,
    });
  });

  it('retombe sur « fitness » avec 3 séances par défaut', () => {
    expect(parseObjective('Rester en forme', '2026-10-30')).toMatchObject({
      type: 'fitness',
      weeklySessionsCount: 3,
    });
  });

  it('refuse un texte vide', () => {
    expect(parseObjective('  ', '2026-10-30')).toBeNull();
  });
});

import { getNowAction } from './now';

const session = { id: 's1', title: 'Fractionné', completed: false };

describe('getNowAction', () => {
  it('propose le repas du moment quand il manque', () => {
    expect(getNowAction({ hour: 12, mealHours: [8], session })).toEqual({
      kind: 'log_meal',
      moment: 'noon',
      title: 'Déjeuner',
    });
  });

  it('passe à la séance quand le repas est loggé', () => {
    expect(getNowAction({ hour: 12, mealHours: [8, 12], session })).toMatchObject({
      kind: 'workout',
      sessionId: 's1',
    });
  });

  it('ne réclame pas de repas hors fenêtre', () => {
    expect(getNowAction({ hour: 16, mealHours: [], session: undefined }).kind).toBe('idle');
  });

  it('est au repos quand la séance est faite', () => {
    expect(
      getNowAction({ hour: 15, mealHours: [12], session: { ...session, completed: true } }).kind,
    ).toBe('idle');
  });
});

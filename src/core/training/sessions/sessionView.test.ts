import type { Activity } from '../../schemas';
import { buildSessionView } from './sessionView';
import type { Session } from './types';

const RUN: Activity = {
  id: 'r1', name: 'Footing', type: 'run', date: '2026-11-02', startTime: '18:20:00',
  durationMin: 30, movingTimeSec: 1800, distanceKm: 5, avgHr: 148, maxHr: 171,
  source: 'coros', aiEligible: true,
};

const SESSION: Session = {
  id: 's_r1', sport: 'run', familySport: 'run',
  startedAt: '2026-11-02T18:20:00+01:00', endedAt: '2026-11-02T18:50:00+01:00',
  activityIds: ['r1'], movingTimeSec: 1800, elapsedTimeSec: 1800, distanceM: 5000, avgHr: 148,
  aiEligible: true,
};

const MAP = new Map([[RUN.id, RUN]]);

describe('buildSessionView selon le niveau déclaré', () => {
  it('« Je débute » : la durée en héros, aucun chiffre secondaire (215)', () => {
    const view = buildSessionView(SESSION, MAP, 'beginner');
    expect(view.heroValue).toBe('30\u00a0min');
    expect(view.heroUnit).toBeUndefined();
    expect(view.metrics).toEqual([]);
    expect(view.pace).toBeUndefined();
    expect(view.parts[0].distanceLabel).toBeUndefined();
    expect(view.parts[0].paceLabel).toBeUndefined();
    expect(view.density.hr).toBe(false);
  });

  it('« Je cours un peu » : distance et allure, sans FC', () => {
    const view = buildSessionView(SESSION, MAP, 'regular');
    expect(view.heroUnit).toBe('/km');
    expect(view.metrics.map((m) => m.label)).not.toContain('FC moy.');
    expect(view.metrics.map((m) => m.label)).not.toContain('FC max');
    expect(view.parts[0].paceLabel).toBeDefined();
  });

  it('« Je m’entraîne » (défaut) : tout ce que les données permettent', () => {
    const view = buildSessionView(SESSION, MAP);
    expect(view.heroUnit).toBe('/km');
    expect(view.metrics.map((m) => m.label)).toEqual(['FC moy.', 'FC max']);
    expect(view.density.reconstructed).toBe(true);
  });

  it('les données retirent : sans FC, « Je m’entraîne » n’a pas de chiffre de FC', () => {
    const noHr = { ...RUN, avgHr: undefined, maxHr: undefined };
    const view = buildSessionView({ ...SESSION, avgHr: undefined }, new Map([[noHr.id, noHr]]), 'advanced');
    expect(view.metrics).toEqual([]);
    expect(view.density.hr).toBe(true);
  });
});

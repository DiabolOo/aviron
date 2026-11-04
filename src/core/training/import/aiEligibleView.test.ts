import type { Activity } from '../../schemas';
import type { Session } from '../sessions/types';
import { aiEligibleView } from './aiEligibleView';

function act(id: string, aiEligible: boolean): Activity {
  return {
    id, name: id, type: 'run', date: '2026-05-01', startTime: '08:00', durationMin: 30,
    source: aiEligible ? 'coros' : 'strava',
    aiEligible,
  };
}

function session(id: string, activityIds: string[], aiEligible: boolean): Session {
  return {
    id,
    sport: 'run',
    familySport: 'run',
    startedAt: '2026-05-01T08:00:00+00:00',
    endedAt: '2026-05-01T08:30:00+00:00',
    activityIds,
    movingTimeSec: 1800,
    elapsedTimeSec: 1800,
    aiEligible,
  };
}

describe('aiEligibleView', () => {
  it('garde les activités aiEligible:true, exclut aiEligible:false', () => {
    const acts = [act('a1', true), act('a2', false), act('a3', true)];
    const { activities } = aiEligibleView(acts, []);
    expect(activities.map((a) => a.id)).toEqual(['a1', 'a3']);
  });

  it('garde les séances dont toutes les activités sont éligibles', () => {
    const acts = [act('a1', true), act('a2', true), act('a3', false)];
    const sessions = [
      session('s1', ['a1', 'a2'], true),   // toutes éligibles → gardée
      session('s2', ['a3'], false),          // non éligible → exclue
    ];
    const { sessions: out } = aiEligibleView(acts, sessions);
    expect(out.map((s) => s.id)).toEqual(['s1']);
  });

  it('exclut la séance mixte (une éligible + une non éligible)', () => {
    const acts = [act('a1', true), act('a2', false)];
    const sessions = [
      session('s_mixed', ['a1', 'a2'], false),
    ];
    const { sessions: out } = aiEligibleView(acts, sessions);
    expect(out).toHaveLength(0);
  });

  it('résumé identique avec ou sans les activités Strava présentes', () => {
    // Le volume total des activités éligibles est le même que si on n'avait jamais importé Strava
    const eligible = [act('a1', true), act('a2', true)];
    const withStrava = [...eligible, act('s1', false), act('s2', false)];

    const v1 = aiEligibleView(eligible, []);
    const v2 = aiEligibleView(withStrava, []);

    expect(v1.activities.map((a) => a.id)).toEqual(v2.activities.map((a) => a.id));
  });

  it('ne mute pas les entrées', () => {
    const acts = [act('a1', true)];
    const sessions: Session[] = [];
    const actsCopy = [...acts];
    aiEligibleView(acts, sessions);
    expect(acts).toEqual(actsCopy);
  });

  it('résultat vide si tout est Strava', () => {
    const acts = [act('a1', false), act('a2', false)];
    const sessions = [session('s1', ['a1', 'a2'], false)];
    const { activities, sessions: out } = aiEligibleView(acts, sessions);
    expect(activities).toHaveLength(0);
    expect(out).toHaveLength(0);
  });
});

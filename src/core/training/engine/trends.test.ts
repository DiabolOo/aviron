import type { Activity } from '../../schemas';
import {
  buildSportTrends,
  efficiencyTrend,
  intensityTrend,
  observedMaxHr,
  parseMaxHrInput,
  resolveMaxHr,
  volumeTrend,
} from './trends';

// 2026-11-04 = mercredi (semaine du lundi 2026-11-02)
const TODAY = '2026-11-04';

function act(id: string, date: string, distanceKm: number, min: number, avgHr?: number, type: Activity['type'] = 'run'): Activity {
  return { id, name: 'Sortie', type, date, startTime: '08:00', durationMin: min, distanceKm, avgHr, source: 'manual' as const, aiEligible: true };
}

describe('resolveMaxHr', () => {
  const acts = [{ ...act('o', '2026-06-01', 10, 50, 150), maxHr: 196 }];

  it('la valeur saisie est prioritaire, même avec une observée et un âge', () => {
    expect(resolveMaxHr({ configuredMaxHr: 190, activities: acts, today: TODAY, ageYears: 30 }))
      .toEqual({ maxHr: 190, source: 'configured' });
  });

  it('retombe sur la FC max observée, confirmée par deux activités à 3 bpm près', () => {
    const confirmed = [...acts, { ...act('o2', '2026-08-01', 10, 50, 150), maxHr: 194 }];
    expect(resolveMaxHr({ activities: confirmed, today: TODAY, ageYears: 40 }))
      .toEqual({ maxHr: 196, source: 'observed' });
  });

  it('ignore un pic isolé à 220 bpm et prend la deuxième plus haute valeur', () => {
    const spike = [
      { ...act('s', '2026-09-01', 10, 50, 150), maxHr: 220 },
      { ...act('a', '2026-08-01', 10, 50, 150), maxHr: 196 },
      { ...act('b', '2026-07-01', 10, 50, 150), maxHr: 194 },
    ];
    expect(resolveMaxHr({ activities: spike, today: TODAY, ageYears: 40 }))
      .toEqual({ maxHr: 196, source: 'observed' });
    expect(observedMaxHr(spike, TODAY)).toBe(196);
  });

  it('confirmation exactement à 3 bpm : acceptée ; à 4 bpm : pic écarté', () => {
    const pair = (hi: number, lo: number) => [
      { ...act('a', '2026-09-01', 10, 50, 150), maxHr: hi },
      { ...act('b', '2026-08-01', 10, 50, 150), maxHr: lo },
    ];
    expect(observedMaxHr(pair(200, 197), TODAY)).toBe(200);
    expect(observedMaxHr(pair(200, 196), TODAY)).toBe(196);
  });

  it('une seule activité ne suffit pas : retombe sur l’âge', () => {
    expect(observedMaxHr(acts, TODAY)).toBeUndefined();
    expect(resolveMaxHr({ activities: acts, today: TODAY, ageYears: 40 }))
      .toEqual({ maxHr: 180, source: 'estimated' });
  });

  it('ignore les FC max hors fenêtre ou absentes', () => {
    const old = [{ ...act('o', '2024-01-01', 10, 50, 150), maxHr: 196 }, { ...act('o2', '2024-02-01', 10, 50, 150), maxHr: 195 }];
    const none = [act('n', '2026-06-01', 10, 50, 150)];
    expect(resolveMaxHr({ activities: old, today: TODAY })).toBeUndefined();
    expect(resolveMaxHr({ activities: none, today: TODAY })).toBeUndefined();
  });

  it('estime avec Tanaka depuis l’âge en dernier recours', () => {
    expect(resolveMaxHr({ ageYears: 40 })).toEqual({ maxHr: 180, source: 'estimated' });
  });

  it('ne devine rien sans âge ni donnée', () => {
    expect(resolveMaxHr({})).toBeUndefined();
    expect(resolveMaxHr({ activities: [], today: TODAY })).toBeUndefined();
  });
});

describe('parseMaxHrInput', () => {
  it('accepte les entiers de 100 à 230', () => {
    expect(parseMaxHrInput('100')).toBe(100);
    expect(parseMaxHrInput(' 187 ')).toBe(187);
    expect(parseMaxHrInput('230')).toBe(230);
  });
  it('refuse le reste', () => {
    for (const bad of ['', '99', '231', '19', '1000', '18,5', '190.5', 'abc', '-150']) {
      expect(parseMaxHrInput(bad)).toBeNull();
    }
  });
});

describe('volumeTrend', () => {
  it('renvoie 8 semaines complétées de zéros, la dernière est en cours', () => {
    const v = volumeTrend([], TODAY);
    expect(v.status).toBe('insufficient');
    expect(v.weeks).toHaveLength(8);
    expect(v.weeks[7]).toMatchObject({ start: '2026-11-02', current: true, km: 0 });
    expect(v.weeks[0].start).toBe('2026-09-14');
    expect(v.from).toBe('2026-09-14');
    expect(v.to).toBe(TODAY);
  });

  it('cumule km et durée par semaine, toutes disciplines', () => {
    const v = volumeTrend(
      [
        act('1', '2026-10-27', 10, 50),
        act('2', '2026-10-30', 5, 30),
        act('3', '2026-10-29', 0, 45, undefined, 'strength'),
        act('4', '2026-10-20', 8, 40),
        act('5', '2026-11-03', 6, 30),
        act('6', '2025-01-01', 99, 99),
      ],
      TODAY,
    );
    expect(v.status).toBe('ok');
    expect(v.weeks[6]).toMatchObject({ start: '2026-10-26', km: 15, minutes: 125, sessions: 3 });
    expect(v.weeks[7]).toMatchObject({ km: 6, current: true });
    // moyenne des semaines terminées seulement (7 semaines, 23 km au total)
    expect(v.avgKm).toBe(3.3);
  });

  it('une seule semaine active : pas assez pour une tendance', () => {
    expect(volumeTrend([act('1', '2026-10-27', 10, 50)], TODAY).status).toBe('insufficient');
  });
});

describe('intensityTrend', () => {
  const runs = [
    act('1', '2026-10-30', 10, 60, 150),
    act('2', '2026-10-25', 8, 50, 145),
    act('3', '2026-10-20', 12, 70, 170),
    act('4', '2026-10-10', 6, 35, 155),
  ];

  it('ne propose aucune zone sans FC max connue', () => {
    expect(intensityTrend(runs, TODAY)).toMatchObject({ status: 'noMaxHr', zones: [] });
  });

  it('répartit le temps par zone avec la FC max', () => {
    const t = intensityTrend(runs, TODAY, { maxHr: 200, source: 'configured' });
    expect(t.status).toBe('ok');
    expect(t.runs).toBe(4);
    expect(t.zones).toHaveLength(5);
    // FC max 200 : Z3 = 140-159 (150, 145, 155 → 145 min), Z4 = 160-179 (170 → 70 min)
    expect(t.zones.map((z) => z.pct)).toEqual([0, 0, 67, 33, 0]);
  });

  it('propage l’origine de la FC max', () => {
    expect(intensityTrend(runs, TODAY, { maxHr: 180, source: 'estimated' }).maxHrSource).toBe('estimated');
  });

  it('compte les sorties candidates (> 5 km) avec ou sans FC', () => {
    const noHr = [act('a', '2026-10-30', 10, 60), act('b', '2026-10-25', 8, 50), act('c', '2026-10-20', 3, 20, 150)];
    expect(intensityTrend(noHr, TODAY, { maxHr: 200, source: 'configured' })).toMatchObject({
      status: 'insufficient',
      runs: 0,
      candidates: 2,
      required: 4,
      from: '2026-08-13',
    });
  });

  it('ignore les sorties courtes, sans FC, hors fenêtre ou non-course à pied', () => {
    const noise = [
      act('a', '2026-10-30', 3, 20, 150),
      act('b', '2026-10-29', 10, 60),
      act('c', '2026-01-01', 10, 60, 150),
      act('d', '2026-10-28', 40, 90, 140, 'ride'),
    ];
    expect(intensityTrend([...runs.slice(0, 3), ...noise], TODAY, { maxHr: 200, source: 'configured' })).toMatchObject({
      status: 'insufficient',
      runs: 3,
      zones: [],
    });
  });
});

describe('efficiencyTrend', () => {
  // 10 km en 50 min à 150 bpm : 200 m/min / 150 = 1.333 ; plus rapide à FC égale → EF plus haute
  const month = (prefix: string, min: number) => [
    act(`${prefix}1`, `${prefix}-03`, 10, min, 150),
    act(`${prefix}2`, `${prefix}-10`, 10, min, 150),
    act(`${prefix}3`, `${prefix}-17`, 10, min, 150),
  ];

  it('détecte une hausse entre les deux derniers mois fiables', () => {
    const t = efficiencyTrend([...month('2026-09', 55), ...month('2026-10', 50)], TODAY);
    expect(t.status).toBe('ok');
    expect(t.direction).toBe('up');
    expect(t.deltaPct).toBe(10);
    expect(t.points.map((p) => p.month)).toEqual(['2026-09', '2026-10']);
  });

  it('détecte une baisse et une stabilité', () => {
    expect(efficiencyTrend([...month('2026-09', 50), ...month('2026-10', 55)], TODAY).direction).toBe('down');
    expect(efficiencyTrend([...month('2026-09', 50), ...month('2026-10', 50)], TODAY).direction).toBe('flat');
  });

  it('état insuffisant avec un seul mois fiable ou trop peu de sorties', () => {
    const one = efficiencyTrend([...month('2026-10', 50), act('x', '2026-09-05', 10, 50, 150)], TODAY);
    expect(one.status).toBe('insufficient');
    expect(one.direction).toBeUndefined();
    expect(one.points).toHaveLength(2);
    expect(efficiencyTrend([], TODAY)).toEqual({ status: 'insufficient', points: [], reliableMonths: 0, requiredMonths: 2 });
    expect(one).toMatchObject({ reliableMonths: 1, requiredMonths: 2 });
  });

  it('préfère le temps en mouvement et ignore sorties courtes, sans FC, hors fenêtre', () => {
    const t = efficiencyTrend(
      [
        { ...act('m', '2026-10-05', 10, 60, 150), movingTimeSec: 3000 },
        act('short', '2026-10-06', 2, 10, 150),
        act('nohr', '2026-10-07', 10, 50),
        act('old', '2025-01-05', 10, 50, 150),
      ],
      TODAY,
    );
    expect(t.points).toEqual([{ month: '2026-10', runs: 1, ef: 1.333, reliable: false }]);
  });
});

describe('buildSportTrends', () => {
  it('état vide cohérent sans activité', () => {
    const t = buildSportTrends({ activities: [], today: TODAY });
    expect(t.volume.status).toBe('insufficient');
    expect(t.intensity.status).toBe('noMaxHr');
    expect(t.efficiency.status).toBe('insufficient');
  });

  it('se cale sur la dernière activité quand la semaine en cours est vide', () => {
    const t = buildSportTrends({ activities: [act('1', '2026-10-20', 10, 50), act('2', '2026-10-13', 8, 40)], today: TODAY });
    expect(t).toMatchObject({ asOf: '2026-10-20', stale: true });
    expect(t.volume.status).toBe('ok');
    expect(t.volume.weeks[7]).toMatchObject({ start: '2026-10-19', km: 10, current: false });
    expect(t.volume.avgKm).toBe(2.3);
  });

  it('reste sur aujourd’hui si une activité a eu lieu cette semaine', () => {
    const t = buildSportTrends({ activities: [act('1', '2026-11-03', 5, 30)], today: TODAY });
    expect(t).toMatchObject({ asOf: TODAY, stale: false });
  });

  it('une pause de moins de 7 jours n’est pas « semaine vide » (ex. dimanche, on est lundi)', () => {
    const t = buildSportTrends({ activities: [act('1', '2026-11-01', 5, 30)], today: TODAY });
    expect(t).toMatchObject({ asOf: TODAY, stale: false });
  });

  it('FC absente : aucune course avec FC sur les 12 dernières semaines', () => {
    const t = buildSportTrends({
      activities: [act('1', '2026-06-03', 10, 50, 150), act('2', '2026-10-30', 10, 50), act('3', '2026-10-20', 8, 40)],
      today: TODAY,
    });
    expect(t).toMatchObject({ hrAbsent: true, lastHrDate: '2026-06-03' });
  });

  it('FC absente : aucune course avec FC jamais enregistrée', () => {
    expect(buildSportTrends({ activities: [], today: TODAY })).toMatchObject({ hrAbsent: true, lastHrDate: undefined });
    expect(buildSportTrends({ activities: [act('1', '2026-10-30', 10, 50)], today: TODAY }).hrAbsent).toBe(true);
  });

  it('une course courte avec FC ne fait pas disparaître la ligne « FC absente »', () => {
    const t = buildSportTrends({
      activities: [act('1', '2026-06-03', 10, 50, 150), act('2', '2026-10-30', 4, 25, 150)],
      today: TODAY,
    });
    expect(t.hrAbsent).toBe(true);
  });

  it('les sections reviennent dès qu’une course de plus de 5 km a une FC', () => {
    const t = buildSportTrends({
      activities: [act('1', '2026-06-03', 10, 50, 150), act('2', '2026-10-30', 6, 30, 150)],
      today: TODAY,
    });
    expect(t.hrAbsent).toBe(false);
    expect(t.lastHrDate).toBe('2026-10-30');
  });

  it('la fenêtre de 12 semaines se cale sur la dernière activité quand la carte est « en pause »', () => {
    const t = buildSportTrends({
      activities: [act('1', '2026-09-20', 10, 50, 150), act('2', '2026-10-01', 10, 50)],
      today: TODAY,
    });
    expect(t).toMatchObject({ asOf: '2026-10-01', stale: true, hrAbsent: false });
  });

  it('retient la dernière course avec FC', () => {
    const t = buildSportTrends({
      activities: [act('1', '2026-06-03', 10, 50, 150), act('2', '2026-05-01', 10, 50, 150), act('3', '2026-10-20', 10, 50)],
      today: TODAY,
    });
    expect(t.lastHrDate).toBe('2026-06-03');
    expect(buildSportTrends({ activities: [], today: TODAY }).lastHrDate).toBeUndefined();
  });

  it('utilise l’âge pour estimer la FC max', () => {
    const t = buildSportTrends({ activities: [], today: TODAY, ageYears: 40 });
    expect(t.intensity).toMatchObject({ status: 'insufficient', maxHr: 180, maxHrSource: 'estimated' });
  });
});

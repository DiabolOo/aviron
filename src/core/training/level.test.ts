import type { Activity } from '../schemas';
import type { UserProfile } from '../types';
import { recentRunsLackHr } from './hrGuidance';
import {
  athleteProfileFrom,
  detailDensity,
  EQUIPMENT_OPTIONS,
  hasHrDeviceFor,
  intensityBpm,
  intensityCue,
  LEVEL_OPTIONS,
  levelGuidance,
  progressFocus,
  sessionInstruction,
  todaySessionMeasure,
  weekPlace,
  type LevelGuidance,
} from './level';

/** Les espaces insécables sont vérifiés à part : ici on compare le texte lu. */
const plain = (s: string): string => s.replace(/\u00a0/g, ' ');

const BEGINNER: LevelGuidance = { level: 'beginner' };
const REGULAR: LevelGuidance = { level: 'regular' };
const ATHLETE_HR: LevelGuidance = { level: 'advanced', maxHr: 200 };
const ATHLETE_NO_HR: LevelGuidance = { level: 'advanced' };
const PACE = { fastSecPerKm: 330, slowSecPerKm: 345 };

const USER: UserProfile = {
  firstName: 'Jul',
  goalLabel: 'Running',
  calorieTarget: 2200,
  macrosTarget: { calories: 2200, protein: 140, carbs: 250, fat: 70 },
  weightKg: 70,
  targetWeightKg: 70,
};

describe('options de l’onboarding (210)', () => {
  it('trois niveaux et trois équipements, dans l’ordre de la maquette', () => {
    expect(LEVEL_OPTIONS.map((o) => o.label)).toEqual(['Je débute', 'Je cours un peu', 'Je m\u2019entraîne']);
    expect(LEVEL_OPTIONS.map((o) => o.id)).toEqual(['beginner', 'regular', 'advanced']);
    expect(EQUIPMENT_OPTIONS.map((o) => o.id)).toEqual(['hrWatch', 'phone', 'none']);
  });

  it('seule la montre avec cardio lit la FC ; sans réponse, rien n’est présumé', () => {
    expect(hasHrDeviceFor('hrWatch')).toBe(true);
    expect(hasHrDeviceFor('phone')).toBe(false);
    expect(hasHrDeviceFor('none')).toBe(false);
    expect(hasHrDeviceFor(undefined)).toBeUndefined();
  });
});

describe('athleteProfileFrom', () => {
  it('reprend le niveau et l’équipement déclarés', () => {
    const p = athleteProfileFrom({ ...USER, level: 'advanced', equipment: 'phone', maxHr: 201 });
    expect(p.level).toBe('advanced');
    expect(p.hasHrDevice).toBe(false);
    expect(p).toMatchObject({ maxHr: 201, maxHrSource: 'configured' });
  });

  it('sans réponse : « Je débute », équipement inconnu, pas de FC max', () => {
    const p = athleteProfileFrom(USER);
    expect(p.level).toBe('beginner');
    expect(p.hasHrDevice).toBeUndefined();
    expect(p.maxHr).toBeUndefined();
    expect(p.maxHrSource).toBeUndefined();
  });
});

describe('levelGuidance : les données retirent, elles ne changent pas le niveau', () => {
  it('bpm seulement pour « Je m’entraîne » avec une FC max connue', () => {
    expect(levelGuidance({ level: 'advanced', maxHr: 200 })).toEqual({ level: 'advanced', maxHr: 200 });
    expect(levelGuidance({ level: 'advanced', maxHr: 200, hasHrDevice: true })).toEqual(ATHLETE_HR);
    expect(levelGuidance({ level: 'regular', maxHr: 200, hasHrDevice: true })).toEqual(REGULAR);
    expect(levelGuidance({ level: 'beginner', maxHr: 200, hasHrDevice: true })).toEqual(BEGINNER);
  });

  it('sans cardio déclaré, sans FC récente ou sans FC max : plus de bpm, même niveau', () => {
    expect(levelGuidance({ level: 'advanced', maxHr: 200, hasHrDevice: false })).toEqual(ATHLETE_NO_HR);
    expect(levelGuidance({ level: 'advanced', maxHr: 200 }, { recentHrMissing: true })).toEqual(ATHLETE_NO_HR);
    expect(levelGuidance({ level: 'advanced' })).toEqual(ATHLETE_NO_HR);
  });
});

describe('intensityCue (planche 001 §04)', () => {
  it('« Je débute » : la sensation', () => {
    expect(intensityCue('easy', BEGINNER)).toBe('Tu dois pouvoir parler');
    expect(intensityCue('moderate', BEGINNER)).toBe('Tu parles par bribes');
    expect(intensityCue('hard', BEGINNER)).toBe('Tu ne peux plus parler');
  });

  it('« Je cours un peu » : l’allure de référence, même avec une allure chiffrée', () => {
    expect(intensityCue('easy', REGULAR, PACE)).toBe('Allure footing');
    expect(intensityCue('moderate', REGULAR)).toBe('Allure semi');
    expect(plain(intensityCue('hard', REGULAR))).toBe('Allure 5 km');
  });

  it('« Je m’entraîne » avec cardio : zones et bpm tirés de la FC max', () => {
    expect(intensityBpm(200)).toEqual({ easyBelow: 140, hardAbove: 160 });
    expect(plain(intensityCue('easy', ATHLETE_HR))).toBe('Z1–Z2 · sous 140 bpm');
    expect(plain(intensityCue('moderate', ATHLETE_HR))).toBe('Z3 · 140 à 160 bpm');
    expect(plain(intensityCue('hard', ATHLETE_HR))).toBe('Z4–Z5 · au-dessus de 160 bpm');
  });

  it('« Je m’entraîne » sans cardio : allure et sensation, jamais de bpm', () => {
    expect(plain(intensityCue('easy', ATHLETE_NO_HR, PACE))).toBe('5:30 à 5:45 /km, tu dois pouvoir parler');
    expect(intensityCue('hard', ATHLETE_NO_HR)).toBe('Tu ne peux plus parler');
    expect(intensityCue('moderate', ATHLETE_NO_HR, PACE)).not.toMatch(/bpm|Z\d/);
  });

  it('l’unité ne se détache jamais du nombre', () => {
    expect(intensityCue('easy', ATHLETE_HR)).toContain('140\u00a0bpm');
    expect(intensityCue('easy', ATHLETE_NO_HR, PACE)).toContain('5:45\u00a0/km');
  });
});

describe('sessionInstruction', () => {
  it('« Je m’entraîne » sans cardio : la consigne de la maquette 102', () => {
    expect(plain(sessionInstruction({ intensity: 'easy', durationMin: 45, pace: PACE }, ATHLETE_NO_HR))).toBe(
      'Environ 45 minutes, à une allure où tu peux parler : 5:30 à 5:45 /km.',
    );
  });

  it('« Je m’entraîne » avec cardio : zone et bpm, l’allure prévue n’est pas répétée', () => {
    const text = plain(sessionInstruction({ intensity: 'easy', durationMin: 45, pace: PACE }, ATHLETE_HR));
    expect(text).toBe('Environ 45 minutes en Z1–Z2, sous 140 bpm.');
  });

  it('« Je m’entraîne » sans cardio ni allure prévue : la sensation seule', () => {
    expect(plain(sessionInstruction({ intensity: 'moderate', durationMin: 40 }, ATHLETE_NO_HR))).toBe(
      'Environ 40 minutes, à une allure où tu parles par bribes.',
    );
  });

  it('« Je cours un peu » et « Je débute » : aucun chiffre d’allure ni de bpm', () => {
    expect(plain(sessionInstruction({ intensity: 'easy', durationMin: 45, pace: PACE }, REGULAR))).toBe(
      'Environ 45 minutes, allure footing.',
    );
    expect(plain(sessionInstruction({ intensity: 'easy', durationMin: 20, pace: PACE }, BEGINNER))).toBe(
      '20 minutes, à une allure où tu peux parler.',
    );
  });

  it('au-delà d’une heure, la durée s’écrit en heures', () => {
    expect(sessionInstruction({ intensity: 'easy', durationMin: 70 }, REGULAR)).toBe('Environ 1h10, allure footing.');
  });
});

describe('héros d’Aujourd’hui', () => {
  it('en minutes pour « Je débute », en km sinon', () => {
    expect(plain(todaySessionMeasure('beginner', { durationMin: 20, distanceKm: 3 }))).toBe('20 minutes');
    expect(plain(todaySessionMeasure('regular', { durationMin: 45, distanceKm: 8 }))).toBe('8 km');
    expect(plain(todaySessionMeasure('advanced', { durationMin: 50, distanceKm: 8.5 }))).toBe('8,5 km');
  });

  it('sans distance prévue, on descend aux minutes', () => {
    expect(plain(todaySessionMeasure('advanced', { durationMin: 45 }))).toBe('45 minutes');
    expect(todaySessionMeasure('regular', { durationMin: 70, distanceKm: 0 })).toBe('1h10');
  });

  it('la place dans la semaine, pour « Je m’entraîne » seulement', () => {
    expect(weekPlace('advanced', 1, 4)).toBe('1re séance sur 4 cette semaine');
    expect(weekPlace('advanced', 3, 4)).toBe('3e séance sur 4 cette semaine');
    expect(weekPlace('regular', 1, 4)).toBeUndefined();
    expect(weekPlace('beginner', 1, 3)).toBeUndefined();
    expect(weekPlace('advanced', 5, 4)).toBeUndefined();
  });
});

describe('densité par niveau', () => {
  it('détail : durée seule, puis distance et allure, puis FC, zones, charge et séance reconstituée', () => {
    expect(Object.values(detailDensity('beginner')).every((v) => !v)).toBe(true);
    expect(detailDensity('regular')).toEqual({
      distance: true, pace: true, quarters: true, hr: false, zones: false, load: false, reconstructed: false,
    });
    expect(Object.values(detailDensity('advanced')).every(Boolean)).toBe(true);
  });

  it('Progrès : semaines actives · km et sorties · charge et prédictions', () => {
    expect(progressFocus('beginner')).toBe('activeWeeks');
    expect(progressFocus('regular')).toBe('kmAndRuns');
    expect(progressFocus('advanced')).toBe('loadAndPredictions');
  });
});

describe('recentRunsLackHr', () => {
  const run = (id: string, date: string, avgHr?: number): Activity => ({
    id, name: 'Sortie', type: 'run', date, startTime: '08:00', durationMin: 40, distanceKm: 7, avgHr,
    source: 'manual', aiEligible: true,
  });
  const TODAY = '2026-11-08';

  it('vrai quand la FC n’arrive plus sur les dernières courses', () => {
    const acts = [run('a', '2026-10-01', 150), ...['10', '12', '14', '16', '18'].map((d) => run(d, `2026-10-${d}`))];
    expect(recentRunsLackHr(acts, TODAY)).toBe(true);
  });

  it('faux avec une FC récente ou un historique trop court', () => {
    const withHr = ['10', '12', '14', '16', '18'].map((d) => run(d, `2026-10-${d}`, 150));
    expect(recentRunsLackHr(withHr, TODAY)).toBe(false);
    expect(recentRunsLackHr([run('a', '2026-10-10')], TODAY)).toBe(false);
  });
});

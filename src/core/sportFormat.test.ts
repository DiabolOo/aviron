import {
  activityPace,
  activityDurationDisplay,
  analyzeSplits,
  formatClock,
  effortTimeSec,
  formatSecAsClock,
  displayActivityName,
  formatDayLong,
  formatHour,
  formatKm,
  formatKmNumber,
  formatKmTotal,
} from './sportFormat';

describe('activityPace', () => {
  it('run et walk → min/km', () => {
    expect(activityPace('run', 10, 3000)).toEqual({ label: 'Allure', value: '5:00', unit: '/km' });
    expect(activityPace('run', 10, 3260)).toEqual({ label: 'Allure', value: '5:26', unit: '/km' });
    expect(activityPace('walk', 9.178, 105 * 60)).toEqual({ label: 'Allure', value: '11:26', unit: '/km' });
  });

  it('ride → km/h à virgule', () => {
    expect(activityPace('ride', 50.189, 2 * 3600)).toEqual({ label: 'Vitesse', value: '25,1', unit: 'km/h' });
  });

  it('swim → min/100 m', () => {
    // 1,125 km en 30 min → 2:40 /100 m
    expect(activityPace('swim', 1.125, 30 * 60)).toEqual({ label: 'Allure', value: '2:40', unit: '/100 m' });
  });

  it('strength et other → pas d’allure', () => {
    expect(activityPace('strength', undefined, 3600)).toBeUndefined();
    expect(activityPace('other', 0, 3600)).toBeUndefined();
  });

  it('distance ou temps absent → undefined', () => {
    expect(activityPace('run', undefined, 3000)).toBeUndefined();
    expect(activityPace('run', 0, 3000)).toBeUndefined();
    expect(activityPace('run', 10, undefined)).toBeUndefined();
    expect(activityPace('run', 10, 0)).toBeUndefined();
  });
});

describe('formats français', () => {
  it('distance à virgule décimale', () => {
    expect(formatKmNumber(9.178)).toBe('9,2');
    expect(formatKm(10.471)).toBe('10,5 km');
  });

  it('totaux arrondis', () => {
    expect(formatKmTotal(797.6)).toBe('798 km');
    expect(formatKmTotal(0.4)).toBe('0 km');
  });

  it('jour en minuscules', () => {
    expect(formatDayLong('2024-03-08')).toBe('vendredi 8 mars');
  });

  it('heure sans secondes', () => {
    expect(formatHour('12:01:21')).toBe('12:01');
    expect(formatHour('07:15')).toBe('07:15');
  });
});

describe('displayActivityName', () => {
  it.each([
    ['Morning Run', 'Course du matin'],
    ['Lunch run', 'Course du midi'],
    ['Afternoon Run', "Course de l'après-midi"],
    ['Evening Run', 'Course du soir'],
    ['Night Walk', 'Marche du soir'],
    ['Lunch Swim', 'Nage du midi'],
    ['Morning Swim', 'Nage du matin'],
    ['Lunch Weight Training', 'Musculation du midi'],
    ['Weight Training', 'Musculation'],
    ['Morning Ride', 'Sortie vélo du matin'],
    ['Evening Hike', 'Randonnée du soir'],
  ])('%s → %s', (input, expected) => {
    expect(displayActivityName(input)).toBe(expected);
  });

  it('ne retouche ni les titres libres ni les titres déjà français', () => {
    for (const name of [
      'Semi de Reims',
      'Course à pied du midi',
      "Course à pied dans l'après-midi",
      'Triathlon de l’âme',
      'Morning coffee', // préfixe reconnu mais sport absent → inchangé
      'Evening yoga',
    ]) {
      expect(displayActivityName(name)).toBe(name);
    }
  });
});

describe('allure sur le temps de déplacement (valeurs réelles du snapshot)', () => {
  it('nage du 8 mars 2024 → 2:48 /100 m', () => {
    const a = { durationMin: 37.667, movingTimeSec: 1892 };
    expect(activityPace('swim', 1.125, effortTimeSec(a))).toEqual({ label: 'Allure', value: '2:48', unit: '/100 m' });
  });

  it('courses d’octobre 2026 → 5:00 et 4:58 /km (jamais 4:60)', () => {
    expect(activityPace('run', 9.155, effortTimeSec({ durationMin: 50.667, movingTimeSec: 2742 }))?.value).toBe('5:00');
    expect(activityPace('run', 9.111, effortTimeSec({ durationMin: 49.217, movingTimeSec: 2718 }))?.value).toBe('4:58');
    expect(formatSecAsClock(299.5)).toBe('5:00');
  });

  it('marche et vélo utilisent aussi le temps de déplacement ; repli sur le temps écoulé', () => {
    const walk = { durationMin: 392.65, movingTimeSec: 8468 };
    expect(activityPace('walk', 9.178, effortTimeSec(walk))?.value).toBe('15:23');
    expect(activityPace('ride', 30, effortTimeSec({ durationMin: 100, movingTimeSec: 3600 }))?.value).toBe('30,0');
    expect(effortTimeSec({ durationMin: 50 })).toBe(3000);
    expect(effortTimeSec({ durationMin: 50, movingTimeMin: 48 })).toBe(2880);
  });
});

describe('analyzeSplits', () => {
  it('marque arrêt un split > 3 × la médiane et l’exclut de l’échelle', () => {
    const splits = [
      { km: 1, paceSec: 800 },
      { km: 2, paceSec: 830 },
      { km: 3, paceSec: 2600 },
      { km: 4, paceSec: 780 },
    ];
    const scale = analyzeSplits(splits);
    expect([...scale.stops]).toEqual([3]);
    expect(scale.fastest).toBe(780);
    expect(scale.slowest).toBe(830);
  });

  it('sans arrêt ni donnée', () => {
    expect(analyzeSplits([]).fastest).toBeUndefined();
    expect(analyzeSplits([{ km: 1, paceSec: 300 }, { km: 2, paceSec: 330 }]).stops.size).toBe(0);
  });
});

describe('durée affichée', () => {
  it('formate en mm:ss et h:mm:ss', () => {
    expect(formatClock(45 * 60 + 18)).toBe('45:18');
    expect(formatClock(9 * 60 + 5)).toBe('9:05');
    expect(formatClock(3725)).toBe('1:02:05');
  });

  it('temps de déplacement en principal, écoulé en second s’il diffère d’au moins 1 min', () => {
    expect(activityDurationDisplay({ durationMin: 49.2167, movingTimeSec: 2718 })).toEqual({
      main: '45:18',
      total: '49:13 au total',
    });
    expect(activityDurationDisplay({ durationMin: 45.5, movingTimeSec: 2718 })).toEqual({ main: '45:18' });
    expect(activityDurationDisplay({ durationMin: 50 })).toEqual({ main: '50:00' });
  });

  it('une course garde le temps écoulé (chrono)', () => {
    expect(activityDurationDisplay({ durationMin: 110.8333, movingTimeSec: 6645 }, true)).toEqual({ main: '1:50:50' });
  });
});

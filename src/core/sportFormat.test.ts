import {
  activityPace,
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

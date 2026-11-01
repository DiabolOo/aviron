import { parseActivitiesCsv, parseActivityDate } from './stravaCsv';

const HEADER = [
  "ID d'activité", "Date de l'activité", "Nom de l'activité", "Type d'activité",
  'Temps écoulé', 'Distance', 'FC max', 'FC moyenne', 'Dénivelé', 'Temps de déplacement',
  'Calories', 'Nom du fichier',
  // colonnes impériales dupliquées — la 2e « Distance » est en mètres, le 2e « Dénivelé » en mètres
  'Temps écoulé', 'Distance', 'Dénivelé',
].join(',');

const CSV = [
  HEADER,
  '123,"19 oct. 2025, 7:30:00",Semi de Reims,Course à pied,6650,"21,24",178,162,120,6650,1430,activities/123.fit,"1:50:50","21238,4",395',
  '124,"2 mars 2025, 10:30",Footing,Run,3000,"10,05",150,140,20,2940,600,activities/124.gpx,"0:50:00","10050,0",66',
  '125,"5 févr. 2025, 18:00:00",Sortie piscine,Natation,2400,2,,,0,2400,,activities/125.fit,"0:40:00","2000,0",0',
  '126,"date bizarre",Sans date,Run,1000,3,,,0,1000,,activities/126.gpx,"0:16:40","3000,0",0',
].join('\n');

describe('parseActivityDate', () => {
  it.each([
    // dates UTC → heure de Paris (octobre = UTC+2, mars/février = UTC+1)
    ['19 oct. 2025, 7:30:00', '2025-10-19', '09:30:00', '2025-10-19T07:30:00+00:00'],
    ['2 mars 2025, 10:30', '2025-03-02', '11:30:00', '2025-03-02T10:30:00+00:00'],
    ['5 févr. 2025, 18:00:00', '2025-02-05', '19:00:00', '2025-02-05T18:00:00+00:00'],
    ['Oct 19, 2025, 7:30:00 AM', '2025-10-19', '09:30:00', '2025-10-19T07:30:00+00:00'],
  ])('parses %s', (input, date, startTime, startedAt) => {
    expect(parseActivityDate(input)).toEqual({ date, startTime, startedAt });
  });

  it('returns undefined for garbage', () => {
    expect(parseActivityDate('pas une date')).toBeUndefined();
  });
});

describe('parseActivitiesCsv', () => {
  const { activities, skipped } = parseActivitiesCsv(CSV);
  const race = activities.find((a) => a.activity.id === '123')!;

  it('parses activities, uses the meters column and maps FR types', () => {
    expect(activities).toHaveLength(3);
    expect(race.activity).toMatchObject({
      date: '2025-10-19', startTime: '09:30:00', type: 'run',
      startedAt: '2025-10-19T07:30:00+00:00',
      durationMin: 6650 / 60, distanceKm: 21.238, elevationM: 395,
      maxHr: 178, avgHr: 162, calories: 1430, source: 'strava',
    });
    expect(activities.find((a) => a.activity.id === '125')!.activity.type).toBe('swim');
  });

  it('exposes the associated filename', () => {
    expect(race.filename).toBe('activities/123.fit');
    expect(activities.find((a) => a.activity.id === '124')!.filename).toBe('activities/124.gpx');
  });

  it('keeps activities without calories or HR', () => {
    const swim = activities.find((a) => a.activity.id === '125')!.activity;
    expect(swim.calories).toBeUndefined();
    expect(swim.avgHr).toBeUndefined();
  });

  it('skips rows with unreadable dates and sorts by date', () => {
    expect(skipped).toHaveLength(1);
    expect(skipped[0].reason).toMatch(/date illisible/);
    expect(activities.map((a) => a.activity.id)).toEqual(['125', '124', '123']);
  });
});

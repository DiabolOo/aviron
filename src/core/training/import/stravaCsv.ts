import { parse } from 'csv-parse/sync';
import { ActivitySchema, type Activity } from '../../schemas';

// Parse `activities.csv` d'un export Strava (colonnes en français ou anglais).
// - Dates UTC (« 22 oct. 2026, 10:45:07 ») → converties en Europe/Paris pour
//   `date` et `startTime` ; l'instant UTC est conservé dans `startedAt`.
// - « Distance » et « Dénivelé » apparaissent en double : la 2e occurrence est
//   en mètres bruts, la 1re en unités d'affichage. En export FR on préfère la 2e.
// - « Nom du fichier » donne le fichier FIT/GPX associé (pas l'ID d'activité).

const MONTHS: Record<string, number> = {
  janvier: 1, 'janv.': 1, janv: 1, jan: 1,
  'février': 2, 'févr.': 2, fevrier: 2, 'fevr.': 2, fevr: 2, feb: 2,
  mars: 3, mar: 3,
  avril: 4, 'avr.': 4, avr: 4, apr: 4,
  mai: 5, may: 5,
  juin: 6, jun: 6,
  juillet: 7, 'juil.': 7, juil: 7, jul: 7,
  'août': 8, aout: 8, aug: 8,
  septembre: 9, 'sept.': 9, sept: 9, sep: 9,
  octobre: 10, 'oct.': 10, oct: 10,
  novembre: 11, 'nov.': 11, nov: 11,
  'décembre': 12, 'déc.': 12, decembre: 12, 'dec.': 12, dec: 12,
};

const TYPE_MAP: Record<string, Activity['type']> = {
  'course à pied': 'run', 'course a pied': 'run', course: 'run', trail: 'run',
  'course virtuelle': 'run', run: 'run', running: 'run', 'trail run': 'run', 'virtual run': 'run',
  'sortie à vélo': 'ride', 'sortie a velo': 'ride', 'vélo': 'ride', velo: 'ride',
  vtt: 'ride', gravel: 'ride', 'vélo en salle': 'ride', 'velo en salle': 'ride',
  'vélo virtuel': 'ride', ride: 'ride', 'virtual ride': 'ride', 'vélo électrique': 'ride',
  marche: 'walk', 'randonnée': 'walk', randonnee: 'walk', 'marche nordique': 'walk',
  walk: 'walk', hike: 'walk',
  natation: 'swim', nage: 'swim', piscine: 'swim', swim: 'swim',
  musculation: 'strength', 'salle de sport': 'strength',
  'weight training': 'strength', weighttraining: 'strength', crossfit: 'strength',
};

type ColumnKey =
  | 'id' | 'date' | 'name' | 'type' | 'filename' | 'elapsed' | 'moving'
  | 'distance' | 'elevation' | 'avgHr' | 'maxHr' | 'calories';

const COLUMNS: Record<ColumnKey, string[]> = {
  id: ["ID d'activité", 'Activity ID'],
  date: ["Date de l'activité", 'Activity Date'],
  name: ["Nom de l'activité", 'Activity Name'],
  type: ["Type d'activité", 'Activity Type'],
  filename: ['Nom du fichier', 'Filename', 'Fichier'],
  elapsed: ['Temps écoulé', 'Elapsed Time'],
  moving: ['Temps de déplacement', 'Temps de trajet', 'Moving Time'],
  distance: ['Distance'],
  elevation: ['Dénivelé', 'Elevation Gain'],
  avgHr: ['FC moyenne', 'Fréquence cardiaque moyenne', 'Average Heart Rate'],
  maxHr: ['FC max', 'Fréquence cardiaque maximale', 'Max Heart Rate'],
  calories: ['Calories'],
};

export interface CsvActivity {
  activity: Activity;
  filename?: string;
}

export interface CsvParseResult {
  activities: CsvActivity[];
  skipped: { row: number; reason: string }[];
}

const parisFmt = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Paris',
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function parseFrNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^\d.\-]/g, '');
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function parseDurationMin(raw: string | undefined): number | undefined {
  const n = parseFrNumber(raw);
  if (n !== undefined) return n / 60;
  if (!raw) return undefined;
  const hms = raw.trim().match(/(?:(\d+)\s*h)?(?:(\d+)\s*m)?(?:(\d+)\s*s)?$/i);
  if (hms && (hms[1] || hms[2] || hms[3])) {
    return (Number(hms[1] ?? 0) * 3600 + Number(hms[2] ?? 0) * 60 + Number(hms[3] ?? 0)) / 60;
  }
  const colon = raw.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
  if (colon) {
    return (Number(colon[1] ?? 0) * 3600 + Number(colon[2]) * 60 + Number(colon[3])) / 60;
  }
  return undefined;
}

/**
 * La colonne date de l'export est en UTC (« 22 oct. 2026, 10:45:07 » ou
 * « Oct 22, 2026, 10:45:07 AM »). `date`/`startTime` sont en heure de Paris,
 * `startedAt` conserve l'instant UTC.
 */
export function parseActivityDate(
  raw: string,
): { date: string; startTime: string; startedAt: string } | undefined {
  const text = raw.trim().replace(/\s+/g, ' ');
  let day: number, month: number | undefined, year: number;

  let m = text.match(/(\d{1,2})\s+([a-zà-ÿ]+\.?)\s+(\d{4})/i);
  if (m) {
    [day, year] = [Number(m[1]), Number(m[3])];
    month = MONTHS[m[2].toLowerCase()];
  } else {
    m = text.match(/([a-z]+\.?)\s+(\d{1,2}),?\s+(\d{4})/i);
    if (!m) return undefined;
    month = MONTHS[m[1].toLowerCase()];
    [day, year] = [Number(m[2]), Number(m[3])];
  }
  if (!month) return undefined;

  const t = text.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]m)?/i);
  let [hh, mi, ss] = t ? [Number(t[1]), Number(t[2]), Number(t[3] ?? 0)] : [12, 0, 0];
  const ap = t?.[4]?.toLowerCase();
  if (ap === 'pm' && hh < 12) hh += 12;
  if (ap === 'am' && hh === 12) hh = 0;

  const utc = new Date(Date.UTC(year, month - 1, day, hh, mi, ss));
  const [date, startTime] = parisFmt.format(utc).split(' ');
  return { date, startTime, startedAt: utc.toISOString().replace(/\.\d{3}Z$/, '+00:00') };
}

export function parseActivitiesCsv(csvText: string): CsvParseResult {
  const rows = parse(csvText, {
    bom: true,
    relaxColumnCount: true,
    skipEmptyLines: true,
  }) as string[][];
  const [header, ...body] = rows;
  if (!header) return { activities: [], skipped: [] };

  const indexOf = new Map<string, number[]>();
  header.forEach((name, i) => {
    const key = name.trim();
    indexOf.set(key, [...(indexOf.get(key) ?? []), i]);
  });

  const cell = (row: string[], key: ColumnKey, occurrence = 0): string | undefined => {
    for (const name of COLUMNS[key]) {
      const idx = indexOf.get(name)?.[occurrence];
      if (idx !== undefined) return row[idx]?.trim() || undefined;
    }
    return undefined;
  };
  const num = (row: string[], key: ColumnKey, occurrence = 0) =>
    parseFrNumber(cell(row, key, occurrence));

  const isFrench = indexOf.has("Date de l'activité") || indexOf.has('Nom du fichier');

  const activities: CsvActivity[] = [];
  const skipped: CsvParseResult['skipped'] = [];

  body.forEach((row, i) => {
    const id = cell(row, 'id') ?? `row-${i}`;
    const rawDate = cell(row, 'date');
    const parsedDate = rawDate ? parseActivityDate(rawDate) : undefined;
    if (!parsedDate) {
      skipped.push({ row: i + 2, reason: `date illisible : ${rawDate ?? '(absente)'}` });
      return;
    }
    // « Temps écoulé » fait foi pour le temps de course (pauses incluses).
    const durationMin = parseDurationMin(cell(row, 'elapsed')) ?? parseDurationMin(cell(row, 'moving')) ?? 0;
    const movingMin = parseDurationMin(cell(row, 'moving'));
    // Export FR : la 2e colonne « Distance » est en mètres bruts (la 1re en km affichés).
    const distM = num(row, 'distance', 1);
    const distanceKm = isFrench && distM !== undefined ? Math.round(distM) / 1000 : num(row, 'distance');
    const elevationM = isFrench ? num(row, 'elevation', 1) ?? num(row, 'elevation') : num(row, 'elevation');
    const candidate = {
      id,
      name: cell(row, 'name') ?? 'Sortie',
      type: TYPE_MAP[(cell(row, 'type') ?? '').toLowerCase()] ?? 'other',
      date: parsedDate.date,
      startTime: parsedDate.startTime,
      startedAt: parsedDate.startedAt,
      durationMin,
      movingTimeSec: movingMin !== undefined ? Math.round(movingMin * 60) : undefined,
      distanceKm,
      elevationM,
      calories: num(row, 'calories'),
      avgHr: num(row, 'avgHr'),
      maxHr: num(row, 'maxHr'),
      source: 'strava' as const,
    };
    const parsed = ActivitySchema.safeParse(candidate);
    if (parsed.success) activities.push({ activity: parsed.data, filename: cell(row, 'filename') });
    else skipped.push({ row: i + 2, reason: parsed.error.issues[0]?.message ?? 'schéma invalide' });
  });

  activities.sort((a, b) => a.activity.date.localeCompare(b.activity.date));
  return { activities, skipped };
}

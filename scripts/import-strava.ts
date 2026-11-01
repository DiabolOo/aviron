/**
 * Import d'une archive d'export Strava (outil de dev — ADR-004).
 *
 *   npm run import:strava -- <chemin/vers/export.zip> [--out fixtures/julien.snapshot.json]
 *
 * Lit activities.csv (dates UTC → heure de Paris, colonnes métriques en double),
 * fusionne les fichiers FIT (.fit / .fit.gz) et GPX pointés par la colonne
 * « Nom du fichier », puis écrit un snapshot validé par ActivitySchema.
 * hrStream et polyline ne sont jamais inclus.
 */
import { gunzipSync } from 'node:zlib';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import unzipper from 'unzipper';
import FitParser from 'fit-file-parser';
import GpxParser from 'gpxparser';
import { z } from 'zod';
import { ActivitySchema, type Activity } from '../src/core/schemas';
import { parseActivitiesCsv } from '../src/core/training/import/stravaCsv';
import { mergeFitData, type FitData } from '../src/core/training/import/fit';
import { mergeGpxData, type GpxTrackPoint } from '../src/core/training/import/gpx';

const DEFAULT_OUT = 'fixtures/julien.snapshot.json';

function resolveArgs(argv: string[]): { zipPath: string; outPath: string } {
  const args = argv.slice(2);
  const outIdx = args.indexOf('--out');
  const outPath = outIdx >= 0 ? args[outIdx + 1] : DEFAULT_OUT;
  const zipArg = args.find((a) => !a.startsWith('--') && a !== outPath);
  return { zipPath: zipArg ?? '', outPath: outPath ?? DEFAULT_OUT };
}

async function findZip(zipArg: string): Promise<string> {
  if (zipArg) {
    if (!existsSync(zipArg)) throw new Error(`Archive introuvable : ${zipArg}`);
    return zipArg;
  }
  for (const dir of ['fixtures/real', 'fixtures', '.']) {
    if (!existsSync(dir)) continue;
    const zips = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith('.zip'));
    if (zips.length) return path.join(dir, zips[0]);
  }
  throw new Error('Aucune archive trouvée. Usage : npm run import:strava -- <export.zip>');
}

const fitParser = new FitParser({
  force: true,
  speedUnit: 'm/s',
  lengthUnit: 'm',
  temperatureUnit: 'celsius',
  mode: 'list',
});

function parseFit(buf: Buffer): Promise<FitData> {
  return new Promise((resolve, reject) => {
    fitParser.parse(buf, (err, data) => (err ? reject(err) : resolve(data as FitData)));
  });
}

function parseGpx(xml: string): GpxTrackPoint[] {
  const parser = new GpxParser();
  parser.parse(xml);
  return parser.tracks.flatMap((t) =>
    t.points.map((p) => ({ lat: p.lat, lon: p.lon, ele: p.ele ?? undefined, time: p.time ?? undefined })),
  );
}

async function main() {
  const { zipPath, outPath } = resolveArgs(process.argv);
  const zip = await findZip(zipPath);
  console.log(`Archive : ${zip}`);

  const archive = await unzipper.Open.file(zip);
  const csvEntry = archive.files.find((f) => f.path === 'activities.csv');
  if (!csvEntry) throw new Error('activities.csv absent de l’archive');
  const { activities: rows, skipped } = parseActivitiesCsv((await csvEntry.buffer()).toString('utf8'));

  // Association par « Nom du fichier » (basename, insensible à la casse).
  const fileIndex = new Map<string, (typeof archive.files)[number]>();
  for (const f of archive.files) {
    if (f.type === 'File') fileIndex.set(path.basename(f.path).toLowerCase(), f);
  }

  const stats = { filesRead: 0, fit: 0, gpx: 0, fitSplits: 0, gpxSplits: 0 };
  const fileErrors: { file: string; reason: string }[] = [];
  const activities: Activity[] = [];

  for (let i = 0; i < rows.length; i++) {
    let { activity } = rows[i];
    const filename = rows[i].filename;
    const entry = filename ? fileIndex.get(path.basename(filename).toLowerCase()) : undefined;
    if (entry) {
      const base = path.basename(entry.path);
      try {
        const raw = await entry.buffer();
        if (/\.fit(\.gz)?$/i.test(base)) {
          const buf = base.toLowerCase().endsWith('.gz') ? gunzipSync(raw) : raw;
          activity = mergeFitData(activity, await parseFit(buf));
          stats.fit++;
          if (activity.splits?.length) stats.fitSplits++;
        } else if (/\.gpx$/i.test(base)) {
          activity = mergeGpxData(activity, parseGpx(raw.toString('utf8')));
          stats.gpx++;
          if (activity.splits?.length) stats.gpxSplits++;
        }
        stats.filesRead++;
      } catch (err) {
        // Un fichier illisible ne bloque pas l'import : on garde la ligne CSV.
        fileErrors.push({ file: base, reason: err instanceof Error ? err.message : String(err) });
      }
    }
    activities.push(activity);
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${rows.length} activités…`);
  }

  const validated = z.array(ActivitySchema).safeParse(activities);
  if (!validated.success) {
    console.error(validated.error.issues.slice(0, 5));
    throw new Error('Snapshot invalide');
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    source: 'strava_export' as const,
    activities: validated.data,
  };
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(snapshot));

  const noHr = activities.filter((a) => a.avgHr === undefined).length;
  console.log(`\n${activities.length} activités → ${outPath}`);
  console.log(
    `  Fichiers lus : ${stats.filesRead} (${stats.fit} FIT, ${stats.gpx} GPX)` +
      ` · erreurs : ${fileErrors.length} · lignes CSV ignorées : ${skipped.length}`,
  );
  console.log(`  Splits : ${stats.fitSplits} FIT + ${stats.gpxSplits} GPX · activités sans FC : ${noHr}`);
  if (skipped.length) console.log('  Ignorées :', skipped.slice(0, 10));
  if (fileErrors.length) console.log('  Fichiers en erreur :', fileErrors);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

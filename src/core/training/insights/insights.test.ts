import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Activity } from '../../schemas';
import { addDays, detectRaces } from '../engine';
import type { TrainingInsight } from '../types';
import {
  aerobicTrendCopy,
  cautiousStartCopy,
  consistencyCopy,
  dataQualityNoHrCopy,
  fastStartCopy,
  gapResumeCopy,
  intensityTooHighCopy,
  racePrepPastCopy,
  racePrepUpcomingCopy,
  volumeRampCopy,
} from './copy.fr';
import { evaluateInsights, rankInsights } from './evaluate';
import { INSIGHT_RULES } from './rules';
import { aerobicTrend } from './rules/aerobicTrend';
import { dataQualityNoHr } from './rules/dataQualityNoHr';
import { gapResume } from './rules/gapResume';
import { intensityTooHigh } from './rules/intensityTooHigh';
import { racePacing } from './rules/racePacing';
import { racePrepRule } from './rules/racePrep';
import { consistency } from './rules/consistency';
import { volumeRamp } from './rules/volumeRamp';
import { candidate, ctxOf, run } from './testUtils';
import type { InsightContext, InsightCopy } from './types';

// ─── Lint des textes ──────────────────────────────────────────────────────────

const JARGON = /(\bbpm\b|\bfc\b|\bzones?\b|vo2|trimp|seuil|allure cible)/i;
const BROKEN = /(NaN|undefined|\[object)/;
const sentences = (t: string) => t.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0).length;
const words = (t: string) => t.trim().split(/\s+/).length;

function lintCopy(c: InsightCopy) {
  expect(words(c.title)).toBeLessThanOrEqual(8);
  expect(sentences(c.beginnerText)).toBeLessThanOrEqual(2);
  expect(sentences(c.athleteText)).toBeLessThanOrEqual(2);
  expect(sentences(c.why)).toBeGreaterThanOrEqual(2);
  expect(sentences(c.why)).toBeLessThanOrEqual(3);
  expect(c.beginnerText).not.toMatch(JARGON);
  expect(c.title).not.toMatch(JARGON);
  for (const t of [c.title, c.beginnerText, c.athleteText, c.why]) {
    expect(t).not.toMatch(BROKEN);
    expect(t.trim().length).toBeGreaterThan(0);
  }
}

function lintInsight(i: TrainingInsight, today: string) {
  lintCopy(i);
  expect(i.why.trim()).not.toBe('');
  expect(i.message).toMatch(/\S/);
  expect(i.id.startsWith(`${i.ruleId}:`)).toBe(true);
  expect(i.date).toBe(today);
  expect(i.confidence).toBeGreaterThan(0);
  expect(i.confidence).toBeLessThanOrEqual(1);
  expect(i.evidence.length).toBeGreaterThan(0);
  for (const e of i.evidence) {
    expect(Number.isFinite(e.numeric)).toBe(true);
    expect(e.label).not.toMatch(BROKEN);
    expect(e.value).not.toMatch(BROKEN);
  }
}

// Toutes les variantes de gabarits, avec des valeurs réalistes.
const COPY_VARIANTS: Record<string, InsightCopy[]> = {
  data_quality_no_hr: [
    dataQualityNoHrCopy({ missing: 5, window: 5, streak: 11, since: '2026-06-03' }),
    dataQualityNoHrCopy({ missing: 3, window: 5, streak: 1, since: '2026-10-01' }),
  ],
  intensity_too_high: [intensityTooHighCopy({ sharePct: 53, minKm: 5, thresholdBpm: 160, easyBpm: 150, total: 49, weeks: 12 })],
  race_pacing: [
    fastStartCopy({ gapPct: 6.2, firstPaceSec: 321, secondPaceSec: 341, evenPaceSec: 331 }),
    cautiousStartCopy({ gapPct: 5.8, firstQuarterPaceSec: 350, averagePaceSec: 331 }),
  ],
  race_prep: [
    racePrepUpcomingCopy({ longestKm: 9.2, raceKm: 21.0975, sharePct: 44, weeks: 8, daysToRace: 1, tooLate: true }),
    racePrepUpcomingCopy({ longestKm: 9.2, raceKm: 21.0975, sharePct: 44, weeks: 8, daysToRace: 40, tooLate: false }),
    racePrepPastCopy({ longestKm: 9.2, raceKm: 21.0975, sharePct: 44, weeks: 8, targetKm: 12.7 }),
  ],
  gap_resume: [gapResumeCopy({ days: 21, lastDate: '2026-10-11', firstSessionMin: 20 })],
  volume_ramp: [volumeRampCopy({ weekKm: 32.4, baselineKm: 22.1, rampPct: 47, nextWeekKm: 24, weeks: 4 })],
  consistency: (['good', 'building', 'restart'] as const).flatMap((tier) =>
    [1, 5, 8].map((active) => consistencyCopy({ tier, active, window: 8, sessions: 12 })),
  ),
  aerobic_trend: [
    aerobicTrendCopy({ variationPct: 6.4, latest: '2026-Q4', base: '2026-Q3' }),
    aerobicTrendCopy({ variationPct: -7.1, latest: '2026-Q1', base: '2025-Q4' }),
  ],
};

describe('copy lint', () => {
  it('covers every registered rule', () => {
    expect(Object.keys(COPY_VARIANTS).sort()).toEqual(INSIGHT_RULES.map((r) => r.ruleId).sort());
  });

  it.each(Object.entries(COPY_VARIANTS))('%s texts respect the style rules', (_ruleId, variants) => {
    for (const c of variants) lintCopy(c);
  });
});

// ─── Profils synthétiques ─────────────────────────────────────────────────────

const TODAY = '2026-11-01'; // dimanche

/** `weeks` semaines de sorties ; `plan` donne [décalage en jours depuis la fin de semaine, km, FC]. */
function block(plan: [number, number, number | undefined][], weeks: number, until = TODAY): Activity[] {
  const acts: Activity[] = [];
  for (let w = 0; w < weeks; w++) {
    plan.forEach(([offset, km, hr], i) => acts.push(run(`w${w}-${i}`, addDays(until, -(w * 7 + offset)), km, hr)));
  }
  return acts;
}

const FC_RULES = ['intensity_too_high', 'aerobic_trend'];

describe('synthetic profiles', () => {
  it('beginner without HR: data quality advice, no HR-based rule', () => {
    const acts = block([[2, 5, undefined], [5, 4, undefined]], 12);
    const ctx = ctxOf(TODAY, acts, { profile: { level: 'beginner', maxHr: undefined, ageYears: 30 } });
    const out = evaluateInsights(ctx);
    const ids = out.map((i) => i.ruleId);
    expect(ids).toContain('data_quality_no_hr');
    expect(ids).toContain('consistency');
    for (const r of FC_RULES) expect(ids).not.toContain(r);
    for (const i of out) {
      lintInsight(i, TODAY);
      expect(i.message).toBe(i.beginnerText);
    }
    expect(rankInsights(out)[0].ruleId).toBe('data_quality_no_hr');
  });

  it('Sunday runner: regular and easy, only a consistency card', () => {
    const acts = block([[0, 8, 145]], 16);
    const out = evaluateInsights(ctxOf(TODAY, acts));
    expect(out.map((i) => i.ruleId)).toEqual(['consistency']);
    expect(out[0].evidence[0].numeric).toBe(8);
    lintInsight(out[0], TODAY);
  });

  it('equipped athlete: too many hard runs and a short long run before a half-marathon', () => {
    const acts = block([[0, 10, 145], [2, 10, 172], [4, 10, 145], [6, 10, 172]], 14);
    const upcoming = candidate({ id: 'race-up', date: '2026-12-05', status: 'upcoming', confidence: 'medium' });
    const ctx = ctxOf(TODAY, acts, { races: [upcoming] });
    const out = evaluateInsights(ctx);
    const ids = out.map((i) => i.ruleId);
    expect(ids).toEqual(expect.arrayContaining(['intensity_too_high', 'race_prep', 'consistency']));
    expect(ids).not.toContain('data_quality_no_hr');
    expect(ids).not.toContain('gap_resume');
    for (const i of out) lintInsight(i, TODAY);
    expect(rankInsights(out).map((i) => i.ruleId)).toEqual(['intensity_too_high', 'race_prep', 'consistency']);
    expect(out.find((i) => i.ruleId === 'intensity_too_high')!.message).toContain('160 bpm');
  });
});

describe('rules with insufficient data', () => {
  const empty: InsightContext = ctxOf(TODAY, []);
  it.each(INSIGHT_RULES.map((r) => [r.ruleId, r] as const))('%s returns null on an empty history', (_id, rule) => {
    expect(rule.evaluate(empty)).toBeNull();
  });

  it('exposes the rules in the documented order', () => {
    expect(INSIGHT_RULES.map((r) => r.ruleId)).toEqual([
      dataQualityNoHr, intensityTooHigh, racePacing, racePrepRule, gapResume, volumeRamp, consistency, aerobicTrend,
    ].map((r) => r.ruleId));
  });
});

// ─── Données réelles (snapshot gitignoré — tests sautés si absent) ───────────

const snapshotPath = path.join(__dirname, '../../../../fixtures/julien.snapshot.json');
const snapshot: { activities: Activity[] } | null = existsSync(snapshotPath)
  ? JSON.parse(readFileSync(snapshotPath, 'utf8'))
  : null;

(snapshot ? describe : describe.skip)('real Strava export', () => {
  const acts = snapshot!.activities;
  const profile = { level: 'advanced' as const, maxHr: 201, maxHrSource: 'observed' as const, ageYears: 40 };
  const races = detectRaces(acts, { maxHr: 201 });

  it('2026-11-01: no-HR warning fires, intensity stays silent', () => {
    const ctx = ctxOf('2026-11-01', acts, { profile, races });
    const noHr = dataQualityNoHr.evaluate(ctx)!;
    expect(noHr).not.toBeNull();
    expect(noHr.evidence[1].numeric).toBe(11);
    expect(noHr.evidence[1].value).toBe('11 depuis le 3 juin 2026');
    expect(noHr.athleteText).toContain('11 courses d’affilée sans FC depuis le 3 juin 2026');
    expect(intensityTooHigh.evaluate(ctx)).toBeNull();
    for (const i of evaluateInsights(ctx)) lintInsight(i, '2026-11-01');
  });

  it('2026-10-10 with a synthetic half-marathon on 2026-10-11: race prep fires', () => {
    const upcoming = candidate({ id: 'race-synth', date: '2026-10-11', status: 'upcoming', confidence: 'medium', name: 'Semi' });
    const ctx = ctxOf('2026-10-10', acts, { profile, races: [...races.filter((r) => r.date <= '2026-10-10'), upcoming] });
    const prep = racePrepRule.evaluate(ctx)!;
    expect(prep).not.toBeNull();
    const [longest, share, total] = prep.evidence;
    expect(total.numeric).toBeCloseTo(37.3, 1);
    expect(longest.numeric).toBeGreaterThan(9.1);
    expect(longest.numeric).toBeLessThan(9.2);
    expect(share.value).toBe('43 %');
    lintInsight(prep, '2026-10-10');
  });
});

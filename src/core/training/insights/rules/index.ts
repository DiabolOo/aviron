import type { InsightRuleDef } from '../types';
import { dataQualityNoHr } from './dataQualityNoHr';
import { intensityTooHigh } from './intensityTooHigh';
import { racePacing } from './racePacing';
import { racePrepRule } from './racePrep';
import { gapResume } from './gapResume';
import { volumeRamp } from './volumeRamp';
import { consistency } from './consistency';
import { aerobicTrend } from './aerobicTrend';

/** Ordre = priorité à gravité égale. */
export const INSIGHT_RULES: InsightRuleDef[] = [dataQualityNoHr, intensityTooHigh, racePacing, racePrepRule, gapResume, volumeRamp, consistency, aerobicTrend];

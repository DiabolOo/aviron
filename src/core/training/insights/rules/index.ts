import type { InsightRuleDef } from '../types';
import { dataQualityNoHr } from './dataQualityNoHr';
import { intensityTooHigh } from './intensityTooHigh';
import { racePacing } from './racePacing';

/** Ordre = priorité à gravité égale. */
export const INSIGHT_RULES: InsightRuleDef[] = [dataQualityNoHr, intensityTooHigh, racePacing];

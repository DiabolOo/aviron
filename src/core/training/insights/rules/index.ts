import type { InsightRuleDef } from '../types';
import { dataQualityNoHr } from './dataQualityNoHr';

/** Ordre = priorité à gravité égale. */
export const INSIGHT_RULES: InsightRuleDef[] = [dataQualityNoHr];

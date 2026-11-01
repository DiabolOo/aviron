import type { TrainingInsight } from '../types';
import { rankInsights } from './evaluate';

function ins(ruleId: string, severity: TrainingInsight['severity'], date = '2026-11-01', periodKey = 'p'): TrainingInsight {
  return {
    id: `${ruleId}:${periodKey}`, date, source: 'trend', message: 'm', confidence: 1, ruleId, severity,
    title: 't', beginnerText: 'b', athleteText: 'a', evidence: [], why: 'w',
  };
}

describe('rankInsights', () => {
  it('sorts by severity and caps at 3 by default', () => {
    const out = rankInsights([ins('a', 'info'), ins('b', 'warning'), ins('c', 'notice'), ins('d', 'info'), ins('e', 'notice')]);
    expect(out.map((i) => i.ruleId)).toEqual(['b', 'c', 'e']);
  });

  it('puts unseen and newer insights first within the same severity', () => {
    const list = [ins('a', 'notice', '2026-11-01'), ins('b', 'notice', '2026-11-01'), ins('c', 'notice', '2026-10-30')];
    expect(rankInsights(list, { seenIds: new Set(['a:p']) }).map((i) => i.ruleId)).toEqual(['b', 'c', 'a']);
    expect(rankInsights(list).map((i) => i.ruleId)).toEqual(['a', 'b', 'c']);
  });

  it('keeps a single card per ruleId and does not mutate the input', () => {
    const list = [ins('a', 'info', '2026-11-01', 'x'), ins('a', 'warning', '2026-11-01', 'y'), ins('b', 'info')];
    const copy = [...list];
    const out = rankInsights(list, { max: 5 });
    expect(out.map((i) => i.id)).toEqual(['a:y', 'b:p']);
    expect(list).toEqual(copy);
  });
});

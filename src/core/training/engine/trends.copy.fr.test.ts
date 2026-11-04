import type { Activity } from '../../schemas';
import { formatDuration } from '../../format';
import { efficiencyEmptyText, hrAbsentText, intensityEmptyText, volumeEmptyText } from './trends.copy.fr';
import { efficiencyTrend, intensityTrend, volumeTrend } from './trends';

const TODAY = '2026-11-04';
const MAX = { maxHr: 200, source: 'configured' } as const;

function run(id: string, date: string, km: number, avgHr?: number): Activity {
  return { id, name: 'Sortie', type: 'run', date, startTime: '08:00', durationMin: km * 5, distanceKm: km, avgHr, source: 'manual', aiEligible: true };
}

describe('formatDuration', () => {
  it('« 49 min », jamais « 0 h 49 »', () => {
    expect(formatDuration(49)).toBe('49 min');
    expect(formatDuration(15)).toBe('15 min');
    expect(formatDuration(0)).toBe('0 min');
  });
  it('heures + minutes à partir de 60 min, sans « 1h60 »', () => {
    expect(formatDuration(65)).toBe('1h05');
    expect(formatDuration(119.6)).toBe('2h00');
  });
});

describe('états vides : où j’en suis', () => {
  it('volume : aucune ou une seule semaine active', () => {
    expect(volumeEmptyText(volumeTrend([], TODAY))).toBe('Aucune activité sur les 8 dernières semaines.');
    expect(volumeEmptyText(volumeTrend([run('1', '2026-10-27', 5)], TODAY))).toBe(
      '1 semaine active sur 8 : il te manque une semaine avec activité pour voir une tendance.',
    );
  });

  it('intensités : il manque N sorties', () => {
    const t = intensityTrend([run('1', '2026-10-30', 10, 150), run('2', '2026-10-25', 8, 150), run('3', '2026-10-20', 7)], TODAY, MAX);
    expect(intensityEmptyText(t)).toBe(
      'Il te manque 2 sorties de plus de 5 km avec FC sur les 12 dernières semaines (2 sur 4).',
    );
    const one = intensityTrend(Array.from({ length: 3 }, (_, i) => run(`${i}`, `2026-10-2${i}`, 10, 150)), TODAY, MAX);
    expect(intensityEmptyText(one)).toContain('Il te manque 1 sortie de plus de 5 km avec FC');
  });

  it('intensités : aucune FC, avec la dernière course avec FC', () => {
    const t = intensityTrend([run('1', '2026-10-30', 10), run('2', '2026-10-25', 8)], TODAY, MAX);
    expect(intensityEmptyText(t, '2026-06-03')).toMatch(
      /^Aucune de tes 2 sorties de plus de 5 km sur les 12 dernières semaines n’a de FC\. Dernière course avec FC : 3 juin\.$/,
    );
  });

  it('intensités : aucune sortie, ou FC max inconnue', () => {
    expect(intensityEmptyText(intensityTrend([], TODAY, MAX))).toBe('Aucune sortie de plus de 5 km sur les 12 dernières semaines.');
    expect(intensityEmptyText(intensityTrend([], TODAY))).toMatch(/^FC max inconnue/);
  });

  it('efficacité : mois manquants et cas sans aucun mois', () => {
    const month = ['2026-10-03', '2026-10-10', '2026-10-17'].map((d, i) => run(`m${i}`, d, 10, 150));
    expect(efficiencyEmptyText(efficiencyTrend(month, TODAY))).toBe(
      'Il te manque 1 mois avec 3 sorties de plus de 3 km avec FC (1 mois sur 2 requis, sur les 6 derniers mois).',
    );
    expect(efficiencyEmptyText(efficiencyTrend([], TODAY), '2026-06-03')).toBe(
      'Aucun mois avec 3 sorties de plus de 3 km avec FC sur les 6 derniers mois. Dernière course avec FC : 3 juin.',
    );
  });
});

describe('hrAbsentText', () => {
  it('« FC absente depuis le <date> »', () => {
    expect(hrAbsentText('2026-06-03', '2026-11-04')).toBe('FC absente depuis le 3 juin');
  });
  it('ajoute l’année quand elle diffère', () => {
    expect(hrAbsentText('2025-06-03', '2026-11-04')).toBe('FC absente depuis le 3 juin 2025');
  });
  it('sans aucune FC enregistrée', () => {
    expect(hrAbsentText(undefined, '2026-11-04')).toBe('FC absente : aucune course avec FC enregistrée');
  });
});

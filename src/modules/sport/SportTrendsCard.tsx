import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { formatDayMonth } from '@/src/core/dates';
import { formatDuration } from '@/src/core/format';
import {
  type SportTrends as SportTrendsReport,
  type EfficiencyTrend,
  type IntensityTrend,
  type VolumeTrend,
} from '@/src/core/training/engine';
import {
  efficiencyEmptyText,
  hrAbsentText,
  intensityEmptyText,
  volumeEmptyText,
} from '@/src/core/training/engine/trends.copy.fr';
import { useTheme } from '@/src/ui/useTheme';

const MAX_HR_SOURCE_LABEL = {
  configured: 'saisie',
  observed: 'observée sur 12 mois',
  estimated: 'estimée d’après l’âge',
} as const;
const ZONE_ALPHA = ['3D', '66', '99', 'CC', 'FF'] as const;
const DIRECTION_LABEL = { up: 'En hausse', flat: 'Stable', down: 'En baisse' } as const;
const fr = (n: number) => String(n).replace('.', ',');

/** Texte d'état vide : plus discret que les données (plus petit, gris plus clair). */
function Empty({ children }: { children: string }) {
  return <Text className="text-[13px] leading-[18px] text-faint">{children}</Text>;
}

function KeyFigure({ children }: { children: React.ReactNode }) {
  return <Text className="text-[22px] font-bold tracking-tight text-fg">{children}</Text>;
}

function Section({
  title,
  window,
  children,
}: {
  title: string;
  window: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2.5 border-t border-fg/5 pt-3">
      <View className="flex-row items-baseline gap-1.5">
        <Text className="text-[15px] font-semibold text-fg">{title}</Text>
        <Text className="text-[12px] text-muted">· {window}</Text>
      </View>
      {children}
    </View>
  );
}

/** « estimation » : discret si peu de temps est estimé, marqué sinon. */
function EstimationTag({ estimatedPct }: { estimatedPct: number }) {
  if (estimatedPct <= 50) return <Text className="text-[12px] text-muted">· estimation</Text>;
  return (
    <View className="self-start rounded-full bg-insight-data-tint px-2.5 py-1">
      <Text className="text-[12px] font-medium text-insight-data">estimation</Text>
    </View>
  );
}

function Volume({ volume }: { volume: VolumeTrend }) {
  const { colors } = useTheme();
  if (volume.status === 'insufficient') return <Empty>{volumeEmptyText(volume)}</Empty>;

  const weeks = volume.weeks;
  const last = weeks[weeks.length - 1];
  const hasCurrent = weeks.some((w) => w.current);
  const max = Math.max(...weeks.map((w) => w.km), 1);
  return (
    <>
      <View className="flex-row items-baseline gap-1.5">
        <KeyFigure>
          {fr(volume.avgKm)} km · {formatDuration(volume.avgMinutes)}
        </KeyFigure>
        <Text className="text-[14px] text-muted">par semaine</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] text-muted">km par semaine</Text>
        <Text className="text-[12px] text-muted">max {fr(max)} km</Text>
      </View>
      <View className="h-[72px] flex-row gap-2 border-b border-fg/10" accessibilityElementsHidden>
        {weeks.map((w) => (
          <View key={w.start} className="h-full flex-1 justify-end">
            <View
              className="w-full rounded-t-md"
              style={{
                height: `${Math.max(4, Math.round((w.km / max) * 100))}%`,
                backgroundColor: w.current ? `${colors.insightData}66` : colors.insightData,
              }}
            />
          </View>
        ))}
      </View>
      <View className="flex-row justify-between">
        <Text className="text-[12px] text-muted">{formatDayMonth(weeks[0].start)}</Text>
        <Text className="text-[12px] text-muted">{formatDayMonth(last.start)}</Text>
      </View>
      <Text className="text-[13px] text-muted">
        Du {formatDayMonth(volume.from)} au {formatDayMonth(volume.to)}
        {hasCurrent ? ' · barre claire : semaine en cours, incomplète' : ''}
      </Text>
      <Text className="text-[13px] text-muted">
        Semaine du {formatDayMonth(last.start)} : {fr(last.km)} km · {formatDuration(last.minutes)}
      </Text>
    </>
  );
}

function Intensity({ intensity, lastHrDate }: { intensity: IntensityTrend; lastHrDate?: string }) {
  const { colors } = useTheme();
  if (intensity.status !== 'ok') return <Empty>{intensityEmptyText(intensity, lastHrDate)}</Empty>;
  const dominant = [...intensity.zones].sort((a, b) => b.pct - a.pct)[0];
  return (
    <>
      <KeyFigure>
        Z{dominant.zone} : {dominant.pct} %
      </KeyFigure>
      <View className="flex-row items-baseline gap-1.5">
        <Text className="text-[13px] text-muted">du temps en zone</Text>
        <EstimationTag estimatedPct={intensity.estimatedPct} />
      </View>
      <View className="h-3 flex-row overflow-hidden rounded-full" accessibilityElementsHidden>
        {intensity.zones.map((z) =>
          z.pct > 0 ? (
            <View
              key={z.zone}
              style={{ flex: z.pct, backgroundColor: `${colors.insightData}${ZONE_ALPHA[z.zone - 1]}` }}
            />
          ) : null,
        )}
      </View>
      <View className="flex-row justify-between">
        {intensity.zones.map((z) => (
          <View key={z.zone} className="items-center">
            <Text className="text-[15px] font-semibold text-fg">{z.pct} %</Text>
            <Text className="text-[12px] text-muted">Z{z.zone}</Text>
          </View>
        ))}
      </View>
      <Text className="text-[13px] text-muted">
        {intensity.runs} sorties depuis le {formatDayMonth(intensity.from)} · FC max {intensity.maxHr} bpm (
        {MAX_HR_SOURCE_LABEL[intensity.maxHrSource ?? 'estimated']})
      </Text>
    </>
  );
}

function Efficiency({ efficiency, lastHrDate }: { efficiency: EfficiencyTrend; lastHrDate?: string }) {
  if (efficiency.status !== 'ok' || !efficiency.direction) {
    return <Empty>{efficiencyEmptyText(efficiency, lastHrDate)}</Empty>;
  }
  const delta = efficiency.deltaPct ?? 0;
  return (
    <>
      <View className="flex-row items-baseline gap-2">
        <KeyFigure>{DIRECTION_LABEL[efficiency.direction]}</KeyFigure>
        <Text className="text-[15px] font-semibold text-fg">
          {delta > 0 ? '+' : ''}
          {fr(delta)} %
        </Text>
        <Text className="text-[14px] text-muted">vs mois précédent</Text>
      </View>
      <Text className="text-[13px] text-muted">Plus vite à fréquence cardiaque égale = meilleure efficacité.</Text>
    </>
  );
}

export function SportTrendsCard({ trends }: { trends: SportTrendsReport }) {
  return (
    <Card tint="data" className="gap-3 p-[18px]">
      <Text className="text-[17px] font-semibold text-fg">Sport</Text>
      {trends.stale ? (
        <Text className="text-[14px] font-medium text-fg">
          Pas d’activité depuis le {formatDayMonth(trends.asOf)} : la carte affiche les semaines jusqu’à cette date.
        </Text>
      ) : null}
      <Section title="Volume" window="8 semaines">
        <Volume volume={trends.volume} />
      </Section>
      {trends.hrAbsent ? (
        <View className="border-t border-fg/5 pt-3">
          <Empty>{hrAbsentText(trends.lastHrDate, trends.asOf)}</Empty>
        </View>
      ) : (
        <>
          <Section title="Intensités" window="12 semaines">
            <Intensity intensity={trends.intensity} lastHrDate={trends.lastHrDate} />
          </Section>
          <Section title="Efficacité aérobie" window="6 mois">
            <Efficiency efficiency={trends.efficiency} lastHrDate={trends.lastHrDate} />
          </Section>
        </>
      )}
    </Card>
  );
}

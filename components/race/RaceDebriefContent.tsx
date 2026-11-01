import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AdviceCard } from '@/components/ui/AdviceCard';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Text } from '@/components/ui/Text';
import { parseISODate } from '@/src/core/dates';
import { NBSP, nbspUnits } from '@/src/core/sportFormat';
import {
  comparisonLabel,
  formatKmRange,
  formatPaceKm,
  formatRaceDelta,
  formatRaceTime,
  raceDistanceName,
  type RaceDebriefView,
  type RaceRow,
} from '@/src/core/training/raceView';

type Props = {
  view: RaceDebriefView;
  onOpenRace: (raceId: string) => void;
};

const longDate = (iso: string): string =>
  parseISODate(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

const shortDate = (iso: string): string =>
  parseISODate(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

/** Barre plus longue = allure plus rapide ; renvoie une largeur en % comprise entre 35 et 100. */
function barWidth(paceSec: number, fastest: number, slowest: number): number {
  if (slowest === fastest) return 100;
  return 35 + 65 * ((slowest - paceSec) / (slowest - fastest));
}

function Pace({ paceSec }: { paceSec: number }) {
  return (
    <Text className="text-xl font-semibold text-fg">
      {formatPaceKm(paceSec)}
      <Text className="text-sm font-normal text-muted">{NBSP}/km</Text>
    </Text>
  );
}

function Bands({ view }: { view: RaceDebriefView }) {
  const paces = view.bands.map((b) => b.officialPaceSec as number);
  const fastest = Math.min(...paces, view.averagePaceSec ?? Infinity);
  const slowest = Math.max(...paces, view.averagePaceSec ?? -Infinity);
  const avgLeft =
    view.averagePaceSec !== undefined ? (`${barWidth(view.averagePaceSec, fastest, slowest)}%` as `${number}%`) : undefined;

  return (
    <View className="mt-8">
      <Label>Tranches</Label>
      <Card className="mt-3 py-2">
        {view.bands.map((band, i) => (
          <View key={band.label} className={`py-3.5 ${i > 0 ? 'border-t border-fg/5' : ''}`}>
            <View className="flex-row items-baseline justify-between">
              <Text className="text-sm text-muted">Km {formatKmRange(band.fromKm, band.toKm)}</Text>
              <View className="flex-row items-baseline gap-3">
                {band.avgHr !== undefined ? <Text className="text-xs text-muted">{`${band.avgHr}${NBSP}bpm`}</Text> : null}
                <Pace paceSec={band.officialPaceSec as number} />
              </View>
            </View>
            <View className="mt-2 h-1.5 w-full rounded-full bg-fg/5">
              <View
                className="h-full rounded-full bg-fg/30"
                style={{ width: `${barWidth(band.officialPaceSec as number, fastest, slowest)}%` }}
              />
              {avgLeft ? (
                <View testID="average-pace-line" className="absolute -top-1 h-3.5 w-px bg-fg" style={{ left: avgLeft }} />
              ) : null}
            </View>
          </View>
        ))}
        {view.averagePaceSec !== undefined ? (
          <Text className="mb-1 mt-1 text-xs text-muted">Trait : allure moyenne {formatPaceKm(view.averagePaceSec)}{NBSP}/km</Text>
        ) : null}
      </Card>
    </View>
  );
}

function HeartRate({ hr }: { hr: NonNullable<RaceDebriefView['hr']> }) {
  const { first, second } = hr.halves;
  const rows = [
    { label: '1re moitié', half: first },
    { label: '2e moitié', half: second },
  ];
  return (
    <View className="mt-8">
      <Label>Moitiés</Label>
      <Card className="mt-3 py-2">
        {rows.map(({ label, half }, i) => (
          <View key={label} className={`flex-row items-baseline justify-between py-3.5 ${i > 0 ? 'border-t border-fg/5' : ''}`}>
            <Text className="text-sm text-muted">{label}</Text>
            <View className="flex-row items-baseline gap-3">
              <Text className="text-xs text-muted">{`${half.avgHr}${NBSP}bpm`}</Text>
              <Pace paceSec={half.officialPaceSec} />
            </View>
          </View>
        ))}
        {hr.driftSentence ? (
          <Text className="mb-1 mt-1 border-t border-fg/5 pt-3 text-sm text-fg">{nbspUnits(hr.driftSentence)}</Text>
        ) : null}
      </Card>
    </View>
  );
}

function DistanceNote({ note }: { note: NonNullable<RaceDebriefView['distanceNote']> }) {
  const [open, setOpen] = useState(false);
  return (
    <View className="mt-3">
      <View className="flex-row items-center gap-2">
        <Text numberOfLines={1} className="shrink text-sm text-muted">{nbspUnits(note.short)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Détail de la distance"
          hitSlop={10}
          onPress={() => setOpen((v) => !v)}
          className="h-5 w-5 items-center justify-center rounded-full border border-fg/20 active:opacity-70">
          <Text className="text-[11px] font-semibold text-muted">i</Text>
        </Pressable>
      </View>
      {open ? <Text className="mt-2 text-sm text-muted">{nbspUnits(note.detail)}</Text> : null}
    </View>
  );
}

function ComparisonRow({ row, onOpen }: { row: RaceRow; onOpen: (id: string) => void }) {
  return (
    <Pressable
      disabled={row.current}
      testID={row.current ? 'race-row-current' : undefined}
      onPress={() => onOpen(row.raceId)}
      className={`flex-row items-center gap-3 rounded-2xl px-3 py-3 active:opacity-70 ${row.current ? 'bg-fg/10' : ''}`}>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className={`text-base ${row.current ? 'font-semibold text-fg' : 'text-fg'}`}>{shortDate(row.date)}</Text>
          {row.best ? (
            <View className="rounded-full bg-fg px-2 py-0.5">
              <Text className="text-[11px] font-semibold text-canvas">Meilleure</Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-0.5 text-sm text-muted">
          {raceDistanceName(row.officialDistanceKm)}
          {row.officialPaceSec !== undefined ? ` · ${formatPaceKm(row.officialPaceSec)}${NBSP}/km` : ''}
        </Text>
      </View>
      <View className="items-end">
        {row.timeSec !== undefined ? (
          <Text className="text-base font-semibold text-fg">{formatRaceTime(row.timeSec)}</Text>
        ) : null}
        {row.deltaSec !== undefined ? <Text className="mt-0.5 text-sm text-muted">{nbspUnits(formatRaceDelta(row.deltaSec))}</Text> : null}
      </View>
    </Pressable>
  );
}

function Comparison({ rows, label, onOpen }: { rows: RaceRow[]; label: string; onOpen: (id: string) => void }) {
  return (
    <View className="mt-8">
      <Label>{label}</Label>
      <Card className="mt-3 px-2 py-2">
        {rows.map((row) => (
          <ComparisonRow key={row.raceId} row={row} onOpen={onOpen} />
        ))}
      </Card>
    </View>
  );
}

function OriginalTitle({ name }: { name: string }) {
  return (
    <View testID="original-title" className="mt-8 border-t border-fg/5 pt-4">
      <Label>Titre d’origine</Label>
      <Text className="mt-1 text-sm text-fg">{name}</Text>
    </View>
  );
}

export function RaceDebriefContent({ view, onOpenRace }: Props) {
  return (
    <View>
      <Text testID="race-title" numberOfLines={2} className="mt-6 text-3xl font-semibold tracking-tight text-fg">
        {view.title}
      </Text>
      <Text className="mt-1 text-sm text-muted">{longDate(view.race.date)}</Text>

      {view.timeSec !== undefined ? (
        <Text testID="race-time" className="mt-6 text-6xl font-semibold tracking-tighter text-fg">
          {formatRaceTime(view.timeSec)}
        </Text>
      ) : null}
      {view.officialPaceSec !== undefined ? (
        <Text testID="race-pace" className="mt-1 text-base text-muted">
          {formatPaceKm(view.officialPaceSec)}{NBSP}/km
        </Text>
      ) : null}
      {view.distanceNote ? <DistanceNote note={view.distanceNote} /> : null}

      {view.pacing ? (
        <View className="mt-6">
          <AdviceCard
            source="data"
            title={view.pacing.title}
            summary={view.pacing.summary}
            why={[view.pacing.message, ...view.pacing.extras, view.pacing.why]}
          />
        </View>
      ) : null}

      {view.bands.length > 0 ? <Bands view={view} /> : null}
      {view.hr ? <HeartRate hr={view.hr} /> : null}
      {view.comparison.length > 1 ? (
        <Comparison rows={view.comparison} label={comparisonLabel(view.race.officialDistanceKm)} onOpen={onOpenRace} />
      ) : null}
      {view.originalName ? <OriginalTitle name={view.originalName} /> : null}
    </View>
  );
}

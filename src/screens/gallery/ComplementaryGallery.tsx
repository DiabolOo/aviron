import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { makeStyles } from '@/src/design';
import { BackHeader } from '@/src/ui/BackHeader';
import { ConsentBlock } from '@/src/ui/ConsentBlock';
import { DayDots } from '@/src/ui/DayDots';
import { ListCard } from '@/src/ui/ListCard';
import { NumberedList } from '@/src/ui/NumberedList';
import { OptionCard } from '@/src/ui/OptionCard';
import { PaceSteps } from '@/src/ui/PaceSteps';
import { PastWeekRow } from '@/src/ui/PastWeekRow';
import { PeriodCard } from '@/src/ui/PeriodCard';
import { RaceList } from '@/src/ui/RaceList';
import { ScreenHeader } from '@/src/ui/ScreenHeader';
import { SegmentedControl } from '@/src/ui/SegmentedControl';
import { SettingsGroup } from '@/src/ui/SettingsGroup';
import { SourceChip } from '@/src/ui/SourceChip';
import { StepHeader } from '@/src/ui/StepHeader';
import { Text } from '@/src/ui/Text';
import { WeekBars } from '@/src/ui/WeekBars';
import { WeekList } from '@/src/ui/WeekList';

const noop = () => undefined;

const useStyles = makeStyles((t) => ({
  section: { gap: t.space.md },
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.card,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
    padding: t.space.screen,
    gap: t.space.md,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm },
  options: { gap: t.space.sm },
}));

function Section({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text role="caption" weight="semibold" color="inkTertiary">
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Composants complémentaires de la SPEC-v3 §7, avec les contenus des maquettes v3.4. Dev seulement. */
export function ComplementaryGallery() {
  const styles = useStyles();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [level, setLevel] = useState('advanced');
  const [consent, setConsent] = useState(false);
  const [analyse, setAnalyse] = useState(true);

  return (
    <>
      <Section title="BackHeader">
        <View style={styles.card}>
          <BackHeader label="Cette semaine" onBack={noop} />
          <BackHeader onClose={noop} />
        </View>
      </Section>

      <Section title="ScreenHeader">
        <ScreenHeader eyebrow="Lundi 2 novembre · phase de base" title="Bonjour, Jul" avatar={{ initial: 'J', onPress: noop }} />
        <ScreenHeader title="Coach" subtitle="Tu demandes, il prépare, tu valides." action={{ label: 'Historique', onPress: noop }} />
      </Section>

      <Section title="SourceChip">
        <View style={styles.row}>
          <SourceChip label="COROS, via Strava" />
          <SourceChip label="Téléphone, via Strava" />
          <SourceChip label="Saisie à la main" />
        </View>
      </Section>

      <Section title="WeekList">
        <WeekList
          days={[
            { id: 'mon', day: 'Lun 2', title: 'Footing 8 km', sub: 'Aujourd’hui', today: true, effort: { level: 'easy', scale: 'planned' } },
            { id: 'tue', day: 'Mar 3', title: 'Repos', rest: true },
            { id: 'wed', day: 'Mer 4', title: 'Renfo jambes · 55 min', effort: { level: 'neutral', label: 'Renfo' } },
            { id: 'thu', day: 'Jeu 5', title: 'Fractionné 6 × 800 m', effort: { level: 'hard', scale: 'planned' } },
            { id: 'sat', day: 'Sam 7', title: 'Sortie longue 16 km', proposal: 'Le coach propose 12 km', effort: { level: 'easy', scale: 'planned' } },
          ]}
        />
        <WeekList
          days={[
            { id: 'mon', day: 'Lun 2', title: '20 min, marche et course', sub: 'Fait · ressenti facile', check: 'done', effort: { level: 'easy', scale: 'felt' }, onPress: noop },
            { id: 'tue', day: 'Mar 3', title: 'Repos', rest: true },
            { id: 'thu', day: 'Jeu 5', title: 'Repos', sub: 'Aujourd’hui', rest: true, today: true },
            { id: 'sat', day: 'Sam 7', title: '25 min, marche et course', check: 'open', effort: { level: 'neutral', label: 'Prévu' } },
          ]}
        />
      </Section>

      <Section title="PastWeekRow">
        <ListCard>
          <PastWeekRow title="26 oct. – 1 nov." detail="Rien d’importé" onPress={noop} />
          <PastWeekRow title="19 – 25 oct. · 1 sortie, 15 min" detail="Jeu. 22 · course 2,8 km à 3:41 /km · sans cardio" onPress={noop} />
        </ListCard>
      </Section>

      <Section title="DayDots">
        <View style={styles.card}>
          <DayDots
            days={WEEKDAYS.map((label, i) => ({ id: String(i), label, date: String(26 + i > 31 ? 26 + i - 31 : 26 + i), state: 'empty' as const }))}
          />
          <DayDots
            days={[
              { id: 'mon', label: 'Lun', state: 'today' },
              { id: 'wed', label: 'Mer', state: 'empty' },
              { id: 'sat', label: 'Sam', state: 'done' },
            ]}
          />
        </View>
      </Section>

      <Section title="WeekBars">
        <View style={styles.card}>
          <Text role="body" weight="semibold">
            5 séances, 3 sports, 4 h 03
          </Text>
          <WeekBars
            accessibilityLabel="5 séances, 3 sports, 4 h 03"
            legend="Nage lun. et mar. · course mer. et ven. · muscu jeu."
            bars={WEEKDAYS.map((label, i) => ({ id: String(i), label, value: [40, 38, 42, 68, 55, 0, 0][i], highlight: i === 3 }))}
          />
        </View>
      </Section>

      <Section title="SegmentedControl · PeriodCard">
        <SegmentedControl
          options={[
            { id: 'week', label: 'Semaine' },
            { id: 'month', label: 'Mois' },
            { id: 'year', label: 'Année' },
          ]}
          value={period}
          onChange={setPeriod}
        />
        <PeriodCard
          period="Mai 2026"
          onPrev={noop}
          onNext={noop}
          hero={{ value: '4h50', caption: 'd’entraînement · 6 séances' }}
          barsLabel="Par semaine : 4 mai rien, 11 mai 47 min, 18 mai 4 h 03, 25 mai rien"
          bars={[
            { id: '4', label: '4 mai', value: 0, valueLabel: '—' },
            { id: '11', label: '11', value: 47, valueLabel: '47 min' },
            { id: '18', label: '18', value: 243, valueLabel: '4 h 03', highlight: true },
            { id: '25', label: '25', value: 0, valueLabel: '—' },
          ]}
          breakdown="Course 2 h 25 · nage 1 h 18 · muscu 1 h 07"
          regularity={{ lead: '2 semaines actives sur 4', rest: ': celles du 11 et du 18 mai.' }}
        />
      </Section>

      <Section title="RaceList">
        <RaceList
          title="Tes semis"
          caption="écart à ton record"
          races={[
            { id: 'r26', title: '11 oct. 2026 · Reims', sub: '5:22 /km · sans cardio', time: '1h53:09', gap: '+4:53', onPress: noop },
            { id: 'r25', title: '12 oct. 2025 · Reims', sub: '5:15 /km', time: '1h50:51', gap: '+2:35', onPress: noop },
            { id: 'r24', title: '3 mars 2024', sub: '5:08 /km', time: '1h48:16', record: true, onPress: noop },
          ]}
        />
      </Section>

      <Section title="PaceSteps · NumberedList">
        <View style={styles.card}>
          <PaceSteps
            legend="↑ plus vite"
            averageLabel="moy. 5:22"
            averageSec={322}
            pace={[
              { fromKm: 0, toKm: 5.3, value: 355 },
              { fromKm: 5.3, toKm: 15.8, value: 327 },
              { fromKm: 15.8, toKm: 21.1, value: 288 },
            ]}
            markers={[
              { km: 2.6, label: '1' },
              { km: 10.5, label: '2' },
              { km: 18.5, label: '3' },
            ]}
            axis={['km 0', 'km 21,1']}
            accessibilityLabel="Allure : départ 5:55, milieu 5:27, final 4:48."
          />
          <PaceSteps
            legend="— allure ↑ plus vite · ··· FC ↑ plus haute"
            averageLabel="moy. 5:15"
            target={{ valueSec: 299, label: 'objectif 4:59' }}
            pace={[
              { fromKm: 0, toKm: 5.3, value: 303 },
              { fromKm: 5.3, toKm: 10.5, value: 311 },
              { fromKm: 10.5, toKm: 15.8, value: 314 },
              { fromKm: 15.8, toKm: 21.1, value: 333 },
            ]}
            hr={[
              { fromKm: 0, toKm: 5.3, value: 165 },
              { fromKm: 5.3, toKm: 10.5, value: 169 },
              { fromKm: 10.5, toKm: 15.8, value: 175 },
              { fromKm: 15.8, toKm: 21.1, value: 184 },
            ]}
            markers={[
              { km: 2.6, label: '1' },
              { km: 10.5, label: '2' },
              { km: 18.5, label: '3' },
            ]}
            axis={['km 0', 'km 10,5', 'km 21,1']}
            accessibilityLabel="Allure : 5:03, puis 5:11 et 5:14, puis 5:33 ; FC de 165 à 184 bpm."
          />
          <NumberedList
            items={[
              { id: '1', title: 'Départ · km 0 à 5,3 · 5:55 /km', body: '33 s plus lent que ta moyenne : près de 3 minutes laissées là.' },
              { id: '2', title: 'Milieu · km 5,3 à 15,8 · 5:27 puis 5:26', body: 'Dix kilomètres réguliers, à une seconde près.' },
              { id: '3', title: 'Final · km 15,8 à 21,1 · 4:48 /km', body: 'Ton quart le plus rapide, 34 s sous ta moyenne.' },
            ]}
          />
        </View>
      </Section>

      <Section title="StepHeader · OptionCard · ConsentBlock">
        <View style={styles.options} accessibilityRole="radiogroup">
          <StepHeader step={4} total={4} label="4 sur 4" onBack={noop} />
          <OptionCard title="Je débute" description="Je ne cours pas encore, ou très peu." selected={level === 'beginner'} onPress={() => setLevel('beginner')} />
          <OptionCard title="Je cours un peu" description="Une ou deux sorties par semaine, sans plan." selected={level === 'regular'} onPress={() => setLevel('regular')} />
          <OptionCard title="Je m’entraîne" description="Un plan, des séances variées, un objectif chiffré." selected={level === 'advanced'} onPress={() => setLevel('advanced')} />
          <ConsentBlock
            sends="allures, durées, FC moyennes, par semaine."
            never="ton nom, ta position, tes activités Strava."
            accepted={consent}
            onChange={setConsent}
          />
        </View>
      </Section>

      <Section title="SettingsGroup">
        <SettingsGroup
          title="Toi"
          rows={[
            { id: 'level', label: 'Niveau', value: 'Je m’entraîne' },
            { id: 'gear', label: 'Équipement', value: 'Montre avec cardio', sub: 'Aucune FC reçue depuis juin. C’est voulu ?' },
            { id: 'goal', label: 'Objectif', value: 'Semi en 1h45' },
          ]}
        />
        <SettingsGroup
          title="Personnalisation"
          rows={[
            { id: 'analyse', label: 'Analyser mes séances', sub: 'Sur ton téléphone', toggle: { value: analyse, onChange: setAnalyse } },
            { id: 'data', label: 'Données', onPress: noop },
            { id: 'settings', label: 'Réglages', value: 'Apparence, modules', onPress: noop },
          ]}
        />
      </Section>
    </>
  );
}

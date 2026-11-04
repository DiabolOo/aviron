import { useState, type ReactNode } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DesignPreviewProvider,
  fontScaleBreakpoints,
  makeStyles,
  useTheme,
  type ColorScheme,
  type DesignPreview,
} from '@/src/design';
import { Button } from '@/src/ui/Button';
import { CoachCard } from '@/src/ui/CoachCard';
import { EffortPill } from '@/src/ui/EffortPill';
import { EmptyState } from '@/src/ui/EmptyState';
import { HeroMetric } from '@/src/ui/HeroMetric';
import { ProposalCard, type ProposalCardProps } from '@/src/ui/ProposalCard';
import { SessionCard, type SessionStatus } from '@/src/ui/SessionCard';
import { Skeleton } from '@/src/ui/Skeleton';
import { Text } from '@/src/ui/Text';
import { UndoToast } from '@/src/ui/UndoToast';
import { useDelayedSkeleton } from '@/src/ui/useDelayedSkeleton';

const noop = () => undefined;
const formatKm = (n: number) => n.toFixed(1).replace('.', ',');
const formatMinutes = (n: number) => {
  const total = Math.round(n);
  return `${Math.floor(total / 60)}h${String(total % 60).padStart(2, '0')}`;
};

const ROWS: ProposalCardProps['rows'] = [
  { day: 'Jeu. 12', before: 'Fractionné 8 × 400 m', after: 'Footing 40 min' },
  { day: 'Sam. 14', before: 'Sortie longue 16 km', after: 'Sortie longue 12 km' },
  { day: 'Dim. 15', after: 'Repos' },
];

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  scroll: { padding: t.space.screen, gap: t.space.section },
  section: { gap: t.space.md },
  toggles: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.card,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
    paddingHorizontal: t.space.screen,
    paddingVertical: t.space.sm,
  },
  toggle: { minHeight: t.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm },
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.card,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
    padding: t.space.screen,
    gap: t.space.md,
  },
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

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.toggle}>
      <Text role="body">{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.line, true: colors.coach }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

function SkeletonDemo() {
  const styles = useStyles();
  const [loading, setLoading] = useState(false);
  const [ms, setMs] = useState(0);
  const show = useDelayedSkeleton(loading);
  const load = (duration: number) => {
    setMs(duration);
    setLoading(true);
    setTimeout(() => setLoading(false), duration);
  };
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Button variant="secondary" label="Chargement 200 ms" onPress={() => load(200)} />
        <Button variant="secondary" label="Chargement 1,5 s" onPress={() => load(1500)} />
      </View>
      {show ? (
        <>
          <Skeleton role="verdict" />
          <Skeleton role="body" />
        </>
      ) : (
        <Text role="sub" color="inkSecondary">
          {ms === 0 ? 'Lance un chargement : à 200 ms, aucun squelette.' : loading ? 'Attente…' : 'Chargé.'}
        </Text>
      )}
    </View>
  );
}

type Preview = DesignPreview & { scheme: ColorScheme };

function Gallery({ preview, setPreview }: { preview: Preview; setPreview: (p: Preview) => void }) {
  const styles = useStyles();
  const { size, space } = useTheme();
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<SessionStatus>('planned');
  const [toast, setToast] = useState<string | null>(null);
  const [coachAnswer, setCoachAnswer] = useState<string>();
  const [proposalAnswer, setProposalAnswer] = useState<string>();
  const [applied, setApplied] = useState(false);
  const [heroKey, setHeroKey] = useState(0);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.root}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + size.touchMin + space.section }]}>
          <Text role="title">Galerie v3.1</Text>

          <View style={styles.toggles}>
            <Toggle
              label="Sombre"
              value={preview.scheme === 'dark'}
              onChange={(v) => setPreview({ ...preview, scheme: v ? 'dark' : 'light' })}
            />
            <Toggle
              label={`Texte agrandi ×${String(fontScaleBreakpoints.stack).replace('.', ',')}`}
              value={preview.fontScale !== undefined}
              onChange={(v) => setPreview({ ...preview, fontScale: v ? fontScaleBreakpoints.stack : undefined })}
            />
            <Toggle
              label="Réduire les animations"
              value={preview.reduceMotion === true}
              onChange={(v) => setPreview({ ...preview, reduceMotion: v || undefined })}
            />
          </View>

          <Section title="Text">
            <View style={styles.card}>
              <Text role="hero" weight="semibold">
                42,5
              </Text>
              <Text role="title">Footing 8 km</Text>
              <Text role="verdict" weight="bold">
                Ta semaine est bien partie.
              </Text>
              <Text role="body">Texte courant, libellés de bouton.</Text>
              <Text role="sub" color="inkSecondary">
                Lignes de liste, détails.
              </Text>
              <Text role="caption" color="inkTertiary">
                Légendes, sources.
              </Text>
            </View>
          </Section>

          <Section title="EffortPill">
            <View style={styles.row}>
              <EffortPill level="easy" />
              <EffortPill level="moderate" />
              <EffortPill level="hard" />
              <EffortPill level="neutral" label="Renfo" />
              <EffortPill level="neutral" label="Sans cardio" />
            </View>
          </Section>

          <Section title="HeroMetric">
            <View style={styles.card} key={`count-${heroKey}`}>
              <HeroMetric
                animate="count"
                countTo={42.5}
                format={formatKm}
                value="42,5"
                unit="km"
                caption="cette semaine, en 5 séances"
                metrics={[
                  { label: 'Durée', value: '4h05' },
                  { label: 'Dénivelé', value: '320', unit: 'm' },
                  { label: 'Séances', value: '5' },
                ]}
              />
            </View>
            <View style={styles.card} key={`count-min-${heroKey}`}>
              <HeroMetric animate="count" countTo={68} format={formatMinutes} value="1h08" caption="de course depuis lundi" />
            </View>
            <View style={styles.card} key={`fade-${heroKey}`}>
              <HeroMetric animate="fade" value="4:52" unit="/km" caption="sur le bloc principal de 3 km" metrics={[{ label: 'FC moyenne', value: '158', unit: 'bpm' }]} />
            </View>
            <Button variant="secondary" label="Rejouer les animations" onPress={() => setHeroKey((k) => k + 1)} />
          </Section>

          <Section title="CoachCard">
            <CoachCard kind="insight" source="device" verdict="Tu cours plus vite à effort égal." body="Sur tes six dernières sorties faciles, l’allure a gagné dix secondes au kilomètre pour le même cardio." />
            <CoachCard
              kind="advice"
              source="ai"
              verdict="Garde la sortie longue tranquille."
              body="Ta semaine est déjà chargée : vise une allure où tu peux parler."
              action={{ label: 'Voir la séance', onPress: noop }}
            />
            <CoachCard
              kind="question"
              source="profile"
              body="Comment s’est passée la séance d’hier ?"
              choices={[
                { id: 'easy', label: 'Facile' },
                { id: 'moderate', label: 'Correct' },
                { id: 'hard', label: 'Dur' },
              ]}
              selected={coachAnswer}
              onChoose={setCoachAnswer}
            />
            <CoachCard kind="insight" source="device" verdict="Environ 25 km cette semaine." body="Deux sorties n’ont pas de distance mesurée." approxReason="montre sans GPS sur deux séances" />
          </Section>

          <Section title="SessionCard">
            <SessionCard
              eyebrow="Séance du jour"
              title="Footing 8 km"
              effort={{ level: 'easy' }}
              instruction="Allure où tu peux parler, environ 45 minutes."
              note="Pas de cardio sur tes dernières sorties : fie-toi à la sensation."
              status={session}
              onValidate={() => {
                setSession('done');
                setToast('Séance validée');
              }}
              onPostpone={() => setSession('postponed')}
              onUndo={() => setSession('planned')}
            />
            {session !== 'planned' ? <Button variant="secondary" label="Revenir à « à faire »" onPress={() => setSession('planned')} /> : null}
            <SessionCard
              eyebrow="Ta première séance"
              title="20 minutes, marche et course"
              effort={{ level: 'neutral', label: 'Découverte' }}
              instruction="Alterne 1 minute de course et 2 minutes de marche."
              status="postponed"
              onValidate={noop}
              onPostpone={noop}
              onUndo={noop}
            />
          </Section>

          <Section title="ProposalCard">
            <ProposalCard
              context="Plan · semaine du 9 nov."
              title="Alléger la fin de semaine"
              rows={ROWS}
              rationale="Tu as dormi moins de six heures deux nuits de suite et ta dernière sortie était dure."
              verified
              source="ai"
              question={{
                prompt: 'Tu préfères garder samedi ou dimanche ?',
                choices: [
                  { id: 'sat', label: 'Samedi' },
                  { id: 'sun', label: 'Dimanche' },
                ],
                selected: proposalAnswer,
                onChoose: setProposalAnswer,
              }}
              status={applied ? 'applied' : 'pending'}
              onAccept={() => {
                setApplied(true);
                setToast('Plan modifié');
              }}
              onEdit={noop}
              onReject={noop}
            />
            {applied ? <Button variant="secondary" label="Revenir à « en attente »" onPress={() => setApplied(false)} /> : null}
            <ProposalCard
              context="Plan · samedi 14 nov."
              title="Sortie longue : 16 → 12 km"
              rows={ROWS.slice(1, 2)}
              rationale="Ta charge de la semaine dépasse ta moyenne habituelle."
              confidence="medium"
              source="device"
              status="applying"
              onAccept={noop}
              onEdit={noop}
            />
            <ProposalCard
              compact
              context="À décider"
              title="Sortie longue : 16 → 12 km"
              rows={ROWS.slice(1, 2)}
              rationale="Ta charge de la semaine dépasse ta moyenne habituelle."
              source="ai"
              status="pending"
              onAccept={noop}
              onEdit={noop}
            />
          </Section>

          <Section title="EmptyState">
            <EmptyState
              reason="noPlan"
              title="Pas encore de plan."
              body="Dis au coach ce que tu prépares, il te propose une semaine."
              primary={{ label: 'Créer mon plan avec le coach', onPress: noop }}
              secondary={{ label: 'Voir les modèles', onPress: noop }}
            />
            <EmptyState
              reason="firstSessions"
              title="Tes tendances arrivent bientôt."
              body="Il me faut quelques séances pour voir comment tu progresses."
              progress={{ remaining: 'Encore 2 séances', done: ['Footing du lundi', 'Marche rapide du mercredi'] }}
            />
          </Section>

          <Section title="UndoToast">
            <Button variant="secondary" label="Montrer le bandeau" onPress={() => setToast('Séance validée')} />
          </Section>

          <Section title="Squelette (useDelayedSkeleton)">
            <SkeletonDemo />
          </Section>
        </ScrollView>
      </SafeAreaView>
      <UndoToast
        visible={toast !== null}
        message={toast ?? ''}
        bottomInset={insets.bottom}
        onUndo={() => {
          setToast(null);
          setSession('planned');
          setApplied(false);
        }}
        onDismiss={() => setToast(null)}
      />
    </View>
  );
}

export default function GalleryScreen() {
  const system = useTheme().scheme;
  const [preview, setPreview] = useState<Preview>({ scheme: system });

  // Écran de dev uniquement : ne rend rien dans l'app livrée.
  if (!__DEV__) return null;

  return (
    <DesignPreviewProvider value={preview}>
      <Gallery preview={preview} setPreview={setPreview} />
    </DesignPreviewProvider>
  );
}

/**
 * EXCEPTION TEMPORAIRE — fichiers antérieurs au design system v3.1 (ADR-011).
 *
 * Ces fichiers utilisent encore NativeWind (`className`) et/ou des valeurs de style littérales.
 * Ils sont exemptés des règles `pulsefit/no-classname` et `pulsefit/no-literal-style` le temps
 * de leur migration vers src/design/, une étape à la fois (un écran et ses composants par étape).
 *
 * - Quand un fichier est migré, retirer sa ligne. Le test legacy-exceptions.test.js échoue si
 *   une exception ne sert plus, ou si un fichier listé n'existe plus.
 * - Ne jamais ajouter de ligne : un nouveau fichier suit les règles dès sa création.
 * - Quand la liste est vide : retirer NativeWind (babel, metro, tailwind.config.js, global.css,
 *   nativewind-env.d.ts), constants/theme.ts, src/ui/useTheme.ts et les polices héritées.
 */

const C = ['className'];
const L = ['literalStyle'];
const CL = ['className', 'literalStyle'];

const STEPS = {
  'Étape 1 — Accueil': {
    'components/dashboard/CoachWidget.tsx': CL,
    'components/dashboard/Ripples.tsx': C,
    'components/dashboard/WorkoutWidget.tsx': C,
  },
  'Étape 2 — Plan': {
    'components/sport/NoPlanCard.tsx': C,
    'components/sport/ProgramTimeline.tsx': CL,
    'components/sport/SessionDetail.tsx': C,
    'components/sport/WeekStrip.tsx': C,
    'components/sport/WorkoutCard.tsx': C,
    'src/modules/sport/SportPlan.tsx': C,
  },
  'Étape 4 — Suivi et détail d’activité': {
    'components/sport/ActivityDetail.tsx': C,
    'components/sport/ActivityHistory.tsx': C,
    'components/sport/ActivityRow.tsx': C,
    'components/sport/HeartRateChart.tsx': CL,
    'components/sport/HighlightLine.tsx': C,
    'components/sport/PaceCurve.tsx': CL,
    'components/sport/RouteMap.tsx': C,
    'components/sport/SplitsList.tsx': C,
    'src/modules/sport/SportDashboard.tsx': C,
  },
  'Étape 5 — Stats': {
    'src/modules/sport/SportTrendsCard.tsx': C,
    'src/ui/StatsPreview.tsx': C,
  },
  'Étape 6 — Courses': {
    'components/race/ConfirmRaceCard.tsx': C,
    'components/race/RaceDebriefBody.tsx': C,
    'components/race/RaceDebriefContent.tsx': C,
    'components/race/RaceInsightCards.tsx': C,
    'components/race/RacesSection.tsx': C,
    'components/race/TargetRace.tsx': C,
  },
  'Étape 7 — Profil': {
    'app/profile/modules.tsx': CL,
    'app/profile/[section].tsx': C,
    'components/profile/EditProfileModal.tsx': C,
    'components/profile/GoalSheet.tsx': C,
    'components/profile/MaxHrField.tsx': C,
    'components/profile/SettingRow.tsx': C,
  },
  'Étape 8 — Onboarding': {
  },
  'Étape 9 — Scan': {
  },
  'Étape 10 — Socle hérité (en dernier, quand plus aucun écran ne l’utilise)': {
    'app/+html.tsx': C,
    'app/+not-found.tsx': CL,
    'components/ui/AdviceCard.tsx': C,
    'components/ui/Card.tsx': CL,
    'components/ui/CardHalo.tsx': C,
    'components/ui/EmptyState.tsx': C,
    'components/ui/ErrorState.tsx': C,
    'components/ui/Glow.tsx': C,
    'components/ui/HoldToConfirmCard.tsx': CL,
    'components/ui/IconButton.tsx': C,
    'components/ui/Label.tsx': C,
    'components/ui/PrimaryButton.tsx': C,
    'components/ui/Screen.tsx': CL,
    'components/ui/Segmented.tsx': C,
    'components/ui/Stepper.tsx': C,
    'components/ui/Text.tsx': C,
    'constants/theme.ts': L,
    'src/ui/motion/FadeSlide.tsx': C,
    'src/ui/theme/tokens.ts': L,
  },
};

const entries = Object.values(STEPS).flatMap((files) => Object.entries(files));
const filesFor = (rule) => entries.filter(([, rules]) => rules.includes(rule)).map(([file]) => file);

module.exports = {
  STEPS,
  className: filesFor('className'),
  literalStyle: filesFor('literalStyle'),
};

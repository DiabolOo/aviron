import { CalendarDays, House, Sparkles, TrendingUp } from 'lucide-react-native';

/** Noms des routes de `(tabs)` : Semaine et Progrès sont des groupes, chacun avec sa pile. */
export const TAB_ICONS = {
  index: House,
  '(semaine)': CalendarDays,
  coach: Sparkles,
  '(progres)': TrendingUp,
} as const;

export const TAB_ORDER = ['index', '(semaine)', 'coach', '(progres)'] as const;

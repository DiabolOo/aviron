import { CalendarDays, House, Sparkles, TrendingUp } from 'lucide-react-native';

export const TAB_ICONS = {
  index: House,
  semaine: CalendarDays,
  coach: Sparkles,
  progres: TrendingUp,
} as const;

export const TAB_ORDER = ['index', 'semaine', 'coach', 'progres'] as const;

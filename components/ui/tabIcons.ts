import { Activity, BarChart3, CalendarDays, House, Sparkles } from 'lucide-react-native';

export const TAB_ICONS = {
  index: House,
  plan: CalendarDays,
  agent: Sparkles,
  suivi: Activity,
  stats: BarChart3,
} as const;

export const TAB_ORDER = ['index', 'plan', 'agent', 'suivi', 'stats'] as const;

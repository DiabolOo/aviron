import { Activity, CalendarDays, CircleUser, House, Sparkles } from 'lucide-react-native';

export const TAB_ICONS = {
  index: House,
  plan: CalendarDays,
  agent: Sparkles,
  suivi: Activity,
  moi: CircleUser,
} as const;

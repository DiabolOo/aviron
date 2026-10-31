import { Activity, CalendarDays, House, Sparkles, User } from 'lucide-react-native';

export const TAB_ICONS = {
  index: House,
  plan: CalendarDays,
  agent: Sparkles,
  suivi: Activity,
  moi: User,
} as const;

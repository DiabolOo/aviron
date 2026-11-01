import { Activity, Bike, Dumbbell, Footprints, Mountain, Waves } from 'lucide-react-native';

import type { ActivityType } from '@/src/core/types';

/** Une icône par sport (haltère pour la musculation), partagée par la liste et le détail. */
export const SPORT_ICONS: Record<ActivityType, typeof Footprints> = {
  run: Footprints,
  ride: Bike,
  walk: Mountain,
  swim: Waves,
  strength: Dumbbell,
  other: Activity,
};

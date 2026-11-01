import { router } from 'expo-router';
import { RefreshCcw } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { ActivityRow } from '@/components/sport/ActivityRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { Label } from '@/components/ui/Label';
import { Text } from '@/components/ui/Text';
import { formatDuration } from '@/src/core/format';
import { formatKmTotal } from '@/src/core/sportFormat';
import type { WeekSummary } from '@/src/core/sportWeek';
import type { StravaActivity } from '@/src/core/types';

type ActivityHistoryProps = {
  week: WeekSummary;
  activities: StravaActivity[];
  connected: boolean;
  lastActivityLabel?: string;
};

export function ActivityHistory({ week, activities, connected, lastActivityLabel }: ActivityHistoryProps) {
  return (
    <View className="mt-10">
      <View className="flex-row items-center justify-between">
        <Label>Activités</Label>
        {connected && week.count > 0 ? (
          <Text className="font-mono text-[13px] text-muted">
            {formatKmTotal(week.km)} · {formatDuration(week.durationMin)}
          </Text>
        ) : null}
      </View>

      {!connected ? (
        <Pressable
          onPress={() => router.navigate('/profile-section?id=connexions')}
          className="mt-3 rounded-3xl border border-dashed border-fg/15 p-5 active:opacity-70">
          <Text className="text-base font-semibold text-fg">Connecter Strava</Text>
          <Text className="mt-1 text-sm text-muted">Importe tes sorties depuis ton profil.</Text>
        </Pressable>
      ) : activities.length === 0 ? (
        <EmptyState
          className="mt-3"
          icon={RefreshCcw}
          title="Aucune activité synchronisée"
          description="Tes sorties apparaîtront ici après la prochaine synchro."
        />
      ) : (
        <View className="mt-2">
          {week.count === 0 ? (
            <View className="py-6">
              <Text className="text-base text-fg">Aucune séance cette semaine</Text>
              {lastActivityLabel ? (
                <Text className="mt-1 text-sm text-muted">Dernière activité : {lastActivityLabel}</Text>
              ) : null}
            </View>
          ) : (
            week.activities.map((activity, index) => (
              <ActivityRow key={activity.id} activity={activity} first={index === 0} />
            ))
          )}
          <Pressable
            onPress={() => router.push('/activities')}
            className="mt-2 items-center border-t border-fg/5 py-4 active:opacity-70">
            <Text className="text-sm font-medium text-fg">Voir tout l&apos;historique</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

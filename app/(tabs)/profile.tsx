import { router } from 'expo-router';
import { ChevronRight, Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { usePulseFitStore } from '@/lib/store';
import { MODULES } from '@/src/modules';
import { getEnabledModules } from '@/src/modules/registry';
import { useIsModuleEnabled } from '@/src/modules/useModules';
import { useTheme } from '@/src/ui/useTheme';

const THEME_LABEL = { system: 'Système', light: 'Clair', dark: 'Sombre' } as const;

type Row = { label: string; value: string; to?: string };

export default function ProfileScreen() {
  const { colors } = useTheme();
  const profile = usePulseFitStore((s) => s.profile);
  const updateProfile = usePulseFitStore((s) => s.updateProfile);
  const strava = usePulseFitStore((s) => s.stravaConnected);
  const watch = usePulseFitStore((s) => s.watchConnected);
  const theme = usePulseFitStore((s) => s.themePreference);
  const isEnabled = useIsModuleEnabled();
  const [editing, setEditing] = useState(false);
  const toggleable = MODULES.filter((m) => m.icon);
  const active = getEnabledModules(toggleable, isEnabled).length;

  const rows: Row[] = [
    { label: 'Modules', value: `${active} ${active > 1 ? 'actifs' : 'actif'}`, to: '/profile-modules' },
    { label: 'Objectifs', value: 'Poids, rythme', to: '/profile-section?id=objectifs' },
    {
      label: 'Connexions',
      value: strava || watch ? (strava ? 'Strava' : 'Montre') : 'Aucune',
      to: '/profile-section?id=connexions',
    },
    { label: 'Apparence', value: THEME_LABEL[theme], to: '/profile-section?id=apparence' },
    { label: 'Compte et données', value: 'Bientôt' },
  ];

  return (
    <Screen tone="plan">
      <View className="gap-3.5">
        <ProfileHeader title="Profil" backLabel="Accueil" backTo="/" />
        <Card className="flex-row items-center gap-4 p-5">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-chip">
            <Text className="text-[26px] font-bold text-fg">{profile.firstName.charAt(0).toUpperCase()}</Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text numberOfLines={1} className="text-[22px] font-bold text-fg">
              {profile.firstName}
            </Text>
            <Text numberOfLines={2} className="text-[15px] text-muted">
              {profile.goalLabel ? `Objectif : ${profile.goalLabel}` : 'Aucun objectif défini'}
            </Text>
          </View>
          <IconButton label="Modifier le profil" onPress={() => setEditing(true)}>
            <Pencil color={colors.fg} size={16} strokeWidth={1.8} />
          </IconButton>
        </Card>

        <Card className="px-5 py-1">
          {rows.map((row, i) => (
            <Pressable
              key={row.label}
              accessibilityRole="button"
              disabled={!row.to}
              onPress={() => row.to && router.navigate(row.to as never)}
              className={`min-h-14 flex-row items-center gap-3 py-3.5 active:opacity-60 ${
                i > 0 ? 'border-t border-fg/10' : ''
              } ${row.to ? '' : 'opacity-60'}`}>
              <Text className="flex-1 text-[18px] font-semibold text-fg">{row.label}</Text>
              <Text className="text-[16px] text-muted">{row.value}</Text>
              {row.to ? <ChevronRight color={colors.muted} size={20} strokeWidth={2} /> : null}
            </Pressable>
          ))}
        </Card>
      </View>
      <EditProfileModal
        visible={editing}
        profile={profile}
        onClose={() => setEditing(false)}
        onSave={updateProfile}
      />
    </Screen>
  );
}

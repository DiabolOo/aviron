import { Switch, View } from 'react-native';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { usePulseFitStore } from '@/lib/store';
import { MODULES } from '@/src/modules';
import { useIsModuleEnabled } from '@/src/modules/useModules';
import { useTheme } from '@/src/ui/useTheme';

export default function ProfileModulesScreen() {
  const { colors } = useTheme();
  const isEnabled = useIsModuleEnabled();
  const setModuleFlag = usePulseFitStore((s) => s.setModuleFlag);
  const modules = MODULES.filter((m) => m.icon);
  const enabledCount = modules.filter(isEnabled).length;

  return (
    <Screen tone="plan">
      <View className="gap-3.5">
        <ProfileHeader title="Modules" backLabel="Profil" backTo="/profile" />
        <Text className="px-0.5 text-[16px] leading-[22px] text-muted">
          Choisis ce qui t’intéresse. Modifiable à tout moment.
        </Text>
        <Card className="px-5 py-1">
          {modules.map((module, i) => {
            const on = isEnabled(module);
            const color = colors[module.color ?? 'sport'];
            return (
              <View
                key={module.id}
                className={`min-h-[68px] flex-row items-center gap-3.5 py-3.5 ${
                  i > 0 ? 'border-t border-fg/10' : ''
                }`}>
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                <View className="min-w-0 flex-1 gap-0.5">
                  <Text className="text-[18px] font-semibold text-fg">{module.title}</Text>
                  {module.description ? (
                    <Text className="text-[14px] text-muted">{module.description}</Text>
                  ) : null}
                </View>
                <Switch
                  accessibilityLabel={`Module ${module.title}`}
                  value={on}
                  onValueChange={(value) => setModuleFlag(module.id, value)}
                  trackColor={{ false: colors.track, true: color }}
                  thumbColor="#FFFFFF"
                />
              </View>
            );
          })}
          <View className="min-h-[68px] flex-row items-center gap-3.5 border-t border-fg/10 py-3.5 opacity-70">
            <View className="h-3 w-3 rounded-full bg-track" />
            <View className="min-w-0 flex-1 gap-0.5">
              <Text className="text-[18px] font-semibold text-fg">Agenda</Text>
              <Text className="text-[14px] text-muted">Rendez-vous et habitudes</Text>
            </View>
            <View className="rounded-xl bg-chip px-2.5 py-1">
              <Text className="text-[14px] font-semibold text-muted">Bientôt</Text>
            </View>
          </View>
        </Card>
        <Text className="px-1 text-[15px] leading-[21px] text-muted">
          {enabledCount <= 1
            ? 'Un seul module actif : les sélecteurs disparaissent de Plan et Suivi, l’Accueil ne montre que lui.'
            : 'Désactiver un module masque ses écrans sans supprimer tes données.'}
        </Text>
      </View>
    </Screen>
  );
}

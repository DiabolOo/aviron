import { Sparkles } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Label } from '@/components/ui/Label';
import { useTheme } from '@/src/ui/useTheme';

export function BriefPlaceholder() {
  const { colors } = useTheme();

  return (
    <View className="mt-10 flex-row items-center gap-4 rounded-3xl border border-dashed border-fg/15 p-5">
      <Sparkles color={colors.muted} size={20} strokeWidth={1.8} />
      <View className="flex-1">
        <Label>Brief du jour</Label>
        <Text className="mt-1 text-sm text-muted">Ton brief IA apparaîtra ici chaque matin.</Text>
      </View>
    </View>
  );
}

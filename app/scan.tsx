import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { View } from 'react-native';

import { AnalyzingState } from '@/components/scan/AnalyzingState';
import { CapturePane } from '@/components/scan/CapturePane';
import { MealResultCard } from '@/components/scan/MealResultCard';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { usePulseFitStore } from '@/lib/store';
import { useTheme } from '@/lib/useTheme';

export default function ScanScreen() {
  const { colors } = useTheme();
  const scanStep = usePulseFitStore((s) => s.scanStep);
  const pendingMeal = usePulseFitStore((s) => s.pendingMeal);
  const analyzePhoto = usePulseFitStore((s) => s.analyzePhoto);
  const savePendingMeal = usePulseFitStore((s) => s.savePendingMeal);
  const discardPendingMeal = usePulseFitStore((s) => s.discardPendingMeal);

  const close = () => {
    discardPendingMeal();
    router.back();
  };

  const save = () => {
    savePendingMeal();
    router.back();
  };

  const showResult = scanStep === 'result' && pendingMeal;

  return (
    <Screen scroll={Boolean(showResult)} withSafeBottom>
      <View className="flex-row justify-end">
        <IconButton label="Fermer" onPress={close}>
          <X color={colors.fg} size={18} strokeWidth={1.8} />
        </IconButton>
      </View>
      {scanStep === 'analyzing' ? (
        <AnalyzingState />
      ) : showResult ? (
        <MealResultCard meal={pendingMeal} onSave={save} onRetry={discardPendingMeal} />
      ) : (
        <CapturePane onCapture={(uri) => void analyzePhoto(uri)} />
      )}
    </Screen>
  );
}

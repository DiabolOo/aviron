import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { View } from 'react-native';

import { AnalyzingState } from '@/components/scan/AnalyzingState';
import { CapturePane } from '@/components/scan/CapturePane';
import { MealResultCard } from '@/components/scan/MealResultCard';
import { ErrorState } from '@/components/ui/ErrorState';
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

  const save = (saveAsRecipe: boolean) => {
    savePendingMeal(saveAsRecipe);
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
      ) : scanStep === 'error' ? (
        <ErrorState
          className="mt-10"
          title="Analyse impossible"
          description="La photo n'a pas pu être analysée. Réessaie avec une assiette bien éclairée."
          onRetry={discardPendingMeal}
        />
      ) : showResult ? (
        <MealResultCard meal={pendingMeal} onSave={save} onRetry={discardPendingMeal} />
      ) : (
        <CapturePane onCapture={(uri) => void analyzePhoto(uri)} />
      )}
    </Screen>
  );
}

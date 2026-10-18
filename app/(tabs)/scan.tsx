import { AnalyzingState } from '@/components/scan/AnalyzingState';
import { CapturePane } from '@/components/scan/CapturePane';
import { MealResultCard } from '@/components/scan/MealResultCard';
import { Screen } from '@/components/ui/Screen';
import { usePulseFitStore } from '@/lib/store';

export default function ScanScreen() {
  const scanStep = usePulseFitStore((s) => s.scanStep);
  const pendingMeal = usePulseFitStore((s) => s.pendingMeal);
  const analyzePhoto = usePulseFitStore((s) => s.analyzePhoto);
  const savePendingMeal = usePulseFitStore((s) => s.savePendingMeal);
  const discardPendingMeal = usePulseFitStore((s) => s.discardPendingMeal);

  if (scanStep === 'analyzing') {
    return (
      <Screen scroll={false}>
        <AnalyzingState />
      </Screen>
    );
  }

  if (scanStep === 'result' && pendingMeal) {
    return (
      <Screen>
        <MealResultCard meal={pendingMeal} onSave={savePendingMeal} onRetry={discardPendingMeal} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <CapturePane onCapture={(uri) => void analyzePhoto(uri)} />
    </Screen>
  );
}

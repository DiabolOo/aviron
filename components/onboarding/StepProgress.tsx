import { View } from 'react-native';

type StepProgressProps = {
  step: number;
  total: number;
};

export function StepProgress({ step, total }: StepProgressProps) {
  return (
    <View className="h-2 flex-1 flex-row gap-1.5">
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          className={`h-2 flex-1 rounded-full ${index <= step ? 'bg-accent' : 'bg-fg/10'}`}
        />
      ))}
    </View>
  );
}

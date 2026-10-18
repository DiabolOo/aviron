import { RotateCcw, TriangleAlert } from 'lucide-react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { useTheme } from '@/lib/useTheme';

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
  className?: string;
};

export function ErrorState({
  title = 'Une erreur est survenue',
  description,
  onRetry,
  retryLabel = 'Réessayer',
  compact = false,
  className = '',
}: ErrorStateProps) {
  const { colors } = useTheme();

  return (
    <EmptyState
      icon={TriangleAlert}
      title={title}
      description={description}
      compact={compact}
      className={className}
      action={
        onRetry
          ? {
              label: retryLabel,
              onPress: onRetry,
              variant: 'primary',
              icon: <RotateCcw color={colors.accentFg} size={16} strokeWidth={2} />,
            }
          : undefined
      }
    />
  );
}

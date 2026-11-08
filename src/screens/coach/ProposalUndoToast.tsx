import { useProposalStore } from '@/lib/proposalStore';
import { UndoToast } from '@/src/ui/UndoToast';
import { useTabBarInset } from '@/src/ui/useTabBarInset';

/** Bandeau « Annuler » (5 s) après l'application d'une proposition, sur tous les onglets. */
export function ProposalUndoToast() {
  const lastResolved = useProposalStore((s) => s.lastResolved);
  const undo = useProposalStore((s) => s.undo);
  const dismiss = useProposalStore((s) => s.dismissToast);
  const inset = useTabBarInset();

  return (
    <UndoToast
      visible={lastResolved !== null}
      message={lastResolved ? `Appliqué : ${lastResolved.label}` : ''}
      onUndo={() => lastResolved && void undo(lastResolved.id)}
      onDismiss={dismiss}
      bottomInset={inset}
    />
  );
}

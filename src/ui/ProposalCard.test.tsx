import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { ProposalCard, QUESTION_PENDING_REASON, type ProposalCardProps } from '@/src/ui/ProposalCard';
import { withPreview } from '@/src/ui/v3-test-utils';

const base = (over: Partial<ProposalCardProps> = {}): ProposalCardProps => ({
  context: 'Plan · semaine du 9 nov.',
  title: 'Alléger la fin de semaine',
  rows: [
    { day: 'Sam. 14', before: 'Sortie longue 16 km', after: 'Sortie longue 12 km' },
    { day: 'Dim. 15', after: 'Repos' },
  ],
  rationale: 'Ta dernière sortie était dure.',
  source: 'ai',
  status: 'pending',
  onAccept: jest.fn(),
  onEdit: jest.fn(),
  ...over,
});

function WithQuestion({ onAccept }: { onAccept: () => void }) {
  const [selected, setSelected] = useState<string>();
  return (
    <ProposalCard
      {...base({ onAccept })}
      question={{
        prompt: 'Samedi ou dimanche ?',
        choices: [
          { id: 'sat', label: 'Samedi' },
          { id: 'sun', label: 'Dimanche' },
        ],
        selected,
        onChoose: setSelected,
      }}
    />
  );
}

describe('ProposalCard', () => {
  it('en attente : tableau avant / après sur plusieurs jours, « Rien de prévu » pour une création', async () => {
    await render(withPreview({ fontScale: 1 }, <ProposalCard {...base({ verified: true })} />));
    expect(screen.getByText('Sortie longue 16 km')).toBeTruthy();
    expect(screen.getByText('Sortie longue 12 km')).toBeTruthy();
    expect(screen.getByText('Rien de prévu')).toBeTruthy();
    expect(screen.getByTestId('proposal-footnote').props.children).toBe('Vérifié par le plan · Rédigé par l’IA');
  });

  it('texte agrandi à 1,3 : avant et après s’empilent par jour', async () => {
    await render(withPreview({ fontScale: 1.3 }, <ProposalCard {...base()} />));
    expect(screen.getByText('Avant : Sortie longue 16 km')).toBeTruthy();
    expect(screen.getByText('Avant : Rien de prévu')).toBeTruthy();
    expect(screen.getByText('Après : Repos')).toBeTruthy();
  });

  it('Valider et Modifier appellent leurs callbacks', async () => {
    const p = base();
    await render(<ProposalCard {...p} />);
    await fireEvent.press(screen.getByText('Valider'));
    await fireEvent.press(screen.getByText('Modifier'));
    expect(p.onAccept).toHaveBeenCalled();
    expect(p.onEdit).toHaveBeenCalled();
  });

  it('question sans réponse : Valider désactivé et dit pourquoi ; répondre le réactive', async () => {
    const onAccept = jest.fn();
    await render(<WithQuestion onAccept={onAccept} />);
    const accept = screen.getByTestId('proposal-accept');
    expect(accept.props.accessibilityState.disabled).toBe(true);
    expect(accept.props.accessibilityHint).toBe(QUESTION_PENDING_REASON);
    await fireEvent.press(accept);
    expect(onAccept).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText('Dimanche'));
    expect(screen.getByTestId('proposal-accept').props.accessibilityState.disabled).toBe(false);
    expect(screen.getByTestId('proposal-accept').props.accessibilityHint).toBeUndefined();
    await fireEvent.press(screen.getByTestId('proposal-accept'));
    expect(onAccept).toHaveBeenCalled();
  });

  it('confiance affichée en mots seulement si elle n’est pas haute', async () => {
    await render(<ProposalCard {...base({ confidence: 'medium', source: 'device' })} />);
    expect(screen.getByTestId('proposal-footnote').props.children).toBe('Confiance moyenne · Calculé sur ton téléphone');
  });

  it('en cours d’application : boutons indisponibles', async () => {
    await render(<ProposalCard {...base({ status: 'applying' })} />);
    expect(screen.getByTestId('proposal-accept').props.accessibilityState).toEqual({ disabled: true, busy: true });
  });

  it('appliquée : repliée en une ligne', async () => {
    await render(<ProposalCard {...base({ status: 'applied' })} />);
    expect(screen.getByText('Appliqué : Alléger la fin de semaine')).toBeTruthy();
    expect(screen.queryByText('Valider')).toBeNull();
  });

  it('compacte : sans tableau, avec la source', async () => {
    await render(<ProposalCard {...base({ compact: true })} />);
    expect(screen.getByTestId('proposal-compact')).toBeTruthy();
    expect(screen.queryByText('Sortie longue 16 km')).toBeNull();
    expect(screen.getByTestId('proposal-footnote').props.children).toBe('Rédigé par l’IA');
  });
});

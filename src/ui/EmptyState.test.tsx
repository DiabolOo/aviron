import { fireEvent, render, screen } from '@testing-library/react-native';

import { EmptyState } from '@/src/ui/EmptyState';

jest.mock('lucide-react-native', () => ({ Check: () => null }));

describe('EmptyState', () => {
  it('noPlan : phrase, sous-phrase, « Créer mon plan avec le coach »', async () => {
    const onPress = jest.fn();
    await render(
      <EmptyState
        reason="noPlan"
        title="Pas encore de plan."
        body="Dis au coach ce que tu prépares."
        primary={{ label: 'Créer mon plan avec le coach', onPress }}
      />,
    );
    expect(screen.getByTestId('empty-noPlan')).toBeTruthy();
    await fireEvent.press(screen.getByText('Créer mon plan avec le coach'));
    expect(onPress).toHaveBeenCalled();
  });

  it('firstSessions : des cercles (pleins = faites) et « Encore N séances », sans « 0 » ni graphique (211)', async () => {
    await render(
      <EmptyState
        reason="firstSessions"
        title="Ta progression arrive."
        body="À la troisième séance, je te montre ta régularité."
        progress={{ remaining: 'Encore 2 séances', done: ['Footing du lundi'], total: 3 }}
      />,
    );
    expect(screen.getByText('Encore 2 séances')).toBeTruthy();
    expect(screen.getByLabelText('Fait : Footing du lundi')).toBeTruthy();
    expect(screen.getAllByTestId('day-dot-done')).toHaveLength(1);
    expect(screen.getAllByTestId('day-dot-empty')).toHaveLength(2);
    expect(screen.queryByText(/\b0\b/)).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('noImport : deux boutons empilés, la légende sous les boutons (109)', async () => {
    await render(
      <EmptyState
        reason="noImport"
        title="Rien d’importé cette semaine."
        body="Soit tu as fait une pause, soit tu as couru sans rien enregistrer."
        primary={{ label: 'J’ai couru sans montre', onPress: jest.fn() }}
        secondary={{ label: 'C’était une pause', onPress: jest.fn() }}
        caption="« Sans montre » ouvre le coach."
      />,
    );
    expect(screen.getByText('« Sans montre » ouvre le coach.')).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
});

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

  it('firstSessions : « Encore N séances » et ce qui est déjà fait, sans « 0 » ni graphique', async () => {
    await render(
      <EmptyState
        reason="firstSessions"
        title="Tes tendances arrivent bientôt."
        body="Il me faut quelques séances."
        progress={{ remaining: 'Encore 2 séances', done: ['Footing du lundi'] }}
      />,
    );
    expect(screen.getByText('Encore 2 séances')).toBeTruthy();
    expect(screen.getByLabelText('Fait : Footing du lundi')).toBeTruthy();
    expect(screen.queryByText(/\b0\b/)).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

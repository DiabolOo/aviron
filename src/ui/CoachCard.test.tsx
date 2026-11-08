import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { colors } from '@/src/design';
import { COACH_SOURCE_LABEL, CoachCard, type CoachSource } from '@/src/ui/CoachCard';

jest.mock('lucide-react-native', () => ({ Check: () => null, Sparkles: () => null }));

const CHOICES = [
  { id: 'easy', label: 'Facile', effort: 'easy' as const },
  { id: 'hard', label: 'Dur', effort: 'hard' as const },
];

function Question() {
  const [selected, setSelected] = useState<string>();
  return <CoachCard kind="question" source="device" body="Comment c’était ?" choices={CHOICES} selected={selected} onChoose={setSelected} />;
}

describe('CoachCard', () => {
  it('constat : libellé, verdict, explication', async () => {
    await render(<CoachCard kind="insight" source="device" verdict="Tu progresses." body="Dix secondes gagnées." />);
    expect(screen.getByText('Ton coach')).toBeTruthy();
    expect(screen.getByText('Tu progresses.')).toBeTruthy();
    expect(screen.getByText('Dix secondes gagnées.')).toBeTruthy();
  });

  it('conseil : action facultative', async () => {
    const onPress = jest.fn();
    await render(<CoachCard kind="advice" source="ai" verdict="Reste calme." body="Allure facile." action={{ label: 'Voir', onPress }} />);
    await fireEvent.press(screen.getByText('Voir'));
    expect(onPress).toHaveBeenCalled();
  });

  it('question : la puce choisie reste affichée, sur le fond de son effort, et une autre se touche encore (215)', async () => {
    await render(<Question />);
    await fireEvent.press(screen.getByText('Dur'));
    expect(screen.getByTestId('choice-hard').props.accessibilityState).toEqual({ checked: true });
    expect(StyleSheet.flatten(screen.getByTestId('choice-hard').props.style).backgroundColor).toBe(colors.light.effortHardSurface);
    expect(screen.getByText('Facile')).toBeTruthy();
    await fireEvent.press(screen.getByText('Facile'));
    expect(screen.getByTestId('choice-easy').props.accessibilityState).toEqual({ checked: true });
    expect(screen.getByTestId('choice-hard').props.accessibilityState).toEqual({ checked: false });
  });

  it('question : début de phrase en semibold, légende, pas de libellé « Ton coach » par défaut (107, 108)', async () => {
    await render(
      <CoachCard
        kind="question"
        source="device"
        showSource={false}
        lead="Je vois ton allure, pas ton effort."
        body="Comment tu l’as sentie ?"
        caption="Facultatif · ça m’aide."
        choices={CHOICES}
        onChoose={jest.fn()}
      />,
    );
    expect(screen.getByText('Je vois ton allure, pas ton effort.')).toBeTruthy();
    expect(screen.getByText('Facultatif · ça m’aide.')).toBeTruthy();
    expect(screen.queryByText('Ton coach')).toBeNull();
    expect(screen.queryByTestId('coach-source')).toBeNull();
  });

  it('showSource={false} : la ligne de source disparaît, sauf pour un texte rédigé par l’IA', async () => {
    const { unmount } = await render(<CoachCard kind="insight" source="device" showSource={false} verdict="V" />);
    expect(screen.queryByTestId('coach-source')).toBeNull();
    await unmount();
    await render(<CoachCard kind="insight" source="ai" showSource={false} verdict="V" />);
    expect(screen.getByTestId('coach-source').props.children).toBe('Rédigé par l’IA');
  });

  it('« Environ » : la cause est dite une fois', async () => {
    await render(<CoachCard kind="insight" source="device" verdict="25 km." body="Estimation." approxReason="deux sorties sans GPS" />);
    expect(screen.getByText('Environ : deux sorties sans GPS')).toBeTruthy();
  });

  it.each([
    ['ai', 'Rédigé par l’IA'],
    ['device', 'Calculé sur ton téléphone'],
    ['profile', 'Programme établi d’après ton profil'],
  ] as const)('la source %s est toujours affichée, dans chaque variante', async (source: CoachSource, label) => {
    expect(COACH_SOURCE_LABEL[source]).toBe(label);
    const { unmount } = await render(<CoachCard kind="insight" source={source} verdict="V" body="B" />);
    expect(screen.getByTestId('coach-source').props.children).toBe(label);
    await unmount();
    await render(<CoachCard kind="question" source={source} body="Q" choices={CHOICES} selected="easy" onChoose={jest.fn()} />);
    expect(screen.getByTestId('coach-source').props.children).toBe(label);
  });
});

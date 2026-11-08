import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { COACH_SOURCE_LABEL, CoachCard, type CoachSource } from '@/src/ui/CoachCard';

jest.mock('lucide-react-native', () => ({ Check: () => null, Sparkles: () => null }));

const CHOICES = [
  { id: 'easy', label: 'Facile' },
  { id: 'hard', label: 'Dur' },
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

  it('question : un tap répond, la carte se replie en « Noté : … », « Changer » rouvre les choix', async () => {
    await render(<Question />);
    await fireEvent.press(screen.getByText('Dur'));
    expect(screen.getByText('Noté : Dur')).toBeTruthy();
    expect(screen.queryByText('Facile')).toBeNull();
    await fireEvent.press(screen.getByText('Changer'));
    expect(screen.getByText('Facile')).toBeTruthy();
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

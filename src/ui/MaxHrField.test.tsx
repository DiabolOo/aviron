import { fireEvent, render, screen } from '@testing-library/react-native';

import { MaxHrField } from '@/components/profile/MaxHrField';

const input = () => screen.getByLabelText('FC max en bpm');

describe('MaxHrField', () => {
  it('enregistre une valeur valide', async () => {
    const onChange = jest.fn();
    await render(<MaxHrField onChange={onChange} />);
    await fireEvent.changeText(input(), '188');
    expect(onChange).toHaveBeenCalledWith(188);
    expect(screen.queryByText(/Entre 100 et 230/)).toBeNull();
  });

  it('refuse une valeur hors 100–230 et affiche l’erreur', async () => {
    const onChange = jest.fn();
    await render(<MaxHrField onChange={onChange} />);
    await fireEvent.changeText(input(), '99');
    await fireEvent.changeText(input(), '231');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Entre 100 et 230 bpm')).toBeTruthy();
  });

  it('ne touche pas à la valeur enregistrée pendant la frappe incomplète', async () => {
    const onChange = jest.fn();
    await render(<MaxHrField value={190} onChange={onChange} />);
    await fireEvent.changeText(input(), '1');
    await fireEvent.changeText(input(), '17');
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent.changeText(input(), '175');
    expect(onChange).toHaveBeenLastCalledWith(175);
  });

  it('filtre les caractères non numériques', async () => {
    const onChange = jest.fn();
    await render(<MaxHrField onChange={onChange} />);
    await fireEvent.changeText(input(), '1a8,x');
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent.changeText(input(), '1x9y0');
    expect(onChange).toHaveBeenCalledWith(190);
  });

  it('« Auto » efface la saisie', async () => {
    const onChange = jest.fn();
    await render(<MaxHrField value={190} autoValue={185} onChange={onChange} />);
    await fireEvent.press(screen.getByLabelText('Revenir à la valeur automatique'));
    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(input().props.value).toBe('');
  });

  it('« Auto » n’apparaît que si une valeur est saisie', async () => {
    await render(<MaxHrField autoValue={185} onChange={jest.fn()} />);
    expect(screen.queryByLabelText('Revenir à la valeur automatique')).toBeNull();
    expect(input().props.placeholder).toBe('185');
  });
});

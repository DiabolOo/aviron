import { render, screen } from '@testing-library/react-native';

import { HeroMetric } from '@/src/ui/HeroMetric';
import { withPreview } from '@/src/ui/v3-test-utils';

const formatKm = (n: number) => n.toFixed(1).replace('.', ',');

describe('HeroMetric', () => {
  it('fade : valeur, unité, phrase et trio ; le lecteur d’écran lit la valeur finale', async () => {
    await render(
      <HeroMetric
        animate="fade"
        value="4:52"
        unit="/km"
        caption="sur le bloc principal"
        metrics={[
          { label: 'FC moyenne', value: '158', unit: 'bpm' },
          { label: 'Durée', value: '40:05' },
        ]}
      />,
    );
    expect(screen.getByTestId('hero-value').props.children).toBe('4:52');
    expect(screen.getByText('/km')).toBeTruthy();
    expect(screen.getByText('sur le bloc principal')).toBeTruthy();
    expect(screen.getByText('158 bpm')).toBeTruthy();
    expect(screen.getByTestId('hero-metric').props.accessibilityLabel).toBe(
      '4:52 /km, sur le bloc principal, FC moyenne : 158 bpm, Durée : 40:05',
    );
  });

  it('sans unité ni trio : la rangée n’est pas rendue', async () => {
    await render(<HeroMetric value="1h08" />);
    expect(screen.getByTestId('hero-metric').props.accessibilityLabel).toBe('1h08');
    expect(screen.queryByText('Durée')).toBeNull();
  });

  it('count : le libellé d’accessibilité est la valeur finale dès le montage', async () => {
    await render(<HeroMetric animate="count" countTo={42.5} format={formatKm} value="42,5" unit="km" />);
    expect(screen.getByTestId('hero-metric').props.accessibilityLabel).toBe('42,5 km');
  });

  it('count avec « réduire les animations » : valeur finale affichée tout de suite', async () => {
    await render(
      withPreview({ reduceMotion: true }, <HeroMetric animate="count" countTo={42.5} format={formatKm} value="42,5" unit="km" />),
    );
    expect(screen.getByTestId('hero-value').props.children).toBe('42,5');
  });

  it('count : démarre à 0 et finit sur la valeur exacte', async () => {
    jest.useFakeTimers();
    await render(<HeroMetric animate="count" countTo={42.5} format={formatKm} value="42,5" />);
    expect(screen.getByTestId('hero-value').props.children).toBe('0,0');
    await jest.advanceTimersByTimeAsync(1000);
    expect(screen.getByTestId('hero-value').props.children).toBe('42,5');
    jest.useRealTimers();
  });
});

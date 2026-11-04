import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors, typography } from '@/src/design';
import { Text } from '@/src/ui/Text';
import { withPreview } from '@/src/ui/v3-test-utils';

const flat = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style);

describe('Text', () => {
  it.each(Object.keys(typography) as (keyof typeof typography)[])('rôle %s : taille et interligne du thème', async (role) => {
    await render(
      <Text role={role} testID="t">
        Phrase
      </Text>,
    );
    expect(flat('t').fontSize).toBe(typography[role].fontSize);
    expect(flat('t').lineHeight).toBe(typography[role].lineHeight);
    expect(screen.getByTestId('t').props.maxFontSizeMultiplier).toBe(typography[role].maxFontSizeMultiplier ?? undefined);
  });

  it('graisse par famille de police, couleur de la palette (encre par défaut)', async () => {
    await render(
      <>
        <Text role="body" weight="semibold" testID="a">
          A
        </Text>
        <Text role="sub" color="inkSecondary" testID="b">
          B
        </Text>
      </>,
    );
    expect(flat('a').fontFamily).toBe('Inter_600SemiBold');
    expect(flat('a').color).toBe(colors.light.ink);
    expect(flat('b').fontFamily).toBe('Inter_400Regular');
    expect(flat('b').color).toBe(colors.light.inkSecondary);
  });

  it('un plafond d’usage plus strict l’emporte sur celui du rôle', async () => {
    await render(
      <Text role="title" cap={1.2} testID="t">
        Titre
      </Text>,
    );
    expect(screen.getByTestId('t').props.maxFontSizeMultiplier).toBe(1.2);
  });

  it('texte agrandi forcé : taille multipliée, plafonnée par le rôle, sans double agrandissement système', async () => {
    await render(
      withPreview(
        { fontScale: 1.3 },
        <>
          <Text role="body" testID="body">
            Corps
          </Text>
          <Text role="hero" weight="semibold" testID="hero">
            42
          </Text>
        </>,
      ),
    );
    expect(flat('body').fontSize).toBeCloseTo(17 * 1.3);
    expect(flat('hero').fontSize).toBeCloseTo(64 * 1.25);
    expect(screen.getByTestId('body').props.allowFontScaling).toBe(false);
  });
});

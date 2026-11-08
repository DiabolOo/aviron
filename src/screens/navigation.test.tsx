/**
 * Routes de l'amendement v3.4 de l'ADR-012 : le détail, la semaine passée et le débrief
 * s'empilent dans l'onglet (Semaine ou Progrès), barre d'onglets visible.
 * Les écrans sont remplacés par des bouchons ; la pile partagée est la vraie.
 */
import { router, Stack, Tabs } from 'expo-router';
import { act, renderRouter, screen, testRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import * as TabStackLayout from '@/app/(tabs)/(semaine,progres)/_layout';

// `expo-router/testing-library` remplace le mock de Reanimated dont dépendent les tokens.
jest.mock('@/src/design', () => ({ useTheme: () => ({ colors: {} }) }));

function stub(label: string) {
  return function Stub() {
    return <Text>{label}</Text>;
  };
}

function routes() {
  return {
    _layout: () => <Stack screenOptions={{ headerShown: false }} />,
    '(tabs)/_layout': () => (
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="(semaine)" />
        <Tabs.Screen name="coach" />
        <Tabs.Screen name="(progres)" />
      </Tabs>
    ),
    '(tabs)/index': stub('Aujourd’hui'),
    '(tabs)/coach': stub('Coach'),
    '(tabs)/(semaine,progres)/_layout': TabStackLayout,
    '(tabs)/(semaine,progres)/activity/[id]': stub('Détail'),
    '(tabs)/(semaine,progres)/activity/[id]/debrief': stub('Débrief'),
    '(tabs)/(semaine)/semaine': stub('Semaine'),
    '(tabs)/(semaine)/week/[start]': stub('Semaine passée'),
    '(tabs)/(progres)/progres': stub('Progrès'),
    'profile/index': stub('Profil'),
  };
}

describe('Routes de l’amendement v3.4 (ADR-012)', () => {
  it('chaque onglet garde son URL', async () => {
    await renderRouter(routes(), { initialUrl: '/semaine' });
    expect(screen).toHavePathname('/semaine');
    await testRouter.navigate('/progres');
    expect(screen.getByText('Progrès')).toBeTruthy();
  });

  it('le détail s’empile dans Semaine, au-dessus de la semaine', async () => {
    await renderRouter(routes(), { initialUrl: '/semaine' });
    await act(async () => router.push('/(tabs)/(semaine)/activity/a1'));
    expect(screen).toHavePathname('/activity/a1');
    expect(screen).toHaveSegments(['(tabs)', '(semaine)', 'activity', '[id]']);
    await testRouter.back('/semaine');
  });

  it('depuis Aujourd’hui, le détail passe par l’onglet Semaine', async () => {
    await renderRouter(routes(), { initialUrl: '/' });
    await act(async () => router.push('/(tabs)/(semaine)/activity/a1'));
    expect(screen).toHaveSegments(['(tabs)', '(semaine)', 'activity', '[id]']);
  });

  it('la semaine passée s’empile dans Semaine', async () => {
    await renderRouter(routes(), { initialUrl: '/semaine' });
    await act(async () => router.push('/(tabs)/(semaine)/week/2026-10-26'));
    expect(screen).toHaveSegments(['(tabs)', '(semaine)', 'week', '[start]']);
    expect(screen).toHaveSearchParams({ start: '2026-10-26' });
    await testRouter.back('/semaine');
  });

  it('le débrief s’empile dans Progrès et y ramène', async () => {
    await renderRouter(routes(), { initialUrl: '/progres' });
    await act(async () => router.push('/(tabs)/(progres)/activity/s1/debrief'));
    expect(screen).toHaveSegments(['(tabs)', '(progres)', 'activity', '[id]', 'debrief']);
    expect(screen.getByText('Débrief')).toBeTruthy();
    await testRouter.back('/progres');
  });
});

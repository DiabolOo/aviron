import { openActivity, openDebrief, openWeek, resetNavLock } from '@/src/ui/nav';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

beforeEach(() => {
  mockPush.mockClear();
  resetNavLock();
  jest.restoreAllMocks();
});

describe('Navigation vers un détail', () => {
  it('3 taps rapides → une seule page dans la pile', () => {
    openActivity('a1');
    openActivity('a1');
    openActivity('a1');
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/(semaine)/activity/a1');
  });

  it('taps sur deux activités différentes dans la fenêtre : seul le premier compte', () => {
    openActivity('a25');
    openActivity('a26');
    openActivity('a25');
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/(semaine)/activity/a25');
  });

  it('un tap après plus d’1 s navigue à nouveau', () => {
    let now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    openActivity('a1');
    now += 1001;
    openActivity('a2');
    expect(mockPush).toHaveBeenCalledTimes(2);
    expect(mockPush).toHaveBeenLastCalledWith('/(tabs)/(semaine)/activity/a2');
  });
});

describe('Écrans empilés dans un onglet (ADR-012, amendement v3.4)', () => {
  it('le détail s’empile dans l’onglet demandé', () => {
    openActivity('a1', 'progres');
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/(progres)/activity/a1');
  });

  it('la semaine passée s’empile dans Semaine', () => {
    openWeek('2026-10-26');
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/(semaine)/week/2026-10-26');
  });

  it('le débrief s’empile dans Progrès', () => {
    openDebrief('s1');
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/(progres)/activity/s1/debrief');
  });
});

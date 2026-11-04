import { act, renderHook } from '@testing-library/react-native';

import { useDelayedSkeleton } from '@/src/ui/useDelayedSkeleton';

const advance = (ms: number) => act(async () => void jest.advanceTimersByTime(ms));

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('useDelayedSkeleton', () => {
  it('chargement de 200 ms : aucun squelette', async () => {
    const seen: boolean[] = [];
    const { rerender } = await renderHook(({ loading }: { loading: boolean }) => {
      const v = useDelayedSkeleton(loading);
      seen.push(v);
      return v;
    }, { initialProps: { loading: true } });
    await advance(200);
    await rerender({ loading: false });
    await advance(1000);
    expect(seen.every((v) => !v)).toBe(true);
  });

  it('chargement de 350 ms : affiché à 300 ms et pendant au moins 300 ms', async () => {
    const { result, rerender } = await renderHook(({ loading }: { loading: boolean }) => useDelayedSkeleton(loading), {
      initialProps: { loading: true },
    });
    await advance(299);
    expect(result.current).toBe(false);
    await advance(1);
    expect(result.current).toBe(true);
    await advance(50);
    await rerender({ loading: false });
    await advance(249);
    expect(result.current).toBe(true);
    await advance(1);
    expect(result.current).toBe(false);
  });
});

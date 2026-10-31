import { create } from 'zustand';

import type { StatsPeriod } from '@/src/core/stats';

type PeriodState = { period: StatsPeriod; setPeriod: (period: StatsPeriod) => void };

export const useStatsPeriod = create<PeriodState>()((set) => ({
  period: 'month',
  setPeriod: (period) => set({ period }),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

import { ProposalSchema, type Proposal } from '@/src/core/schemas';
import type { IProposalRepository } from '@/src/data/repositories/IProposalRepository';

const KEY = 'pf:proposals';

export class LocalProposalRepository implements IProposalRepository {
  private async loadAll(): Promise<Proposal[]> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr: unknown[] = JSON.parse(raw);
    return arr.flatMap((item) => {
      const r = ProposalSchema.safeParse(item);
      return r.success ? [r.data] : [];
    });
  }

  private async saveAll(proposals: Proposal[]): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(proposals));
  }

  async list(): Promise<Proposal[]> {
    return this.loadAll();
  }

  async upsert(proposal: Proposal): Promise<void> {
    const all = await this.loadAll();
    const idx = all.findIndex((p) => p.id === proposal.id);
    if (idx >= 0) {
      all[idx] = proposal;
    } else {
      all.push(proposal);
    }
    await this.saveAll(all);
  }

  async remove(id: string): Promise<void> {
    const all = await this.loadAll();
    await this.saveAll(all.filter((p) => p.id !== id));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  }
}

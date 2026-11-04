import { ProfileSchema } from '@/src/core/schemas';
import type { LifeModule } from '@/src/modules/types';

export const profileModule: LifeModule = {
  id: 'profile',
  title: 'Profil',
  enabledByDefault: true,
  entities: [ProfileSchema],
  todayWidgets: [],
  agentTools: [
    {
      name: 'get_profile',
      description: 'Profil utilisateur résumé (sans identifiants)',
      access: 'read',
    },
  ],
  analyzers: [],
};

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import { useProposalStore } from '@/lib/proposalStore';
import { usePulseFitStore } from '@/lib/store';
import { agent } from '@/src/agent';
import type { IntentResult } from '@/src/agent/types';
import type { Proposal } from '@/src/core/schemas';
import type { WorkoutSession } from '@/src/core/types';
import { motion } from '@/src/design';
import { useAgentDraft } from '@/src/ui/agentDraft';

import { CoachScreen } from './CoachScreen';
import { FALLBACK_NOTICE, LOCAL_ONLY } from './coachFlow';
import { useConversation } from './conversationStore';
import { ProposalUndoToast } from './ProposalUndoToast';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), navigate: jest.fn() } }));
jest.mock('lucide-react-native', () => ({ ArrowUp: () => null, X: () => null, Check: () => null, Sparkles: () => null }));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/src/agent', () => {
  const { MockAgent } = jest.requireActual('@/src/agent/MockAgent');
  const real = new MockAgent();
  return {
    agent: {
      isModel: false,
      interpretIntent: jest.fn((text: string, ctx: unknown) => real.interpretIntent(text, ctx)),
      analyzePlate: jest.fn(),
      getPendingProposals: jest.fn(),
    },
  };
});

const model = agent as unknown as { isModel: boolean; interpretIntent: jest.Mock };
const realReply = model.interpretIntent.getMockImplementation();

const iso = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const session = (over: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: 'ws-1',
  date: iso(1),
  title: 'Sortie longue',
  kind: 'run',
  subtitle: '',
  durationMin: 90,
  caloriesBurn: 0,
  completed: false,
  ...over,
});

type Seed = { unavailable?: string[]; consent?: boolean; proposals?: Proposal[]; dataReady?: boolean; load?: () => Promise<void> };

function seed({ unavailable, consent = false, proposals = [], dataReady = true, load = async () => {} }: Seed = {}) {
  usePulseFitStore.setState((s) => ({
    dataReady,
    sessions: [session()],
    aiConsent: consent,
    profile: { ...s.profile, unavailableDates: unavailable },
  }));
  useProposalStore.setState({ proposals, loaded: true, lastResolved: null, load });
}

const mount = async () =>
  await render(
    <>
      <CoachScreen />
      <ProposalUndoToast />
    </>,
  );

async function ask(text: string) {
  await fireEvent.changeText(screen.getByLabelText('Message pour le coach'), text);
  await act(async () => {
    await fireEvent.press(screen.getByLabelText('Envoyer'));
  });
}

const isDisabled = (el: { props: { accessibilityState?: { disabled?: boolean } } }) =>
  Boolean(el.props.accessibilityState?.disabled);

beforeEach(() => {
  model.isModel = false;
  model.interpretIntent.mockReset();
  if (realReply) model.interpretIntent.mockImplementation(realReply);
  useConversation.getState().reset();
  useAgentDraft.setState({ text: '', context: null, nonce: 0 });
  seed();
});

describe('états', () => {
  it('chargement : squelette après le délai, titre « Coach »', async () => {
    seed({ dataReady: false });
    await mount();
    expect(await screen.findByTestId('coach-loading')).toBeTruthy();
    expect(screen.getByText('Coach')).toBeTruthy();
    expect(screen.getByTestId('screen-header')).toBeTruthy();
  });

  it('vide sans accord IA : le moteur du téléphone est présenté, sans manque ni « Ton agent »', async () => {
    await mount();
    expect(screen.getByTestId('empty-noAi')).toBeTruthy();
    expect(screen.queryByText('Ton agent')).toBeNull();
    expect(screen.queryByText('À décider')).toBeNull();
    expect(screen.queryByText(/Historique/)).toBeNull();
    expect(screen.getByText('Décale la sortie longue')).toBeTruthy();
    expect(screen.queryByText(/Prépare un semi/)).toBeNull();
  });

  it('vide avec accord IA : pas d’état provisoire, toutes les suggestions', async () => {
    seed({ consent: true });
    await mount();
    expect(screen.queryByTestId('empty-noAi')).toBeNull();
    expect(screen.getByText(/Prépare un semi/)).toBeTruthy();
  });

  it('erreur de chargement : message clair et nouvel essai', async () => {
    const load = jest.fn().mockRejectedValue(new Error('disque'));
    seed({ load });
    await mount();
    expect(await screen.findByText('Je n’arrive pas à charger tes propositions.')).toBeTruthy();
    expect(screen.getByText('Réessayer')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByText('Réessayer'));
    });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('ignore les propositions hors bêta (nutrition)', async () => {
    seed({
      proposals: [
        {
          id: 'meal',
          createdAt: '2026-11-09T07:00:00',
          title: '+40 g de glucides',
          source: 'nutrition',
          action: 'adjust_nutrition_targets',
          payload: {},
          status: 'pending',
          rationale: '',
          confidence: 0.8,
          autoApply: false,
        },
      ],
    });
    await mount();
    expect(screen.queryByText('+40 g de glucides')).toBeNull();
    expect(screen.queryByText('À décider')).toBeNull();
  });

  it('demande hors portée sans accord IA : le moteur le dit simplement', async () => {
    await mount();
    await ask('Prépare un semi en 1h45 dans 10 semaines');
    expect(await screen.findByText(LOCAL_ONLY)).toBeTruthy();
    expect(screen.queryByTestId('proposal-pending')).toBeNull();
  });
});

describe('proposition', () => {
  it('une demande donne une proposition avant / après, source « Calculé sur ton téléphone »', async () => {
    await mount();
    await ask('claqué, 45 min max');
    expect(await screen.findByTestId('proposal-pending')).toBeTruthy();
    expect(screen.getByTestId('user-bubble')).toBeTruthy();
    expect(screen.getAllByText(/Avant/).length).toBeGreaterThan(0);
    expect(screen.getByTestId('proposal-footnote').props.children).toContain('Calculé sur ton téléphone');
    expect(screen.queryByText(/Rédigé par l’IA/)).toBeNull();
    expect(isDisabled(screen.getByTestId('proposal-accept'))).toBe(false);
  });

  it('Valider applique, replie la carte et ouvre le bandeau Annuler', async () => {
    await mount();
    await ask('claqué, 45 min max');
    await screen.findByTestId('proposal-pending');
    await act(async () => {
      await fireEvent.press(screen.getByTestId('proposal-accept'));
    });
    expect(await screen.findByTestId('proposal-applied')).toBeTruthy();
    expect(screen.queryByTestId('proposal-pending')).toBeNull();
    expect(screen.getByTestId('undo-toast')).toBeTruthy();
    expect(usePulseFitStore.getState().sessions[0].date).toBe(iso(2));
  });

  it('Annuler (bandeau) remet le plan comme avant', async () => {
    await mount();
    await ask('claqué, 45 min max');
    await screen.findByTestId('proposal-pending');
    await act(async () => {
      await fireEvent.press(screen.getByTestId('proposal-accept'));
    });
    await act(async () => {
      await fireEvent.press(screen.getByLabelText(/^Annuler :/));
    });
    expect(usePulseFitStore.getState().sessions[0].date).toBe(iso(1));
    expect(useProposalStore.getState().proposals[0].status).toBe('undone');
    await waitFor(() => expect(screen.queryByTestId('undo-toast')).toBeNull());
  });

  it('le bandeau disparaît après 5 s, l’historique garde Annuler toute la journée', async () => {
    jest.useFakeTimers();
    try {
      await mount();
      await ask('claqué, 45 min max');
      await screen.findByTestId('proposal-pending');
      await act(async () => {
        await fireEvent.press(screen.getByTestId('proposal-accept'));
      });
      expect(screen.getByTestId('undo-toast')).toBeTruthy();
      await act(async () => {
        jest.advanceTimersByTime(motion.undo + motion.base + 50);
      });
      expect(screen.queryByTestId('undo-toast')).toBeNull();

      await fireEvent.press(screen.getByText('Historique'));
      const undo = screen.getByLabelText(/^Annuler Reporter/);
      await act(async () => {
        await fireEvent.press(undo);
      });
      expect(usePulseFitStore.getState().sessions[0].date).toBe(iso(1));
    } finally {
      jest.useRealTimers();
    }
  });

  it('Refuser (« Pas maintenant ») laisse le plan intact', async () => {
    await mount();
    await ask('claqué, 45 min max');
    await screen.findByTestId('proposal-pending');
    await act(async () => {
      await fireEvent.press(screen.getByText('Pas maintenant'));
    });
    expect(usePulseFitStore.getState().sessions[0].date).toBe(iso(1));
    expect(screen.queryByTestId('proposal-pending')).toBeNull();
  });
});

describe('question obligatoire', () => {
  const blocked = () => seed({ unavailable: [iso(2)] });

  it('Valider est désactivé jusqu’à la réponse, puis activé', async () => {
    blocked();
    await mount();
    await ask('claqué, 45 min max');
    await screen.findByTestId('proposal-pending');
    expect(screen.getByText('Quel jour te convient ?')).toBeTruthy();
    expect(isDisabled(screen.getByTestId('proposal-accept'))).toBe(true);

    const choices = screen.getAllByRole('radio');
    expect(choices).toHaveLength(3);
    await fireEvent.press(choices[1]);
    expect(isDisabled(screen.getByTestId('proposal-accept'))).toBe(false);
  });

  it('ne propose pas le jour déclaré indisponible et applique le jour choisi', async () => {
    blocked();
    await mount();
    await ask('claqué, 45 min max');
    await screen.findByTestId('proposal-pending');
    const labels = screen.getAllByRole('radio').map((r) => within(r).getAllByText(/./)[0].props.children as string);
    expect(labels).toHaveLength(3);
    await fireEvent.press(screen.getAllByRole('radio')[0]);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('proposal-accept'));
    });
    expect(await screen.findByTestId('proposal-applied')).toBeTruthy();
    expect(usePulseFitStore.getState().sessions[0].date).toBe(iso(3));
    expect(usePulseFitStore.getState().profile.unavailableDates).not.toContain(usePulseFitStore.getState().sessions[0].date);
  });
});

describe('IA : source et repli', () => {
  it('un modèle rédige : « Rédigé par l’IA »', async () => {
    seed({ consent: true });
    model.isModel = true;
    const result: IntentResult = {
      reply: 'Je te propose de décaler la sortie longue.',
      proposals: [
        {
          id: 'ai-1',
          createdAt: new Date().toISOString(),
          title: 'Décaler la sortie longue',
          source: 'coach',
          action: 'adjust_plan',
          payload: { sessionId: 'ws-1', toDate: iso(3) },
          status: 'pending',
          rationale: 'Pluie prévue',
          confidence: 0.9,
          autoApply: false,
        },
      ],
    };
    model.interpretIntent.mockResolvedValue(result);
    await mount();
    await ask('décale la sortie longue');
    await screen.findByTestId('proposal-pending');
    expect(screen.getByTestId('proposal-footnote').props.children).toContain('Rédigé par l’IA');
    expect(screen.getByTestId('coach-source').props.children).toBe('Rédigé par l’IA');
  });

  it('l’IA échoue : repli sur le moteur, annoncé, source « Calculé sur ton téléphone »', async () => {
    seed({ consent: true });
    model.isModel = true;
    model.interpretIntent.mockRejectedValue(new Error('réseau'));
    await mount();
    await ask('claqué, 45 min max');
    expect(await screen.findByText(FALLBACK_NOTICE)).toBeTruthy();
    expect(await screen.findByTestId('proposal-pending')).toBeTruthy();
    expect(screen.getByTestId('proposal-footnote').props.children).toContain('Calculé sur ton téléphone');
    expect(screen.getByTestId('coach-source').props.children).toBe('Calculé sur ton téléphone');
    expect(screen.queryByText(/Rédigé par l’IA/)).toBeNull();
  });
});

describe('Modifier', () => {
  it('rouvre la conversation avec la proposition en contexte, puis remplace la proposition', async () => {
    await mount();
    await ask('claqué, 45 min max');
    await screen.findByTestId('proposal-pending');
    await fireEvent.press(screen.getByLabelText('Modifier'));
    expect(screen.getByTestId('composer-context')).toBeTruthy();
    expect(screen.getByText(/^Modifier : Reporter/)).toBeTruthy();
    expect(screen.getByText(/plutôt jeudi/)).toBeTruthy();

    await ask('plutôt jeudi');
    await waitFor(() => expect(screen.getByText('Voilà la version modifiée.')).toBeTruthy());
    expect(screen.getAllByTestId('proposal-pending')).toHaveLength(1);
    expect(screen.getByText(/^Laissée de côté/)).toBeTruthy();
    expect(screen.queryByTestId('composer-context')).toBeNull();
  });
});

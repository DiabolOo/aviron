/**
 * Règles de l'écran Coach : portée de la bêta, jours indisponibles, question obligatoire,
 * lecture d'une demande de modification, passage d'une proposition aux props de ProposalCard.
 * Fonctions pures, sans React ni réseau. À rapprocher de `src/core/` (étape ultérieure).
 */
import { addDaysISO, formatFullDay, parseISODate, toISODate } from '@/src/core/dates';
import { parseProposalPayload } from '@/src/core/proposalActions';
import type { Proposal } from '@/src/core/schemas';
import type { WorkoutSession } from '@/src/core/types';
import type { ProposalCardProps, ProposalRow } from '@/src/ui/ProposalCard';

export type PlanContext = {
  sessions: readonly WorkoutSession[];
  unavailableDates?: readonly string[];
  /** YYYY-MM-DD */
  today: string;
};

export type AdjustQuestion = {
  prompt: string;
  /** `id` = date ISO choisie. */
  choices: { id: string; label: string }[];
};

export type Adjustment =
  | { kind: 'ready'; proposal: Proposal }
  | { kind: 'ask'; proposal: Proposal; question: AdjustQuestion }
  | { kind: 'blocked'; message: string };

export const MAX_CHOICES = 3;
const SEARCH_DAYS = 7;

const SPORT_ACTIONS: readonly Proposal['action'][] = ['adjust_plan', 'create_program'];

/** Bêta limitée au sport : nutrition et le reste ne sont jamais proposés. */
export const isSportProposal = (p: Pick<Proposal, 'action'>): boolean => SPORT_ACTIONS.includes(p.action);

const SIMPLE_RE =
  /décal|decal|report|dimanche|claqu|fatigu|crev|épuis|epuis|courbatur|pas la forme|allèg|alleg|plus léger|plus leger/i;

/** Demandes que le moteur du téléphone sait traiter seul : décaler, alléger, fatigue. */
export const isSimpleIntent = (text: string): boolean => SIMPLE_RE.test(text);

const isOpen = (s: WorkoutSession) => !s.completed && !s.skipped;

function isFree(date: string, session: WorkoutSession, ctx: PlanContext): boolean {
  if (date < ctx.today || ctx.unavailableDates?.includes(date)) return false;
  return !ctx.sessions.some((s) => s.id !== session.id && s.date === date && isOpen(s));
}

/** Les prochains jours où la séance peut aller : ni déclarés indisponibles, ni déjà occupés. */
export function freeDays(session: WorkoutSession, ctx: PlanContext, limit = MAX_CHOICES): string[] {
  const base = session.date > ctx.today ? session.date : ctx.today;
  const days: string[] = [];
  for (let i = 1; i <= SEARCH_DAYS && days.length < limit; i++) {
    const date = addDaysISO(base, i);
    if (isFree(date, session, ctx)) days.push(date);
  }
  return days;
}

const withTarget = (proposal: Proposal, toDate: string, patch: Partial<Proposal>): Proposal => ({
  ...proposal,
  ...patch,
  payload: { ...proposal.payload, toDate },
});

/**
 * Le plan ne place jamais une séance un jour déclaré indisponible. Quand le jour demandé ne
 * convient pas : un seul jour libre → substitution annoncée ; plusieurs → question obligatoire ;
 * aucun → pas de proposition.
 */
export function resolveAdjustment(proposal: Proposal, ctx: PlanContext): Adjustment {
  if (proposal.action !== 'adjust_plan') return { kind: 'ready', proposal };
  const parsed = parseProposalPayload(proposal);
  if (parsed?.action !== 'adjust_plan') return { kind: 'ready', proposal };
  const { sessionId, toDate } = parsed.payload;
  const session = ctx.sessions.find((s) => s.id === sessionId);
  if (!session || isFree(toDate, session, ctx)) return { kind: 'ready', proposal };

  const requested = formatFullDay(toDate);
  const reason = ctx.unavailableDates?.includes(toDate)
    ? `${requested} est un jour indisponible.`
    : `${requested} est déjà pris ou passé.`;
  const days = freeDays(session, ctx);
  if (days.length === 0) {
    return { kind: 'blocked', message: `${reason} Je ne trouve aucun jour libre dans les ${SEARCH_DAYS} prochains jours.` };
  }
  if (days.length === 1) {
    return {
      kind: 'ready',
      proposal: withTarget(proposal, days[0], {
        title: `Déplacer « ${session.title} » : ${formatFullDay(days[0])}`,
        rationale: `${reason} ${formatFullDay(days[0])} est le seul jour libre.`,
      }),
    };
  }
  return {
    kind: 'ask',
    proposal: withTarget(proposal, days[0], { title: `Déplacer « ${session.title} »`, rationale: reason }),
    question: {
      prompt: 'Quel jour te convient ?',
      choices: days.map((d) => ({ id: d, label: formatFullDay(d) })),
    },
  };
}

const WEEKDAYS: [RegExp, number][] = [
  [/dimanche/i, 0],
  [/lundi/i, 1],
  [/mardi/i, 2],
  [/mercredi/i, 3],
  [/jeudi/i, 4],
  [/vendredi/i, 5],
  [/samedi/i, 6],
];

/** Jour cité dans une demande de modification (« plutôt jeudi », « demain »), ou null. */
export function dayFromText(text: string, today: string): string | null {
  if (/apr[èe]s[- ]demain/i.test(text)) return addDaysISO(today, 2);
  if (/demain/i.test(text)) return addDaysISO(today, 1);
  const hit = WEEKDAYS.find(([re]) => re.test(text));
  if (!hit) return null;
  const base = parseISODate(today).getDay();
  return addDaysISO(today, ((hit[1] - base + 6) % 7) + 1);
}

/** « Modifier » un décalage : la même séance, un autre jour. Null si la demande ne cite aucun jour. */
export function retargetAdjustment(original: Proposal, text: string, today: string, now = new Date()): Proposal | null {
  const parsed = parseProposalPayload(original);
  if (parsed?.action !== 'adjust_plan') return null;
  const date = dayFromText(text, today);
  if (!date) return null;
  return {
    ...original,
    id: `prop-edit-${now.getTime()}`,
    createdAt: now.toISOString(),
    status: 'pending',
    resolvedAt: undefined,
    editedPayload: undefined,
    payload: { ...original.payload, toDate: date },
    title: original.title,
    rationale: 'Ta demande de modification',
    confidence: 0.9,
  };
}

export const toConfidence = (c: number): 'high' | 'medium' | 'low' => (c >= 0.8 ? 'high' : c >= 0.5 ? 'medium' : 'low');

export type CardModel = Pick<
  ProposalCardProps,
  'context' | 'title' | 'rows' | 'rationale' | 'verified' | 'confidence'
>;

/** Ce que la carte affiche, calculé ici : le composant ne calcule rien. */
export function cardModel(proposal: Proposal, ctx: PlanContext, answer?: string): CardModel {
  const base = { title: proposal.title, rationale: proposal.rationale, confidence: toConfidence(proposal.confidence) };
  const parsed = parseProposalPayload(proposal);

  if (parsed?.action === 'adjust_plan') {
    const session = ctx.sessions.find((s) => s.id === parsed.payload.sessionId);
    if (session) {
      const target = answer ?? parsed.payload.toDate;
      const others = ctx.sessions.filter((s) => s.id !== session.id && s.date === target && isOpen(s)).map((s) => s.title);
      const rows: ProposalRow[] = [
        { day: formatShortDay(session.date), before: session.title, after: 'Rien de prévu' },
        {
          day: formatShortDay(target),
          before: others.length ? others.join(' + ') : undefined,
          after: [...others, session.title].join(' + '),
        },
      ];
      return {
        ...base,
        context: `Plan · ${formatLongDay(session.date)}`,
        rows,
        verified: isFree(target, session, ctx),
      };
    }
  }

  if (parsed?.action === 'create_program') {
    return {
      ...base,
      context: 'Plan · nouveau programme',
      rows: [{ day: 'Programme', after: proposal.preview?.after ?? parsed.payload.goal.targetName }],
    };
  }

  return {
    ...base,
    context: 'Plan',
    rows: proposal.preview ? [{ day: 'Plan', before: proposal.preview.before, after: proposal.preview.after }] : [],
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « samedi 7 nov. » */
export const formatLongDay = (iso: string): string =>
  parseISODate(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });

/** « Mar 3 » */
export const formatShortDay = (iso: string): string =>
  cap(parseISODate(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }).replace('.', ''));

/** « 08:12 » */
export const formatClock = (at: Date): string =>
  `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;

/** « 08:12 », « hier, 21:14 », « lundi 08:12 » : l'heure d'un message. */
export function formatStamp(at: Date, now: Date = new Date()): string {
  const day = toISODate(at);
  const today = toISODate(now);
  if (day === today) return formatClock(at);
  if (day === addDaysISO(today, -1)) return `hier, ${formatClock(at)}`;
  return `${at.toLocaleDateString('fr-FR', { weekday: 'long' })} ${formatClock(at)}`;
}

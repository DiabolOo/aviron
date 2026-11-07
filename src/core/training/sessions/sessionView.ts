/**
 * Données d'affichage d'une séance — pur, sans React.
 *
 * Prend une Session et ses activités, retourne tout ce que l'écran
 * `app/activity/[id].tsx` doit afficher (titres, héros, métriques,
 * source badge, rôles).
 */

import type { Activity } from '../../schemas';
import {
  activityDurationDisplay,
  activityLayout,
  activityPace,
  displayActivityName,
  effortTimeSec,
  formatClock,
  formatDayLong,
  formatHour,
  formatKm,
  formatKmNumber,
  NBSP,
  type ActivityLayout,
  type DurationDisplay,
  type EffortPace,
} from '../../sportFormat';
import type { Session } from './types';

// ─── Source badge ────────────────────────────────────────────────────────────

/** « COROS, via Strava » ou le canal seul si l'appareil est inconnu. */
export function sourceBadge(activity: Activity): string {
  const channel = SOURCE_LABELS[activity.source] ?? activity.source;
  if (activity.device) return `${activity.device}, via ${channel}`;
  return channel;
}

const SOURCE_LABELS: Record<string, string> = {
  strava: 'Strava',
  coros: 'COROS',
  garmin: 'Garmin',
  apple_health: 'Apple\u00a0Santé',
  health_connect: 'Health\u00a0Connect',
  file: 'Fichier',
  phone: 'Téléphone',
  manual: 'Manuel',
};

// ─── Session view ───────────────────────────────────────────────────────────

export type SessionPartView = {
  activityId: string;
  /** Rôle affiché (override seulement). */
  role?: 'warmup' | 'main' | 'cooldown';
  roleLabel?: string;
  name: string;
  distanceLabel?: string;
  durationLabel: string;
  paceLabel?: string;
};

export type SessionView = {
  sessionId: string;
  sport: Activity['type'];
  layout: ActivityLayout;

  /** « Mercredi 20 mai » */
  dateLine: string;
  /** « midi », « 10:14 » */
  timeLine?: string;
  /** « 3 activités regroupées » */
  groupLabel?: string;

  /** Nom de la séance : nom de l'activité principale ou titre déduit. */
  title: string;
  /** Sous-titre original (quand le titre est celui d'une course). */
  originalName?: string;

  source: string;

  /** Héros : formaté par core. */
  heroValue: string;
  heroUnit?: string;
  heroCaption?: string;

  /** 0 à 3 chiffres secondaires (label + value + unit). */
  metrics: { label: string; value: string; unit?: string }[];

  /** Allure ou vitesse affichée. */
  pace?: EffortPace;

  /** Durée avec indication « au total » si le temps écoulé diffère. */
  duration: DurationDisplay;

  /** Activités dans la séance (toujours au moins 1). */
  parts: SessionPartView[];

  /** true si la séance contient plus d'une activité. */
  isGrouped: boolean;

  /** FC moyenne (si disponible). */
  avgHr?: number;
  /** FC max (si disponible). */
  maxHr?: number;
};

const ROLE_LABELS: Record<string, string> = {
  warmup: 'Échauffement',
  main: 'Bloc rapide',
  cooldown: 'Retour au calme',
};

const TIME_OF_DAY: Record<string, string> = {
  morning: 'matin',
  lunch: 'midi',
  afternoon: 'après-midi',
  evening: 'soir',
};

function timeOfDay(hour: number): string | undefined {
  if (hour >= 5 && hour < 12) return TIME_OF_DAY.morning;
  if (hour >= 12 && hour < 14) return TIME_OF_DAY.lunch;
  if (hour >= 14 && hour < 18) return TIME_OF_DAY.afternoon;
  if (hour >= 18 && hour < 22) return TIME_OF_DAY.evening;
  return undefined;
}

/** Construit le view-model d'une séance pour l'écran de détail. */
export function buildSessionView(
  session: Session,
  activitiesById: ReadonlyMap<string, Activity>,
): SessionView {
  const activities = session.activityIds
    .map((id) => activitiesById.get(id))
    .filter((a): a is Activity => a !== undefined);
  if (activities.length === 0) {
    throw new Error(`Session ${session.id} has no matching activities`);
  }

  const layout = activityLayout(session.sport);
  const isGrouped = activities.length > 1;
  const mainActivity = activities[0];

  // ── Date & heure ────────────────────────────────────────────────────────
  const dateLine = formatDayLong(session.startedAt.slice(0, 10));
  const startHour = Number(mainActivity.startTime.slice(0, 2));
  const timeLine = timeOfDay(startHour) ?? formatHour(mainActivity.startTime);
  const groupLabel = isGrouped ? `${activities.length} activités regroupées` : undefined;

  // ── Source badge (première activité) ────────────────────────────────────
  const source = sourceBadge(mainActivity);

  // ── Titre ──────────────────────────────────────────────────────────────
  const title = displayActivityName(mainActivity.name);

  // ── Durée ──────────────────────────────────────────────────────────────
  const movingSec = session.movingTimeSec;
  const elapsedSec = session.elapsedTimeSec;
  const duration: DurationDisplay = {
    main: formatClock(movingSec),
    total: elapsedSec - movingSec >= 60 ? `${formatClock(elapsedSec)}${NBSP}au${NBSP}total` : undefined,
  };

  // ── Allure / vitesse ──────────────────────────────────────────────────
  const distanceKm = session.distanceM !== undefined ? session.distanceM / 1000 : undefined;
  const pace = activityPace(session.sport, distanceKm, movingSec);

  // ── Héros (selon le sport) ────────────────────────────────────────────
  let heroValue: string;
  let heroUnit: string | undefined;
  let heroCaption: string | undefined;

  if (layout.showDistance && distanceKm !== undefined && distanceKm > 0) {
    // Run/walk/ride/swim : allure ou distance en héros
    if (pace) {
      heroValue = pace.value;
      heroUnit = pace.unit;
      if (isGrouped) {
        // Main bloc's pace for grouped sessions
        const mainAct = findMainActivity(activities, session.roles);
        if (mainAct && mainAct.distanceKm) {
          heroCaption = `sur le bloc rapide de ${formatKmNumber(mainAct.distanceKm)}${NBSP}km`;
        }
      }
    } else {
      heroValue = formatKmNumber(distanceKm);
      heroUnit = 'km';
    }
  } else {
    // Strength, other : durée en héros
    heroValue = duration.main;
  }

  // ── Métriques secondaires ─────────────────────────────────────────────
  const metrics: { label: string; value: string; unit?: string }[] = [];
  if (layout.showDistance && distanceKm !== undefined && pace) {
    // Si l'allure est en héros, la durée est un chiffre secondaire
    if (isGrouped) {
      const mainAct = findMainActivity(activities, session.roles);
      if (mainAct) {
        const mainSec = mainAct.movingTimeSec ?? mainAct.durationMin * 60;
        metrics.push({ label: 'Bloc', value: formatClock(mainSec) });
      }
    }
  }
  if (session.avgHr !== undefined) {
    metrics.push({ label: 'FC moy.', value: `${session.avgHr}`, unit: 'bpm' });
  }
  const maxHr = Math.max(...activities.map((a) => a.maxHr ?? 0));
  if (maxHr > 0) {
    metrics.push({ label: 'FC max', value: `${maxHr}`, unit: 'bpm' });
  }

  // ── Parts (activités de la séance) ────────────────────────────────────
  const parts: SessionPartView[] = activities.map((a) => {
    const role = session.roles?.[a.id];
    const aPace = activityPace(a.type, a.distanceKm, effortTimeSec(a));
    const aDur = activityDurationDisplay(a);
    return {
      activityId: a.id,
      role,
      roleLabel: role ? ROLE_LABELS[role] : undefined,
      name: displayActivityName(a.name),
      distanceLabel: a.distanceKm !== undefined ? formatKm(a.distanceKm) : undefined,
      durationLabel: aDur.main,
      paceLabel: aPace ? `${aPace.value}${NBSP}${aPace.unit}` : undefined,
    };
  });

  return {
    sessionId: session.id,
    sport: session.sport,
    layout,
    dateLine,
    timeLine,
    groupLabel,
    title,
    source,
    heroValue,
    heroUnit,
    heroCaption,
    metrics,
    pace,
    duration,
    parts,
    isGrouped,
    avgHr: session.avgHr,
    maxHr: maxHr > 0 ? maxHr : undefined,
  };
}

/** L'activité principale : celle dont le rôle est 'main', sinon la plus intense. */
function findMainActivity(
  activities: Activity[],
  roles?: Record<string, 'warmup' | 'main' | 'cooldown'>,
): Activity | undefined {
  if (roles) {
    const mainId = Object.entries(roles).find(([, r]) => r === 'main')?.[0];
    if (mainId) {
      const found = activities.find((a) => a.id === mainId);
      if (found) return found;
    }
  }
  // Fallback : la plus rapide (allure la plus basse, pour run/walk/swim)
  let best: Activity | undefined;
  let bestPace = Infinity;
  for (const a of activities) {
    if (a.distanceKm === undefined || a.distanceKm <= 0) continue;
    const sec = effortTimeSec(a);
    const pace = sec / a.distanceKm;
    if (pace < bestPace) {
      bestPace = pace;
      best = a;
    }
  }
  return best ?? activities[0];
}

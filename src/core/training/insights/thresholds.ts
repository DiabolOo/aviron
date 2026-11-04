// Seuils des règles d'insights. Chaque constante porte la raison de sa valeur.

/** Nombre de dernières courses examinées pour la qualité des données FC. */
export const NO_HR_WINDOW_RUNS = 5;
/** Au moins 3 courses sur 5 sans FC : assez pour que ce ne soit pas un oubli isolé. */
export const NO_HR_MIN_MISSING = 3;
/** Il faut déjà ≥ 5 séances avec FC dans l'historique : en dessous, on ne peut pas parler de mesure « perdue ». */
export const NO_HR_MIN_HR_SESSIONS = 5;

/** Fenêtre d'analyse de l'intensité : 12 semaines, assez longue pour lisser un bloc ponctuel. */
export const INTENSITY_WINDOW_WEEKS = 12;
/** Seules les courses de plus de 5 km comptent : en dessous, la FC moyenne reflète surtout l'échauffement. */
export const INTENSITY_MIN_RUN_KM = 5;
/** Minimum de courses > 5 km avec FC pour parler de tendance (sinon null). */
export const INTENSITY_MIN_RUNS = 4;
/** Une sortie est « soutenue » au-delà de 80 % de la FC max (début de la zone dure). */
export const INTENSITY_HIGH_HR_RATIO = 0.8;
/** Déclenchement : ≥ 40 % des courses éligibles sont soutenues. */
export const INTENSITY_TRIGGER_SHARE_PCT = 40;
/** Au-delà de 60 % de sorties soutenues, la carte passe en gravité « warning ». */
export const INTENSITY_WARNING_SHARE_PCT = 60;
/** FC conseillée pour une sortie facile : 75 % de la FC max. */
export const INTENSITY_EASY_HR_RATIO = 0.75;

/** Écart d'allure de 5 % : au-delà, la différence est nette et non due au bruit GPS ou au dénivelé. */
export const PACING_GAP_PCT = 5;
/** Le débrief d'allure n'est proposé que pour une course des 28 derniers jours. */
export const PACING_MAX_AGE_DAYS = 28;
/** Les temps de passage doivent couvrir ≥ 90 % de la distance mesurée (sinon les moitiés sont fausses). */
export const PACING_MIN_COVERAGE = 0.9;
/** Minimum de temps de passage kilométriques pour comparer moitiés et quarts. */
export const PACING_MIN_SPLITS = 4;

/** Une course est « à venir » pour la règle de préparation si elle a lieu dans 12 semaines au plus. */
export const PREP_UPCOMING_MAX_WEEKS = 12;
/** Pour une course passée, le bilan de préparation reste proposé 28 jours. */
export const PREP_REVIEW_MAX_DAYS = 28;
/** Fenêtre de préparation analysée : les 8 semaines avant la course (ou avant aujourd'hui). */
export const PREP_WINDOW_WEEKS = 8;
/** La plus longue sortie devrait atteindre 60 % de la distance de course. */
export const PREP_LONGEST_RUN_RATIO = 0.6;
/** Minimum de courses à pied dans la fenêtre : en dessous, l'historique est trop mince pour conclure. */
export const PREP_MIN_SESSIONS = 2;
/** À 10 jours ou moins de la course, aucune critique : seulement allure et affûtage. */
export const PREP_TOO_LATE_DAYS = 10;

/** Deux semaines sans activité : assez pour parler d'une coupure, pas d'un simple jour de repos. */
export const GAP_RESUME_MIN_DAYS = 14;
/** Il faut avoir déjà ≥ 3 activités enregistrées pour parler de « reprise » (sinon null). */
export const GAP_MIN_PRIOR_ACTIVITIES = 3;
/** Coupure de 14 à 27 jours : reprise à 70 % de la séance habituelle (médiane des 8 semaines avant la coupure). */
export const GAP_RESUME_RATIO = 0.7;
/** Dernier jour de coupure « courte » (14–27 j) ; à partir de 28 jours, séance de reprise fixe. */
export const GAP_SHORT_MAX_DAYS = 27;
/** Coupure de 28 jours ou plus : première séance volontairement courte, 20 minutes. */
export const GAP_LONG_FIRST_SESSION_MIN = 20;
/** Fenêtre précédant la coupure, pour rappeler le niveau d'activité d'avant. */
export const GAP_CONTEXT_WEEKS = 8;

/** Hausse de volume jugée rapide : > 30 % au-dessus de la moyenne hebdomadaire récente. */
export const VOLUME_RAMP_PCT = 30;
/** Au-delà de +50 %, la carte passe en gravité « warning ». */
export const VOLUME_RAMP_WARNING_PCT = 50;
/** En dessous de 10 km sur 7 jours, une hausse en pourcentage n'est pas significative. */
export const VOLUME_MIN_WEEK_KM = 10;
/** Nombre de semaines de référence précédant la semaine courante. */
export const VOLUME_BASELINE_WEEKS = 4;
/** Minimum de courses dans les 4 semaines de référence, sinon la moyenne n'est pas fiable (null). */
export const VOLUME_MIN_BASELINE_RUNS = 4;
/** Volume conseillé la semaine suivante : moyenne de référence + 10 %. */
export const VOLUME_NEXT_WEEK_FACTOR = 1.1;

/** Fenêtre de régularité : 8 semaines glissantes de 7 jours. */
export const CONSISTENCY_WINDOW_WEEKS = 8;
/** ≥ 6 semaines actives sur 8 : régularité à saluer. En dessous, ton encourageant. */
export const CONSISTENCY_GOOD_WEEKS = 6;
/** Minimum de séances dans la fenêtre pour afficher le décompte (sinon null). */
export const CONSISTENCY_MIN_SESSIONS = 3;

/** Variation d'efficacité aérobie entre deux trimestres jugée significative : 5 %, au-dessus du bruit habituel. */
export const AEROBIC_TREND_MIN_PCT = 5;
/** Minimum de séances (≥ 3 par trimestre, comme `reliable` de l'engine) pour comparer deux trimestres. */
export const AEROBIC_TREND_MIN_SESSIONS = 6;

/** Croissance maximale conseillée de la sortie longue : +10 % par semaine. */
export const PREP_WEEKLY_GROWTH = 0.1;
/** Un rejet de carte masque la règle concernée 28 jours, quel que soit l'id (la période) rejeté. */
export const INSIGHT_MUTE_DAYS = 28;
/** Une candidate de course non confirmée n'est proposée à la confirmation que pendant 28 jours. */
export const CONFIRM_RACE_MAX_AGE_DAYS = 28;

/** Allure visée plausible : entre 2:30 et 10:00 par km, sinon le temps saisi est ignoré. */
export const TARGET_PACE_MIN_SEC = 150;
export const TARGET_PACE_MAX_SEC = 600;
/**
 * Règles jamais masquées 28 jours : leur refus est définitif.
 * confirm_race : via rejectedIds de detectRaces ; data_quality_no_hr : via rankInsights({ rejectedForever }).
 */
export const NEVER_MUTED_RULE_IDS: readonly string[] = ['confirm_race', 'data_quality_no_hr'];

// ─── Regroupement en séances (groupSessions) ─────────────────────────────────

/** Écart maximal entre la fin d'une activité et le début de la suivante pour les regrouper (minutes). */
export const GROUP_MAX_GAP_MIN = 15;
/** Durée maximale d'une séance du premier début à la dernière fin (heures). */
export const GROUP_MAX_DURATION_H = 4;

// ─── Déduplication (dedupeActivities) ────────────────────────────────────────

/** Deux activités sont la même sortie si leurs débuts sont séparés de moins de N minutes. */
export const DEDUPE_START_DIFF_MIN = 2;
/** Deux activités sont la même sortie si leurs distances diffèrent de moins de N % (ou durées si pas de distance). */
export const DEDUPE_DISTANCE_PCT = 3;

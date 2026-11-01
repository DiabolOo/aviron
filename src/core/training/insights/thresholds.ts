// Seuils des règles d'insights. Chaque constante porte la raison de sa valeur.

/** Nombre de dernières courses examinées pour la qualité des données FC. */
export const NO_HR_WINDOW_RUNS = 5;
/** Au moins 3 courses sur 5 sans FC : assez pour que ce ne soit pas un oubli isolé. */
export const NO_HR_MIN_MISSING = 3;

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

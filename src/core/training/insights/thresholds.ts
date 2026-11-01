// Seuils des règles d'insights. Chaque constante porte la raison de sa valeur.

/** Nombre de dernières courses examinées pour la qualité des données FC. */
export const NO_HR_WINDOW_RUNS = 5;
/** Au moins 3 courses sur 5 sans FC : assez pour que ce ne soit pas un oubli isolé. */
export const NO_HR_MIN_MISSING = 3;

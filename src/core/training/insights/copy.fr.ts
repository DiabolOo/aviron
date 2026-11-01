// Gabarits de textes (français, tutoiement, sans diagnostic ni ton culpabilisant).
// Les chiffres sont fournis par l'engine : on ne recalcule rien ici.

export const nf = (n: number, digits = 0): string => n.toFixed(digits).replace('.', ',');
export const pct = (n: number, digits = 0): string => `${nf(n, digits)} %`;
export const km = (n: number, digits = 1): string => `${nf(n, digits)} km`;

export const quarterLabel = (key: string): string => {
  const [year, q] = key.split('-Q');
  return `T${q} ${year}`;
};

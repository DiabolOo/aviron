/**
 * Vérifie que le dossier app/ ne contient que des routes Expo Router valides.
 * Toute logique (composants, tests) doit vivre dans src/.
 *
 * Fichiers autorisés dans app/ :
 *   - _layout.tsx / _layout.ts
 *   - +html.tsx
 *   - +not-found.tsx
 *   - Fichiers de route : noms en minuscules, segments dynamiques [id].tsx,
 *     groupes de routes (tabs)/_layout.tsx, etc.
 *
 * Fichiers interdits :
 *   - *.test.ts / *.test.tsx
 *   - Composants (nom commençant par une majuscule, ex. PostponeSheet.tsx)
 */

import * as fs from 'fs';
import * as path from 'path';

/** Retourne tous les fichiers .ts/.tsx sous un répertoire (récursivement). */
function collectFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full));
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const APP_DIR = path.resolve(__dirname, '../../app');

describe('Structure de app/', () => {
  const files = collectFiles(APP_DIR);

  it("ne contient aucun fichier de test (*.test.*)", () => {
    const testFiles = files.filter((f) => /\.test\.[jt]sx?$/.test(path.basename(f)));
    expect(testFiles).toEqual([]);
  });

  it("ne contient aucun composant (nom commençant par une majuscule)", () => {
    const components = files.filter((f) => {
      const base = path.basename(f);
      // Exclure les fichiers Expo Router spéciaux
      if (base.startsWith('+') || base.startsWith('_')) return false;
      // Un composant commence par une majuscule
      return /^[A-Z]/.test(base);
    });
    expect(components).toEqual([]);
  });
});

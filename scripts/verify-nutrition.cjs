// Verification des calculs nutritionnels (Mifflin-St Jeor, TDEE, macros).
// Usage : node scripts/verify-nutrition.cjs

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const file = path.join(__dirname, '..', 'lib', 'nutritionCalculator.ts');
const source = fs.readFileSync(file, 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});

const mod = { exports: {} };
new Function('exports', 'module', 'require', outputText)(mod.exports, mod, require);
const {
  calculateBMR,
  calculateTDEE,
  adjustForGoal,
  paceToDailyKcalDelta,
  calculateMacros,
  inferGoal,
  calculateNutritionTargets,
} = mod.exports;

let failures = 0;

function check(label, actual, expected) {
  const ok =
    typeof expected === 'number' ? Math.abs(actual - expected) < 1e-6 : actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: ${JSON.stringify(actual)} (attendu ${JSON.stringify(expected)})`);
}

function checkDeep(label, actual, expected) {
  const ok =
    actual !== null &&
    Object.keys(expected).every((key) => actual[key] === expected[key]);
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}:`, actual, '(attendu', expected, ')');
}

// BMR Mifflin-St Jeor
check('BMR homme 80kg/180cm/30a', calculateBMR({ sex: 'male', weightKg: 80, heightCm: 180, ageYears: 30 }), 1780);
check('BMR femme 60kg/165cm/35a', calculateBMR({ sex: 'female', weightKg: 60, heightCm: 165, ageYears: 35 }), 1295.25);

// TDEE
check('TDEE sedentary', calculateTDEE(1780, 'sedentary'), 1780 * 1.2);
check('TDEE light', calculateTDEE(1780, 'light'), 1780 * 1.375);
check('TDEE active', calculateTDEE(1780, 'active'), 1780 * 1.55);
check('TDEE athlete', calculateTDEE(1780, 'athlete'), 1780 * 1.725);

// Ajustement objectif
check('goal weight_loss', adjustForGoal(2759, 'weight_loss'), 2759 * 0.85);
check('goal maintenance', adjustForGoal(2759, 'maintenance'), 2759);
check('goal muscle_gain', adjustForGoal(2759, 'muscle_gain'), 2759 * 1.1);

// Inference depuis poids cible
check('inferGoal perte', inferGoal(80, 75), 'weight_loss');
check('inferGoal prise', inferGoal(70, 78), 'muscle_gain');
check('inferGoal maintien', inferGoal(74, 74.3), 'maintenance');

// Macros : 80kg, 2760 kcal -> P160 (640) + L80 (720) = 1360 -> G350
checkDeep('macros 80kg/2760kcal', calculateMacros(80, 2760), { protein: 160, carbs: 350, fat: 80 });

// Profil complet : homme 80kg/180cm/30a, actif, maintien
checkDeep(
  'targets homme maintenance',
  calculateNutritionTargets({
    sex: 'male', ageYears: 30, heightCm: 180, weightKg: 80,
    targetWeightKg: 80, activityLevel: 'active',
  }),
  { calories: 2760, protein: 160, carbs: 350, fat: 80 },
);

// Profil femme en perte de poids : BMR 1295.25 * 1.375 = 1781 * 0.85 = 1514 -> 1510
const femaleLoss = calculateNutritionTargets({
  sex: 'female', ageYears: 35, heightCm: 165, weightKg: 60,
  targetWeightKg: 55, activityLevel: 'light',
});
check('targets femme weight_loss calories', femaleLoss ? femaleLoss.calories : NaN, 1510);
checkDeep('targets femme weight_loss macros', femaleLoss, { calories: 1510, protein: 120, carbs: 123, fat: 60 });

// Donnees incompletes -> null (on conserve les objectifs existants)
check('profil incomplet -> null', calculateNutritionTargets({ weightKg: 70, targetWeightKg: 70 }), null);

// Rythme en kg/semaine : 0.5 kg/sem -> 550 kcal/jour
check('rythme 0.5 kg/sem', paceToDailyKcalDelta(0.5), 550);
check('rythme 1 kg/sem', paceToDailyKcalDelta(1), 1100);

// Deficit base sur le rythme : TDEE 2759 - 550 = 2209 -> 2210
check(
  'targets homme perte 0.5 kg/sem',
  calculateNutritionTargets({
    sex: 'male', ageYears: 30, heightCm: 180, weightKg: 80,
    targetWeightKg: 75, weeklyPaceKg: 0.5, activityLevel: 'active',
  }).calories,
  2210,
);

// Surplus base sur le rythme : TDEE 2604 + 275 = 2879 -> 2880
check(
  'targets homme prise 0.25 kg/sem',
  calculateNutritionTargets({
    sex: 'male', ageYears: 30, heightCm: 180, weightKg: 70,
    targetWeightKg: 74, weeklyPaceKg: 0.25, activityLevel: 'active',
  }).calories,
  2880,
);

// Plancher de securite : femme sédentaire, perte 1 kg/sem -> TDEE 1554 - 1100 = 454 -> 1200
check(
  'plancher 1200 kcal (femme)',
  calculateNutritionTargets({
    sex: 'female', ageYears: 35, heightCm: 165, weightKg: 60,
    targetWeightKg: 50, weeklyPaceKg: 1, activityLevel: 'sedentary',
  }).calories,
  1200,
);

// Plancher homme : TDEE 1780*1.2=2136 - 1100 = 1036 -> 1500
check(
  'plancher 1500 kcal (homme)',
  calculateNutritionTargets({
    sex: 'male', ageYears: 30, heightCm: 180, weightKg: 80,
    targetWeightKg: 70, weeklyPaceKg: 1, activityLevel: 'sedentary',
  }).calories,
  1500,
);

if (failures > 0) {
  console.error(`\n${failures} echec(s)`);
  process.exit(1);
}
console.log('\nTous les calculs sont conformes.');

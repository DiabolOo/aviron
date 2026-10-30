import { ActivitySchema, DailyBriefSchema, FoodItemSchema, GoalSchema, InsightSchema, MacrosSchema, MealSchema, PlannedWorkoutSchema, ProfileSchema, ProposalSchema, TrainingPlanSchema } from './schemas';

describe('MacrosSchema', () => {
  it('accepte des macros valides', () => {
    expect(MacrosSchema.safeParse({ calories: 2000, protein: 150, carbs: 200, fat: 70 }).success).toBe(true);
  });
  it('refuse des valeurs négatives', () => {
    expect(MacrosSchema.safeParse({ calories: -100, protein: 0, carbs: 0, fat: 0 }).success).toBe(false);
  });
});

describe('ProfileSchema', () => {
  const valid = {
    firstName: 'Alex', weightKg: 74, targetWeightKg: 72,
    goalLabel: 'Semi-marathon', calorieTarget: 2500,
    macrosTarget: { calories: 2500, protein: 150, carbs: 280, fat: 70 },
  };
  it('accepte un profil minimal valide', () => {
    expect(ProfileSchema.safeParse(valid).success).toBe(true);
  });
  it('refuse un prénom vide', () => {
    expect(ProfileSchema.safeParse({ ...valid, firstName: '' }).success).toBe(false);
  });
  it('refuse un âge hors limites', () => {
    expect(ProfileSchema.safeParse({ ...valid, ageYears: 5 }).success).toBe(false);
  });
});

describe('MealSchema', () => {
  const valid = {
    id: 'm1', name: 'Déjeuner',
    loggedAt: '2026-10-30T12:30:00',
    macros: { calories: 600, protein: 40, carbs: 70, fat: 15 },
    confidence: 0.9,
  };
  it('accepte un repas valide', () => {
    expect(MealSchema.safeParse(valid).success).toBe(true);
  });
  it('refuse une confiance > 1', () => {
    expect(MealSchema.safeParse({ ...valid, confidence: 1.5 }).success).toBe(false);
  });
});

describe('FoodItemSchema', () => {
  it('accepte un aliment valide', () => {
    expect(FoodItemSchema.safeParse({
      id: 'fi1', name: 'Poulet', portionG: 150,
      macrosPer100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    }).success).toBe(true);
  });
});

describe('ActivitySchema', () => {
  it('accepte une activité course', () => {
    expect(ActivitySchema.safeParse({
      id: 'a1', name: 'Footing', type: 'run',
      date: '2026-10-29', startTime: '07:00',
      durationMin: 45, calories: 450,
    }).success).toBe(true);
  });
  it('refuse une date mal formatée', () => {
    expect(ActivitySchema.safeParse({
      id: 'a1', name: 'Run', type: 'run',
      date: '30/10/2026', startTime: '07:00',
      durationMin: 45, calories: 450,
    }).success).toBe(false);
  });
});

describe('PlannedWorkoutSchema', () => {
  it('accepte une séance planifiée', () => {
    expect(PlannedWorkoutSchema.safeParse({
      id: 's1', date: '2026-10-30', title: 'Footing',
      kind: 'run', subtitle: '8 km', durationMin: 48,
      targetCaloriesBurn: 520, completed: false,
    }).success).toBe(true);
  });
});

describe('GoalSchema', () => {
  it('accepte un objectif de type course', () => {
    expect(GoalSchema.safeParse({
      type: 'race', id: 'g1', name: 'Semi de Lyon',
      targetDate: '2027-03-15',
    }).success).toBe(true);
  });
  it('accepte un objectif de type poids', () => {
    expect(GoalSchema.safeParse({
      type: 'weight', id: 'g2', targetWeightKg: 70,
    }).success).toBe(true);
  });
  it('refuse un discriminant inconnu', () => {
    expect(GoalSchema.safeParse({ type: 'sleep', id: 'g3' }).success).toBe(false);
  });
});

describe('InsightSchema', () => {
  it('accepte un insight valide', () => {
    expect(InsightSchema.safeParse({
      id: 'i1', date: '2026-10-30', source: 'coach',
      message: 'Volume en hausse cette semaine.', confidence: 0.85,
    }).success).toBe(true);
  });
});

describe('ProposalSchema', () => {
  it('accepte une proposition pending', () => {
    expect(ProposalSchema.safeParse({
      id: 'p1', createdAt: '2026-10-30T08:00:00Z',
      action: 'create_plan', payload: { goalId: 'g1' },
      status: 'pending', rationale: 'Objectif semi détecté.',
      confidence: 0.9,
    }).success).toBe(true);
  });
  it('refuse un statut inconnu', () => {
    expect(ProposalSchema.safeParse({
      id: 'p1', createdAt: '2026-10-30T08:00:00Z',
      action: 'x', payload: {}, status: 'unknown',
      rationale: '', confidence: 0.5,
    }).success).toBe(false);
  });
});

describe('TrainingPlanSchema', () => {
  it('accepte un plan minimal', () => {
    expect(TrainingPlanSchema.safeParse({
      id: 'tp1', createdAt: '2026-10-30T08:00:00Z',
      startDate: '2026-10-30', endDate: '2026-12-25',
      totalWeeks: 8, weeks: [], rationale: 'Plan 8 semaines.', confidence: 0.9,
    }).success).toBe(true);
  });
});

describe('DailyBriefSchema', () => {
  it('accepte un brief valide', () => {
    expect(DailyBriefSchema.safeParse({
      date: '2026-10-30', generatedAt: '2026-10-30T06:00:00Z',
      summary: 'Bonne journée prévue.',
      actions: [{ id: 'a1', label: 'Valider la séance', priority: 1 }],
      kcalTarget: 2500,
    }).success).toBe(true);
  });
});

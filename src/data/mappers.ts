import type { Activity, PlannedWorkout } from '@/src/core/schemas';
import type {
  ActivityType,
  StravaActivity,
  WorkoutKind,
  WorkoutSession,
} from '@/src/core/types';

function toUiActivityType(type: Activity['type']): ActivityType {
  if (type === 'ride' || type === 'walk') return type;
  return 'run';
}

function fromUiActivityType(type: ActivityType): Activity['type'] {
  return type;
}

export function activityToStrava(activity: Activity): StravaActivity {
  return {
    id: activity.id,
    name: activity.name,
    type: toUiActivityType(activity.type),
    date: activity.date,
    startTime: activity.startTime,
    distanceKm: activity.distanceKm ?? 0,
    movingTimeMin: activity.durationMin,
    elevationM: activity.elevationM ?? 0,
    calories: activity.calories ?? 0,
    avgHr: activity.avgHr ?? 0,
    maxHr: activity.maxHr ?? 0,
    splits: (activity.splits ?? []).map((s) => ({ ...s, avgHr: s.avgHr ?? 0 })),
    hrStream: activity.hrStream ?? [],
    polyline: activity.polyline ?? [],
  };
}

export function stravaToActivity(activity: StravaActivity): Activity {
  return {
    id: activity.id,
    name: activity.name,
    type: fromUiActivityType(activity.type),
    date: activity.date.slice(0, 10),
    startTime: activity.startTime,
    durationMin: activity.movingTimeMin,
    distanceKm: activity.distanceKm,
    elevationM: activity.elevationM,
    calories: activity.calories,
    avgHr: activity.avgHr,
    maxHr: activity.maxHr,
    source: 'strava',
    splits: activity.splits,
    hrStream: activity.hrStream,
    polyline: activity.polyline,
  };
}

function toUiWorkoutKind(kind: PlannedWorkout['kind']): WorkoutKind {
  if (kind === 'run' || kind === 'rest') return kind;
  return 'strength';
}

export function plannedToSession(workout: PlannedWorkout): WorkoutSession {
  return {
    id: workout.id,
    date: workout.date,
    title: workout.title,
    kind: toUiWorkoutKind(workout.kind),
    subtitle: workout.subtitle,
    durationMin: workout.durationMin,
    caloriesBurn: workout.targetCaloriesBurn,
    completed: workout.completed,
    blocks: workout.blocks,
    exercises: workout.exercises,
  };
}

export function sessionToPlanned(session: WorkoutSession): PlannedWorkout {
  return {
    id: session.id,
    date: session.date,
    title: session.title,
    kind: session.kind,
    subtitle: session.subtitle,
    durationMin: session.durationMin,
    targetCaloriesBurn: session.caloriesBurn,
    completed: session.completed,
    blocks: session.blocks,
    exercises: session.exercises,
  };
}

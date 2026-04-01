import type { DayPayload, TemplateExercise } from "@/lib/types";

export type ModuleCompletion = {
  diary: boolean;
  reading: boolean;
  gym: boolean;
};

export type DayStrength = "empty" | "partial" | "strong";

function hasExerciseFieldsFilled(
  exercise: TemplateExercise,
  entries: DayPayload["gym"]["entries"]
): boolean {
  const exerciseEntries = entries[exercise.id] ?? {};
  return exercise.fields.every((field) => {
    const value = exerciseEntries[field];
    return typeof value === "number" && Number.isFinite(value);
  });
}

export function getModuleCompletion(payload: DayPayload): ModuleCompletion {
  const diary = payload.diary.completed;
  const reading = payload.reading.bookTitle.trim().length > 0;
  const snapshot = payload.gym.snapshot;
  const gym =
    Boolean(snapshot) &&
    snapshot!.exercises.length > 0 &&
    snapshot!.exercises.every((exercise) => hasExerciseFieldsFilled(exercise, payload.gym.entries));

  return {
    diary,
    reading,
    gym
  };
}

export function getDayStrength(payload: DayPayload): DayStrength {
  const completion = getModuleCompletion(payload);
  const completeCount = Object.values(completion).filter(Boolean).length;

  if (completeCount === 0) {
    return "empty";
  }

  if (completeCount === 3) {
    return "strong";
  }

  return "partial";
}

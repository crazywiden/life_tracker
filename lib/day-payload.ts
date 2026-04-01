import type { DayPayload, DiaryModule, GymModule, ReadingModule } from "@/lib/types";

export function emptyDiaryModule(): DiaryModule {
  return {
    completed: false,
    updatedAt: null
  };
}

export function emptyReadingModule(): ReadingModule {
  return {
    bookTitle: "",
    notes: "",
    updatedAt: null
  };
}

export function emptyGymModule(): GymModule {
  return {
    templateId: null,
    templateName: null,
    snapshot: null,
    entries: {},
    updatedAt: null
  };
}

export function emptyDayPayload(): DayPayload {
  return {
    diary: emptyDiaryModule(),
    reading: emptyReadingModule(),
    gym: emptyGymModule()
  };
}

export function normalizeDayPayload(input: unknown): DayPayload {
  const fallback = emptyDayPayload();
  if (!input || typeof input !== "object") {
    return fallback;
  }

  const payload = input as Partial<DayPayload>;

  return {
    diary: {
      completed: Boolean(payload.diary?.completed),
      updatedAt: payload.diary?.updatedAt ?? null
    },
    reading: {
      bookTitle: payload.reading?.bookTitle ?? "",
      notes: payload.reading?.notes ?? "",
      updatedAt: payload.reading?.updatedAt ?? null
    },
    gym: {
      templateId: payload.gym?.templateId ?? null,
      templateName: payload.gym?.templateName ?? null,
      snapshot: payload.gym?.snapshot ?? null,
      entries: payload.gym?.entries ?? {},
      updatedAt: payload.gym?.updatedAt ?? null
    }
  };
}

export function mergeModule<T extends keyof DayPayload>(
  payload: DayPayload,
  moduleKey: T,
  value: DayPayload[T]
): DayPayload {
  return {
    ...payload,
    [moduleKey]: value
  };
}

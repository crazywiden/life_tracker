export const TEMPLATE_FIELD_KEYS = [
  "sets",
  "reps",
  "weight",
  "duration",
  "distance"
] as const;

export type TemplateFieldKey = (typeof TEMPLATE_FIELD_KEYS)[number];

export type TemplateExercise = {
  id: string;
  name: string;
  fields: TemplateFieldKey[];
};

export type WorkoutTemplate = {
  schemaVersion: 1;
  name: string;
  exercises: TemplateExercise[];
};

export type DiaryModule = {
  completed: boolean;
  updatedAt: string | null;
};

export type ReadingModule = {
  bookTitle: string;
  notes: string;
  updatedAt: string | null;
};

export type GymEntries = Record<string, Partial<Record<TemplateFieldKey, number | null>>>;

export type GymModule = {
  templateId: string | null;
  templateName: string | null;
  snapshot: WorkoutTemplate | null;
  entries: GymEntries;
  updatedAt: string | null;
};

export type DayPayload = {
  diary: DiaryModule;
  reading: ReadingModule;
  gym: GymModule;
};

export type DayRecord = {
  id: string;
  user_id: string;
  local_date: string;
  timezone: string;
  payload: DayPayload;
  created_at: string;
  updated_at: string;
};

export type TemplateRow = {
  id: string;
  user_id: string;
  name: string;
  schema_version: number;
  source_json: unknown;
  normalized_payload: WorkoutTemplate;
  is_active: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

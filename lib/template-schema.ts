import { z } from "zod";

import { TEMPLATE_FIELD_KEYS, type TemplateExercise, type WorkoutTemplate } from "@/lib/types";

const fieldSchema = z.enum(TEMPLATE_FIELD_KEYS);

const templateSchema = z.object({
  schemaVersion: z.literal(1),
  name: z.string().trim().min(1).max(80),
  exercises: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(80).optional(),
        name: z.string().trim().min(1).max(120),
        fields: z
          .array(fieldSchema)
          .min(1)
          .max(TEMPLATE_FIELD_KEYS.length)
          .superRefine((value, ctx) => {
            const unique = new Set(value);
            if (unique.size !== value.length) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Exercise fields must be unique."
              });
            }
          })
      })
    )
    .min(1)
    .max(40)
});

export function getTemplateExample(): string {
  return JSON.stringify(
    {
      schemaVersion: 1,
      name: "Upper Day",
      exercises: [
        {
          name: "Bench Press",
          fields: ["sets", "reps", "weight"]
        },
        {
          name: "Pull-Ups",
          fields: ["sets", "reps"]
        }
      ]
    },
    null,
    2
  );
}

function slugifyExerciseId(name: string, index: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return base ? `${base}-${index + 1}` : `exercise-${index + 1}`;
}

function normalizeExerciseIds(exercises: TemplateExercise[]): TemplateExercise[] {
  const seen = new Set<string>();

  return exercises.map((exercise, index) => {
    let id = exercise.id ?? slugifyExerciseId(exercise.name, index);

    while (seen.has(id)) {
      id = `${id}-${index + 1}`;
    }

    seen.add(id);

    return {
      ...exercise,
      id
    };
  });
}

export function parseTemplateSource(source: string): {
  parsedSource: unknown;
  normalized: WorkoutTemplate;
} {
  let parsed: unknown;

  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error("Template JSON could not be parsed.");
  }

  const template = templateSchema.parse(parsed);

  return {
    parsedSource: parsed,
    normalized: {
      schemaVersion: 1,
      name: template.name,
      exercises: normalizeExerciseIds(template.exercises as TemplateExercise[])
    }
  };
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { getDayStrength, getModuleCompletion } from "@/lib/derived-status";
import type { DayPayload, GymModule, TemplateExercise, TemplateFieldKey } from "@/lib/types";

type SaveState = "idle" | "saving" | "saved" | "error";

type TodayShellProps = {
  initialPayload: DayPayload;
  localDate: string;
  timezone: string;
  eyebrow?: string;
  helperText?: string;
};

function statusLabel(state: SaveState) {
  switch (state) {
    case "saving":
      return "Saving";
    case "saved":
      return "Saved";
    case "error":
      return "Retry needed";
    default:
      return "Idle";
  }
}

function countCompletedExercises(gym: GymModule) {
  const snapshot = gym.snapshot;
  if (!snapshot) {
    return {
      completed: 0,
      total: 0
    };
  }

  const completed = snapshot.exercises.filter((exercise) =>
    exercise.fields.every((field) => {
      const value = gym.entries[exercise.id]?.[field];
      return typeof value === "number" && Number.isFinite(value);
    })
  ).length;

  return {
    completed,
    total: snapshot.exercises.length
  };
}

export function TodayShell({ initialPayload, localDate, timezone, eyebrow = "Today", helperText }: TodayShellProps) {
  const [payload, setPayload] = useState(initialPayload);
  const [saveState, setSaveState] = useState<Record<"diary" | "reading" | "gym", SaveState>>({
    diary: "idle",
    reading: "idle",
    gym: "idle"
  });

  const readingTimer = useRef<number | null>(null);
  const gymTimer = useRef<number | null>(null);
  const didBootReading = useRef(false);
  const didBootGym = useRef(false);
  const skipNextReadingSave = useRef(false);
  const skipNextGymSave = useRef(false);

  const completion = useMemo(() => getModuleCompletion(payload), [payload]);
  const strength = useMemo(() => getDayStrength(payload), [payload]);
  const gymProgress = useMemo(() => countCompletedExercises(payload.gym), [payload.gym]);

  async function persistModule(module: "diary" | "reading" | "gym", value: DayPayload[typeof module]) {
    setSaveState((current) => ({
      ...current,
      [module]: "saving"
    }));

    try {
      const response = await fetch("/api/day", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          localDate,
          timezone,
          module,
          value
        })
      });

      const next = await response.json();
      if (!response.ok) {
        throw new Error(next.error ?? "Save failed.");
      }

      if (module === "reading") {
        skipNextReadingSave.current = true;
      }

      if (module === "gym") {
        skipNextGymSave.current = true;
      }

      setPayload(next.payload);
      setSaveState((current) => ({
        ...current,
        [module]: "saved"
      }));
    } catch {
      setSaveState((current) => ({
        ...current,
        [module]: "error"
      }));
    }
  }

  useEffect(() => {
    if (!didBootReading.current) {
      didBootReading.current = true;
      return;
    }

    if (skipNextReadingSave.current) {
      skipNextReadingSave.current = false;
      return;
    }

    window.clearTimeout(readingTimer.current ?? undefined);
    setSaveState((current) => ({ ...current, reading: "saving" }));

    readingTimer.current = window.setTimeout(() => {
      void persistModule("reading", {
        ...payload.reading,
        updatedAt: new Date().toISOString()
      });
    }, 500);

    return () => {
      window.clearTimeout(readingTimer.current ?? undefined);
    };
  }, [payload.reading.bookTitle, payload.reading.notes]);

  useEffect(() => {
    if (!didBootGym.current) {
      didBootGym.current = true;
      return;
    }

    if (skipNextGymSave.current) {
      skipNextGymSave.current = false;
      return;
    }

    window.clearTimeout(gymTimer.current ?? undefined);
    setSaveState((current) => ({ ...current, gym: "saving" }));

    gymTimer.current = window.setTimeout(() => {
      void persistModule("gym", {
        ...payload.gym,
        updatedAt: new Date().toISOString()
      });
    }, 600);

    return () => {
      window.clearTimeout(gymTimer.current ?? undefined);
    };
  }, [payload.gym]);

  function updateExerciseValue(exercise: TemplateExercise, field: TemplateFieldKey, nextValue: number | null) {
    setPayload((current) => ({
      ...current,
      gym: {
        ...current.gym,
        entries: {
          ...current.gym.entries,
          [exercise.id]: {
            ...current.gym.entries[exercise.id],
            [field]: nextValue
          }
        }
      }
    }));
  }

  return (
    <div className="grid-two">
      <section className="stack">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h1 className="page-title">{localDate}</h1>
              <p className="muted-copy">{helperText ?? `Timezone: ${timezone}`}</p>
            </div>
            <div className="summary-chip-row">
              <div className="summary-chip">
                <strong>Day</strong>
                <span>{strength}</span>
              </div>
              <div className="summary-chip">
                <strong>Gym</strong>
                <span>
                  {gymProgress.completed}/{gymProgress.total || "0"}
                </span>
              </div>
            </div>
          </div>
          <div className="summary-chip-row">
            <div className="summary-chip">
              <strong>Diary</strong>
              <span>{completion.diary ? "done" : "still to do"}</span>
            </div>
            <div className="summary-chip">
              <strong>Reading</strong>
              <span>{completion.reading ? "done" : "still to do"}</span>
            </div>
            <div className="summary-chip">
              <strong>Gym</strong>
              <span>{completion.gym ? "done" : "still to do"}</span>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Gym</p>
              <h2>{payload.gym.templateName ?? "No active template"}</h2>
            </div>
            <span className="status-pill" data-state={saveState.gym}>
              {statusLabel(saveState.gym)}
            </span>
          </div>

          {payload.gym.snapshot ? (
            <div className="gym-grid">
              {payload.gym.snapshot.exercises.map((exercise) => (
                <div key={exercise.id} className="exercise-row">
                  <div>
                    <strong>{exercise.name}</strong>
                  </div>
                  <div className="exercise-fields">
                    {exercise.fields.map((field) => {
                      const currentValue = payload.gym.entries[exercise.id]?.[field] ?? null;
                      return (
                        <div key={field}>
                          <p className="eyebrow">{field}</p>
                          <div className="stepper">
                            <button
                              type="button"
                              onClick={() => updateExerciseValue(exercise, field, Math.max(0, (currentValue ?? 0) - 1))}
                              aria-label={`Decrease ${field} for ${exercise.name}`}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={currentValue ?? ""}
                              onChange={(event) => {
                                const next = event.target.value === "" ? null : Number(event.target.value);
                                updateExerciseValue(exercise, field, Number.isFinite(next) ? next : null);
                              }}
                              aria-label={`${field} for ${exercise.name}`}
                            />
                            <button
                              type="button"
                              onClick={() => updateExerciseValue(exercise, field, (currentValue ?? 0) + 1)}
                              aria-label={`Increase ${field} for ${exercise.name}`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel empty-state">
              <p className="eyebrow">No active template</p>
              <p className="muted-copy">
                Import a workout template first, then today&apos;s gym log will render here automatically.
              </p>
              <Link href="/templates" className="secondary-link">
                Go to templates
              </Link>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Reading</p>
              <h2>One book is enough for today.</h2>
            </div>
            <span className="status-pill" data-state={saveState.reading}>
              {statusLabel(saveState.reading)}
            </span>
          </div>
          <label className="stack">
            <span className="eyebrow">Book title</span>
            <input
              className="field"
              value={payload.reading.bookTitle}
              onChange={(event) =>
                setPayload((current) => ({
                  ...current,
                  reading: {
                    ...current.reading,
                    bookTitle: event.target.value
                  }
                }))
              }
              placeholder="Deep Work"
            />
          </label>
          <label className="stack">
            <span className="eyebrow">Optional notes</span>
            <textarea
              className="textarea"
              value={payload.reading.notes}
              onChange={(event) =>
                setPayload((current) => ({
                  ...current,
                  reading: {
                    ...current.reading,
                    notes: event.target.value
                  }
                }))
              }
              placeholder="Key idea, page number, or quick reaction."
            />
          </label>
        </section>
      </section>

      <aside className="stack">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Diary</p>
              <h2>Keep it binary.</h2>
            </div>
            <span className="status-pill" data-state={saveState.diary}>
              {statusLabel(saveState.diary)}
            </span>
          </div>
          <div className="checkbox-row">
            <div>
              <strong>{payload.diary.completed ? "Diary done" : "Diary still open"}</strong>
              <p className="muted-copy">This stays a single checkbox by design.</p>
            </div>
            <input
              type="checkbox"
              checked={payload.diary.completed}
              onChange={(event) => {
                const nextDiary = {
                  completed: event.target.checked,
                  updatedAt: new Date().toISOString()
                };
                setPayload((current) => ({
                  ...current,
                  diary: nextDiary
                }));
                void persistModule("diary", nextDiary);
              }}
              aria-label="Mark diary complete"
            />
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">Notes</p>
          <ul className="detail-list muted-copy">
            <li>Gym saves in short background batches.</li>
            <li>Reading saves after a short pause.</li>
            <li>Diary saves immediately.</li>
          </ul>
          <Link href="/calendar" className="secondary-link">
            Review the month
          </Link>
        </section>
      </aside>
    </div>
  );
}

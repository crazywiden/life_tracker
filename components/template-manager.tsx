"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { TemplateRow, WorkoutTemplate } from "@/lib/types";

type TemplateManagerProps = {
  initialTemplates: TemplateRow[];
  exampleSource: string;
};

export function TemplateManager({ initialTemplates, exampleSource }: TemplateManagerProps) {
  const router = useRouter();
  const [source, setSource] = useState(exampleSource);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [imported, setImported] = useState<TemplateRow | null>(null);
  const [templates, setTemplates] = useState(initialTemplates);

  const activeTemplateId = useMemo(
    () => templates.find((template) => template.is_active && !template.archived_at)?.id ?? null,
    [templates]
  );

  async function importTemplate() {
    setError(null);
    setStatus("Importing template...");

    const response = await fetch("/api/templates/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ source })
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus(null);
      setError(data.error ?? "Import failed.");
      return;
    }

    setImported(data.template);
    setTemplates((current) => [data.template, ...current]);
    setStatus("Template imported. Preview it, then activate it.");
  }

  async function activateTemplate(templateId: string) {
    setError(null);
    setStatus("Activating template...");

    const response = await fetch(`/api/templates/${templateId}/activate`, {
      method: "POST"
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus(null);
      setError(data.error ?? "Activation failed.");
      return;
    }

    setTemplates((current) =>
      current.map((template) => ({
        ...template,
        is_active: template.id === templateId
      }))
    );
    setStatus("Template activated for future workouts.");
    router.refresh();
  }

  function handleFileImport(file: File | undefined) {
    if (!file) {
      return;
    }

    void file.text().then((text) => {
      setSource(text);
      setStatus(`Loaded ${file.name}.`);
    });
  }

  const previewTemplate = imported?.normalized_payload as WorkoutTemplate | undefined;

  return (
    <div className="grid-two">
      <section className="stack">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Import</p>
              <h1 className="page-title">Bring in a workout template.</h1>
            </div>
          </div>
          {error ? <div className="error-banner">{error}</div> : null}
          {status ? <div className="success-banner">{status}</div> : null}
          <div className="stack">
            <label>
              <span className="eyebrow">JSON file</span>
              <input type="file" accept="application/json" onChange={(event) => handleFileImport(event.target.files?.[0])} />
            </label>
            <label>
              <span className="eyebrow">Template source</span>
              <textarea className="json-input" value={source} onChange={(event) => setSource(event.target.value)} />
            </label>
            <button type="button" className="primary-button" onClick={() => void importTemplate()}>
              Import template
            </button>
          </div>
        </section>

        {previewTemplate ? (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Preview</p>
                <h2>{previewTemplate.name}</h2>
              </div>
              {imported ? (
                <button type="button" className="secondary-button" onClick={() => void activateTemplate(imported.id)}>
                  Set as active template
                </button>
              ) : null}
            </div>
            <ul className="detail-list">
              {previewTemplate.exercises.map((exercise) => (
                <li key={exercise.id}>
                  <strong>{exercise.name}</strong> — {exercise.fields.join(", ")}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>

      <aside className="stack">
        <section className="panel">
          <p className="eyebrow">Current templates</p>
          <div className="template-list">
            {templates.length === 0 ? (
              <div className="template-card empty-state">
                <p className="muted-copy">No templates yet. Import your first one to unlock gym logging.</p>
              </div>
            ) : null}
            {templates.map((template) => {
              const preview = template.normalized_payload as WorkoutTemplate;
              return (
                <div key={template.id} className="template-card" data-active={template.id === activeTemplateId}>
                  <div className="panel-header">
                    <div>
                      <strong>{template.name}</strong>
                      <p className="muted-copy">{template.is_active ? "Active for new workouts" : "Stored for reference"}</p>
                    </div>
                    {!template.is_active ? (
                      <button type="button" className="ghost-button" onClick={() => void activateTemplate(template.id)}>
                        Activate
                      </button>
                    ) : null}
                  </div>
                  <ul className="detail-list">
                    {preview.exercises.map((exercise) => (
                      <li key={exercise.id}>
                        {exercise.name}: {exercise.fields.join(", ")}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      </aside>
    </div>
  );
}

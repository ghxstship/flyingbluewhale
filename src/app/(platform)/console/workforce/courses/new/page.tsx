"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/Shell";
import { AICourseGenerator } from "./AICourseGenerator";

type Tab = "manual" | "ai";

export default function Page() {
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>("manual");
  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [duration, setDuration] = React.useState("");
  const [role, setRole] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/courses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim() || undefined,
          duration_minutes: duration ? Number(duration) : undefined,
          required_for_role: role.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json?.ok) {
        toast.error(json?.error?.message ?? "Failed to create course");
        return;
      }
      toast.success("Course created");
      router.push(`/console/workforce/courses/${json.data.id}`);
    } catch {
      toast.error("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  }

  function fillFromAI(course: { title: string; summary: string; lessons: { title: string; objective: string }[] }) {
    setTitle(course.title);
    const lessonText = course.lessons
      .map((l, i) => `${i + 1}. ${l.title}: ${l.objective}`)
      .join("\n");
    setSummary(course.summary + (lessonText ? `\n\nLesson outline:\n${lessonText}` : ""));
    setTab("manual");
    toast.success("Course outline applied — review and save");
  }

  return (
    <>
      <ModuleHeader eyebrow="Training" title="New Course" />
      <div className="page-content max-w-2xl space-y-5">
        <div className="flex gap-1 border-b border-[var(--border-color)] pb-0">
          {(["manual", "ai"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? "border-[var(--brand-color,var(--org-primary))] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t === "manual" ? "Manual" : "✦ AI Generate"}
            </button>
          ))}
        </div>

        {tab === "ai" ? (
          <AICourseGenerator onAccept={fillFromAI} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                Title <span className="text-[var(--color-error)]">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                placeholder="Course title"
                className="input-base mt-1.5 w-full"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Summary</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={5}
                maxLength={2000}
                className="input-base mt-1.5 w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)]">Duration (minutes)</label>
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  type="number"
                  min={1}
                  max={600}
                  placeholder="e.g. 30"
                  className="input-base mt-1.5 w-full"
                />
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">Shown to assignee on /m/learning.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)]">Required for role</label>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  maxLength={80}
                  placeholder="e.g. Rigger"
                  className="input-base mt-1.5 w-full"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={submitting || !title.trim()} className="btn btn-primary flex-1">
                {submitting ? "Creating…" : "Create Course"}
              </button>
              <a href="/console/workforce/courses" className="btn btn-secondary">
                Cancel
              </a>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

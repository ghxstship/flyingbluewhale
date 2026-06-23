"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { QuizQuestion } from "@/components/ui/QuizQuestion";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { submitAttemptAction } from "../../actions";

export type RunnerQuestion = { id: string; prompt: string; options: string[] };

/**
 * Real-assessment harness. Unlike the sample QuizRunner this NEVER receives
 * the correct answers — it collects the learner's selections and submits them
 * to the server action, which scores against the question bank and (on a pass)
 * issues the course certification. Shows the returned score + pass/fail.
 */
export function AssessmentRunner({
  courseId,
  assessmentId,
  passPct,
  questions,
}: {
  courseId: string;
  assessmentId: string;
  passPct: number;
  questions: RunnerQuestion[];
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1));
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ passed?: boolean; scorePct?: number; error?: string } | null>(null);

  const q = questions[index];
  const current = answers[index] ?? -1;

  if (result && result.error == null) {
    const passed = !!result.passed;
    return (
      <div className="surface space-y-4 p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--p-text-3)]">Assessment complete</p>
        <p className="text-3xl font-bold" style={{ color: passed ? "var(--p-success)" : "var(--p-danger)" }}>
          {result.scorePct}%
        </p>
        <p className="text-sm text-[var(--p-text-2)]">{passed ? `Passed — needed ${passPct}%.` : `Not yet — needed ${passPct}%. Try again.`}</p>
        <Link href={`/legend/learn/${courseId}`} className="ps-btn ps-btn--cta ps-btn--lg" style={{ minHeight: 44 }}>
          Back to course
        </Link>
      </div>
    );
  }

  const select = (i: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = i;
      return next;
    });
  };

  const last = index + 1 >= questions.length;
  const submit = () => {
    start(async () => {
      const res = await submitAttemptAction(assessmentId, answers);
      setResult(res);
    });
  };

  if (!q) return null;

  return (
    <div className="surface space-y-5 p-6">
      <ProgressBar value={Math.round(((index + 1) / questions.length) * 100)} aria-label="Assessment progress" />
      <QuizQuestion
        prompt={q.prompt}
        options={q.options}
        selected={current >= 0 ? current : undefined}
        onSelect={select}
        index={index + 1}
        total={questions.length}
      />
      {result?.error && (
        <p className="ps-alert ps-alert--danger" role="alert">
          {result.error}
        </p>
      )}
      <div className="flex justify-between gap-2">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="ps-btn ps-btn--secondary"
          style={{ minHeight: 44 }}
        >
          Back
        </button>
        {last ? (
          <button
            type="button"
            onClick={submit}
            disabled={pending || current < 0}
            className="ps-btn ps-btn--cta"
            style={{ minHeight: 44 }}
          >
            {pending ? "Scoring…" : "Submit"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIndex((i) => i + 1)}
            disabled={current < 0}
            className="ps-btn ps-btn--cta"
            style={{ minHeight: 44 }}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

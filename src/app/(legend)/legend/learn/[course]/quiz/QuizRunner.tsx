"use client";

import * as React from "react";
import { QuizQuestion } from "@/components/ui/QuizQuestion";
import { Button } from "@/components/ui/Button";
import type { QuizItem } from "../../sample";

export type QuizRunnerProps = {
  items: QuizItem[];
  startIndex: number;
};

/**
 * Client harness for the kit v7 <QuizQuestion> primitive: walks the course
 * quiz, tracks the selection, reveals correctness, scores, and links back to
 * the catalog at the end.
 */
export function QuizRunner({ items, startIndex }: QuizRunnerProps): React.ReactElement {
  const [index, setIndex] = React.useState(startIndex);
  const [selected, setSelected] = React.useState<number | undefined>(undefined);
  const [revealed, setRevealed] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const item = items[index];

  if (done || !item) {
    return (
      <div className="space-y-4 rounded-[var(--p-r-lg,12px)] border border-[var(--p-border)] bg-[var(--p-surface)] p-6 text-center">
        <p className="font-mono text-xs tracking-[0.12em] text-[var(--p-text-3)] uppercase">Quiz complete</p>
        <p className="text-2xl font-bold text-[var(--p-text-1)]">
          {score} / {items.length}
        </p>
        <Button href="/legend/learn" variant="cta" className="inline-block">
          Back to courses
        </Button>
      </div>
    );
  }

  const check = () => {
    if (selected == null) return;
    if (selected === item.correctIndex) setScore((s) => s + 1);
    setRevealed(true);
  };

  const advance = () => {
    if (index + 1 >= items.length) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(undefined);
    setRevealed(false);
  };

  return (
    <div className="space-y-5 rounded-[var(--p-r-lg,12px)] border border-[var(--p-border)] bg-[var(--p-surface)] p-6">
      <QuizQuestion
        prompt={item.prompt}
        options={item.options}
        selected={selected}
        onSelect={(i) => !revealed && setSelected(i)}
        correctIndex={item.correctIndex}
        revealed={revealed}
        index={index + 1}
        total={items.length}
      />
      <div className="flex justify-end gap-2">
        {!revealed ? (
          <Button type="button" variant="cta" onClick={check} disabled={selected == null}>
            Check answer
          </Button>
        ) : (
          <Button type="button" variant="cta" onClick={advance}>
            {index + 1 >= items.length ? "Finish" : "Next question"}
          </Button>
        )}
      </div>
    </div>
  );
}

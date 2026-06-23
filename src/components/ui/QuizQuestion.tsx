"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * QuizQuestion — a single multiple-choice question: an eyebrow position
 * counter, a prompt, and a list of selectable option buttons. When `revealed`,
 * the correct option reads in the success tone, an incorrect selection reads in
 * the danger tone, and input is locked. Ported from the ATLVS kit
 * (kits/core/components/learning/QuizQuestion.d.ts).
 */
export type QuizOption = string | { label: ReactNode };

export function QuizQuestion({
  prompt,
  options,
  selected,
  onSelect,
  correctIndex,
  revealed = false,
  index,
  total,
  className = "",
  style,
}: {
  prompt: ReactNode;
  options: QuizOption[];
  /** Index of the chosen option. */
  selected?: number;
  onSelect?: (i: number) => void;
  correctIndex?: number;
  /** Lock input and surface correct / incorrect tones. */
  revealed?: boolean;
  /** 1-based position, for the "Question n / total" eyebrow. */
  index?: number;
  total?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const labelOf = (o: QuizOption): ReactNode => (typeof o === "string" ? o : o.label);

  return (
    <div className={className} style={style}>
      {(index != null || total != null) && (
        <div
          style={{
            fontFamily: "var(--p-mono)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--p-text-3)",
            marginBottom: 6,
          }}
        >
          Question {index ?? 1}
          {total != null ? ` / ${total}` : ""}
        </div>
      )}
      <div style={{ color: "var(--p-text-1)", fontWeight: 700, fontSize: 16, marginBottom: 12, lineHeight: 1.4 }}>{prompt}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((o, i) => {
          const isSelected = selected === i;
          const isCorrect = revealed && correctIndex === i;
          const isWrongPick = revealed && isSelected && correctIndex !== i;

          let borderColor = "var(--p-border)";
          let bg = "var(--p-surface)";
          let tone = "var(--p-text-1)";
          if (isCorrect) {
            borderColor = "var(--p-success)";
            bg = "color-mix(in srgb, var(--p-success) 12%, var(--p-surface))";
            tone = "var(--p-success)";
          } else if (isWrongPick) {
            borderColor = "var(--p-danger)";
            bg = "color-mix(in srgb, var(--p-danger) 12%, var(--p-surface))";
            tone = "var(--p-danger)";
          } else if (isSelected) {
            borderColor = "var(--p-accent)";
            bg = "color-mix(in srgb, var(--p-accent) 8%, var(--p-surface))";
          }

          return (
            <button
              key={i}
              type="button"
              disabled={revealed}
              aria-pressed={isSelected}
              onClick={() => onSelect?.(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                textAlign: "start",
                padding: "12px 14px",
                border: `1px solid ${borderColor}`,
                borderRadius: "var(--p-r, 8px)",
                background: bg,
                color: tone,
                cursor: revealed ? "default" : "pointer",
                font: "inherit",
                fontSize: 14,
                fontWeight: isSelected || isCorrect ? 600 : 400,
                transition: "border-color var(--motion-fast) var(--ease-standard), background var(--motion-fast) var(--ease-standard)",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 22,
                  height: 22,
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "999px",
                  border: `1px solid ${isSelected || isCorrect || isWrongPick ? "currentColor" : "var(--p-border-2)"}`,
                  fontSize: 12,
                  fontFamily: "var(--p-mono)",
                }}
              >
                {isCorrect ? "✓" : isWrongPick ? "✕" : String.fromCharCode(65 + i)}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>{labelOf(o)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { AICourseGenerator } from "./AICourseGenerator";
import { ManualCourseForm } from "./ManualCourseForm";

export function CourseNewToggle() {
  const [mode, setMode] = useState<"ai" | "manual">("ai");

  return mode === "ai" ? (
    <AICourseGenerator onSwitch={() => setMode("manual")} />
  ) : (
    <ManualCourseForm onSwitch={() => setMode("ai")} />
  );
}

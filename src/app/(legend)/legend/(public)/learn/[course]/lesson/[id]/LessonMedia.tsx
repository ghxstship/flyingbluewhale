"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MediaPlayer } from "@/components/ui/MediaPlayer";
import { completeLessonAction, saveLessonProgressAction } from "../../../actions";

/**
 * LessonMedia — MediaPlayer wrapper for a real (authenticated) lesson that
 * makes resume durable (audit D-27):
 *
 *  - Seeds the player's localStorage resume slot from the server-side
 *    `lesson_progress.position_seconds` (max of the two wins), so a learner
 *    picks up where they left off on ANY device.
 *  - Persists position back to `lesson_progress` on a throttle (every ~15s
 *    of playback) via `saveLessonProgressAction`.
 *  - Auto-completes the lesson at >= 90% watched (or media end) through the
 *    existing `completeLessonAction`, then refreshes so the page reflects it.
 */
export function LessonMedia({
  courseId,
  lessonId,
  src,
  kind,
  eyebrow,
  title,
  serverPositionSeconds,
  alreadyDone,
}: {
  courseId: string;
  lessonId: string;
  src: string;
  kind: "video" | "audio";
  eyebrow: string;
  title: string;
  serverPositionSeconds: number;
  alreadyDone: boolean;
}) {
  const router = useRouter();
  const resumeKey = `legend:${courseId}:${lessonId}`;
  const lastSavedRef = useRef(0);
  const completingRef = useRef(false);
  const [seeded, setSeeded] = useState(false);

  // Cross-device seed: take the greater of localStorage vs server position.
  useEffect(() => {
    try {
      const slot = `media-resume:${resumeKey}`;
      const local = Number(localStorage.getItem(slot));
      const best = Math.max(Number.isFinite(local) ? local : 0, serverPositionSeconds);
      if (best > 0) localStorage.setItem(slot, String(best));
    } catch {
      // Storage unavailable — server resume still applies next visit.
    }
    setSeeded(true);
  }, [resumeKey, serverPositionSeconds]);

  const persist = (seconds: number) => {
    const fd = new FormData();
    fd.set("course_id", courseId);
    fd.set("lesson_id", lessonId);
    fd.set("position_seconds", String(Math.floor(seconds)));
    void saveLessonProgressAction(null, fd).catch(() => {});
  };

  const complete = (seconds: number) => {
    if (alreadyDone || completingRef.current) return;
    completingRef.current = true;
    const fd = new FormData();
    fd.set("course_id", courseId);
    fd.set("lesson_id", lessonId);
    fd.set("position_seconds", String(Math.floor(seconds)));
    void completeLessonAction(null, fd)
      .then(() => router.refresh())
      .catch(() => {
        completingRef.current = false;
      });
  };

  const onProgress = (fraction: number, seconds: number) => {
    if (fraction >= 0.9) complete(seconds);
    if (seconds - lastSavedRef.current >= 15) {
      lastSavedRef.current = seconds;
      persist(seconds);
    }
  };

  // Hold the player one paint until the resume slot is seeded so the
  // restore-on-loadedmetadata reads the merged position.
  if (!seeded) return <div className="surface" style={{ aspectRatio: kind === "video" ? "16 / 9" : "auto" }} />;

  return (
    <MediaPlayer
      src={src}
      kind={kind}
      eyebrow={eyebrow}
      title={title}
      resumeKey={resumeKey}
      onProgress={onProgress}
      onEnded={() => complete(lastSavedRef.current)}
    />
  );
}

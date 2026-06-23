import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";

/**
 * Render smoke for the v7 kit components ported in the design-kit refactor
 * (Phase 2). Each must mount without throwing in jsdom — the floor that keeps
 * a token typo or a bad ref from silently shipping. Behavior is covered where
 * it has logic; this guards "it renders at all" across the whole new set.
 */
import { LineChart, AreaChart } from "@/components/charts/LineChart";
import { DonutChart } from "@/components/charts/DonutChart";
import {
  Accordion,
  RichTextEditor,
  SignaturePad,
  FileViewer,
  MediaPlayer,
  QuizQuestion,
  FloorPlan,
  CoordinateMatrix,
  Coordinate,
  GanttChart,
} from "@/components/ui";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("kit components — render smoke", () => {
  const series = [
    { label: "Jan", value: 10 },
    { label: "Feb", value: 24 },
    { label: "Mar", value: 18 },
  ];

  it("charts mount (LineChart / AreaChart / DonutChart)", () => {
    expect(() => render(<LineChart data={series} />)).not.toThrow();
    expect(() => render(<AreaChart data={series} />)).not.toThrow();
    expect(() =>
      render(<DonutChart data={[{ label: "A", value: 3 }, { label: "B", value: 7 }]} centerLabel="10" centerSub="total" />),
    ).not.toThrow();
  });

  it("disclosure + editors mount (Accordion / RichTextEditor / SignaturePad)", () => {
    expect(() => render(<Accordion items={[{ title: "Q", content: "A" }]} />)).not.toThrow();
    expect(() => render(<RichTextEditor defaultValue="<p>hi</p>" />)).not.toThrow();
    expect(() => render(<SignaturePad label="Sign here" />)).not.toThrow();
  });

  it("media + assessment mount (FileViewer / MediaPlayer / QuizQuestion)", () => {
    expect(() => render(<FileViewer src="/x.png" name="x.png" kind="image" />)).not.toThrow();
    expect(() => render(<MediaPlayer src="/x.mp4" title="Lesson 1" eyebrow="Module" />)).not.toThrow();
    expect(() =>
      render(<QuizQuestion prompt="2+2?" options={["3", "4", "5"]} index={1} total={3} correctIndex={1} />),
    ).not.toThrow();
  });

  it("spatial + coordinate mount (FloorPlan / CoordinateMatrix / Coordinate / GanttChart)", () => {
    expect(() =>
      render(<FloorPlan placements={[{ id: "p1", x: 50, y: 50, label: "Gate" }]} selectedId="p1" />),
    ).not.toThrow();
    expect(() =>
      render(
        <CoordinateMatrix
          longitude={[{ id: "design", label: "Design" }]}
          latitude={[{ id: "build", label: "Build" }]}
          cells={[{ x: "design", y: "build", value: 4 }]}
        />,
      ),
    ).not.toThrow();
    expect(() => render(<Coordinate longitude="Build" latitude="Design" />)).not.toThrow();
    expect(() =>
      render(<GanttChart rows={[{ id: "t1", label: "Task", start: 1, end: 5 }]} today={3} />),
    ).not.toThrow();
  });
});

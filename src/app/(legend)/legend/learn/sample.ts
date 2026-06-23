/**
 * LEG3ND public-funnel course fixtures. The /legend/learn surface is the public
 * LMS preview (anonymous, no org RLS read), so it renders self-contained sample
 * courses that showcase the MediaPlayer + QuizQuestion archetypes. Authenticated
 * learners get their real org courses from the LEG3ND LMS (legend_courses), rendered
 * by this same /legend/learn surface keyed on a real course UUID.
 */
export type Lesson = {
  id: string;
  title: string;
  eyebrow: string;
  durationLabel: string;
  /** Same-origin media path. A poster always renders; the clip is a preview placeholder. */
  src: string;
  poster: string;
  body: string;
};

export type QuizItem = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export type Course = {
  slug: string;
  title: string;
  summary: string;
  lessons: Lesson[];
  quiz: QuizItem[];
};

const POSTER = "/brand/atlvs-mark.svg";

export const COURSES: Course[] = [
  {
    slug: "wayfinding-foundations",
    title: "Wayfinding Foundations",
    summary:
      "How the airport-signage system works: the AIGA / U.S. DOT symbol set, the two-color rule, and category tones.",
    lessons: [
      {
        id: "the-standard",
        title: "The Standard",
        eyebrow: "Lesson 1",
        durationLabel: "6 min",
        src: "/legend/learn/preview.mp4",
        poster: POSTER,
        body: "The 60 public-domain AIGA / U.S. DOT symbols are the sole pictogram set. Each is normalized to a 48×48 box and colors from currentColor.",
      },
      {
        id: "two-color-rule",
        title: "The Two-Color Rule",
        eyebrow: "Lesson 2",
        durationLabel: "8 min",
        src: "/legend/learn/preview.mp4",
        poster: POSTER,
        body: "Every sign is exactly POSITIVE (the symbol, the tone legend) + NEGATIVE (the field and counters). No third color.",
      },
      {
        id: "category-tones",
        title: "Category Tones",
        eyebrow: "Lesson 3",
        durationLabel: "5 min",
        src: "/legend/learn/preview.mp4",
        poster: POSTER,
        body: "Each sign colors from its category → airport tone, driving the --sign-{tone}-field / -legend tokens.",
      },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "How many colors does a compliant sign use?",
        options: ["One", "Exactly two", "Three", "Unlimited"],
        correctIndex: 1,
      },
      {
        id: "q2",
        prompt: "Which symbol set is the canonical source?",
        options: ["Custom house glyphs", "AIGA / U.S. DOT symbols", "Emoji", "Material Icons"],
        correctIndex: 1,
      },
      {
        id: "q3",
        prompt: "What determines a sign's color?",
        options: ["Random", "The author's preference", "Its category → airport tone", "The viewer's theme"],
        correctIndex: 2,
      },
    ],
  },
];

export function getCourse(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

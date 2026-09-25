import type { LessonBlock, LessonContent } from "../../types";
import { LEVELS } from "../curriculum";
import { getLessonContent, lessonKey } from "../lessonContent";
import type { Deck, DeckSlide, DeckSlideKind } from "./types";

/**
 * عروض دروس الجذع المشترك العلمي المبنية على كتاب «منار التاريخ والجغرافيا».
 *
 * الكتاب الموجود في Drive مصوّر، لذلك تُعرض صفحاته الأصلية كما هي، بينما
 * تُبنى مهام القراءة وعناصر الإجابة من محتوى الدرس المنشور في المنصة.
 * الترتيب هنا هو نفس ترتيب الدروس في المقرر: التاريخ ثم الجغرافيا، ووحدات
 * كل مادة ودروسها بالترتيب الأصلي.
 */

const MINAR_PAGE_BASE = "/decks/tc-sci-minar";
const MINAR_BOOK_ID = "tc-sci-minar";
const MINAR_BOOK_TITLE = "منار التاريخ والجغرافيا";
const MINAR_BOOK_LEVEL = "الجذع المشترك العلمي والتكنولوجي";
const MINAR_FIRST_LESSON_PAGE = 14;
const MINAR_LAST_LESSON_PAGE = 240;

interface MinarLessonEntry {
  key: string;
  subjectId: "history" | "geography";
  subject: "التاريخ" | "الجغرافيا";
  unitIndex: number;
  unitTitle: string;
  lessonIndex: number;
  content: LessonContent;
}

function blockText(block: LessonBlock): string {
  if (block.type === "p") return block.text;
  if (block.type === "callout") return `${block.label}: ${block.text}`;
  if (block.type === "ul") return `${block.title ? `${block.title}: ` : ""}${block.items.join("؛ ")}`;
  return `${block.head.join(" / ")} — ${block.rows.map((row) => row.join(": ")).join("؛ ")}`;
}

function sectionText(section: LessonContent["sections"][number]): string {
  return section.blocks.map(blockText).filter(Boolean).join(" ");
}

function compact(value: string, max = 620): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max).replace(/\s+\S*$/, "").trimEnd();
  return `${cut}…`;
}

function unique(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function tcSciLessons(): MinarLessonEntry[] {
  const branch = LEVELS.find((level) => level.id === "tc")?.branches.find((item) => item.id === "tc-sci");
  if (!branch) return [];

  const entries: MinarLessonEntry[] = [];
  for (const subjectId of ["history", "geography"] as const) {
    const units = branch.units[subjectId] ?? [];
    units.forEach((unit, unitIndex) => {
      unit.lessons.forEach((lesson, lessonIndex) => {
        if (lesson.soon) return;
        const key = lessonKey("tc-sci", subjectId, unitIndex, lessonIndex);
        const content = getLessonContent(key);
        if (!content) return;
        entries.push({
          key,
          subjectId,
          subject: subjectId === "history" ? "التاريخ" : "الجغرافيا",
          unitIndex,
          unitTitle: unit.title,
          lessonIndex,
          content,
        });
      });
    });
  }
  return entries;
}

/** توزيع متصل للصفحات، مع الحفاظ على ترتيب المقرر وإتاحة كل صفحة في عرض واحد فقط. */
function allocateRanges(count: number, first: number, last: number, weights: number[]): [number, number][] {
  if (!count) return [];
  const totalPages = last - first + 1;
  const minimum = Math.min(4, Math.floor(totalPages / count));
  const remaining = totalPages - minimum * count;
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || count;
  const lengths = weights.map((weight) => minimum + Math.floor((remaining * weight) / totalWeight));
  let assigned = lengths.reduce((sum, length) => sum + length, 0);
  let cursor = 0;
  while (assigned < totalPages) {
    lengths[cursor % lengths.length] += 1;
    assigned += 1;
    cursor += 1;
  }
  while (assigned > totalPages) {
    const index = cursor % lengths.length;
    if (lengths[index] > minimum) {
      lengths[index] -= 1;
      assigned -= 1;
    }
    cursor += 1;
  }

  const ranges: [number, number][] = [];
  let start = first;
  for (const length of lengths) {
    const end = start + length - 1;
    ranges.push([start, end]);
    start = end + 1;
  }
  return ranges;
}

function slideCount(content: LessonContent, range: [number, number]): number {
  return Math.min(range[1] - range[0] + 1, Math.min(6, Math.max(3, content.sections.length + 1)));
}

function slideFor(
  content: LessonContent,
  range: [number, number],
  index: number,
  total: number,
): DeckSlide {
  const pages = Array.from({ length: range[1] - range[0] + 1 }, (_, offset) => range[0] + offset);
  const from = Math.floor((index * pages.length) / total);
  const to = Math.max(from + 1, Math.floor(((index + 1) * pages.length) / total));
  const selectedPages = pages.slice(from, Math.min(to, pages.length));
  const isIntro = index === 0;
  const isSummary = index === total - 1;
  const sectionIndex = Math.min(
    Math.max(0, content.sections.length - 1),
    Math.floor(((index - 1) * content.sections.length) / Math.max(1, total - 2)),
  );
  const section = content.sections[sectionIndex];
  const body = section ? compact(sectionText(section)) : "";
  const kind: DeckSlideKind = isIntro ? "intro" : isSummary ? "summary" : "activity";

  if (isIntro) {
    return {
      page: selectedPages[0],
      pages: selectedPages.slice(1),
      kind,
      title: `التمهيد الإشكالي: ${content.title}`,
      focus: content.coreQuestion,
      tasks: [
        {
          q: "ما الإشكالية المركزية للدرس؟",
          a: content.coreQuestion,
        },
      ],
      keys: unique([content.objectives[0] ?? "تحديد موضوع الدرس وإطاره", content.objectives[1] ?? "ربط الدرس بمكتسبات المتعلم"]).slice(0, 2),
    };
  }

  if (isSummary) {
    const summary = content.summary.filter(Boolean).slice(0, 4).join("؛ ");
    return {
      page: selectedPages[0],
      pages: selectedPages.slice(1),
      kind,
      title: `الخلاصة والتقويم: ${content.title}`,
      focus: summary || content.coreQuestion,
      tasks: [
        {
          q: "استخرج أهم خلاصات الدرس واربطها بالإشكالية المركزية.",
          a: summary || content.coreQuestion,
        },
      ],
      keys: unique([
        ...content.summary.slice(0, 3),
        ...content.glossary.slice(0, 2).map((item) => `${item.term}: ${item.def}`),
      ]).slice(0, 4),
    };
  }

  return {
    page: selectedPages[0],
    pages: selectedPages.slice(1),
    kind,
    title: section?.title ?? `محور من درس ${content.title}`,
    focus: body || content.coreQuestion,
    tasks: [
      {
        q: `ما أهم مضامين محور «${section?.title ?? content.title}»؟`,
        a: body || content.coreQuestion,
      },
    ],
    keys: unique([
      section?.title ?? content.title,
      ...content.glossary.slice(sectionIndex, sectionIndex + 2).map((item) => `${item.term}: ${item.def}`),
    ]).slice(0, 3),
  };
}

function buildDeck(entry: MinarLessonEntry, range: [number, number]): Deck {
  const count = slideCount(entry.content, range);
  const slides = Array.from({ length: count }, (_, index) => slideFor(entry.content, range, index, count));
  return {
    id: `minar-${entry.key.replace(/\./g, "-")}`,
    bookId: MINAR_BOOK_ID,
    bookTitle: MINAR_BOOK_TITLE,
    bookLevel: MINAR_BOOK_LEVEL,
    pageBase: MINAR_PAGE_BASE,
    lessonKey: entry.key,
    subject: entry.subject,
    unitNo: entry.unitIndex + 1,
    module: entry.unitTitle,
    title: entry.content.title,
    pages: range,
    problem: entry.content.coreQuestion,
    objectives: entry.content.objectives.slice(0, 6),
    concepts: entry.content.glossary.slice(0, 10).map((item) => item.term),
    slides,
    quiz: entry.content.quiz.map((item) => ({
      q: item.q,
      options: item.options,
      answer: item.answer,
      why: item.why,
    })),
  };
}

const MINAR_LESSON_ENTRIES = tcSciLessons();
const MINAR_LESSON_WEIGHTS = MINAR_LESSON_ENTRIES.map((entry) =>
  Math.max(1, entry.content.sections.length + Math.round(entry.content.sections.reduce((sum, section) => sum + sectionText(section).length, 0) / 900)),
);
const MINAR_LESSON_RANGES = allocateRanges(
  MINAR_LESSON_ENTRIES.length,
  MINAR_FIRST_LESSON_PAGE,
  MINAR_LAST_LESSON_PAGE,
  MINAR_LESSON_WEIGHTS,
);

/** عروض الدروس بالترتيب الرسمي: التاريخ أولًا، ثم الجغرافيا. */
export const MINAR_LESSON_DECKS: Deck[] = MINAR_LESSON_ENTRIES.map((entry, index) => buildDeck(entry, MINAR_LESSON_RANGES[index]));

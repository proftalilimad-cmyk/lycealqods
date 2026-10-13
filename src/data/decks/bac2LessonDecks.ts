import type { LessonBlock, LessonContent } from "../../types";
import { LEVELS } from "../curriculum";
import { getLessonContent, lessonKey } from "../lessonContent";
import type { Deck, DeckSlide, DeckSlideKind } from "./types";

/**
 * عروض دروس كتابي الثانية باكالوريا:
 * - «منار الجغرافيا — السنة الثانية باك».
 * - «في رحاب التاريخ — 2 باك آداب».
 *
 * الصور هي صفحات الكتابين المصوّرة، أما مهام الاشتغال والخلاصات والاختبارات
 * فتُبنى من محتوى الدروس المنشور في المنصة، مع سقالة مختصرة للدرس حين لا
 * يتوفر له محتوى تفصيلي مستقل بعد.
 */

const GEO_BOOK_ID = "bac2-minar-geography";
const HISTORY_BOOK_ID = "bac2-rihab-history";
const GEO_PAGE_BASE = "/decks/bac2-geography";
const HISTORY_PAGE_BASE = "/decks/bac2-history";

interface BookConfig {
  id: string;
  title: string;
  level: string;
  branchId: "bac2-arts";
  subjectId: "history" | "geography";
  subject: "التاريخ" | "الجغرافيا";
  pageBase: string;
  firstPage: number;
  lastPage: number;
}

interface LessonEntry {
  key: string;
  subject: "التاريخ" | "الجغرافيا";
  unitIndex: number;
  unitTitle: string;
  content: LessonContent;
}

const BOOKS: BookConfig[] = [
  {
    id: HISTORY_BOOK_ID,
    title: "في رحاب التاريخ — 2 باك آداب",
    level: "الثانية باكالوريا آداب وعلوم إنسانية",
    branchId: "bac2-arts",
    subjectId: "history",
    subject: "التاريخ",
    pageBase: HISTORY_PAGE_BASE,
    firstPage: 9,
    lastPage: 224,
  },
  {
    id: GEO_BOOK_ID,
    title: "منار الجغرافيا — السنة الثانية باك",
    level: "الثانية باكالوريا",
    branchId: "bac2-arts",
    subjectId: "geography",
    subject: "الجغرافيا",
    pageBase: GEO_PAGE_BASE,
    firstPage: 9,
    lastPage: 233,
  },
];

function blockText(block: LessonBlock): string {
  if (block.type === "p") return block.text;
  if (block.type === "callout") return `${block.label}: ${block.text}`;
  if (block.type === "ul") return `${block.title ? `${block.title}: ` : ""}${block.items.join("؛ ")}`;
  return `${block.head.join(" / ")} — ${block.rows.map((row) => row.join(": ")).join("؛ ")}`;
}

function sectionText(section: LessonContent["sections"][number]): string {
  return section.blocks.map(blockText).filter(Boolean).join(" ");
}

function compact(value: string, max = 650): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max).replace(/\s+\S*$/, "").trimEnd();
  return `${cut}…`;
}

function unique(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function fallbackContent(key: string, title: string, subject: "التاريخ" | "الجغرافيا"): LessonContent {
  const intro = subject === "التاريخ"
    ? `يتناول درس «${title}» تحولًا تاريخيًا ضمن البرنامج الوطني للثانية باكالوريا، من خلال ضبط الإطار الزمني والمجالي، واستخراج العوامل والمظاهر والنتائج من صفحات الكتاب.`
    : `يتناول درس «${title}» ظاهرة مجالية واقتصادية ضمن برنامج الجغرافيا للثانية باكالوريا، مع قراءة المجال والوثائق وتفسير التفاوتات والعوامل والنتائج.`;
  return {
    id: key,
    title,
    duration: "حصتان دراسيتان",
    objectives: [
      `تحديد موضوع درس «${title}» وإطاره الزمني والمجالي`,
      "استخراج المعطيات والأفكار الأساسية من وثائق الكتاب",
      subject === "التاريخ" ? "ترتيب الأحداث وربط العوامل بالنتائج" : "وصف الظاهرة المجالية وتفسير توزيعها",
      "تركيب خلاصة منظمة وتوظيف المفاهيم المناسبة",
    ],
    intro,
    coreQuestion: `ما أهم مضامين درس «${title}»؟ وما العوامل والنتائج أو التحديات المرتبطة به؟`,
    sections: [
      {
        title: "التمهيد الإشكالي وضبط المفاهيم",
        blocks: [
          { type: "p", text: intro },
          { type: "callout", tone: "info", label: "منهجية القراءة", text: "أحدد نوع الوثيقة ومصدرها ومجالها الزمني والمكاني، ثم أستخرج الفكرة الأساسية وأربطها بإشكالية الدرس." },
        ],
      },
      {
        title: "تحليل صفحات الكتاب وتركيب الأفكار",
        blocks: [
          { type: "ul", title: "خطوات الاشتغال", items: ["أستخرج المعطيات البارزة من الجداول والخرائط والنصوص.", "أرتب العناصر في محاور واضحة.", "أفسر العلاقات بين العوامل والمظاهر والنتائج.", "أصوغ خلاصة تجيب عن الإشكالية." ] },
        ],
      },
    ],
    glossary: [
      { term: subject === "التاريخ" ? "التحقيب" : "المجال", def: subject === "التاريخ" ? "تحديد الأحداث ضمن مراحل زمنية مترابطة لفهم تطورها." : "حيز جغرافي تتفاعل داخله الظواهر الطبيعية والبشرية." },
      { term: "الوثيقة", def: "مادة مكتوبة أو رقمية أو خرائطية تُستثمر لاستخراج المعطيات وبناء الاستنتاج." },
    ],
    timeline: [],
    summary: [intro, "تُبنى الإجابة الجيدة على الوصف ثم التفسير ثم التركيب، مع توظيف مفاهيم وأرقام ووثائق الكتاب."],
    examTips: [
      "أبدأ بتأطير الموضوع وطرح الإشكالية قبل تحليل الوثائق.",
      "أفصل بين الوصف والتفسير، وأستعمل روابط سببية واضحة.",
      "أختم بخلاصة مركزة تجيب عن الإشكالية ولا تعيد سرد الوثائق.",
    ],
    quiz: [
      {
        q: `ما الخطوة الأولى في الاشتغال على درس «${title}»؟`,
        options: ["تحديد الإطار والإشكالية", "حفظ الخلاصة دون قراءة الوثائق", "إهمال مصدر الوثيقة", "كتابة خاتمة قبل التحليل"],
        answer: 0,
        why: "تحديد الإطار والإشكالية يوجه قراءة الصفحات وبناء الجواب.",
      },
      {
        q: "ما الترتيب المنهجي الأنسب لتحليل وثيقة؟",
        options: ["نوع ومصدر ثم ملاحظة ثم تفسير واستنتاج", "استنتاج ثم وصف", "حفظ الأرقام دون تفسير", "قراءة العنوان فقط"],
        answer: 0,
        why: "يبدأ التحليل بالتعريف بالوثيقة، ثم الملاحظة، فالتفسير والاستنتاج.",
      },
    ],
  };
}

const ALTERNATES: Record<string, string> = {
  "bac2-arts.history.0.1": "bac2-book.history.1.0",
  "bac2-arts.history.0.2": "bac2-book.history.1.1",
  "bac2-arts.history.2.6": "bac2-sci.history.3.2",
  "bac2-arts.geography.0.3": "bac2-sci.geography.0.2",
  "bac2-arts.geography.1.0": "bac2-book.geography.1.1",
  "bac2-arts.geography.1.1": "bac2-book.geography.1.1",
  "bac2-arts.geography.1.4": "bac2-sci.geography.3.2",
  "bac2-arts.geography.2.0": "bac2-book.geography.1.0",
  "bac2-arts.geography.2.1": "bac2-sci.geography.2.0",
  "bac2-arts.geography.2.2": "bac2-sci.geography.2.1",
  "bac2-arts.geography.2.3": "bac2-book.geography.1.2",
  "bac2-arts.geography.2.4": "bac2-sci.geography.3.0",
  "bac2-arts.geography.2.5": "bac2-sci.geography.3.1",
  "bac2-arts.geography.2.6": "bac2-sci.geography.3.2",
};

function contentFor(key: string, title: string, subject: "التاريخ" | "الجغرافيا"): LessonContent {
  const direct = getLessonContent(key);
  if (direct) return direct;
  const alternate = ALTERNATES[key] ? getLessonContent(ALTERNATES[key]) : undefined;
  return alternate ? { ...alternate, id: key, title } : fallbackContent(key, title, subject);
}

function bookLessons(book: BookConfig): LessonEntry[] {
  const branch = LEVELS.find((level) => level.id === "bac2")?.branches.find((item) => item.id === book.branchId);
  if (!branch) return [];
  const entries: LessonEntry[] = [];
  const units = branch.units[book.subjectId] ?? [];
  units.forEach((unit, unitIndex) => {
    unit.lessons.forEach((lesson, lessonIndex) => {
      if (lesson.soon || !lesson.title.trim()) return;
      const key = lessonKey(book.branchId, book.subjectId, unitIndex, lessonIndex);
      entries.push({
        key,
        subject: book.subject,
        unitIndex,
        unitTitle: unit.title,
        content: contentFor(key, lesson.title, book.subject),
      });
    });
  });
  return entries;
}

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

function slideFor(content: LessonContent, range: [number, number], index: number, total: number): DeckSlide {
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
  const body = section ? compact(sectionText(section)) : content.intro;
  const kind: DeckSlideKind = isIntro ? "intro" : isSummary ? "summary" : index === total - 2 ? "eval" : "activity";

  if (isIntro) {
    return {
      page: selectedPages[0],
      pages: selectedPages.slice(1),
      kind,
      title: `التمهيد الإشكالي: ${content.title}`,
      focus: content.coreQuestion,
      tasks: [{ q: "أقرأ عنوان الدرس وأصوغ الإشكالية المركزية.", a: content.coreQuestion }],
      keys: unique(content.objectives.slice(0, 3)).slice(0, 3),
    };
  }

  if (isSummary) {
    const summary = content.summary.filter(Boolean).slice(0, 4).join("؛ ");
    return {
      page: selectedPages[0],
      pages: selectedPages.slice(1),
      kind,
      title: `الخلاصة والاختبار القبلي: ${content.title}`,
      focus: summary || content.coreQuestion,
      tasks: [{ q: "أركب خلاصة الدرس وأجيب عن الإشكالية.", a: summary || content.coreQuestion }],
      keys: unique([...content.summary.slice(0, 3), ...content.glossary.slice(0, 2).map((item) => `${item.term}: ${item.def}`)]).slice(0, 4),
    };
  }

  return {
    page: selectedPages[0],
    pages: selectedPages.slice(1),
    kind,
    title: index === total - 2 ? "تقويم التعلمات وتطبيق منهجي" : section?.title ?? `محور من درس ${content.title}`,
    focus: body || content.coreQuestion,
    tasks: [{ q: `أستخرج أهم مضامين محور «${section?.title ?? content.title}» من صفحات الكتاب.`, a: body || content.coreQuestion }],
    keys: unique([section?.title ?? content.title, ...content.glossary.slice(sectionIndex, sectionIndex + 2).map((item) => `${item.term}: ${item.def}`)]).slice(0, 3),
  };
}

function buildDeck(book: BookConfig, entry: LessonEntry, range: [number, number]): Deck {
  const count = Math.min(range[1] - range[0] + 1, Math.min(6, Math.max(3, entry.content.sections.length + 1)));
  return {
    id: `${book.id}-${entry.key.replace(/\./g, "-")}`,
    bookId: book.id,
    bookTitle: book.title,
    bookLevel: book.level,
    pageBase: book.pageBase,
    lessonKey: entry.key,
    subject: entry.subject,
    unitNo: entry.unitIndex + 1,
    module: entry.unitTitle,
    title: entry.content.title,
    pages: range,
    problem: entry.content.coreQuestion,
    objectives: entry.content.objectives.slice(0, 6),
    concepts: entry.content.glossary.slice(0, 10).map((item) => item.term),
    slides: Array.from({ length: count }, (_, index) => slideFor(entry.content, range, index, count)),
    quiz: entry.content.quiz.map((item) => ({ q: item.q, options: item.options, answer: item.answer, why: item.why })),
  };
}

function buildBookDecks(book: BookConfig): Deck[] {
  const entries = bookLessons(book);
  const weights = entries.map((entry) => Math.max(1, entry.content.sections.length + Math.round(entry.content.intro.length / 900)));
  const ranges = allocateRanges(entries.length, book.firstPage, book.lastPage, weights);
  return entries.map((entry, index) => buildDeck(book, entry, ranges[index]));
}

/** التاريخ أولًا ثم الجغرافيا، وكل كتاب يحتفظ بمدى صفحات متصل غير متداخل. */
export const BAC2_HISTORY_LESSON_DECKS = buildBookDecks(BOOKS[0]);
export const BAC2_GEOGRAPHY_LESSON_DECKS = buildBookDecks(BOOKS[1]);
export const BAC2_LESSON_DECKS: Deck[] = [...BAC2_HISTORY_LESSON_DECKS, ...BAC2_GEOGRAPHY_LESSON_DECKS];

import type { Deck } from "./types";
import { HISTORY_DECKS } from "./historyDecks";
import { GEOGRAPHY_DECKS } from "./geographyDecks";
import { MINAR_DECK } from "./minarDeck";
import { MINAR_LESSON_DECKS } from "./minarLessonDecks";
import { BAC2_LESSON_DECKS, BAC2_GEOGRAPHY_LESSON_DECKS, BAC2_HISTORY_LESSON_DECKS } from "./bac2LessonDecks";

export type { Deck, DeckSlide, DeckTask, DeckQuiz, DeckSlideKind } from "./types";
export { MINAR_LESSON_DECKS, BAC2_LESSON_DECKS, BAC2_GEOGRAPHY_LESSON_DECKS, BAC2_HISTORY_LESSON_DECKS };

/** مجلد صور صفحات الكتاب المدرسي «مورد» */
export const DECK_PAGE_BASE = "/decks/bac1-sci";
/** مجلد صور صفحات كتاب «منار» للجذع المشترك العلمي */
export const MINAR_PAGE_BASE = "/decks/tc-sci-minar";

export const DECK_BOOK = {
  id: "bac1-sci",
  title: "مورد التاريخ والجغرافيا",
  level: "السنة الأولى من سلك الباكالوريا — المسالك العلمية والتقنية",
  levelId: "bac1",
  branchIds: ["bac1-sci", "bac1-exp"],
  pageBase: DECK_PAGE_BASE,
  note: "طبعة جديدة ومنقحة — كتاب التلميذ والتلميذة (مصادق عليه من طرف وزارة التربية الوطنية).",
};

export const MINAR_BOOK = {
  id: "tc-sci-minar",
  title: "منار التاريخ والجغرافيا",
  level: "الجذع المشترك العلمي والتكنولوجي",
  pageBase: MINAR_PAGE_BASE,
  pageCount: 240,
  note: "كتاب التلميذ والتلميذة للجذع المشترك للتعليم التأهيلي؛ صفحات مصوّرة للقراءة والتكبير والتنقل التفاعلي.",
};

export const DECK_BOOKS = [DECK_BOOK, MINAR_BOOK] as const;

export const DECKS: Deck[] = [...HISTORY_DECKS, ...GEOGRAPHY_DECKS, MINAR_DECK, ...MINAR_LESSON_DECKS, ...BAC2_LESSON_DECKS];

export function pageUrl(page: number, base = DECK_PAGE_BASE): string {
  return `${base}/p${String(page).padStart(3, "0")}.webp`;
}

export function getDeck(id: string): Deck | undefined {
  return DECKS.find((d) => d.id === id);
}

/**
 * العرض المرتبط بدرس معيّن.
 *
 * عروض «مورد» وكتب الثانية باكالوريا و«منار» مرتبطة مباشرة بمفاتيح الدروس
 * المنشورة؛ لذلك يظهر زر العرض التفاعلي داخل قائمة الدروس وداخل صفحة الدرس،
 * مع بقاء كل كتاب مصدر القراءة والتنقل وحفظ التقدم.
 */
export function getDeckForLesson(lessonKey: string): Deck | undefined {
  const direct = DECKS.find((d) => d.lessonKey === lessonKey);
  if (direct) return direct;
  const [branch, ...rest] = lessonKey.split(".");
  if (branch === "bac1-exp") return DECKS.find((d) => d.lessonKey === ["bac1-sci", ...rest].join("."));
  if (branch === "tc-sci") return MINAR_DECK;
  return undefined;
}

export function deckSlideCount(d: Deck): number {
  return d.slides.length;
}

export function deckTaskCount(d: Deck): number {
  return d.slides.reduce((n, s) => n + (s.tasks?.length ?? 0), 0);
}

/** كل صفحات الكتاب التي يغطيها العرض (للتحميل المسبق) */
export function deckPages(d: Deck): number[] {
  const set = new Set<number>();
  for (const s of d.slides) {
    set.add(s.page);
    (s.pages ?? []).forEach((p) => set.add(p));
  }
  return [...set].sort((a, b) => a - b);
}

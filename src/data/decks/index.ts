import type { Deck } from "./types";
import { HISTORY_DECKS } from "./historyDecks";
import { GEOGRAPHY_DECKS } from "./geographyDecks";

export type { Deck, DeckSlide, DeckTask, DeckQuiz, DeckSlideKind } from "./types";

/** مجلد صور صفحات الكتاب المدرسي (public/decks/bac1-sci/pNNN.webp) */
export const DECK_PAGE_BASE = "/decks/bac1-sci";

export const DECK_BOOK = {
  title: "مورد التاريخ والجغرافيا",
  level: "السنة الأولى من سلك الباكالوريا — المسالك العلمية والتقنية",
  levelId: "bac1",
  branchIds: ["bac1-sci", "bac1-exp"],
  note: "طبعة جديدة ومنقحة — كتاب التلميذ والتلميذة (مصادق عليه من طرف وزارة التربية الوطنية).",
};

export const DECKS: Deck[] = [...HISTORY_DECKS, ...GEOGRAPHY_DECKS];

export function pageUrl(page: number): string {
  return `${DECK_PAGE_BASE}/p${String(page).padStart(3, "0")}.webp`;
}

export function getDeck(id: string): Deck | undefined {
  return DECKS.find((d) => d.id === id);
}

/** العرض المرتبط بدرس معيّن (يشمل المسالك المكافئة: bac1-exp ↔ bac1-sci) */
export function getDeckForLesson(lessonKey: string): Deck | undefined {
  const direct = DECKS.find((d) => d.lessonKey === lessonKey);
  if (direct) return direct;
  const [branch, ...rest] = lessonKey.split(".");
  if (branch === "bac1-exp") return DECKS.find((d) => d.lessonKey === ["bac1-sci", ...rest].join("."));
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

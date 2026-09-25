import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, ChevronLeft, ExternalLink, FileText, Globe2, GraduationCap, History, Layers, Library, MonitorPlay, Presentation, Sparkles } from "lucide-react";
import { DECKS, DECK_BOOK, MINAR_BOOK, MINAR_PAGE_BASE, deckTaskCount, pageUrl, type Deck } from "../../data/decks";
import Reveal from "../Reveal";
import type { Route } from "../../routes";
import { cn } from "../../utils/cn";

interface DecksProps {
  go: (r: Route) => void;
  initialSubject?: string;
}

const STORAGE_PREFIX = "talil_deck_progress_v1:";

function progressOf(deck: Deck): number {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + deck.id);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { done?: number[] };
    return Math.round(((parsed.done?.length ?? 0) / deck.slides.length) * 100);
  } catch {
    return 0;
  }
}

function DeckCard({ deck, onOpen }: { deck: Deck; onOpen: () => void }) {
  const progress = useMemo(() => progressOf(deck), [deck]);
  const tasks = deckTaskCount(deck);
  const isBook = Boolean(deck.isBook);
  const isFile = deck.unitNo === 0 && !isBook;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink-900/6 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-[0_25px_55px_-22px_rgba(12,124,91,0.3)]">
      <button type="button" onClick={onOpen} className="relative block aspect-[16/10] overflow-hidden bg-cream text-start">
        <img src={pageUrl(deck.slides[0].page, deck.pageBase)} alt={`${deck.title} — صفحة ${deck.slides[0].page} من الكتاب المدرسي`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/20 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <div>
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold", isFile ? "bg-gold-400 text-ink-900" : "bg-white/15 text-white ring-1 ring-white/20 backdrop-blur")}>
              {isBook ? <BookOpen className="size-3" /> : isFile ? <FileText className="size-3" /> : <Layers className="size-3" />}
              {isBook ? "قراءة الكتاب" : isFile ? "ملف موضوعاتي" : `الوحدة ${deck.unitNo}`}
            </span>
            <p className="mt-1.5 text-[11px] font-bold text-white/80">الكتاب ص {deck.pages[0]}–{deck.pages[1]}</p>
          </div>
          <span className="grid size-11 place-items-center rounded-2xl bg-white text-brand-700 shadow-lg transition-transform duration-300 group-hover:scale-110">
            <MonitorPlay className="size-5" />
          </span>
        </div>
        {progress > 0 && (
          <span className={cn("absolute end-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black", progress === 100 ? "bg-emerald-500 text-white" : "bg-white/90 text-brand-700")}>
            {progress === 100 ? "مكتمل ✓" : `${progress}%`}
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-extrabold text-brand-600">{deck.module}</p>
        <h3 className="mt-1.5 font-display text-[15px] font-black leading-relaxed text-ink-900">{deck.title}</h3>
        <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-ink-500">{deck.problem}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {deck.concepts.slice(0, 4).map((c) => (
            <span key={c} className="rounded-full bg-cream px-2.5 py-1 text-[10px] font-bold text-ink-600 ring-1 ring-ink-900/6">
              {c}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-ink-900/6 pt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] font-bold text-ink-500">
            <span className="inline-flex items-center gap-1">
              <Presentation className="size-3.5 text-brand-500" /> {deck.slides.length} شرائح
            </span>
            <span className="inline-flex items-center gap-1">
              <FileText className="size-3.5 text-gold-500" /> {tasks} مهمة
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-emerald-500" /> {deck.quiz.length} أسئلة
            </span>
          </div>
          <button type="button" onClick={onOpen} className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-gradient-to-l from-brand-600 to-brand-700 px-3.5 py-2 text-[11px] font-extrabold text-white shadow-md shadow-brand-700/25 transition-transform duration-300 group-hover:-translate-x-1">
            ابدأ العرض
            <ChevronLeft className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

type LevelId = "tc" | "bac1" | "bac2";

const LEVEL_SECTIONS: { id: LevelId; label: string; description: string }[] = [
  { id: "tc", label: "الجذع المشترك", description: "عروض كتاب «منار التاريخ والجغرافيا» ودروس الجذع المشترك العلمي." },
  { id: "bac1", label: "الأولى باكالوريا", description: "عروض كتاب «مورد التاريخ والجغرافيا» للمسالك العلمية والتقنية." },
  { id: "bac2", label: "الثانية باكالوريا", description: "عروض «منار الجغرافيا» و«في رحاب التاريخ» بصفحات الكتاب والمهام والاختبار." },
];

const SUBJECT_SECTIONS: { id: "التاريخ" | "الجغرافيا"; icon: typeof History; label: string }[] = [
  { id: "التاريخ", label: "التاريخ", icon: History },
  { id: "الجغرافيا", label: "الجغرافيا", icon: Globe2 },
];

function deckLevel(deck: Deck): LevelId {
  if (deck.bookId === MINAR_BOOK.id || deck.bookLevel?.includes("الجذع")) return "tc";
  if (deck.bookId?.startsWith("bac2") || deck.bookLevel?.includes("الثانية")) return "bac2";
  return "bac1";
}

type LibraryAction = "catalog" | "deck" | "pdf";

interface LibraryBook {
  id: string;
  title: string;
  levelLabel: string;
  subjectLabel: string;
  cover: string;
  description: string;
  stats: string[];
  action: LibraryAction;
  deckId?: string;
  sourceUrl?: string;
}

export default function Decks({ go, initialSubject }: DecksProps) {
  const [subject, setSubject] = useState<"all" | "التاريخ" | "الجغرافيا">(initialSubject === "التاريخ" || initialSubject === "الجغرافيا" ? initialSubject : "all");
  const list = DECKS.filter((d) => (subject === "all" || d.subject === subject) && (d.subject === "التاريخ" || d.subject === "الجغرافيا"));
  const primaryDecks = DECKS.filter((d) => (d.bookId ?? "bac1-sci") === DECK_BOOK.id);
  const minarDeck = DECKS.find((d) => d.isBook && d.bookId === MINAR_BOOK.id);
  const primaryTasks = primaryDecks.reduce((n, d) => n + deckTaskCount(d), 0);
  const primarySlides = primaryDecks.reduce((n, d) => n + d.slides.length, 0);
  const primaryQuizzes = primaryDecks.reduce((n, d) => n + d.quiz.length, 0);
  const minarLessonDecks = DECKS.filter((d) => d.bookId === MINAR_BOOK.id && !d.isBook);
  const bac2GeographyDecks = DECKS.filter((d) => d.bookId === "bac2-minar-geography");
  const bac2HistoryDecks = DECKS.filter((d) => d.bookId === "bac2-rihab-history");
  const levelGroups = LEVEL_SECTIONS.map((level) => ({
    ...level,
    subjects: SUBJECT_SECTIONS.map((entry) => ({
      ...entry,
      items: list.filter((deck) => deckLevel(deck) === level.id && deck.subject === entry.id),
    })),
  }));
  const libraryBooks: LibraryBook[] = [
    {
      id: DECK_BOOK.id,
      title: DECK_BOOK.title,
      levelLabel: "الأولى باكالوريا",
      subjectLabel: "التاريخ والجغرافيا",
      cover: pageUrl(1, DECK_BOOK.pageBase),
      description: DECK_BOOK.note,
      stats: [`${primaryDecks.length} عروض`, `${primarySlides} شريحة`, `${primaryTasks} مهمة`, `${primaryQuizzes} أسئلة`],
      action: "catalog",
    },
    {
      id: MINAR_BOOK.id,
      title: MINAR_BOOK.title,
      levelLabel: "الجذع المشترك",
      subjectLabel: "التاريخ والجغرافيا",
      cover: pageUrl(1, MINAR_PAGE_BASE),
      description: MINAR_BOOK.note,
      stats: [`${MINAR_BOOK.pageCount} صفحة`, `${minarLessonDecks.length} عروض دروس`, "قراءة وتكبير"],
      action: "deck",
      deckId: minarDeck?.id,
    },
    {
      id: "bac2-geography-minar",
      title: "منار الجغرافيا — السنة الثانية باك",
      levelLabel: "الثانية باكالوريا",
      subjectLabel: "الجغرافيا",
      cover: "/decks/bac2-geography/cover.jpg",
      description: "كتاب التلميذ في مادة الجغرافيا للسنة الثانية من سلك البكالوريا.",
      stats: ["233 صفحة", `${bac2GeographyDecks.length} عروض دروس`, "مهام + اختبار"],
      action: "catalog",
      sourceUrl: "https://drive.google.com/file/d/1qorNOgBE_etJ7Brx2LXs-JRpI0eTbHpH/view?usp=sharing",
    },
    {
      id: "bac2-history-rihab",
      title: "في رحاب التاريخ — 2 باك آداب",
      levelLabel: "الثانية باكالوريا",
      subjectLabel: "التاريخ",
      cover: "/decks/bac2-history/cover.jpg",
      description: "كتاب التلميذ في مادة التاريخ للسنة الثانية من سلك البكالوريا، مسلك الآداب.",
      stats: ["224 صفحة", `${bac2HistoryDecks.length} عروض دروس`, "مهام + اختبار"],
      action: "catalog",
      sourceUrl: "https://drive.google.com/file/d/13Z_QtxEJF2cvZ2Dzu1AxVGC_5vQUEszU/view?usp=sharing",
    },
  ];
  const openLibraryBook = (book: LibraryBook) => {
    if (book.action === "deck" && book.deckId) {
      go({ view: "decks", id: book.deckId });
      return;
    }
    if (book.action === "pdf" && book.sourceUrl) {
      window.open(book.sourceUrl, "_blank", "noopener,noreferrer");
      return;
    }
    document.getElementById("deck-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="pt-32 pb-20 md:pt-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
              <Presentation className="size-3.5" aria-hidden="true" />
              عروض تفاعلية
            </span>
            <h1 className="mt-5 font-display text-3xl font-black text-ink-900 sm:text-4xl">العروض التفاعلية — كتب التاريخ والجغرافيا</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-500 sm:text-base">
              دروس وقراءة تفاعلية مبنية على صفحات الكتب المدرسية: عرض الصفحة، التكبير، التنقل وحفظ التقدم، مع مهام الاشتغال والاختبار حين تكون متاحة.
            </p>
          </div>
        </Reveal>

        {/* مكتبة الكتب */}
        <Reveal delay={100}>
          <section aria-labelledby="deck-library-heading" className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/70 bg-gold-50 px-4 py-1.5 text-xs font-semibold text-gold-700">
                  <Library className="size-3.5" aria-hidden="true" />
                  مكتبة الكتب المدرسية
                </span>
                <h2 id="deck-library-heading" className="mt-4 font-display text-2xl font-black text-ink-900 sm:text-3xl">اختر الكتاب أولا</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">تصفح أغلفة الكتب المعتمدة، ثم انتقل إلى عروض الدروس المصنفة حسب المستوى والمادة.</p>
              </div>
              <span className="rounded-full bg-cream px-3 py-1.5 text-[11px] font-bold text-ink-500 ring-1 ring-ink-900/8">{libraryBooks.length} كتب في المكتبة</span>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {libraryBooks.map((book) => (
                <article key={book.id} className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-ink-900/8 bg-white shadow-[0_20px_55px_-35px_rgba(4,36,26,0.5)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_28px_65px_-30px_rgba(12,124,91,0.3)]">
                  <button type="button" onClick={() => openLibraryBook(book)} aria-label={`${book.action === "pdf" ? "فتح ملف" : "فتح"} ${book.title}`} className="relative block w-full overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-ink-950 text-start">
                    <div className="relative flex h-72 items-center justify-center overflow-hidden p-5 sm:h-80">
                      <img src={book.cover} alt={`غلاف ${book.title}`} loading="lazy" decoding="async" className="h-full w-auto max-w-[78%] rounded-lg object-contain object-top shadow-2xl ring-1 ring-white/20 transition duration-700 group-hover:scale-[1.03]" />
                      <span className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1.5 text-[10px] font-black text-ink-950 shadow-lg">{book.levelLabel}</span>
                      <span className="absolute bottom-4 end-4 grid size-10 place-items-center rounded-xl bg-white text-brand-700 shadow-lg">
                        {book.action === "pdf" ? <ExternalLink className="size-4.5" /> : <MonitorPlay className="size-4.5" />}
                      </span>
                    </div>
                  </button>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-lg font-black leading-relaxed text-ink-900">{book.title}</h3>
                    <p className="mt-1 text-[11px] font-bold text-brand-600">{book.subjectLabel}</p>
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink-500">{book.description}</p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-4 text-[10px] font-bold text-ink-500">
                      {book.stats.map((stat) => <span key={stat} className="rounded-full bg-cream px-2.5 py-1.5">{stat}</span>)}
                    </div>
                    {book.sourceUrl && (
                      <a href={book.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-brand-700 hover:text-brand-900">
                        فتح ملف الكتاب الأصلي <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </Reveal>

        {/* تصنيف العروض */}
        <Reveal delay={160}>
          <div id="deck-catalog" className="mt-14 scroll-mt-28">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-900/8 pb-5">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
                  <GraduationCap className="size-3.5" aria-hidden="true" />
                  تصنيف العروض
                </span>
                <h2 className="mt-4 font-display text-2xl font-black text-ink-900 sm:text-3xl">المستوى ثم المادة</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">اختر المادة، ثم افتح العرض المناسب من المستوى الدراسي المطلوب.</p>
              </div>
              <span className="text-[11px] font-bold text-ink-400">العروض مرتبة حسب المقرر</span>
            </div>
          </div>
        </Reveal>

        {/* فلتر المادة */}
        <Reveal delay={160}>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {(["all", "التاريخ", "الجغرافيا"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSubject(s)}
                className={cn(
                  "rounded-2xl px-6 py-3 font-display text-sm font-extrabold transition-all duration-300",
                  subject === s ? "bg-gradient-to-l from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-700/30" : "border border-ink-900/8 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-700",
                )}
              >
                {s === "all" ? "كل العروض" : s}
                <span className={cn("ms-2 rounded-full px-2 py-0.5 text-[10px]", subject === s ? "bg-white/20" : "bg-cream text-ink-500")}>
                  {s === "all" ? DECKS.filter((d) => d.subject === "التاريخ" || d.subject === "الجغرافيا").length : DECKS.filter((d) => d.subject === s).length}
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-10 space-y-10">
          {levelGroups.map((level, levelIndex) => (
            <section key={level.id} className="rounded-[2rem] border border-ink-900/6 bg-white/70 p-5 shadow-[0_20px_55px_-40px_rgba(4,36,26,0.35)] sm:p-7">
              <Reveal delay={80 + levelIndex * 70}>
                <div className="flex flex-wrap items-center gap-3 border-b border-ink-900/6 pb-5">
                  <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                    <GraduationCap className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-display text-2xl font-black text-ink-900">{level.label}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500">{level.description}</p>
                  </div>
                </div>
              </Reveal>
              <div className="mt-6 grid gap-8 lg:grid-cols-2">
                {level.subjects.map((section, subjectIndex) => (
                  <div key={section.id}>
                    <Reveal delay={120 + levelIndex * 70 + subjectIndex * 40}>
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-cream text-brand-700 ring-1 ring-ink-900/8">
                          <section.icon className="size-4.5" aria-hidden="true" />
                        </span>
                        <h3 className="font-display text-lg font-black text-ink-900">{section.label}</h3>
                        <span className="rounded-full bg-cream px-2.5 py-1 text-[10px] font-bold text-ink-500 ring-1 ring-ink-900/8">{section.items.length} عروض</span>
                      </div>
                    </Reveal>
                    {section.items.length > 0 ? (
                      <div className="mt-4 grid gap-5 sm:grid-cols-2">
                        {section.items.map((deck, index) => (
                          <Reveal key={deck.id} delay={160 + (index % 2) * 50} className="h-full">
                            <DeckCard deck={deck} onOpen={() => go({ view: "decks", id: deck.id })} />
                          </Reveal>
                        ))}
                      </div>
                    ) : libraryBooks.some((book) => book.levelLabel === level.label && book.subjectLabel === section.label) ? (
                      <div className="mt-4 rounded-2xl border border-gold-300/50 bg-gold-50/70 p-4">
                        <p className="text-xs font-extrabold text-gold-800">الكتاب متاح في المكتبة، والعروض التفصيلية قيد الإضافة:</p>
                        <div className="mt-3 grid gap-2">
                          {libraryBooks.filter((book) => book.levelLabel === level.label && book.subjectLabel === section.label).map((book) => (
                            <button key={book.id} type="button" onClick={() => document.getElementById("deck-library-heading")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-3 text-start text-[11px] font-bold text-ink-700 ring-1 ring-gold-300/40 transition hover:-translate-y-0.5 hover:text-brand-700">
                              <span className="line-clamp-2">{book.title}</span>
                              <Library className="size-4 shrink-0 text-gold-600" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-ink-900/12 bg-cream/60 px-5 py-8 text-center text-xs font-semibold leading-relaxed text-ink-400">
                        لا توجد عروض منشورة لهذا المستوى والمادة بعد.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-12 rounded-3xl border border-ink-900/6 bg-cream p-6">
            <p className="flex items-center gap-2 font-display text-sm font-extrabold text-ink-900">
              <Sparkles className="size-4.5 text-gold-500" aria-hidden="true" />
              كيف تستفيد من العرض داخل القسم وخارجه؟
            </p>
            <ul className="mt-3 grid gap-2 text-[12.5px] leading-relaxed text-ink-600 sm:grid-cols-3">
              <li className="rounded-xl bg-white p-3.5 ring-1 ring-ink-900/6"><span className="font-extrabold text-brand-700">في القسم:</span> اضغط «وضع العرض الكامل» (F) لعرض الصفحة على السبورة الرقمية، وأخفِ عناصر الإجابة حتى ينتهي التلاميذ.</li>
              <li className="rounded-xl bg-white p-3.5 ring-1 ring-ink-900/6"><span className="font-extrabold text-brand-700">في المنزل:</span> أجب عن المهام كتابيًا ثم قارن بعناصر الإجابة، وعلّم الشريحة «تم» ليُحفظ تقدمك على هذا الجهاز.</li>
              <li className="rounded-xl bg-white p-3.5 ring-1 ring-ink-900/6"><span className="font-extrabold text-brand-700">قبل الفرض:</span> راجع «الأفكار المفتاحية» لكل شريحة، ثم أنجز الاختبار الختامي وراجع الدرس المكتوب.</li>
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

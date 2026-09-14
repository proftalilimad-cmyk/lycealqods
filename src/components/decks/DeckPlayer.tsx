import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Keyboard,
  Layers,
  Lightbulb,
  Maximize2,
  Minimize2,
  NotebookPen,
  Presentation,
  RotateCcw,
  Sparkles,
  Target,
  XCircle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { deckPages, deckTaskCount, pageUrl, type Deck, type DeckSlideKind } from "../../data/decks";
import type { Route } from "../../routes";
import { cn } from "../../utils/cn";
import CopyLinkButton from "../CopyLinkButton";

interface DeckPlayerProps {
  deck: Deck;
  onBack: () => void;
  go: (r: Route) => void;
  /** فتح مباشرة على شريحة معينة */
  initialSlide?: number;
}

const KIND_META: Record<DeckSlideKind, { label: string; cls: string }> = {
  intro: { label: "تمهيد إشكالي", cls: "bg-gold-100 text-gold-700" },
  activity: { label: "نشاط تكويني", cls: "bg-brand-50 text-brand-700" },
  apply: { label: "تطبيق وظيفي", cls: "bg-sky-100 text-sky-700" },
  eval: { label: "تقويم التعلمات", cls: "bg-rose-100 text-rose-700" },
  extend: { label: "تقويم ودعم", cls: "bg-violet-100 text-violet-700" },
  summary: { label: "خلاصة", cls: "bg-emerald-100 text-emerald-700" },
};

const STORAGE_PREFIX = "talil_deck_progress_v1:";

function loadProgress(id: string): { done: number[]; slide: number } {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    if (!raw) return { done: [], slide: 0 };
    const parsed = JSON.parse(raw) as { done?: number[]; slide?: number };
    return { done: parsed.done ?? [], slide: parsed.slide ?? 0 };
  } catch {
    return { done: [], slide: 0 };
  }
}

function saveProgress(id: string, data: { done: number[]; slide: number }) {
  try {
    localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------ */
/* عارض صفحة الكتاب مع تكبير/تصغير وسحب                          */
/* ------------------------------------------------------------ */
function PageViewer({ page, pages, onOpenPage }: { page: number; pages: number[]; onOpenPage: (p: number) => void }) {
  const [zoom, setZoom] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);

  useEffect(() => {
    setLoaded(false);
    setZoom(1);
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, left: 0 });
  }, [page]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1 || !scrollRef.current) return;
    drag.current = { x: e.clientX, y: e.clientY, sl: scrollRef.current.scrollLeft, st: scrollRef.current.scrollTop };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !scrollRef.current) return;
    scrollRef.current.scrollLeft = drag.current.sl - (e.clientX - drag.current.x);
    scrollRef.current.scrollTop = drag.current.st - (e.clientY - drag.current.y);
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* شريط الصفحات */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-900/6 bg-cream/70 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="me-1 text-[10px] font-extrabold text-ink-500">صفحات الكتاب:</span>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onOpenPage(p)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11px] font-black transition-all",
                p === page ? "bg-brand-600 text-white shadow-md shadow-brand-700/25" : "bg-white text-ink-700 ring-1 ring-ink-900/8 hover:text-brand-700",
              )}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))} disabled={zoom <= 1} className="grid size-8 place-items-center rounded-lg bg-white text-ink-700 ring-1 ring-ink-900/8 transition hover:text-brand-700 disabled:opacity-40" aria-label="تصغير">
            <ZoomOut className="size-4" />
          </button>
          <span className="min-w-11 text-center text-[11px] font-extrabold text-ink-700">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} disabled={zoom >= 3} className="grid size-8 place-items-center rounded-lg bg-white text-ink-700 ring-1 ring-ink-900/8 transition hover:text-brand-700 disabled:opacity-40" aria-label="تكبير">
            <ZoomIn className="size-4" />
          </button>
          <button type="button" onClick={() => setZoom(1)} className="grid size-8 place-items-center rounded-lg bg-white text-ink-700 ring-1 ring-ink-900/8 transition hover:text-brand-700" aria-label="إعادة الضبط">
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={cn("relative min-h-0 flex-1 overflow-auto bg-ink-900/[0.04] p-3", zoom > 1 ? "cursor-grab active:cursor-grabbing" : "")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {!loaded && (
          <div className="absolute inset-3 animate-pulse rounded-2xl bg-white/70" aria-hidden="true">
            <div className="flex h-full items-center justify-center text-xs font-bold text-ink-400">جارٍ تحميل الصفحة {page}…</div>
          </div>
        )}
        <div style={{ width: `${zoom * 100}%` }} className="mx-auto max-w-none transition-[width] duration-200">
          <img
            src={pageUrl(page)}
            alt={`صفحة ${page} من الكتاب المدرسي`}
            draggable={false}
            onLoad={() => setLoaded(true)}
            className={cn("w-full select-none rounded-xl bg-white shadow-[0_18px_45px_-20px_rgba(4,36,26,0.35)] ring-1 ring-ink-900/8 transition-opacity", loaded ? "opacity-100" : "opacity-0")}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ */
/* المشغّل الرئيسي                                                */
/* ------------------------------------------------------------ */
export default function DeckPlayer({ deck, onBack, go, initialSlide }: DeckPlayerProps) {
  const total = deck.slides.length;
  const initial = useMemo(() => loadProgress(deck.id), [deck.id]);
  const [idx, setIdx] = useState(() => Math.min(total - 1, Math.max(0, initialSlide ?? initial.slide)));
  const [done, setDone] = useState<Set<number>>(() => new Set(initial.done));
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(deck.slides[idx].page);
  const [focusMode, setFocusMode] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showHelp, setShowHelp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  const slide = deck.slides[idx];
  const slidePages = useMemo(() => {
    const arr = [slide.page, ...(slide.pages ?? [])];
    return [...new Set(arr)].sort((a, b) => a - b);
  }, [slide]);

  /* تحديث الصفحة عند تغيير الشريحة */
  useEffect(() => {
    setPage(deck.slides[idx].page);
    setRevealed(new Set());
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const bar = document.getElementById("deck-bar");
    if (bar) window.scrollTo({ top: bar.getBoundingClientRect().top + window.scrollY - 88, behavior: "smooth" });
  }, [idx, deck]);

  /* الحفظ */
  useEffect(() => {
    saveProgress(deck.id, { done: [...done], slide: idx });
  }, [deck.id, done, idx]);

  /* تحميل مسبق للصفحات المجاورة */
  useEffect(() => {
    const all = deckPages(deck);
    const pos = all.indexOf(page);
    [pos + 1, pos + 2, pos - 1].forEach((i) => {
      const p = all[i];
      if (p) {
        const img = new Image();
        img.src = pageUrl(p);
      }
    });
  }, [page, deck]);

  const next = useCallback(() => {
    if (idx < total - 1) setIdx(idx + 1);
    else {
      setShowQuiz(true);
      window.setTimeout(() => document.getElementById("deck-quiz")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }, [idx, total]);
  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);

  /* لوحة المفاتيح */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") next(); // RTL: السهم الأيسر = التالي
      else if (e.key === "ArrowRight") prev();
      else if (e.key === "f" || e.key === "F") setFocusMode((v) => !v);
      else if (e.key === "Escape") {
        setFocusMode(false);
        setShowToc(false);
        setShowHelp(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const toggleReveal = (key: string) => setRevealed((s) => {
    const n = new Set(s);
    if (n.has(key)) n.delete(key);
    else n.add(key);
    return n;
  });
  const markDone = () => {
    setDone((s) => new Set(s).add(idx));
    next();
  };

  const progress = Math.round((done.size / total) * 100);
  const taskCount = deckTaskCount(deck);
  const kind = KIND_META[slide.kind];
  const quizScore = deck.quiz.reduce((n, q, i) => n + (quizAnswers[i] === q.answer ? 1 : 0), 0);
  const quizComplete = Object.keys(quizAnswers).length === deck.quiz.length;

  return (
    <section ref={rootRef} className={cn("scroll-mt-24", focusMode ? "fixed inset-0 z-[60] overflow-auto bg-paper pt-4 pb-6" : "pt-28 pb-16 md:pt-32")}>
      <div className={cn("mx-auto px-4 sm:px-6", focusMode ? "max-w-[1600px]" : "max-w-7xl")}>
        {/* شريط علوي */}
        {!focusMode && (
          <div className="flex flex-wrap items-center justify-between gap-3" data-no-print>
            <button type="button" onClick={onBack} className="group inline-flex items-center gap-2 text-sm font-bold text-brand-700 transition-colors hover:text-brand-800">
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              العودة إلى قائمة العروض
            </button>
            <div className="flex flex-wrap items-center gap-2">
              {deck.lessonKey && (
                <button type="button" onClick={() => go({ view: "lesson", id: deck.lessonKey! })} className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-white px-3.5 py-2 text-xs font-extrabold text-brand-700 transition-all hover:-translate-y-0.5 hover:border-brand-400">
                  <BookOpenCheck className="size-4" aria-hidden="true" />
                  الدرس المكتوب
                </button>
              )}
              <CopyLinkButton
                route={{ view: "decks", id: deck.id }}
                ariaLabel={`نسخ رابط عرض ${deck.title}`}
                className="border-ink-900/10 px-3.5 py-2 text-ink-700 hover:border-brand-300 hover:text-brand-700"
              />
              <button type="button" onClick={() => setShowHelp((v) => !v)} className="inline-flex items-center gap-1.5 rounded-xl border border-ink-900/10 bg-white px-3.5 py-2 text-xs font-extrabold text-ink-700 transition-all hover:border-brand-300 hover:text-brand-700">
                <Keyboard className="size-4" aria-hidden="true" />
                اختصارات
              </button>
            </div>
          </div>
        )}

        {showHelp && !focusMode && (
          <div className="mt-3 rounded-2xl border border-gold-200 bg-gold-50 p-4 text-xs leading-relaxed text-ink-700">
            <span className="font-extrabold text-gold-700">طريقة الاشتغال:</span> كل شريحة تعرض صفحة من الكتاب المدرسي على اليمين، ومهام الاشتغال على الوثائق على اليسار. اقرأ الوثيقة، أجب في دفترك، ثم اضغط «أظهر عناصر الإجابة» للمقارنة.
            <span className="ms-2 font-extrabold text-gold-700">لوحة المفاتيح:</span> ← الشريحة التالية · → السابقة · F وضع العرض الكامل · Esc خروج.
          </div>
        )}

        {/* ترويسة العرض */}
        {!focusMode && (
          <div className="noise relative mt-5 overflow-hidden rounded-3xl bg-gradient-to-l from-brand-700 via-brand-800 to-brand-950 p-6 text-white sm:p-8">
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute inset-0 pattern-zellige-light opacity-30" />
              <div className="absolute -top-20 end-1/4 size-72 rounded-full bg-gold-500/15 blur-[100px]" />
            </div>
            <div className="relative">
              <nav aria-label="مسار التنقل" className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-white/60">
                <span>الأولى باكالوريا علوم</span>
                <ChevronLeft className="size-3" aria-hidden="true" />
                <span>{deck.subject}</span>
                <ChevronLeft className="size-3" aria-hidden="true" />
                <span className="text-gold-300">{deck.module}</span>
              </nav>
              <h1 className="mt-3 max-w-4xl font-display text-xl font-black leading-[1.45] sm:text-2xl lg:text-3xl">{deck.title}</h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-400/10 px-3.5 py-1.5 text-[11px] font-bold text-gold-300">
                  <BookOpen className="size-3.5" aria-hidden="true" />
                  الكتاب المدرسي ص {deck.pages[0]}–{deck.pages[1]}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold text-white/85">
                  <Presentation className="size-3.5" aria-hidden="true" />
                  {total} شرائح
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold text-white/85">
                  <FileText className="size-3.5" aria-hidden="true" />
                  {taskCount} مهمة على الوثائق
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold text-white/85">
                  <CircleHelp className="size-3.5" aria-hidden="true" />
                  {deck.quiz.length} أسئلة ختامية
                </span>
              </div>
              <div className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="flex items-center gap-2 text-xs font-extrabold text-gold-300">
                    <CircleHelp className="size-4" aria-hidden="true" />
                    التمهيد الإشكالي
                  </p>
                  <p className="mt-1.5 text-[13px] leading-loose text-white/85">{deck.problem}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="flex items-center gap-2 text-xs font-extrabold text-gold-300">
                    <Target className="size-4" aria-hidden="true" />
                    أهداف التعلم
                  </p>
                  <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-white/80">
                    {deck.objectives.map((o) => (
                      <li key={o} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-400" aria-hidden="true" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {deck.concepts.map((c) => (
                  <span key={c} className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/80 ring-1 ring-white/10">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* شريط التقدم والتحكم */}
        <div id="deck-bar" className={cn("sticky z-20 mt-4 rounded-2xl border border-ink-900/6 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur", focusMode ? "top-2" : "top-20")} data-no-print>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowToc((v) => !v)} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-extrabold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-100">
                <Layers className="size-4" aria-hidden="true" />
                الشرائح
              </button>
              <span className="text-xs font-extrabold text-ink-700">
                الشريحة {idx + 1} <span className="text-ink-400">/ {total}</span>
              </span>
              <span className={cn("hidden rounded-full px-2.5 py-1 text-[10px] font-extrabold sm:inline", kind.cls)}>{kind.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="me-1 hidden text-[11px] font-bold text-ink-500 sm:inline">{progress}% منجز</span>
              <button type="button" onClick={prev} disabled={idx === 0} className="grid size-9 place-items-center rounded-xl border border-ink-900/10 bg-white text-ink-700 transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-40" aria-label="الشريحة السابقة">
                <ChevronRight className="size-4.5" />
              </button>
              <button type="button" onClick={next} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-brand-600 to-brand-700 px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-brand-700/25 transition hover:-translate-x-0.5">
                {idx === total - 1 ? "الاختبار الختامي" : "التالي"}
                <ChevronLeft className="size-4" />
              </button>
              <button type="button" onClick={() => setFocusMode((v) => !v)} className="grid size-9 place-items-center rounded-xl border border-ink-900/10 bg-white text-ink-700 transition hover:border-brand-300 hover:text-brand-700" aria-label={focusMode ? "الخروج من وضع العرض" : "وضع العرض الكامل"} title="F">
                {focusMode ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </button>
            </div>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-900/6">
            <div className="h-full rounded-full bg-gradient-to-l from-gold-400 to-brand-500 transition-all duration-500" style={{ width: `${((idx + 1) / total) * 100}%` }} />
          </div>

          {showToc && (
            <ol className="mt-3 grid max-h-72 gap-1.5 overflow-auto border-t border-ink-900/6 pt-3 sm:grid-cols-2 lg:grid-cols-3">
              {deck.slides.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => {
                      setIdx(i);
                      setShowToc(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-xl px-3 py-2 text-start text-[12px] font-bold transition",
                      i === idx ? "bg-brand-600 text-white" : "bg-cream text-ink-700 hover:bg-brand-50",
                    )}
                  >
                    <span className={cn("grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-black", i === idx ? "bg-white/20 text-white" : done.has(i) ? "bg-emerald-500 text-white" : "bg-white text-ink-500 ring-1 ring-ink-900/10")}>
                      {done.has(i) && i !== idx ? "✓" : i + 1}
                    </span>
                    <span className="leading-snug">
                      {s.title}
                      <span className={cn("block text-[10px] font-semibold", i === idx ? "text-white/70" : "text-ink-400")}>ص {s.page}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* جسم الشريحة */}
        <div className={cn("mt-4 grid gap-4", focusMode ? "lg:grid-cols-[1.15fr_1fr]" : "lg:grid-cols-[1.05fr_1fr]")}>
          {/* الصفحة */}
          <div className={cn("overflow-hidden rounded-3xl border border-ink-900/6 bg-white shadow-[0_30px_70px_-30px_rgba(4,36,26,0.25)] lg:sticky lg:self-start", focusMode ? "h-[calc(100vh-7rem)] lg:top-[5.25rem]" : "h-[70vh] min-h-[520px] lg:top-[9.25rem] lg:h-[calc(100vh-10.25rem)] lg:max-h-[900px]")}>
            <PageViewer page={page} pages={slidePages} onOpenPage={setPage} />
          </div>

          {/* لوحة العمل */}
          <div className="flex min-h-0 flex-col gap-4">
            <div className="rounded-3xl border border-ink-900/6 bg-white p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-extrabold", kind.cls)}>{kind.label}</span>
                <span className="rounded-full bg-cream px-2.5 py-1 text-[10px] font-extrabold text-ink-500 ring-1 ring-ink-900/8">
                  الكتاب ص {slidePages.join(" · ")}
                </span>
              </div>
              <h2 className="mt-3 font-display text-lg font-black leading-relaxed text-ink-900 sm:text-xl">{slide.title}</h2>
              {slide.focus && (
                <div className="mt-3 flex gap-2.5 rounded-2xl border border-sky-200 bg-sky-50 p-3.5">
                  <Eye className="mt-0.5 size-4 shrink-0 text-sky-600" aria-hidden="true" />
                  <p className="text-[13px] leading-loose text-ink-700">
                    <span className="font-extrabold text-sky-700">ماذا نلاحظ في الصفحة؟ </span>
                    {slide.focus}
                  </p>
                </div>
              )}
            </div>

            {slide.tasks && slide.tasks.length > 0 && (
              <div className="rounded-3xl border border-ink-900/6 bg-white p-6">
                <h3 className="flex items-center gap-2.5 font-display text-base font-extrabold text-ink-900">
                  <span className="grid size-9 place-items-center rounded-xl bg-gold-100 text-gold-600">
                    <NotebookPen className="size-4.5" aria-hidden="true" />
                  </span>
                  الاشتغال على الوثائق
                </h3>
                <p className="mt-1.5 text-[11px] text-ink-500">اقرأ الوثيقة في الصفحة، أجب في دفترك، ثم قارن إجابتك بعناصر الإجابة.</p>
                <ol className="mt-4 space-y-3">
                  {slide.tasks.map((t, ti) => {
                    const key = `${idx}-${ti}`;
                    const open = revealed.has(key);
                    return (
                      <li key={ti} className="rounded-2xl border border-ink-900/6 bg-cream p-4">
                        <div className="flex items-start gap-3">
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 font-display text-[11px] font-black text-white">{ti + 1}</span>
                          <p className="text-[13.5px] font-bold leading-loose text-ink-900">{t.q}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleReveal(key)}
                          className={cn(
                            "mt-3 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-extrabold transition-all",
                            open ? "bg-brand-600 text-white" : "border border-brand-200 bg-white text-brand-700 hover:border-brand-400",
                          )}
                          aria-expanded={open}
                        >
                          {open ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          {open ? "إخفاء عناصر الإجابة" : "أظهر عناصر الإجابة"}
                        </button>
                        {open && (
                          <div className="mt-3 rounded-xl border-s-4 border-brand-500 bg-white p-3.5 text-[13px] leading-loose text-ink-700 animate-[fade-up_0.35s_ease-out]">
                            {t.a}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {slide.keys && slide.keys.length > 0 && (
              <div className="rounded-3xl bg-gradient-to-l from-brand-800 to-brand-950 p-6 text-white">
                <h3 className="flex items-center gap-2.5 font-display text-base font-extrabold">
                  <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-gold-300">
                    <Lightbulb className="size-4.5" aria-hidden="true" />
                  </span>
                  أفكار مفتاحية للاحتفاظ بها
                </h3>
                <ul className="mt-3 space-y-2">
                  {slide.keys.map((k) => (
                    <li key={k} className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-[13px] leading-relaxed text-white/85">
                      <Sparkles className="mt-1 size-3.5 shrink-0 text-gold-300" aria-hidden="true" />
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-dashed border-brand-300 bg-brand-50/60 p-4" data-no-print>
              <p className="text-[12px] font-bold text-ink-700">
                {done.has(idx) ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="size-4" /> أنجزتَ هذه الشريحة
                  </span>
                ) : (
                  "هل أنهيت الاشتغال على هذه الصفحة؟"
                )}
              </p>
              <button type="button" onClick={markDone} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-gold-500 to-gold-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-gold-600/25 transition hover:-translate-y-0.5">
                <CheckCircle2 className="size-4" />
                {idx === total - 1 ? "إنهاء والانتقال للاختبار" : "تم — الشريحة التالية"}
              </button>
            </div>
          </div>
        </div>

        {/* الاختبار الختامي */}
        {(showQuiz || done.size === total) && (
          <div id="deck-quiz" className="mt-6 scroll-mt-28 rounded-3xl border border-ink-900/6 bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2.5 font-display text-xl font-extrabold text-ink-900">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <GraduationCap className="size-5" aria-hidden="true" />
                </span>
                اختبر فهمك للدرس
              </h2>
              {quizComplete && (
                <span className={cn("rounded-full px-4 py-1.5 text-sm font-black", quizScore === deck.quiz.length ? "bg-emerald-100 text-emerald-700" : "bg-gold-100 text-gold-700")}>
                  {quizScore} / {deck.quiz.length}
                </span>
              )}
            </div>
            <ol className="mt-5 space-y-4">
              {deck.quiz.map((q, qi) => {
                const chosen = quizAnswers[qi];
                return (
                  <li key={qi} className="rounded-2xl border border-ink-900/6 bg-cream p-5">
                    <p className="text-[14px] font-bold leading-loose text-ink-900">
                      <span className="me-2 inline-grid size-6 place-items-center rounded-full bg-brand-600 text-[11px] font-black text-white">{qi + 1}</span>
                      {q.q}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt, oi) => {
                        const isChosen = chosen === oi;
                        const isRight = q.answer === oi;
                        const state = chosen === undefined ? "idle" : isRight ? "right" : isChosen ? "wrong" : "muted";
                        return (
                          <button
                            key={oi}
                            type="button"
                            disabled={chosen !== undefined}
                            onClick={() => setQuizAnswers((a) => ({ ...a, [qi]: oi }))}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-start text-[13px] font-bold transition-all",
                              state === "idle" && "border-ink-900/10 bg-white text-ink-700 hover:border-brand-400 hover:text-brand-700",
                              state === "right" && "border-emerald-400 bg-emerald-50 text-emerald-800",
                              state === "wrong" && "border-rose-400 bg-rose-50 text-rose-800",
                              state === "muted" && "border-ink-900/6 bg-white/60 text-ink-400",
                            )}
                          >
                            {state === "right" ? <CheckCircle2 className="size-4 shrink-0" /> : state === "wrong" ? <XCircle className="size-4 shrink-0" /> : <span className="size-4 shrink-0 rounded-full border-2 border-current opacity-40" />}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {chosen !== undefined && (
                      <p className="mt-3 rounded-xl border-s-4 border-brand-500 bg-white p-3 text-[12.5px] leading-loose text-ink-700">
                        <span className="font-extrabold text-brand-700">لماذا؟ </span>
                        {q.why}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setQuizAnswers({});
                  setDone(new Set());
                  setIdx(0);
                  setShowQuiz(false);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 px-5 py-3 text-sm font-bold text-ink-700 transition-all hover:-translate-y-0.5 hover:border-brand-400"
              >
                <RotateCcw className="size-4" />
                إعادة العرض من البداية
              </button>
              <div className="flex flex-wrap gap-2">
                {deck.lessonKey && (
                  <button type="button" onClick={() => go({ view: "lesson", id: deck.lessonKey! })} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-5 py-3 text-sm font-bold text-brand-700 transition-all hover:-translate-y-0.5 hover:border-brand-400">
                    <BookOpenCheck className="size-4" />
                    مراجعة الدرس المكتوب
                  </button>
                )}
                <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-brand-700 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-brand-700/25 transition-all hover:-translate-y-0.5">
                  <Presentation className="size-4" />
                  عروض أخرى
                </button>
              </div>
            </div>
          </div>
        )}

        {!focusMode && (
          <p className="mt-6 text-center text-[11px] leading-relaxed text-ink-400">
            صفحات الكتاب المدرسي «مورد التاريخ والجغرافيا» معروضة لأغراض تربوية داخل القسم وللمراجعة الذاتية للتلاميذ. المهام وعناصر الإجابة من إعداد الأستاذ.
          </p>
        )}
      </div>
    </section>
  );
}

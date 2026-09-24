import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, ChevronLeft, FileText, Globe2, History, Layers, MonitorPlay, Presentation, Sparkles } from "lucide-react";
import { DECKS, DECK_BOOK, deckTaskCount, pageUrl, type Deck } from "../../data/decks";
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
  const isFile = deck.unitNo === 0;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink-900/6 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-[0_25px_55px_-22px_rgba(12,124,91,0.3)]">
      <button type="button" onClick={onOpen} className="relative block aspect-[16/10] overflow-hidden bg-cream text-start">
        <img src={pageUrl(deck.slides[0].page)} alt={`${deck.title} — صفحة ${deck.slides[0].page} من الكتاب المدرسي`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/20 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <div>
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold", isFile ? "bg-gold-400 text-ink-900" : "bg-white/15 text-white ring-1 ring-white/20 backdrop-blur")}>
              {isFile ? <FileText className="size-3" /> : <Layers className="size-3" />}
              {isFile ? "ملف موضوعاتي" : `الوحدة ${deck.unitNo}`}
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

export default function Decks({ go, initialSubject }: DecksProps) {
  const [subject, setSubject] = useState<"all" | "التاريخ" | "الجغرافيا">(initialSubject === "التاريخ" || initialSubject === "الجغرافيا" ? initialSubject : "all");
  const list = DECKS.filter((d) => subject === "all" || d.subject === subject);
  const totalTasks = DECKS.reduce((n, d) => n + deckTaskCount(d), 0);
  const totalSlides = DECKS.reduce((n, d) => n + d.slides.length, 0);
  const history = list.filter((d) => d.subject === "التاريخ");
  const geography = list.filter((d) => d.subject === "الجغرافيا");

  const groups: { label: string; icon: typeof History; items: Deck[] }[] = [
    { label: "التاريخ", icon: History, items: history },
    { label: "الجغرافيا", icon: Globe2, items: geography },
  ].filter((g) => g.items.length > 0);

  return (
    <section className="pt-32 pb-20 md:pt-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
              <Presentation className="size-3.5" aria-hidden="true" />
              عروض تفاعلية
            </span>
            <h1 className="mt-5 font-display text-3xl font-black text-ink-900 sm:text-4xl">العروض التفاعلية — الأولى باكالوريا علوم</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-500 sm:text-base">
              كل درس في شكل عرض مبني على صفحات الكتاب المدرسي: تُعرض الوثيقة (نص، خريطة، جدول، مبيان، صورة) ومعها مهام الاشتغال عليها وعناصر الإجابة، ثم اختبار ختامي.
            </p>
          </div>
        </Reveal>

        {/* بطاقة الكتاب */}
        <Reveal delay={100}>
          <div className="noise relative mt-10 overflow-hidden rounded-3xl bg-gradient-to-l from-brand-700 via-brand-800 to-brand-950 p-6 text-white sm:p-8">
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute inset-0 pattern-zellige-light opacity-30" />
              <div className="absolute -top-20 end-1/4 size-72 rounded-full bg-gold-500/15 blur-[100px]" />
            </div>
            <div className="relative grid items-center gap-6 md:grid-cols-[auto_1fr_auto]">
              <img src={pageUrl(1)} alt="غلاف الكتاب المدرسي" decoding="async" className="mx-auto h-40 w-auto rounded-xl shadow-2xl ring-2 ring-white/20 md:h-44" />
              <div>
                <p className="text-xs font-bold text-gold-300">المرجع المعتمد</p>
                <h2 className="mt-1 font-display text-2xl font-black">{DECK_BOOK.title}</h2>
                <p className="mt-1 text-sm text-white/75">{DECK_BOOK.level}</p>
                <p className="mt-2 text-[12px] leading-relaxed text-white/60">{DECK_BOOK.note}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">{DECKS.length} عرضًا</span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">{totalSlides} شريحة</span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">{totalTasks} مهمة على الوثائق</span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">{DECKS.reduce((n, d) => n + d.quiz.length, 0)} سؤال اختبار</span>
                </div>
              </div>
              <div className="grid gap-2 text-[12px]">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5">
                  <BookOpen className="size-4 text-gold-300" /> صفحة الكتاب مكبَّرة وقابلة للتكبير
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5">
                  <FileText className="size-4 text-gold-300" /> مهام + عناصر إجابة قابلة للإظهار
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5">
                  <Sparkles className="size-4 text-gold-300" /> أفكار مفتاحية + اختبار + حفظ التقدم
                </div>
              </div>
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
                  {s === "all" ? DECKS.length : DECKS.filter((d) => d.subject === s).length}
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        {groups.map((g, gi) => (
          <div key={g.label} className="mt-10">
            <Reveal delay={80 + gi * 60}>
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <g.icon className="size-5" />
                </span>
                <h2 className="font-display text-xl font-black text-ink-900">عروض {g.label}</h2>
                <span className="rounded-full bg-cream px-3 py-1 text-[10px] font-bold text-ink-500 ring-1 ring-ink-900/8">{g.items.length} عروض</span>
              </div>
            </Reveal>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {g.items.map((d, i) => (
                <Reveal key={d.id} delay={60 + (i % 3) * 60} className="h-full">
                  <DeckCard deck={d} onOpen={() => go({ view: "decks", id: d.id })} />
                </Reveal>
              ))}
            </div>
          </div>
        ))}

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

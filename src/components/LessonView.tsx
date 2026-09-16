import { useMemo, useState } from "react";
import {
  AlarmClock,
  ArrowRight,
  Award,
  BadgeCheck,
  BookMarked,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  FileText,
  FlaskConical,
  GraduationCap,
  Info,
  Layers,
  Lightbulb,
  ListChecks,
  MonitorPlay,
  Network,
  NotebookPen,
  Printer,
  Quote,
  RotateCcw,
  Scale,
  Target,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import type { LessonBlock, LessonContent } from "../types";
import Reveal from "./Reveal";
import SmartText, { AutoTableView } from "./SmartText";
import { isYear } from "../lib/tableDetect";
import CopyLinkButton from "./CopyLinkButton";
import type { Route } from "../routes";
import { getDeckForLesson } from "../data/decks";

/* ---------- عارض الكتل ---------- */
function BlockRenderer({ block }: { block: LessonBlock }) {
  if (block.type === "p") {
    /* البيانات المنظمة داخل الفقرة تتحول تلقائيًا إلى جدول حقيقي (النظام الموحد) */
    return <SmartText text={block.text} className="text-[15px] leading-loose text-ink-700" />;
  }
  if (block.type === "ul") {
    return (
      <div className="rounded-2xl border border-ink-900/6 bg-cream p-5">
        {block.title && <p className="font-display text-sm font-extrabold text-brand-700">{block.title}</p>}
        <ul className={`space-y-2.5 ${block.title ? "mt-3" : ""}`}>
          {block.items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm leading-loose text-ink-700">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (block.type === "table") {
    /* تصميم موحّد لكل جداول الدروس (كتل + وثائق + تقويمات): نفس النظام والمكوّن */
    return (
      <AutoTableView
        t={{
          head: block.head,
          rows: block.rows,
          timeSeries: block.rows.length > 1 && block.rows.every((r) => isYear(r[0] ?? "")),
        }}
      />
    );
  }
  const tones = {
    def: { cls: "border-brand-300 bg-brand-50", labelCls: "text-brand-700", icon: BookMarked },
    info: { cls: "border-sky-300 bg-sky-50", labelCls: "text-sky-700", icon: Info },
    warn: { cls: "border-gold-300 bg-gold-50", labelCls: "text-gold-700", icon: TriangleAlert },
  } as const;
  const t = tones[block.tone];
  return (
    <div className={`rounded-2xl border p-5 ${t.cls}`}>
      <p className={`flex items-center gap-2 font-display text-sm font-extrabold ${t.labelCls}`}>
        <t.icon className="size-4.5" aria-hidden="true" />
        {block.label}
      </p>
      <p className="mt-2.5 text-sm leading-loose text-ink-700">{block.text}</p>
    </div>
  );
}

/* ---------- اختبر فهمك ---------- */
function LessonQuiz({ quiz }: { quiz: LessonContent["quiz"] }) {
  const [picks, setPicks] = useState<Record<number, number>>({});
  const done = Object.keys(picks).length === quiz.length;
  const score = quiz.reduce((s, item, i) => s + (picks[i] === item.answer ? 1 : 0), 0);

  return (
    <div className="space-y-5">
      {quiz.map((item, qi) => {
        const picked = picks[qi];
        return (
          <Reveal key={qi} delay={qi * 80}>
            <div className="rounded-2xl border border-ink-900/6 bg-white p-5">
              <p className="text-sm font-extrabold leading-relaxed text-ink-900">
                <span className="me-1.5 inline-grid size-6 place-items-center rounded-lg bg-brand-600 text-[11px] font-black text-white">{qi + 1}</span>
                {item.q}
              </p>
              <div className="mt-3.5 grid gap-2 sm:grid-cols-2">
                {item.options.map((opt, oi) => {
                  const isPicked = picked === oi;
                  const reveal = picked !== undefined;
                  const isCorrect = oi === item.answer;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={reveal}
                      onClick={() => setPicks((p) => ({ ...p, [qi]: oi }))}
                      className={`flex items-center gap-2.5 rounded-xl border-2 px-3.5 py-3 text-start text-[13px] font-semibold transition-all duration-300 ${
                        reveal && isCorrect
                          ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                          : reveal && isPicked && !isCorrect
                            ? "border-rose-400 bg-rose-50 text-rose-700"
                            : reveal
                              ? "border-ink-900/8 bg-white text-ink-400"
                              : "border-ink-900/10 bg-white text-ink-800 hover:-translate-y-0.5 hover:border-brand-400"
                      }`}
                    >
                      {reveal && isCorrect ? (
                        <CheckCircle2 className="size-4.5 shrink-0 text-emerald-500" aria-hidden="true" />
                      ) : reveal && isPicked && !isCorrect ? (
                        <XCircle className="size-4.5 shrink-0 text-rose-500" aria-hidden="true" />
                      ) : (
                        <span className="size-4.5 shrink-0 rounded-full border-2 border-ink-300" aria-hidden="true" />
                      )}
                      <span className="leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>
              {picked !== undefined && (
                <p className="animate-fade-up mt-3 rounded-xl bg-brand-50 px-4 py-3 text-xs leading-relaxed text-brand-800">
                  <span className="font-extrabold">التوضيح: </span>
                  {item.why}
                </p>
              )}
            </div>
          </Reveal>
        );
      })}
      {done && (
        <div className="animate-fade-up flex flex-col items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-gradient-to-l from-brand-50 to-gold-50 p-5 sm:flex-row">
          <p className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900">
            <Award className="size-5 text-gold-500" aria-hidden="true" />
            نتيجتك في «اختبر فهمك»: {score} / {quiz.length}
          </p>
          <button
            type="button"
            onClick={() => setPicks({})}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-white px-4 py-2.5 text-xs font-extrabold text-brand-700 transition-all hover:-translate-y-0.5"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            إعادة الاختبار
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- عرض الدرس ---------- */
interface LessonViewProps {
  lesson: LessonContent;
  breadcrumb: { level: string; branch: string; subject: string; unit: string };
  onBack: () => void;
  go: (r: Route) => void;
}

export default function LessonView({ lesson, breadcrumb, onBack, go }: LessonViewProps) {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [openDocId, setOpenDocId] = useState<number | null>(null);
  const [showModel, setShowModel] = useState(false);
  const deck = useMemo(() => getDeckForLesson(lesson.id), [lesson.id]);
  const toc = useMemo(() => {
    const items = ["أهداف الدرس", "تمهيد وإشكالية"];
    if (lesson.bookPage) items.push("صفحة الكتاب");
    items.push(...lesson.sections.map((s) => s.title));
    if (lesson.docs?.length) items.push("الوثائق وتحليلها");
    if (lesson.schema) items.push("الخطاطة التركيبية");
    if (lesson.application) items.push("تمرين تطبيقي");
    items.push("خط زمني", "معجم المفاهيم", "خلاصة مركزة", "في الامتحان", "اختبر فهمك");
    return items;
  }, [lesson]);

  return (
    <section className="pt-32 pb-20 md:pt-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-3" data-no-print>
            <button type="button" onClick={onBack} className="group inline-flex items-center gap-2 text-sm font-bold text-brand-700 transition-colors hover:text-brand-800">
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              العودة إلى دروس {breadcrumb.level}
            </button>
            <div className="flex flex-wrap items-center gap-2">
              {deck && (
                <button
                  type="button"
                  onClick={() => go({ view: "decks", id: deck.id })}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-gold-500 to-gold-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-gold-600/25 transition-all hover:-translate-y-0.5"
                >
                  <MonitorPlay className="size-4" aria-hidden="true" />
                  العرض التفاعلي (الكتاب المدرسي ص {deck.pages[0]}–{deck.pages[1]})
                </button>
              )}
              <CopyLinkButton route={{ view: "lesson", id: lesson.id }} ariaLabel={`نسخ رابط درس ${lesson.title}`} />
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-xs font-extrabold text-brand-700 transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md"
              >
                <Printer className="size-4" aria-hidden="true" />
                طباعة / تحميل PDF
              </button>
            </div>
          </div>
        </Reveal>

        {/* ترويسة الدرس */}
        <Reveal delay={80}>
          <div className="noise relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-l from-brand-700 via-brand-800 to-brand-950 p-7 text-white sm:p-10">
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute inset-0 pattern-zellige-light opacity-30" />
              <div className="absolute -top-20 end-1/4 size-72 rounded-full bg-gold-500/15 blur-[100px]" />
            </div>
            <div className="relative">
              <nav aria-label="مسار التنقل" className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-white/60">
                <span>{breadcrumb.level}</span>
                <ChevronLeft className="size-3" aria-hidden="true" />
                <span>{breadcrumb.branch}</span>
                <ChevronLeft className="size-3" aria-hidden="true" />
                <span>{breadcrumb.subject}</span>
                <ChevronLeft className="size-3" aria-hidden="true" />
                <span className="text-gold-300">{breadcrumb.unit}</span>
              </nav>
              <h1 className="mt-4 max-w-3xl font-display text-2xl font-black leading-[1.4] sm:text-3xl lg:text-4xl">
                {lesson.title}
              </h1>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-400/10 px-3.5 py-1.5 text-[11px] font-bold text-gold-300">
                  <GraduationCap className="size-3.5" aria-hidden="true" />
                  مقرر {breadcrumb.subject} — {breadcrumb.level}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold text-white/85">
                  <Clock3 className="size-3.5" aria-hidden="true" />
                  {lesson.duration}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold text-white/85">
                  <Layers className="size-3.5" aria-hidden="true" />
                  {lesson.sections.length} محاور مفصلة + مفاهيم + اختبار
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* المحتوى */}
          <div className="space-y-6">
            {/* أهداف الدرس */}
            <div data-lesson-block>
            <Reveal delay={120}>
              <div className="rounded-3xl border border-ink-900/6 bg-white p-7">
                <h2 className="flex items-center gap-2.5 font-display text-xl font-extrabold text-ink-900">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Target className="size-5" aria-hidden="true" />
                  </span>
                  أهداف التعلم
                </h2>
                <p className="mt-2 text-xs text-ink-500">بعد استيعاب هذا الدرس، ستكون قادرًا على:</p>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {lesson.objectives.map((obj, i) => (
                    <li key={obj} className="flex items-start gap-2.5 rounded-xl bg-cream p-3.5 text-[13px] font-semibold leading-relaxed text-ink-700">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[10px] font-black text-white">{i + 1}</span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            </div>

            {/* تمهيد وإشكالية */}
            <div data-lesson-block>
            <Reveal delay={160}>
              <div className="rounded-3xl border border-ink-900/6 bg-white p-7">
                <h2 className="flex items-center gap-2.5 font-display text-xl font-extrabold text-ink-900">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Quote className="size-5" aria-hidden="true" />
                  </span>
                  تمهيد وإشكالية الدرس
                </h2>
                <p className="mt-4 text-[15px] leading-loose text-ink-700">{lesson.intro}</p>
                <div className="mt-4 rounded-2xl border-2 border-dashed border-gold-400/70 bg-gold-50 p-5">
                  <p className="font-display text-sm font-extrabold text-gold-700">الإشكالية المركزية</p>
                  <p className="mt-2 text-sm font-semibold leading-loose text-ink-700">{lesson.coreQuestion}</p>
                </div>
              </div>
            </Reveal>
            </div>

            {/* صفحة الكتاب المدرسي */}
            {lesson.bookPage && (
              <div data-lesson-block>
              <Reveal delay={60}>
                <div className="overflow-hidden rounded-3xl border border-gold-300/60 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold-200/70 bg-gold-50 px-6 py-4">
                    <h2 className="flex items-center gap-2.5 font-display text-lg font-extrabold text-ink-900">
                      <span className="grid size-10 place-items-center rounded-xl bg-gold-100 text-gold-700">
                        <BookMarked className="size-5" aria-hidden="true" />
                      </span>
                      صفحة الكتاب: {lesson.bookPage.book}
                    </h2>
                    <span className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-extrabold text-gold-700 ring-1 ring-gold-300">
                      الصفحة {lesson.bookPage.page}
                    </span>
                  </div>
                  <a href={lesson.bookPage.src} target="_blank" rel="noreferrer" className="block bg-brand-50/40 p-3 sm:p-5" title="فتح الصفحة بالحجم الكامل">
                    <img
                      src={lesson.bookPage.src}
                      alt={`${lesson.bookPage.book} — الصفحة ${lesson.bookPage.page}`}
                      loading="lazy"
                      className="mx-auto w-full max-w-3xl rounded-xl border border-ink-900/10 bg-white shadow-md"
                    />
                  </a>
                  {lesson.bookPage.caption && (
                    <p className="border-t border-ink-900/6 px-6 py-3 text-xs leading-relaxed text-ink-500">{lesson.bookPage.caption}</p>
                  )}
                </div>
              </Reveal>
              </div>
            )}

            {/* المحاور */}
            {lesson.sections.map((section, si) => (
              <div data-lesson-block key={section.title}>
              <Reveal delay={60}>
                <div className="rounded-3xl border border-ink-900/6 bg-white p-7 sm:p-8">
                  <h2 className="flex items-center gap-3 font-display text-lg font-extrabold text-ink-900 sm:text-xl">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-base font-black text-gold-300">
                      {si + 1}
                    </span>
                    {section.title}
                  </h2>
                  <div className="mt-5 space-y-4">
                    {section.blocks.map((block, bi) => (
                      <BlockRenderer key={bi} block={block} />
                    ))}
                  </div>
                </div>
              </Reveal>
              </div>
            ))}

            {/* الوثائق وتحليلها */}
            {lesson.docs && lesson.docs.length > 0 && (
              <div data-lesson-block>
              <Reveal>
                <div className="rounded-3xl border border-ink-900/6 bg-white p-7 sm:p-8">
                  <h2 className="flex items-center gap-2.5 font-display text-xl font-extrabold text-ink-900">
                    <span className="grid size-10 place-items-center rounded-xl bg-gold-100 text-gold-600">
                      <FileText className="size-5" aria-hidden="true" />
                    </span>
                    الوثائق وأسئلة تحليلها
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-ink-500">وثائق أصلية أو تعليمية مصاحبة للدرس مع أسئلة تحليلية وأجوبتها النموذجية.</p>
                  <div className="mt-5 space-y-6">
                    {lesson.docs.map((doc, di) => {
                      const open = openDocId === di;
                      return (
                        <div key={di} className="overflow-hidden rounded-2xl border border-ink-900/8">
                          <div className="border-b border-ink-900/8 bg-gold-50/70 p-5">
                            <p className="text-[11px] font-extrabold text-gold-700">{doc.label}</p>
                            <div className="mt-2.5"><SmartText text={doc.text} className="text-sm leading-loose text-ink-700" /></div>
                          </div>
                          <ol className="divide-y divide-ink-900/5 px-5 py-2 sm:px-6">
                            {doc.questions.map((qa, qi) => (
                              <li key={qi} className="py-4">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-sm font-extrabold leading-relaxed text-ink-900">
                                    <span className="me-1.5 inline-grid size-6 place-items-center rounded-lg bg-brand-600 text-[11px] font-black text-white">{qi + 1}</span>
                                    {qa.q}
                                  </p>
                                  <span className="shrink-0 rounded-full bg-gold-100 px-2.5 py-1 text-[10px] font-extrabold text-gold-700">{qa.pts} ن</span>
                                </div>
                                {open && (
                                  <p className="animate-fade-up mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-[13px] leading-loose text-ink-700">
                                    <BadgeCheck className="mt-0.5 size-4.5 shrink-0 text-emerald-600" aria-hidden="true" />
                                    <span><span className="font-extrabold text-emerald-700">الجواب: </span>{qa.answer}</span>
                                  </p>
                                )}
                              </li>
                            ))}
                          </ol>
                          <div className="border-t border-ink-900/6 px-5 py-3.5 sm:px-6">
                            <button
                              type="button"
                              onClick={() => setOpenDocId(open ? null : di)}
                              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-l from-brand-600 to-brand-700 px-4 py-2 text-xs font-extrabold text-white shadow transition-transform hover:-translate-y-0.5"
                            >
                              <CheckCircle2 className="size-4" aria-hidden="true" />
                              {open ? "إخفاء الأجوبة" : "عرض الأجوبة النموذجية"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
              </div>
            )}

            {/* الخطاطة التركيبية */}
            {lesson.schema && (
              <div data-lesson-block>
              <Reveal>
                <div className="rounded-3xl border border-ink-900/6 bg-white p-7 sm:p-8">
                  <h2 className="flex items-center gap-2.5 font-display text-xl font-extrabold text-ink-900">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <Network className="size-5" aria-hidden="true" />
                    </span>
                    خطاطة تركيبية
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-ink-500">{lesson.schema.title ?? "خريطة منطقية مركزة تلخص بنية الدرس وعلاقاته."}</p>
                  <ol className="relative mt-6 space-y-4 border-s-2 border-brand-300 ps-6">
                    {lesson.schema.rows.map((row, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -start-[31px] top-1 grid size-4 place-items-center rounded-full bg-brand-500 ring-4 ring-brand-100" aria-hidden="true" />
                        <p className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-extrabold text-brand-700 ring-1 ring-brand-200">{row.label}</p>
                        <p className="mt-1.5 text-sm leading-loose text-ink-700">{row.value}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </Reveal>
              </div>
            )}

            {/* تمرين تطبيقي */}
            {lesson.application && (
              <div data-lesson-block>
              <Reveal>
                <div className="overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-b from-brand-50 to-white">
                  <div className="border-b border-brand-200/60 px-6 py-5 sm:px-8">
                    <h2 className="flex items-center gap-2.5 font-display text-xl font-extrabold text-ink-900">
                      <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/25">
                        <FlaskConical className="size-5" aria-hidden="true" />
                      </span>
                      تمرين تطبيقي
                    </h2>
                    <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-500">
                      <span className="font-extrabold text-brand-700">{lesson.application.title}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" aria-hidden="true" />{lesson.application.duration}</span>
                    </p>
                  </div>
                  <div className="p-6 sm:p-8">
                    <p className="rounded-2xl border border-gold-300/60 bg-gold-50/70 p-5 text-sm font-semibold leading-loose text-ink-700">{lesson.application.prompt}</p>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {lesson.application.guide.map((g) => (
                        <li key={g} className="flex items-start gap-2 rounded-xl bg-white p-3 text-xs font-semibold leading-relaxed text-ink-600 ring-1 ring-ink-900/6">
                          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden="true" />
                          {g}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => setShowModel((v) => !v)}
                      className="btn-shine mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-brand-700 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-brand-700/25 transition-transform hover:-translate-y-0.5"
                    >
                      <BadgeCheck className="size-4.5" aria-hidden="true" />
                      {showModel ? "إخفاء الإجابة النموذجية" : "عرض الإجابة النموذجية"}
                    </button>
                    {showModel && (
                      <div className="animate-fade-up mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                        <p className="font-display text-sm font-extrabold text-emerald-700">الإجابة النموذجية:</p>
                        <ul className="mt-2.5 space-y-2">
                          {lesson.application.model.map((m, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-[13px] leading-loose text-ink-700">
                              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-[10px] font-black text-white">{i + 1}</span>
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
              </div>
            )}

            {/* خط زمني */}
            <div data-lesson-block>
            <Reveal>
              <div className="rounded-3xl border border-ink-900/6 bg-white p-7 sm:p-8">
                <h2 className="flex items-center gap-2.5 font-display text-xl font-extrabold text-ink-900">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <AlarmClock className="size-5" aria-hidden="true" />
                  </span>
                  محطات وتواريخ مفصلية
                </h2>
                <ol className="relative mt-6 space-y-5 border-s-2 border-dashed border-brand-300 ps-5">
                  {lesson.timeline.map((t) => (
                    <li key={t.date} className="relative">
                      <span className="absolute -start-[27px] top-1 grid size-4 place-items-center rounded-full bg-gold-400 ring-4 ring-gold-100" aria-hidden="true" />
                      <p className="font-display text-sm font-extrabold text-brand-700">{t.date}</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-700">{t.event}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
            </div>

            {/* معجم المفاهيم */}
            <div data-lesson-block>
            <Reveal>
              <div className="rounded-3xl border border-ink-900/6 bg-white p-7 sm:p-8">
                <h2 className="flex items-center gap-2.5 font-display text-xl font-extrabold text-ink-900">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <BookOpenCheck className="size-5" aria-hidden="true" />
                  </span>
                  معجم مفاهيم الدرس
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {lesson.glossary.map((g) => (
                    <div key={g.term} className="rounded-2xl border border-ink-900/6 bg-cream p-4.5">
                      <p className="font-display text-sm font-extrabold text-brand-700">{g.term}</p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">{g.def}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            </div>

            {/* مربعات الشخصيات والأماكن */}
            {((lesson.characters && lesson.characters.length > 0) || (lesson.places && lesson.places.length > 0)) && (
              <div data-lesson-block>
              <Reveal>
                <div className="grid gap-5 sm:grid-cols-2">
                  {lesson.characters && lesson.characters.length > 0 && (
                    <div className="rounded-3xl border border-ink-900/6 bg-white p-6">
                      <h2 className="flex items-center gap-2.5 font-display text-lg font-extrabold text-ink-900">
                        <span className="grid size-9 place-items-center rounded-xl bg-gold-100 text-gold-600">
                          <GraduationCap className="size-4.5" aria-hidden="true" />
                        </span>
                        الشخصيات الرئيسية
                      </h2>
                      <ul className="mt-4 space-y-3">
                        {lesson.characters.map((c) => (
                          <li key={c.name} className="rounded-xl bg-cream p-3.5">
                            <p className="text-sm font-extrabold text-brand-700">{c.name}</p>
                            <p className="mt-1 text-xs leading-relaxed text-ink-500">{c.role}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lesson.places && lesson.places.length > 0 && (
                    <div className="rounded-3xl border border-ink-900/6 bg-white p-6">
                      <h2 className="flex items-center gap-2.5 font-display text-lg font-extrabold text-ink-900">
                        <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                          <Layers className="size-4.5" aria-hidden="true" />
                        </span>
                        الأماكن والمحطات الجغرافية
                      </h2>
                      <ul className="mt-4 space-y-3">
                        {lesson.places.map((p) => (
                          <li key={p.name} className="rounded-xl bg-cream p-3.5">
                            <p className="text-sm font-extrabold text-brand-700">{p.name}</p>
                            <p className="mt-1 text-xs leading-relaxed text-ink-500">{p.why}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Reveal>
              </div>
            )}

            {/* المراجع والمصادر */}
            {lesson.references && lesson.references.length > 0 && (
              <div data-lesson-block>
              <Reveal>
                <div className="rounded-3xl border border-dashed border-brand-300 bg-brand-50/50 p-6">
                  <h2 className="flex items-center gap-2.5 font-display text-base font-extrabold text-ink-900">
                    <BookMarked className="size-5 text-brand-600" aria-hidden="true" />
                    المراجع والمصادر
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-ink-500">
                    أُعدّ هذا الدرس بأسلوب تعليمي أصلي بعد مقارنة المعلومات بين المواقع التعليمية المغربية التالية (مراجع استشارية، لا مصادر نقل حرفي):
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {lesson.references.map((r) => (
                      <a
                        key={r.name}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-xs font-bold text-brand-700 transition-all hover:-translate-y-0.5 hover:border-brand-400"
                      >
                        {r.name} ←
                      </a>
                    ))}
                  </div>
                </div>
              </Reveal>
              </div>
            )}

            {/* خلاصة مركزة */}
            <div data-lesson-block>
            <Reveal>
              <div className="rounded-3xl bg-gradient-to-l from-brand-800 to-brand-950 p-7 text-white sm:p-8">
                <h2 className="flex items-center gap-2.5 font-display text-xl font-extrabold">
                  <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-gold-300">
                    <NotebookPen className="size-5" aria-hidden="true" />
                  </span>
                  خلاصة مركزة للحفظ
                </h2>
                <ol className="mt-5 space-y-3">
                  {lesson.summary.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm leading-loose text-white/85">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gold-400/20 font-display text-xs font-black text-gold-300">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
            </div>

            {/* في الامتحان */}
            <div data-lesson-block>
            <Reveal>
              <div className="rounded-3xl border border-gold-300/60 bg-gold-50 p-7 sm:p-8">
                <h2 className="flex items-center gap-2.5 font-display text-xl font-extrabold text-ink-900">
                  <span className="grid size-10 place-items-center rounded-xl bg-gold-400/25 text-gold-600">
                    <Lightbulb className="size-5" aria-hidden="true" />
                  </span>
                  في الفرض والامتحان
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {lesson.examTips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2.5 text-[13px] font-semibold leading-loose text-ink-700">
                      <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-gold-600" aria-hidden="true" />
                      {tip}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => go({ view: "methods", id: "analysis-history-doc" })}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-gold-400 bg-white px-4 py-2.5 text-xs font-extrabold text-gold-700 transition-all hover:-translate-y-0.5"
                >
                  <FileText className="size-4" aria-hidden="true" />
                  راجع منهجية تحليل الوثيقة التاريخية
                </button>
              </div>
            </Reveal>
            </div>

            {/* اختبر فهمك */}
            <div data-lesson-block>
            <Reveal>
              <div className="rounded-3xl border border-ink-900/6 bg-cream p-7 sm:p-8">
                <h2 className="flex items-center gap-2.5 font-display text-xl font-extrabold text-ink-900">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <ListChecks className="size-5" aria-hidden="true" />
                  </span>
                  اختبر فهمك
                </h2>
                <p className="mt-1.5 text-xs text-ink-500">أربعة أسئلة تفاعلية بتصحيح فوري للتأكد من استيعاب الدرس.</p>
                <div className="mt-5">
                  <LessonQuiz quiz={lesson.quiz} />
                </div>
              </div>
            </Reveal>
            </div>

            {/* روابط سريعة */}
            <Reveal>
              <div className="flex flex-col items-center justify-between gap-3 rounded-3xl border border-ink-900/6 bg-white p-6 sm:flex-row">
                <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 px-5 py-3 text-sm font-bold text-ink-700 transition-all hover:-translate-y-0.5 hover:border-brand-400">
                  <ArrowRight className="size-4" aria-hidden="true" />
                  كل الدروس
                </button>
                <button
                  type="button"
                  onClick={() => go({ view: "test" })}
                  className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-brand-700 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-brand-700/25 transition-all hover:-translate-y-0.5"
                >
                  <FlaskConical className="size-4.5" aria-hidden="true" />
                  قيّم مستواك بالتشخيص
                </button>
              </div>
            </Reveal>
          </div>

          {/* فهرس جانبي */}
          <aside className="lg:sticky lg:top-32 lg:self-start" aria-label="فهرس الدرس">
            <Reveal delay={150}>
              <div className="rounded-3xl border border-ink-900/6 bg-white p-5">
                <p className="flex items-center gap-2 font-display text-sm font-extrabold text-ink-900">
                  <Scale className="size-4 text-brand-600" aria-hidden="true" />
                  بنية الدرس
                </p>
                <nav className="mt-4 flex flex-col gap-1">
                  {toc.map((item, i) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setSectionIndex(i);
                        const sections = document.querySelectorAll<HTMLElement>("[data-lesson-block]");
                        sections[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className={`rounded-xl px-3.5 py-2.5 text-start text-[12px] font-bold transition-colors ${
                        sectionIndex === i ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-brand-50 hover:text-brand-700"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </nav>
                <p className="mt-4 rounded-xl bg-paper-warm/70 p-3 text-[10px] leading-relaxed text-ink-500">
                  <span className="mb-1 flex items-center gap-1.5 font-extrabold text-ink-700">
                    <BookMarked className="size-3" aria-hidden="true" />
                    عن المحتوى
                  </span>
                  محتوى مؤلَّف من طرف الأستاذ وفق المحاور المنهجية للمقرر — مناسب للمراجعة والتحضير للفروض.
                </p>
              </div>
            </Reveal>
          </aside>
        </div>
      </div>
    </section>
  );
}

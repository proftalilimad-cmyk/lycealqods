import { useState } from "react";
import { BadgeCheck, BookOpen, BookOpenCheck, ExternalLink, FileText, FlaskConical, Globe2, History, Hourglass, Landmark, MonitorPlay, Scale, Sparkles, Wrench } from "lucide-react";
import { LEVELS } from "../data/curriculum";
import { hasLessonContent, lessonKey } from "../data/lessonContent";
import { getDeckForLesson } from "../data/decks";
import type { LessonItem } from "../types";
import Reveal from "./Reveal";
import type { Route } from "../routes";

interface LessonsProps {
  go: (r: Route) => void;
  initialLevel?: string;
}

const SUBJECT_ICONS: Record<string, typeof History> = {
  history: History,
  geography: Globe2,
  citizenship: Scale,
};

function LessonRow({ lesson, index, ready, onOpen, deckId, onDeck }: { lesson: LessonItem; index: number; ready: boolean; onOpen: () => void; deckId?: string; onDeck?: () => void }) {
  if (lesson.soon) {
    return (
      <li className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-paper-warm text-ink-400">
            <Hourglass className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink-900">الدرس {index + 1}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-gold-700">سيتم إضافة الدرس لاحقًا</p>
          </div>
        </div>
        <span className="rounded-full border border-dashed border-brand-300 bg-brand-50/60 px-3.5 py-1.5 text-[10px] font-extrabold text-brand-700">
          قيد الإعداد
        </span>
      </li>
    );
  }
  const body = (
    <>
      <div className="flex items-start gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl font-display text-[13px] font-black text-white transition-transform duration-300 ${
            ready ? "bg-gradient-to-br from-gold-400 to-gold-600 group-hover:scale-110" : "bg-gradient-to-br from-brand-500 to-brand-700"
          }`}
        >
          {index + 1}
        </span>
        <div>
          <p className="text-sm font-bold leading-relaxed text-ink-900">{lesson.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {lesson.tag === "ملف" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-0.5 text-[10px] font-extrabold text-gold-700">
                <FileText className="size-3" aria-hidden="true" />
                ملف موضوعاتي
              </span>
            )}
            {lesson.tag === "تقنية" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-extrabold text-sky-700">
                <Wrench className="size-3" aria-hidden="true" />
                كفاية تقنية
              </span>
            )}
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${ready ? "text-emerald-600" : "text-ink-400"}`}>
              <BookOpen className="size-3" aria-hidden="true" />
              {ready ? "المحتوى كامل: أهداف + محاور + مفاهيم + اختبر فهمك" : "المحتوى التفصيلي يُضاف تباعًا على المنصة"}
            </span>
            {deckId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-extrabold text-brand-700 ring-1 ring-brand-200">
                <MonitorPlay className="size-3" aria-hidden="true" />
                عرض تفاعلي من الكتاب المدرسي
              </span>
            )}
          </div>
        </div>
      </div>
      <span className="flex shrink-0 flex-wrap items-center gap-2">
        {deckId && onDeck && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeck();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gold-300 bg-gold-50 px-3.5 py-2 text-[11px] font-extrabold text-gold-700 transition-all hover:-translate-y-0.5 hover:border-gold-500 hover:bg-gold-100"
          >
            <MonitorPlay className="size-3.5" aria-hidden="true" />
            العرض التفاعلي
          </button>
        )}
        {ready ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-brand-600 to-brand-700 px-4 py-2 text-[11px] font-extrabold text-white shadow-lg shadow-brand-700/25 transition-transform duration-300 group-hover:-translate-x-1"
          >
            اقرأ الدرس ←
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-1.5 text-[10px] font-extrabold text-brand-700 ring-1 ring-brand-200">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            مدرج بالمقرر الرسمي
          </span>
        )}
      </span>
    </>
  );

  return (
    <li
      className={`group flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition-colors ${ready ? "cursor-pointer hover:bg-brand-50/60" : "hover:bg-brand-50/40"}`}
      onClick={ready ? onOpen : undefined}
    >
      {body}
    </li>
  );
}

export default function Lessons({ go, initialLevel }: LessonsProps) {
  const [levelId, setLevelId] = useState(initialLevel ?? "tc");
  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
  const [branchId, setBranchId] = useState(level.branches[0].id);
  const branch = level.branches.find((b) => b.id === branchId) ?? level.branches[0];
  const [subjectId, setSubjectId] = useState(branch.subjects[0].id);
  const activeSubject = branch.subjects.find((s) => s.id === subjectId) ?? branch.subjects[0];
  const units = branch.units[activeSubject.id] ?? [];

  const switchLevel = (id: string) => {
    const lv = LEVELS.find((l) => l.id === id) ?? LEVELS[0];
    setLevelId(id);
    setBranchId(lv.branches[0].id);
    setSubjectId(lv.branches[0].subjects[0].id);
  };

  const switchBranch = (id: string) => {
    const br = level.branches.find((b) => b.id === id) ?? level.branches[0];
    setBranchId(id);
    setSubjectId(br.subjects[0].id);
  };

  return (
    <section className="pt-32 pb-20 md:pt-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
              <BookOpenCheck className="size-3.5" aria-hidden="true" />
              الدروس
            </span>
            <h1 className="mt-5 font-display text-3xl font-black text-ink-900 sm:text-4xl">الدروس حسب المستويات والمسالك</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-500 sm:text-base">
              دروس التاريخ والجغرافيا حسب المقرر الرسمي، منظمة في وحدات ودورات. يُضيف الأستاذ محتوى كل درس تفصيليًا
              خلال الموسم الدراسي.
            </p>
          </div>
        </Reveal>

        {/* تبويبات المستوى */}
        <Reveal delay={100}>
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {LEVELS.map((lv) => (
              <button
                key={lv.id}
                type="button"
                onClick={() => switchLevel(lv.id)}
                className={`rounded-2xl px-6 py-3.5 font-display text-sm font-extrabold transition-all duration-300 ${
                  levelId === lv.id
                    ? "bg-gradient-to-l from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-700/30"
                    : "border border-ink-900/8 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-700"
                }`}
              >
                {lv.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* تبويبات المسلك */}
        <Reveal delay={160}>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {level.branches.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => switchBranch(b.id)}
                className={`rounded-xl px-4.5 py-2.5 text-xs font-bold transition-all duration-300 sm:text-sm ${
                  branchId === b.id
                    ? "bg-gold-100 text-gold-700 ring-2 ring-gold-400"
                    : "border border-ink-900/8 bg-white text-ink-500 hover:border-gold-300 hover:text-gold-700"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </Reveal>

        {branch.note && (
          <Reveal delay={200}>
            <p className="mx-auto mt-5 max-w-2xl rounded-2xl border border-brand-200 bg-brand-50 px-5 py-3 text-center text-xs font-semibold leading-relaxed text-brand-800">
              {branch.note}
            </p>
          </Reveal>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* عمود المواد */}
          <Reveal delay={220}>
            <div className="space-y-2.5 lg:sticky lg:top-32">
              {branch.subjects.map((s) => {
                const Icon = SUBJECT_ICONS[s.id] ?? BookOpen;
                const active = s.id === activeSubject.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSubjectId(s.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border-2 px-5 py-4 text-start transition-all duration-300 ${
                      active
                        ? "border-brand-500 bg-brand-50 shadow-[0_14px_35px_-16px_rgba(12,124,91,0.4)]"
                        : "border-ink-900/8 bg-white hover:border-brand-300"
                    }`}
                  >
                    <span className={`grid size-10 place-items-center rounded-xl ${active ? "bg-brand-600 text-white" : "bg-paper-warm text-ink-500"}`}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className={`block text-sm font-extrabold ${active ? "text-brand-700" : "text-ink-900"}`}>{s.label}</span>
                      <span className="block text-[10px] text-ink-500">دروس {s.label} — {branch.label}</span>
                    </span>
                  </button>
                );
              })}

              {branch.program && (
                <p className="rounded-2xl border border-dashed border-gold-400/70 bg-gold-50 p-4 text-[10px] font-semibold leading-relaxed text-gold-700">
                  <span className="mb-1 flex items-center gap-1.5 font-extrabold">
                    <ExternalLink className="size-3" aria-hidden="true" />
                    مصدر قائمة الدروس
                  </span>
                  {branch.programNote ?? <>مقرر «{branch.program}» — وفق التنظيم المنشور على منصة قرايتي (9rayti.com).</>}
                </p>
              )}
            </div>
          </Reveal>

          {/* الوحدات والدروس */}
          <div className="space-y-8" key={`${levelId}-${branchId}-${subjectId}`}>
            {[1, 2]
              .map((term) => ({
                term,
                entries: units
                  .map((u, i) => ({ unit: u, ui: i }))
                  .filter((e) => (e.unit.term ?? 1) === term),
              }))
              .filter((g) => g.entries.length > 0)
              .map((group) => (
                <div key={group.term} className="space-y-5">
                  <Reveal>
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 text-xs font-black text-gold-300">
                        {group.term}
                      </span>
                      <h2 className="font-display text-lg font-extrabold text-ink-900 sm:text-xl">
                        {group.term === 1 ? "الدورة الأولى" : "الدورة الثانية"}
                      </h2>
                      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-brand-200 to-transparent" aria-hidden="true" />
                    </div>
                  </Reveal>
                  {group.entries.map(({ unit, ui }, si) => (
              <Reveal key={unit.title} delay={si * 80}>
                <article className="overflow-hidden rounded-3xl border border-ink-900/6 bg-white transition-shadow hover:shadow-[0_25px_55px_-25px_rgba(12,124,91,0.25)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-900/6 bg-gradient-to-l from-brand-50 to-white px-6 py-4">
                    <h2 className="font-display text-base font-extrabold leading-relaxed text-ink-900">
                      <span className="me-2 inline-grid size-7 place-items-center rounded-lg bg-brand-600 text-xs font-black text-white">{ui + 1}</span>
                      {unit.title}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[10px] font-bold text-ink-500 ring-1 ring-ink-900/8">
                      <BookOpen className="size-3" aria-hidden="true" />
                      {unit.lessons.length} {unit.lessons.length === 1 ? "درس" : unit.lessons.length === 2 ? "درسان" : "دروس"}
                    </span>
                  </div>
                  <ul className="divide-y divide-ink-900/5">
                    {unit.lessons.map((lesson, li) => {
                      const key = lesson.soon ? "" : lessonKey(branch.id, activeSubject.id, ui, li);
                      const ready = key !== "" && hasLessonContent(key);
                      const deck = key ? getDeckForLesson(key) : undefined;
                      return (
                        <LessonRow
                          key={li}
                          lesson={lesson}
                          index={li}
                          ready={ready}
                          onOpen={() => go({ view: "lesson", id: key })}
                          deckId={deck?.id}
                          onDeck={deck ? () => go({ view: "decks", id: deck.id }) : undefined}
                        />
                      );
                    })}
                  </ul>
                </article>
              </Reveal>
                  ))}
                </div>
              ))}

            {/* موارد مرتبطة بالمستوى */}
            <Reveal delay={280}>
              <div className="rounded-3xl border border-ink-900/6 bg-cream p-6">
                <p className="flex items-center gap-2 font-display text-sm font-extrabold text-ink-900">
                  <Sparkles className="size-4.5 text-gold-500" aria-hidden="true" />
                  موارد مصاحبة لمستوى {level.label}
                </p>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                  {level.extras.map((x) =>
                    x.target === "soon" ? (
                      <span
                        key={x.label}
                        className="flex items-center gap-2.5 rounded-2xl border border-dashed border-ink-900/15 bg-white/70 px-4 py-3.5 text-xs font-bold text-ink-400"
                      >
                        <Landmark className="size-4 shrink-0" aria-hidden="true" />
                        {x.label}
                      </span>
                    ) : (
                      <button
                        key={x.label}
                        type="button"
                        onClick={() => go(x.target === "methods" ? { view: "methods" } : { view: "apps", level: levelId })}
                        className="group flex items-center gap-2.5 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3.5 text-start text-xs font-extrabold text-brand-700 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        {x.target === "methods" ? <FileText className="size-4 shrink-0" aria-hidden="true" /> : <FlaskConical className="size-4 shrink-0" aria-hidden="true" />}
                        {x.label}
                      </button>
                    )
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

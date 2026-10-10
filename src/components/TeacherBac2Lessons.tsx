import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  FileText,
  Filter,
  Globe2,
  History,
  ListChecks,
  Search,
  ShieldCheck,
  Target,
} from "lucide-react";
import { LEVELS } from "../data/curriculum";
import { getLessonContent, lessonKey } from "../data/lessonContent";
import { getJadada } from "../lib/jadadatLessons";
import type { Route } from "../routes";
import Reveal from "./Reveal";

interface TeacherBac2LessonsProps {
  go: (route: Route) => void;
}

type SubjectFilter = "all" | "history" | "geography";

type TeacherLesson = {
  key: string;
  subjectId: "history" | "geography";
  subjectLabel: string;
  unitIndex: number;
  unitTitle: string;
  term: 1 | 2;
  number: number;
  title: string;
  tag?: string;
  content: NonNullable<ReturnType<typeof getLessonContent>>;
};

const bac2ArtsBranch = LEVELS.find((level) => level.id === "bac2")?.branches.find((branch) => branch.id === "bac2-arts");

function getTeacherLessons(): TeacherLesson[] {
  if (!bac2ArtsBranch) return [];
  return bac2ArtsBranch.subjects.flatMap((subject) => {
    if (subject.id !== "history" && subject.id !== "geography") return [];
    const subjectId = subject.id as "history" | "geography";
    return (bac2ArtsBranch.units[subjectId] ?? []).flatMap((unit, unitIndex) =>
      unit.lessons.flatMap((lesson, lessonIndex) => {
        if (lesson.soon) return [];
        const key = lessonKey(bac2ArtsBranch.id, subjectId, unitIndex, lessonIndex);
        const content = getLessonContent(key);
        if (!content) return [];
        return [{
          key,
          subjectId,
          subjectLabel: subject.label,
          unitIndex,
          unitTitle: unit.title,
          term: unit.term ?? (unitIndex === 0 ? 1 : 2),
          number: lessonIndex + 1,
          title: lesson.title,
          tag: lesson.tag,
          content,
        }];
      }),
    );
  });
}

const subjectLabel = (subject: SubjectFilter): string => {
  if (subject === "history") return "التاريخ";
  if (subject === "geography") return "الجغرافيا";
  return "كل المواد";
};

export default function TeacherBac2Lessons({ go }: TeacherBac2LessonsProps) {
  const [subject, setSubject] = useState<SubjectFilter>("all");
  const [query, setQuery] = useState("");
  const lessons = useMemo(() => getTeacherLessons(), []);
  const normalizedQuery = query.trim().toLocaleLowerCase("ar");

  const filtered = useMemo(
    () => lessons.filter((lesson) => {
      const matchesSubject = subject === "all" || lesson.subjectId === subject;
      const haystack = [lesson.title, lesson.unitTitle, lesson.content.coreQuestion].join(" ").toLocaleLowerCase("ar");
      return matchesSubject && (!normalizedQuery || haystack.includes(normalizedQuery));
    }),
    [lessons, normalizedQuery, subject],
  );

  const groups = useMemo(() => {
    const map = new Map<string, TeacherLesson[]>();
    filtered.forEach((lesson) => {
      const id = `${lesson.subjectId}-${lesson.unitIndex}`;
      const current = map.get(id) ?? [];
      current.push(lesson);
      map.set(id, current);
    });
    return [...map.entries()].map(([id, items]) => ({ id, items, first: items[0] }));
  }, [filtered]);

  const totalQuestions = lessons.reduce((total, lesson) => total + lesson.content.quiz.length, 0);
  const historyCount = lessons.filter((lesson) => lesson.subjectId === "history").length;
  const geographyCount = lessons.filter((lesson) => lesson.subjectId === "geography").length;

  return (
    <div className="space-y-6">
      <Reveal>
        <section className="overflow-hidden rounded-3xl border border-brand-200/70 bg-gradient-to-l from-brand-900 via-brand-800 to-brand-700 p-6 text-white shadow-[0_25px_60px_-32px_rgba(4,36,26,0.8)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-extrabold text-gold-200">
                <BookOpenCheck className="size-4" aria-hidden="true" />
                مكتبة الدروس داخل لوحة الأستاذ
              </span>
              <h2 className="mt-4 font-display text-2xl font-black sm:text-3xl">دروس الثانية باكالوريا آداب وعلوم إنسانية</h2>
              <p className="mt-3 max-w-3xl text-sm leading-loose text-white/75">
                فهرس عملي للأستاذ لمراجعة الدروس المنجزة من مادة «دروس ملخصة»، وفتح المحتوى الكامل أو التقويم النهائي أو الجذاذة مباشرة من اللوحة.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-end">
              <p className="text-[10px] font-bold text-white/60">المصدر</p>
              <p className="mt-1 text-sm font-extrabold text-gold-200">مجزوءتا التاريخ والجغرافيا</p>
              <p className="mt-1 text-[11px] text-white/65">مع بطاقات مستقلة للملفات الخاصة بالمسلك</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "إجمالي الدروس", value: lessons.length, icon: BookOpenCheck },
              { label: "دروس التاريخ", value: historyCount, icon: History },
              { label: "دروس الجغرافيا", value: geographyCount, icon: Globe2 },
              { label: "أسئلة التقويم النهائي", value: totalQuestions, icon: ListChecks },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <stat.icon className="size-5 text-gold-300" aria-hidden="true" />
                <p className="mt-3 font-display text-2xl font-black">{stat.value}</p>
                <p className="mt-1 text-[11px] font-semibold text-white/65">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal delay={80}>
        <section className="rounded-3xl border border-ink-900/8 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900">
                <Filter className="size-5 text-brand-600" aria-hidden="true" />
                فهرس الدروس
              </p>
              <p className="mt-1 text-[11px] text-ink-500">ابحث بعنوان الدرس أو الوحدة، ثم افتح الإجراء الذي تحتاجه داخل القسم.</p>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1.5 text-[11px] font-extrabold text-brand-700 ring-1 ring-brand-200">
              يظهر {filtered.length} من {lessons.length} درسًا
            </span>
          </div>
          <div className="mt-5 flex flex-col gap-3 lg:flex-row">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث: الحرب الباردة، العولمة، الصين..."
                className="field w-full py-3 ps-10 text-sm"
                aria-label="البحث في دروس الثانية باكالوريا"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {(["all", "history", "geography"] as SubjectFilter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSubject(item)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-extrabold transition-all ${subject === item ? "border-brand-500 bg-brand-600 text-white" : "border-ink-900/10 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700"}`}
                >
                  {item === "history" ? <History className="size-4" aria-hidden="true" /> : item === "geography" ? <Globe2 className="size-4" aria-hidden="true" /> : <BookOpenCheck className="size-4" aria-hidden="true" />}
                  {subjectLabel(item)}
                </button>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink-900/15 bg-white p-10 text-center text-sm font-bold text-ink-500">لا يوجد درس يطابق البحث الحالي.</div>
      ) : (
        groups.map((group, groupIndex) => (
          <Reveal key={group.id} delay={groupIndex * 45}>
            <section className="overflow-hidden rounded-3xl border border-ink-900/8 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-900/7 bg-gradient-to-l from-brand-50 to-white px-5 py-4 sm:px-6">
                <div>
                  <p className="text-[10px] font-extrabold text-brand-700">{group.first.subjectLabel} · الدورة {group.first.term}</p>
                  <h3 className="mt-1 font-display text-base font-extrabold text-ink-900">{group.first.unitTitle}</h3>
                </div>
                <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold text-ink-500 ring-1 ring-ink-900/8">{group.items.length} دروس ظاهرة</span>
              </div>
              <div className="divide-y divide-ink-900/6">
                {group.items.map((lesson) => {
                  const finalCount = lesson.content.quiz.length;
                  const formativeCount = lesson.content.formativeAssessments?.length ?? 0;
                  const docsCount = lesson.content.docs?.length ?? 0;
                  const jadada = getJadada(lesson.key);
                  const source = lesson.content.sourceMaterial;
                  return (
                    <article key={lesson.key} className="p-5 sm:p-6">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-start gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-xs font-black text-white">{lesson.number}</span>
                            <div className="min-w-0">
                              <h4 className="font-display text-sm font-extrabold leading-relaxed text-ink-900">{lesson.title}</h4>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {lesson.tag && <span className="rounded-full bg-gold-50 px-2.5 py-1 text-[10px] font-extrabold text-gold-700 ring-1 ring-gold-200">{lesson.tag}</span>}
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700"><CheckCircle2 className="size-3" aria-hidden="true" /> المصدر الأصلي متاح</span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold text-brand-700"><ShieldCheck className="size-3" aria-hidden="true" /> دون إعادة صياغة للمصدر</span>
                              </div>
                            </div>
                          </div>
                          <p className="mt-3 border-s-2 border-gold-300 ps-3 text-xs leading-relaxed text-ink-600">{source?.title ?? "المادة الأصلية من مجلد دروس ملخصة"} — افتح زر المصدر لقراءة النص كما هو.</p>
                          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                              { icon: ListChecks, label: "التقويم النهائي", value: `${finalCount} سؤالًا` },
                              { icon: Target, label: "التقويم المرحلي", value: `${formativeCount} مراحل` },
                              { icon: FileText, label: "الوثائق", value: `${docsCount} وثيقتان/وثائق` },
                              { icon: CalendarDays, label: "المفاهيم والمحطات", value: `${lesson.content.glossary.length} · ${lesson.content.timeline.length}` },
                            ].map((meta) => (
                              <div key={meta.label} className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2.5">
                                <meta.icon className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
                                <span className="min-w-0"><span className="block text-[10px] font-bold text-ink-400">{meta.label}</span><span className="block text-xs font-extrabold text-ink-800">{meta.value}</span></span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2 xl:max-w-[275px] xl:justify-end">
                          <button type="button" onClick={() => go({ view: "lesson", id: lesson.key })} className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-[11px] font-extrabold text-brand-700 transition-transform hover:-translate-y-0.5">
                            <BookOpenCheck className="size-3.5" aria-hidden="true" /> بطاقة الدرس
                          </button>
                          <button type="button" onClick={() => go({ view: "lesson", id: lesson.key, focus: "final" })} className="inline-flex items-center gap-1.5 rounded-xl border border-gold-300 bg-gold-50 px-3.5 py-2.5 text-[11px] font-extrabold text-gold-700 transition-transform hover:-translate-y-0.5">
                            <ListChecks className="size-3.5" aria-hidden="true" /> التقويم النهائي
                          </button>
                          {jadada && (
                            <button type="button" onClick={() => go({ view: "jadadat", id: lesson.key })} className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-[11px] font-extrabold text-brand-700 transition-transform hover:-translate-y-0.5">
                              <FileText className="size-3.5" aria-hidden="true" /> الجذاذة
                            </button>
                          )}
                          {source?.files[0] && (
                            <a href={source.files[0].localUrl ?? source.files[0].url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2.5 text-[11px] font-extrabold text-white transition-transform hover:-translate-y-0.5">
                              <ArrowLeft className="size-3.5" aria-hidden="true" /> الأصل كما هو
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </Reveal>
        ))
      )}
    </div>
  );
}

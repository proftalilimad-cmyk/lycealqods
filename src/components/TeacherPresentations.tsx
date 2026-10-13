import { useMemo, useState } from "react";
import {
  Archive,
  BookOpenCheck,
  CheckCircle2,
  Download,
  FileArchive,
  Loader2,
  MonitorPlay,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { LEVELS } from "../data/curriculum";
import { getLessonContent, lessonKey } from "../data/lessonContent";
import { getDeckForLesson } from "../data/decks";
import { createLessonPowerPointBlob, downloadLessonPowerPoint } from "./LessonPresentation";
import type { CurriculumLevel, LessonContent } from "../types";
import type { Route } from "../routes";
import Reveal from "./Reveal";

interface TeacherPresentationsProps {
  go: (route: Route) => void;
}

interface PresentationLesson {
  key: string;
  title: string;
  content: LessonContent;
  levelId: string;
  levelLabel: string;
  branchId: string;
  branchLabel: string;
  subjectId: string;
  subjectLabel: string;
  unitTitle: string;
  unitIndex: number;
  lessonIndex: number;
  term?: 1 | 2;
}

type SubjectFilter = "all" | "history" | "geography" | "citizenship";

function countCurriculumLessons(level: CurriculumLevel): number {
  return level.branches.reduce((total, branch) => total + branch.subjects.reduce((subjectTotal, subject) => subjectTotal + (branch.units[subject.id] ?? []).reduce((unitTotal, unit) => unitTotal + unit.lessons.length, 0), 0), 0);
}

function collectPresentationLessons(level: CurriculumLevel): PresentationLesson[] {
  const seen = new Set<string>();
  const lessons: PresentationLesson[] = [];
  level.branches.forEach((branch) => {
    branch.subjects.forEach((subject) => {
      (branch.units[subject.id] ?? []).forEach((unit, unitIndex) => {
        unit.lessons.forEach((item, lessonIndex) => {
          const key = lessonKey(branch.id, subject.id, unitIndex, lessonIndex);
          const content = item.soon ? undefined : getLessonContent(key);
          if (!content || seen.has(key)) return;
          seen.add(key);
          lessons.push({
            key,
            title: content.title || item.title,
            content,
            levelId: level.id,
            levelLabel: level.label,
            branchId: branch.id,
            branchLabel: branch.label,
            subjectId: subject.id,
            subjectLabel: subject.label,
            unitTitle: unit.title,
            unitIndex,
            lessonIndex,
            term: unit.term,
          });
        });
      });
    });
  });
  return lessons;
}

function safeFilePart(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\u0600-\u06ff.-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100) || "level";
}

function lessonFileName(lesson: PresentationLesson): string {
  return `presentation-${lesson.key.replace(/[^a-zA-Z0-9.-]+/g, "-")}.pptx`;
}

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function metaFor(lesson: PresentationLesson) {
  return {
    subjectLabel: lesson.subjectLabel,
    levelLabel: lesson.levelLabel,
    branchLabel: lesson.branchLabel,
  };
}

export default function TeacherPresentations({ go }: TeacherPresentationsProps) {
  const [levelId, setLevelId] = useState(LEVELS[0]?.id ?? "tc");
  const [subject, setSubject] = useState<SubjectFilter>("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [notice, setNotice] = useState("");

  const allLessons = useMemo(
    () => LEVELS.flatMap((level) => collectPresentationLessons(level)),
    [],
  );
  const levelSummaries = useMemo(
    () => LEVELS.map((level) => {
      const ready = allLessons.filter((lesson) => lesson.levelId === level.id).length;
      return { level, total: countCurriculumLessons(level), ready };
    }),
    [allLessons],
  );
  const activeLevel = LEVELS.find((level) => level.id === levelId) ?? LEVELS[0];
  const levelLessons = useMemo(
    () => allLessons.filter((lesson) => lesson.levelId === activeLevel?.id),
    [activeLevel?.id, allLessons],
  );
  const filteredLessons = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ar");
    return levelLessons.filter((lesson) => {
      const matchesSubject = subject === "all" || lesson.subjectId === subject;
      const haystack = [lesson.title, lesson.unitTitle, lesson.branchLabel, lesson.subjectLabel].join(" ").toLocaleLowerCase("ar");
      return matchesSubject && (!needle || haystack.includes(needle));
    });
  }, [levelLessons, query, subject]);
  const groups = useMemo(() => {
    const map = new Map<string, PresentationLesson[]>();
    filteredLessons.forEach((lesson) => {
      const key = `${lesson.branchId}::${lesson.unitIndex}`;
      const current = map.get(key) ?? [];
      current.push(lesson);
      map.set(key, current);
    });
    return Array.from(map.entries()).map(([id, items]) => ({ id, branchLabel: items[0].branchLabel, unitTitle: items[0].unitTitle, items }));
  }, [filteredLessons]);

  const run = async (id: string, action: () => Promise<void>, success: string) => {
    setBusy(id);
    setNotice("");
    try {
      await action();
      setNotice(success);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر إنشاء ملف PowerPoint الآن. حاول مرة أخرى.");
    } finally {
      setBusy(null);
      setProgress(null);
    }
  };

  const downloadOne = (lesson: PresentationLesson) => {
    void run(
      lesson.key,
      () => downloadLessonPowerPoint(lesson.content, metaFor(lesson)),
      `تم تحميل ${lessonFileName(lesson)} — يمكن فتحه وتعديله في Keynote.`,
    );
  };

  const downloadLevelZip = () => {
    if (!activeLevel || levelLessons.length === 0) {
      setNotice("لا توجد عروض PowerPoint منشورة لهذا المستوى بعد.");
      return;
    }
    void run(
      `zip-${activeLevel.id}`,
      async () => {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        const folder = zip.folder(`PowerPoint-${safeFilePart(activeLevel.label)}`) ?? zip;
        folder.file(
          "README.txt",
          `عروض PowerPoint قابلة للتحرير في Keynote\nالمستوى: ${activeLevel.label}\nعدد العروض: ${levelLessons.length}\n\nالمحتوى مبني على دروس الموقع الأصلي. افتح ملفات .pptx في Microsoft PowerPoint أو Apple Keynote.\n`,
        );
        setProgress({ done: 0, total: levelLessons.length });
        for (const [index, lesson] of levelLessons.entries()) {
          const blob = await createLessonPowerPointBlob(lesson.content, metaFor(lesson));
          folder.file(lessonFileName(lesson), blob);
          setProgress({ done: index + 1, total: levelLessons.length });
        }
        const archive = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
        triggerBlobDownload(archive, `PowerPoint-${safeFilePart(activeLevel.label)}.zip`);
      },
      `تم جمع ${levelLessons.length} عروض PowerPoint في ملف ZIP للمستوى ${activeLevel.label}.`,
    );
  };

  const readyCount = levelLessons.length;

  return (
    <div className="space-y-6" dir="rtl">
      <Reveal>
        <section className="relative overflow-hidden rounded-3xl border border-brand-200/70 bg-gradient-to-l from-brand-900 via-brand-800 to-brand-950 p-6 text-white shadow-[0_24px_60px_-32px_rgba(4,36,26,0.65)] sm:p-8">
          <div className="pointer-events-none absolute -end-10 -top-16 size-56 rounded-full bg-gold-400/10 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-wrap items-start justify-between gap-5">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-extrabold text-gold-200"><FileArchive className="size-4" aria-hidden="true" /> مكتبة PowerPoint للأستاذ</span>
              <h2 className="mt-4 font-display text-2xl font-black sm:text-3xl">عروض الدروس حسب المستوى</h2>
              <p className="mt-3 max-w-2xl text-sm leading-[2] text-white/75">حمّل العرض الفردي أو اجمع عروض المستوى في ملف ZIP. الملفات بصيغة PowerPoint قابلة للفتح والتعديل في Apple Keynote.</p>
            </div>
            <div className="grid min-w-[150px] gap-2 rounded-2xl border border-white/10 bg-white/10 p-4 text-center"><span className="text-3xl font-black text-gold-200">{allLessons.length}</span><span className="text-[11px] font-bold text-white/70">عرضًا منشورًا</span></div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={60}>
        <section className="rounded-3xl border border-ink-900/8 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="inline-flex items-center gap-2 text-sm font-black text-ink-900"><SlidersHorizontal className="size-4 text-brand-600" aria-hidden="true" /> اختر المستوى</p><p className="mt-1 text-[11px] text-ink-500">يظهر كل مستوى مع عدد عروض PowerPoint الجاهزة للتحميل.</p></div>
            <span className="rounded-full bg-brand-50 px-3 py-1.5 text-[11px] font-extrabold text-brand-700">{readyCount} عرضًا في المستوى الحالي</span>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {levelSummaries.map(({ level, total, ready }) => {
              const active = level.id === activeLevel?.id;
              return <button key={level.id} type="button" onClick={() => { setLevelId(level.id); setSubject("all"); setQuery(""); }} className={`rounded-2xl border p-4 text-start transition-all ${active ? "border-brand-500 bg-brand-600 text-white shadow-lg shadow-brand-700/20" : "border-ink-900/10 bg-paper-warm/60 text-ink-700 hover:border-brand-300 hover:bg-brand-50"}`}><span className="flex items-center justify-between gap-2"><span className="font-display text-sm font-black">{level.label}</span><CheckCircle2 className={`size-4 ${active ? "text-gold-200" : "text-brand-500"}`} aria-hidden="true" /></span><span className={`mt-2 block text-[11px] font-bold ${active ? "text-white/70" : "text-ink-400"}`}>{ready} من {total} دروس لها عرض جاهز</span></button>;
            })}
          </div>
        </section>
      </Reveal>

      <Reveal delay={100}>
        <section className="rounded-3xl border border-ink-900/8 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="field w-full py-3 ps-10 text-sm" placeholder="ابحث عن درس أو وحدة أو فرع..." aria-label="البحث في عروض PowerPoint" /></label>
            <div className="flex flex-wrap gap-2">
              {(["all", "history", "geography", "citizenship"] as SubjectFilter[]).map((item) => <button key={item} type="button" onClick={() => setSubject(item)} className={`rounded-xl border px-3.5 py-2.5 text-[11px] font-extrabold transition-all ${subject === item ? "border-brand-500 bg-brand-600 text-white" : "border-ink-900/10 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700"}`}>{item === "all" ? "كل المواد" : item === "history" ? "التاريخ" : item === "geography" ? "الجغرافيا" : "المواطنة"}</button>)}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-200 bg-gold-50 p-4">
            <div><p className="text-sm font-black text-gold-900">{activeLevel?.label}</p><p className="mt-1 text-[11px] leading-relaxed text-gold-800">يُجمع المستوى كاملًا، وليس نتائج البحث فقط، عند الضغط على زر ZIP.</p></div>
            <button type="button" onClick={downloadLevelZip} disabled={busy !== null || !readyCount} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-3 text-xs font-extrabold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"><Archive className="size-4" aria-hidden="true" />{busy === `zip-${activeLevel?.id}` ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> جارٍ جمع الملفات {progress ? `(${progress.done}/${progress.total})` : "…"}</> : "تحميل كل عروض المستوى ZIP"}</button>
          </div>
          {notice && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold leading-relaxed text-emerald-800" role="status">{notice}</p>}
        </section>
      </Reveal>

      {groups.length === 0 ? <div className="rounded-3xl border border-dashed border-ink-900/15 bg-white p-10 text-center"><BookOpenCheck className="mx-auto size-9 text-brand-400" /><p className="mt-3 text-sm font-extrabold text-ink-700">لا توجد عروض مطابقة للبحث الحالي.</p></div> : groups.map((group, groupIndex) => <Reveal key={group.id} delay={groupIndex * 35}><section className="overflow-hidden rounded-3xl border border-ink-900/8 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-900/7 bg-gradient-to-l from-brand-50 to-white px-5 py-4"><div><p className="text-[10px] font-extrabold text-brand-700">{group.branchLabel}</p><h3 className="mt-1 font-display text-base font-black text-ink-900">{group.unitTitle}</h3></div><span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold text-ink-500 ring-1 ring-ink-900/8">{group.items.length} عروض</span></div><div className="divide-y divide-ink-900/6">{group.items.map((lesson) => { const deck = getDeckForLesson(lesson.key); const visualCount = lesson.content.externalVisuals?.length ?? 0; return <article key={lesson.key} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-xs font-black text-white">{lesson.lessonIndex + 1}</span><div className="min-w-0"><h4 className="font-display text-sm font-extrabold leading-relaxed text-ink-900">{lesson.title}</h4><div className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold text-brand-700">{lesson.subjectLabel}</span>{lesson.term ? <span className="rounded-full bg-paper-warm px-2.5 py-1 text-[10px] font-extrabold text-ink-500">الدورة {lesson.term}</span> : null}{deck ? <span className="inline-flex items-center gap-1 rounded-full bg-gold-50 px-2.5 py-1 text-[10px] font-extrabold text-gold-700"><MonitorPlay className="size-3" aria-hidden="true" /> عرض تفاعلي</span> : null}{visualCount ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700">{visualCount} مورد بصري موثق</span> : null}</div></div></div><p className="mt-3 border-s-2 border-gold-300 ps-3 text-xs leading-relaxed text-ink-600">{lesson.content.duration} · {lesson.content.sections.length} محاور · {lesson.content.quiz.length} أسئلة تقويم</p></div><div className="flex shrink-0 flex-wrap gap-2 lg:max-w-[330px] lg:justify-end"><button type="button" onClick={() => go({ view: "presentation", id: lesson.key })} className="inline-flex items-center gap-1.5 rounded-xl border border-gold-300 bg-gold-50 px-3.5 py-2.5 text-[11px] font-extrabold text-gold-700"><MonitorPlay className="size-3.5" aria-hidden="true" /> فتح العرض</button><button type="button" onClick={() => downloadOne(lesson)} disabled={busy !== null} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-3.5 py-2.5 text-[11px] font-extrabold text-white disabled:opacity-50">{busy === lesson.key ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Download className="size-3.5" aria-hidden="true" />} تحميل PowerPoint</button></div></article>; })}</div></section></Reveal>)}
    </div>
  );
}

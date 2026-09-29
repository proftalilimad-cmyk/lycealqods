import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Eye,
  FlaskConical,
  Globe2,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  X,
  type LucideIcon,
} from "lucide-react";
import Reveal from "./Reveal";
import { printDocument } from "../lib/reportExport";
import { inspectorDiagnosticDemoHtml } from "../lib/inspectorDiagnosticDemoHtml";
import { getInspectorDiagnosticDemo, type InspectorDemoStudent } from "../lib/inspectorDiagnosticDemo";

function score(value: number | null, max: number): string {
  return value === null ? "—" : `${value}/${max}`;
}

function percentage(value: number | null): string {
  return value === null ? "—" : `${value}٪`;
}

function meterClass(value: number): string {
  return value >= 70 ? "bg-emerald-500" : value >= 50 ? "bg-gold-500" : "bg-rose-500";
}

function levelTone(value: string | null): string {
  if (!value) return "bg-paper-warm text-ink-500";
  if (value.includes("جيد")) return "bg-emerald-50 text-emerald-700";
  if (value.includes("متوسط")) return "bg-gold-50 text-gold-800";
  return "bg-rose-50 text-rose-700";
}

export default function InspectorDiagnosticDemo() {
  const [datasetVersion, setDatasetVersion] = useState(0);
  const [filter, setFilter] = useState<"all" | "present" | "absent">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InspectorDemoStudent | null>(null);
  const dataset = useMemo(() => getInspectorDiagnosticDemo(), [datasetVersion]);
  const visibleStudents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");
    return dataset.students.filter((student) => {
      const matchesFilter = filter === "all" || student.attendance === filter;
      const matchesSearch = !query || [student.name, student.demoMassar, String(student.number)].some((value) => value.toLocaleLowerCase("ar").includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [dataset, filter, search]);

  const regenerate = () => {
    setDatasetVersion((value) => value + 1);
    setSelected(null);
  };

  const exportPdf = () => {
    void printDocument(inspectorDiagnosticDemoHtml(dataset), "التقويم_التشخيصي_التجريبي_للمفتش");
  };

  return (
    <div className="space-y-6">
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-amber-300/80 bg-white p-5 shadow-[0_22px_55px_-30px_rgba(4,36,26,0.35)] sm:p-7">
          <div className="pointer-events-none absolute inset-y-0 start-0 w-1.5 bg-gradient-to-b from-amber-300 via-gold-500 to-brand-700" aria-hidden="true" />
          <div className="relative flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-3.5 py-1.5 text-xs font-extrabold text-amber-900"><FlaskConical className="size-4" aria-hidden="true" /> التقويم التشخيصي التجريبي</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-[10px] font-black text-white">DEMO / TEST</span>
              </div>
              <h2 className="mt-4 font-display text-2xl font-black text-ink-900 sm:text-3xl">التقويم التشخيصي التجريبي — فضاء المفتش</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-500">نموذج مستقل للعرض والمحاكاة واختبار التقرير. جميع الأسماء والمعرّفات اصطناعية، ولا يقرأ هذا القسم اللائحة الرسمية ولا يحفظ أي نتيجة حقيقية.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={regenerate} className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-extrabold text-amber-900 hover:bg-amber-100"><RefreshCw className="size-4" aria-hidden="true" /> إعادة توليد النموذج</button>
              <button type="button" onClick={exportPdf} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-brand-700/20 hover:bg-brand-700"><Printer className="size-4" aria-hidden="true" /> طباعة / PDF</button>
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {([
              { label: "المستوى", value: dataset.level, Icon: BookOpen },
              { label: "القسم", value: dataset.className, Icon: Users },
              { label: "المادة", value: dataset.subject, Icon: Globe2 },
              { label: "النوع", value: dataset.assessmentType, Icon: BarChart3 },
              { label: "السنة الدراسية", value: dataset.schoolYear, Icon: ShieldCheck },
            ] satisfies { label: string; value: string; Icon: LucideIcon }[]).map(({ label, value, Icon }) => <div key={label} className="rounded-2xl border border-ink-900/6 bg-paper-warm/50 p-3"><Icon className="size-4 text-amber-700" aria-hidden="true" /><p className="mt-1 text-[10px] font-bold text-ink-500">{label}</p><p className="mt-0.5 text-xs font-extrabold text-ink-900">{value}</p></div>)}
          </div>
        </header>
      </Reveal>

      <Reveal delay={70}>
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4 text-xs font-bold leading-relaxed text-amber-950"><AlertTriangle className="me-2 inline size-4" aria-hidden="true" />وضع تجريبي معزول: لا تُحتسب الحالات الغائبة في أي متوسط أو نجاح أو تحليل مهارات، ولا تُرسل بيانات هذا النموذج إلى Supabase.</div>
      </Reveal>

      <Reveal delay={100}>
        <section className="rounded-3xl border border-ink-900/6 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900"><BarChart3 className="size-5 text-brand-600" aria-hidden="true" /> لوحة المؤشرات التجريبية</p><p className="mt-1 text-[11px] text-ink-500">تُحسب جميع المعدلات آليًا من نتائج التلاميذ الحاضرين.</p></div><span className="rounded-full bg-brand-50 px-3 py-1.5 text-[10px] font-extrabold text-brand-700">عتبة النجاح: {dataset.successThreshold}٪</span></div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {[
              ["المسجلون", dataset.indicators.registered, "text-ink-900"],
              ["الحاضرون", dataset.indicators.present, "text-brand-700"],
              ["الغائبون", dataset.indicators.absent, "text-rose-600"],
              ["نسبة الإنجاز", `${dataset.indicators.completionPercent}٪`, "text-gold-800"],
              ["المعدل العام", dataset.indicators.overallAverage === null ? "—" : `${dataset.indicators.overallAverage}/20`, "text-brand-700"],
              ["نسبة النجاح", dataset.indicators.successPercent === null ? "—" : `${dataset.indicators.successPercent}٪`, "text-emerald-700"],
              ["متوسط التاريخ", dataset.indicators.historyAverage === null ? "—" : `${dataset.indicators.historyAverage}/10`, "text-gold-800"],
              ["متوسط الجغرافيا", dataset.indicators.geographyAverage === null ? "—" : `${dataset.indicators.geographyAverage}/10`, "text-brand-700"],
              ["أعلى نقطة", dataset.indicators.maxScore === null ? "—" : `${dataset.indicators.maxScore}/20`, "text-emerald-700"],
              ["أدنى نقطة", dataset.indicators.minScore === null ? "—" : `${dataset.indicators.minScore}/20`, "text-rose-600"],
              ["يحتاجون للدعم", dataset.indicators.supportCount, "text-rose-600"],
              ["المشاركون", dataset.indicators.participants, "text-brand-700"],
            ].map(([label, value, tone]) => <div key={String(label)} className="rounded-2xl border border-ink-900/6 bg-paper-warm/35 p-3 text-center"><b className={`block font-display text-lg font-black ${tone}`}>{value}</b><span className="text-[10px] font-bold text-ink-500">{label}</span></div>)}
          </div>
        </section>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-2">
        <Reveal delay={130}>
          <section className="h-full rounded-3xl border border-ink-900/6 bg-white p-5 sm:p-6">
            <p className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900"><BarChart3 className="size-5 text-brand-600" aria-hidden="true" /> توزيع النتائج الإجمالية /20</p>
            <div className="mt-5 space-y-3">{dataset.indicators.distribution.map((item) => <div key={item.label}><div className="flex justify-between text-[11px] font-bold text-ink-700"><span>{item.label}</span><span>{item.count} تلميذ — {item.percent}٪</span></div><div className="mt-1.5 h-3 overflow-hidden rounded-full bg-paper-warm"><div className="h-full rounded-full bg-gradient-to-l from-brand-600 to-gold-400" style={{ width: `${item.percent}%` }} /></div></div>)}</div>
          </section>
        </Reveal>
        <Reveal delay={160}>
          <section className="h-full rounded-3xl border border-ink-900/6 bg-white p-5 sm:p-6"><p className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900"><Globe2 className="size-5 text-brand-600" aria-hidden="true" /> مقارنة التاريخ والجغرافيا</p><div className="mt-6 space-y-5">{[["التاريخ", dataset.indicators.historyAverage, "from-gold-400 to-gold-600"], ["الجغرافيا", dataset.indicators.geographyAverage, "from-brand-400 to-brand-600"]].map(([label, value, gradient]) => <div key={String(label)}><div className="flex justify-between text-sm font-extrabold text-ink-900"><span>{label}</span><span>{value ?? "—"} / 10</span></div><div className="mt-2 h-4 overflow-hidden rounded-full bg-paper-warm"><div className={`h-full rounded-full bg-gradient-to-l ${gradient}`} style={{ width: `${typeof value === "number" ? value * 10 : 0}%` }} /></div></div>)}</div><p className="mt-6 rounded-xl bg-paper-warm/70 p-3 text-[11px] leading-relaxed text-ink-600">تُستعمل هذه المقارنة لتحديد المادة التي تحتاج إلى أنشطة دعم أكثر في النموذج التجريبي.</p></section>
        </Reveal>
      </div>

      <Reveal delay={190}>
        <section className="rounded-3xl border border-ink-900/6 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900"><BookOpen className="size-5 text-brand-600" aria-hidden="true" /> التحكم في المهارات</p><p className="mt-1 text-[11px] text-ink-500">التحليل مبني على الحاضرين العشرة فقط.</p></div><span className="rounded-full bg-amber-100 px-3 py-1.5 text-[10px] font-extrabold text-amber-900">لا توجد مهارات للغائبين</span></div><div className="mt-5 grid gap-6 lg:grid-cols-2"><div><p className="mb-3 text-xs font-extrabold text-ink-700">التاريخ</p><div className="space-y-3">{dataset.indicators.historySkills.map((skill) => <SkillBar key={skill.id} label={skill.label} percent={skill.percent} difficulty={skill.difficulty} />)}</div></div><div><p className="mb-3 text-xs font-extrabold text-ink-700">الجغرافيا</p><div className="space-y-3">{dataset.indicators.geographySkills.map((skill) => <SkillBar key={skill.id} label={skill.label} percent={skill.percent} difficulty={skill.difficulty} />)}</div></div></div>{dataset.indicators.commonDifficulties.length > 0 && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/60 p-4"><p className="text-xs font-extrabold text-rose-800">الصعوبات المشتركة</p><p className="mt-2 text-xs leading-relaxed text-ink-700">{dataset.indicators.commonDifficulties.join("، ")}</p></div>}</section>
      </Reveal>

      <Reveal delay={220}>
        <section className="rounded-3xl border border-ink-900/6 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900"><Users className="size-5 text-brand-600" aria-hidden="true" /> لائحة القسم التجريبية</p><p className="mt-1 text-[11px] text-ink-500">40 معرفًا اصطناعيًا؛ 10 أنجزوا و30 غائبون.</p></div><div className="flex flex-wrap gap-2"><div className="relative"><Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-400" aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث في النموذج" className="field py-2 ps-8 text-xs" /></div><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="field py-2 text-xs"><option value="all">كل الحالات (40)</option><option value="present">الحاضرون (10)</option><option value="absent">الغائبون (30)</option></select></div></div>
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[980px] text-xs"><thead><tr className="border-b border-ink-900/10 text-ink-500"><th className="px-3 py-3 text-start">ر.ت</th><th className="px-3 py-3 text-start">التلميذ التجريبي / المعرّف</th><th className="px-3 py-3 text-center">الحضور</th><th className="px-3 py-3 text-center">التاريخ /10</th><th className="px-3 py-3 text-center">الجغرافيا /10</th><th className="px-3 py-3 text-center">المجموع /20</th><th className="px-3 py-3 text-center">النسبة</th><th className="px-3 py-3 text-start">المستوى</th><th className="px-3 py-3 text-end">التفاصيل</th></tr></thead><tbody>{visibleStudents.map((student) => <tr key={student.id} className="border-b border-ink-900/5 last:border-0"><td className="px-3 py-3 text-ink-500">{student.number}</td><td className="px-3 py-3"><span className="font-extrabold text-ink-900">{student.name}</span><br /><span className="font-mono text-[10px] text-ink-400" dir="ltr">{student.demoMassar}</span></td><td className="px-3 py-3 text-center"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${student.attendance === "present" ? "bg-brand-50 text-brand-700" : "bg-rose-50 text-rose-600"}`}>{student.attendance === "present" ? <><UserCheck className="size-3" /> حاضر</> : <><UserX className="size-3" /> غائب</>}</span></td><td className="px-3 py-3 text-center font-bold">{score(student.history?.score ?? null, 10)}</td><td className="px-3 py-3 text-center font-bold">{score(student.geography?.score ?? null, 10)}</td><td className="px-3 py-3 text-center font-display text-base font-black text-ink-900">{score(student.totalScore, 20)}</td><td className="px-3 py-3 text-center font-bold">{percentage(student.percent)}</td><td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${levelTone(student.performanceLevel)}`}>{student.performanceLevel ?? "لا توجد نتيجة"}</span></td><td className="px-3 py-3 text-end"><button type="button" onClick={() => setSelected(student)} className="inline-flex items-center gap-1 rounded-lg border border-brand-200 px-2.5 py-1.5 text-[10px] font-extrabold text-brand-700 hover:bg-brand-50"><Eye className="size-3" /> عرض</button></td></tr>)}</tbody></table>{visibleStudents.length === 0 && <p className="p-8 text-center text-xs font-bold text-ink-500">لا توجد حالة مطابقة للبحث.</p>}</div>
        </section>
      </Reveal>

      {selected && <DemoStudentCard student={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function SkillBar({ label, percent, difficulty }: { label: string; percent: number; difficulty: string }) {
  return <div><div className="flex items-center justify-between gap-3 text-[11px] font-bold text-ink-700"><span>{label}</span><span>{percent}٪</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-paper-warm"><div className={`h-full rounded-full ${meterClass(percent)}`} style={{ width: `${percent}%` }} /></div>{percent < 50 && <p className="mt-1 text-[10px] font-semibold text-rose-600">صعوبة: {difficulty}</p>}</div>;
}

function DemoStudentCard({ student, onClose }: { student: InspectorDemoStudent; onClose: () => void }) {
  return <div className="fixed inset-0 z-[75] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="تفاصيل التلميذ التجريبي"><button type="button" onClick={onClose} className="absolute inset-0 bg-brand-950/65 backdrop-blur-sm" aria-label="إغلاق" /><div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-3"><div><span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold text-amber-900">DEMO / TEST</span><h3 className="mt-3 font-display text-xl font-black text-ink-900">{student.name}</h3><p className="mt-1 font-mono text-[10px] text-ink-400" dir="ltr">{student.id} · {student.demoMassar}</p></div><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-xl border border-ink-900/10 text-ink-500" aria-label="إغلاق"><X className="size-4" /></button></div><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-xl bg-paper-warm p-3 text-center"><b className="block font-display text-lg font-black text-ink-900">{student.attendance === "present" ? "حاضر" : "غائب"}</b><span className="text-[10px] font-bold text-ink-500">الحضور</span></div><div className="rounded-xl bg-brand-50 p-3 text-center"><b className="block font-display text-lg font-black text-brand-700">{score(student.history?.score ?? null, 10)}</b><span className="text-[10px] font-bold text-ink-500">التاريخ</span></div><div className="rounded-xl bg-gold-50 p-3 text-center"><b className="block font-display text-lg font-black text-gold-800">{score(student.geography?.score ?? null, 10)}</b><span className="text-[10px] font-bold text-ink-500">الجغرافيا</span></div><div className="rounded-xl bg-paper-warm p-3 text-center"><b className="block font-display text-lg font-black text-ink-900">{score(student.totalScore, 20)}</b><span className="text-[10px] font-bold text-ink-500">المجموع</span></div></div>{student.attendance === "absent" ? <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold leading-relaxed text-rose-700">هذا التلميذ التجريبي غائب؛ لا توجد له نتيجة أو مهارات أو توصية مبنية على نقطة.</p> : <div className="mt-5 grid gap-4 sm:grid-cols-2"><SubjectDetails label="التاريخ" result={student.history} /><SubjectDetails label="الجغرافيا" result={student.geography} /></div>}<p className="mt-5 text-center text-[10px] font-semibold text-ink-400">بيانات اصطناعية للتطوير فقط — لا تمثل تلميذًا حقيقيًا.</p></div></div>;
}

function SubjectDetails({ label, result }: { label: string; result: InspectorDemoStudent["history"] }) {
  if (!result) return null;
  return <div className="rounded-2xl border border-ink-900/8 bg-paper-warm/40 p-4"><div className="flex justify-between"><p className="font-display text-sm font-extrabold text-ink-900">{label}</p><span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${levelTone(result.level)}`}>{result.level}</span></div><p className="mt-2 text-sm font-black text-brand-700">{result.score}/{result.max} — {result.percent}٪</p><p className="mt-3 text-[10px] font-extrabold text-emerald-700">المهارات المتحكم فيها</p><p className="mt-1 text-xs leading-relaxed text-ink-700">{result.controlledSkills.length ? result.controlledSkills.join("، ") : "لا توجد بعد"}</p><p className="mt-3 text-[10px] font-extrabold text-rose-700">الصعوبات</p><p className="mt-1 text-xs leading-relaxed text-ink-700">{result.difficulties.length ? result.difficulties.join("، ") : "لا توجد صعوبة تحت العتبة"}</p></div>;
}

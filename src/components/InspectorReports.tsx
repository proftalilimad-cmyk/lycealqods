import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ClipboardCheck,
  Database,
  Eye,
  FileBarChart,
  FileDown,
  History,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { DIAGNOSTIC_SESSIONS, displayClassName } from "../data/diagnosticSchedule";
import { ROSTER_CLASSES } from "../data/rosters";
import type { InspectorReport, Submission } from "../types";
import { loadInspectorReports, deleteInspectorReport, saveInspectorReport } from "../lib/cloudStorage";
import { isCloudConfigured } from "../lib/supabase";
import { isDemoSubmission, loadSubmissions } from "../lib/storage";
import {
  analyseInspectorReport,
  defaultInspectorReport,
  reportClassLabel,
  updateReportFromAnalysis,
  type InspectorStudentRow,
} from "../lib/inspectorReports";
import { inspectorReportHtml } from "../lib/inspectorReportHtml";
import { printDocument } from "../lib/reportExport";
import StudentDownloads from "./StudentDownloads";
import Reveal from "./Reveal";

const today = () => new Date().toISOString().slice(0, 10);
type ReportDataMode = "central" | "demo";

function statusLabel(status: InspectorReport["status"]): string {
  return status === "approved" ? "معتمد" : status === "archived" ? "مؤرشف" : "مسودة";
}

function levelForClass(className: string, submissions: Submission[]): string {
  const known = DIAGNOSTIC_SESSIONS.find((session) => session.className === className)?.bankLevel
    ?? submissions.find((submission) => submission.className === className)?.bankLevel;
  if (known) return known;
  if (className.includes("جذع مشترك")) return "الجذع المشترك";
  if (className.includes("الأولى") || className.includes("اولى")) return "الأولى باكالوريا";
  if (className.includes("الثانية") || className.includes("ثانية")) return "الثانية باكالوريا";
  return "غير محدد";
}

function dateText(value: string): string {
  if (!value) return "—";
  return new Date(`${value}T12:00:00`).toLocaleDateString("ar-MA", { day: "numeric", month: "long", year: "numeric" });
}

export default function InspectorReports() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [reports, setReports] = useState<InspectorReport[]>([]);
  const [draft, setDraft] = useState<InspectorReport>(() => defaultInspectorReport());
  const [preview, setPreview] = useState<{ report: InspectorReport; html: string } | null>(null);
  const [studentCard, setStudentCard] = useState<InspectorStudentRow | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "warn" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<"data" | "reports" | "generate" | "save" | "delete" | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState<"all" | InspectorReport["status"]>("all");
  const [dataMode, setDataMode] = useState<ReportDataMode>(() => (isCloudConfigured() ? "central" : "demo"));

  const central = isCloudConfigured();
  const demoSubmissions = useMemo(() => submissions.filter(isDemoSubmission), [submissions]);
  const centralSubmissions = useMemo(
    () => central ? submissions.filter((submission) => !isDemoSubmission(submission)) : [],
    [central, submissions],
  );
  // Demo is an explicitly labelled, isolated preview source. It is never
  // sent to the central reports table.
  const reportSubmissions = dataMode === "demo" ? demoSubmissions : centralSubmissions;
  const includeDemo = dataMode === "demo";

  useEffect(() => {
    let alive = true;
    setBusy("data");
    void loadSubmissions().then((result) => {
      if (!alive) return;
      setSubmissions(result.submissions);
      if (result.error) setNotice({ kind: "warn", text: `النتائج المركزية: ${result.error}` });
      setBusy(null);
    });
    if (central) {
      setBusy("reports");
      void loadInspectorReports().then((result) => {
        if (!alive) return;
        setReports(result.reports);
        if (result.error) setNotice({ kind: "warn", text: `التقارير المركزية: ${result.error}` });
        setBusy(null);
      });
    }
    return () => {
      alive = false;
    };
  }, [central]);

  const classOptions = useMemo(() => {
    const names = new Set<string>([
      ...DIAGNOSTIC_SESSIONS.map((session) => session.className),
      ...ROSTER_CLASSES.map((roster) => roster.label),
      ...submissions.map((submission) => submission.className),
    ]);
    return Array.from(names).sort((a, b) => displayClassName(a).localeCompare(displayClassName(b), "ar"));
  }, [submissions]);

  const levels = useMemo(() => Array.from(new Set([
    ...DIAGNOSTIC_SESSIONS.map((session) => session.bankLevel),
    ...ROSTER_CLASSES.map((roster) => levelForClass(roster.label, submissions)),
    ...submissions.map((submission) => submission.bankLevel).filter(Boolean) as string[],
  ])).sort((a, b) => a.localeCompare(b, "ar")), [submissions]);

  const classesForLevel = useMemo(() => classOptions.filter((className) => draft.level === "غير محدد" || !draft.level || levelForClass(className, submissions) === draft.level), [classOptions, draft.level, submissions]);
  const analysis = useMemo(() => analyseInspectorReport(draft, reportSubmissions, includeDemo), [draft, reportSubmissions, includeDemo]);
  const realCount = centralSubmissions.length;
  const demoDateRange = useMemo(() => {
    const dates = demoSubmissions
      .map((submission) => submission.date.slice(0, 10))
      .filter(Boolean)
      .sort();
    return { from: dates[0] ?? today(), to: dates[dates.length - 1] ?? today() };
  }, [demoSubmissions]);

  useEffect(() => {
    if (dataMode !== "demo" || draft.className || demoSubmissions.length === 0) return;
    const firstClass = demoSubmissions[0].className;
    setDraft((previous) => ({
      ...previous,
      className: firstClass,
      level: levelForClass(firstClass, demoSubmissions),
      periodFrom: demoDateRange.from,
      periodTo: demoDateRange.to,
      updatedAt: new Date().toISOString(),
    }));
  }, [dataMode, demoDateRange.from, demoDateRange.to, demoSubmissions, draft.className]);

  const chooseDataMode = (mode: ReportDataMode) => {
    setDataMode(mode);
    setPreview(null);
    if (mode === "demo" && demoSubmissions.length > 0) {
      const firstClass = demoSubmissions[0].className;
      setDraft((previous) => ({
        ...previous,
        className: firstClass,
        level: levelForClass(firstClass, demoSubmissions),
        periodFrom: demoDateRange.from,
        periodTo: demoDateRange.to,
        submissionIds: [],
        updatedAt: new Date().toISOString(),
      }));
      setNotice({ kind: "warn", text: "تم تفعيل Demo: ستُستعمل بيانات تجريبية معزولة للمعاينة والتصدير فقط، ولن تُحفظ كتقرير مركزي." });
    } else if (mode === "central") {
      setNotice({ kind: central ? "ok" : "warn", text: central ? "تم تفعيل مصدر النتائج المركزية." : "مصدر النتائج المركزية غير مهيأ؛ لا توجد بيانات حقيقية للعرض." });
    }
  };

  const setField = <K extends keyof InspectorReport>(key: K, value: InspectorReport[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value, updatedAt: new Date().toISOString() }));
    setNotice(null);
  };

  const newReport = () => {
    const demoClass = dataMode === "demo" ? (demoSubmissions[0]?.className ?? draft.className) : draft.className;
    const next = defaultInspectorReport(demoClass);
    next.level = dataMode === "demo" && demoClass ? levelForClass(demoClass, demoSubmissions) : (draft.level || next.level);
    next.periodFrom = dataMode === "demo" ? demoDateRange.from : today();
    next.periodTo = dataMode === "demo" ? demoDateRange.to : today();
    setDraft(next);
    setPreview(null);
    setNotice(null);
  };

  const generate = async (saveAfter: boolean) => {
    if (!draft.className) {
      setNotice({ kind: "error", text: "المرجو اختيار القسم قبل إنشاء التقرير." });
      return;
    }
    if (!draft.periodFrom || !draft.periodTo || draft.periodFrom > draft.periodTo) {
      setNotice({ kind: "error", text: "المرجو تحديد فترة زمنية صحيحة." });
      return;
    }
    setBusy("generate");
    const updated = updateReportFromAnalysis(draft, analysis);
    const html = inspectorReportHtml(updated, analyseInspectorReport(updated, reportSubmissions, includeDemo));
    setDraft({ ...updated, htmlSnapshot: html });
    setPreview({ report: updated, html });
    setBusy(null);
    if (!analysis.hasRealResults) {
      setNotice({ kind: "warn", text: dataMode === "demo" ? "لا توجد بيانات Demo مطابقة للاختيار الحالي." : "تم إنشاء معاينة بلا أرقام مختلقة: لا توجد نتائج مركزية مطابقة للاختيار الحالي." });
    } else {
      setNotice({ kind: dataMode === "demo" ? "warn" : "ok", text: dataMode === "demo" ? `تم تحليل ${analysis.participants} نتيجة Demo للمعاينة فقط.` : `تم تحليل ${analysis.participants} نتيجة مركزية من القسم المحدد.` });
    }
    if (saveAfter) await save(updated, html);
  };

  const save = async (value = draft, html = value.htmlSnapshot) => {
    if (dataMode === "demo") {
      setNotice({ kind: "warn", text: "تم إعداد نسخة Demo للمعاينة والتصدير فقط. لم تُحفظ بيانات تجريبية في التقارير المركزية." });
      return;
    }
    if (!central) {
      setNotice({ kind: "warn", text: "المعاينة والتصدير متاحان، لكن الحفظ الدائم متوقف حتى تُضبط قاعدة Supabase وRLS." });
      return;
    }
    setBusy("save");
    try {
      const saved = await saveInspectorReport({ ...value, htmlSnapshot: html });
      setDraft(saved);
      setReports((previous) => [saved, ...previous.filter((report) => report.id !== saved.id)]);
      setNotice({ kind: "ok", text: "تم حفظ التقرير ونسخة المعاينة في قاعدة البيانات المركزية." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "تعذّر حفظ التقرير المركزي." });
    } finally {
      setBusy(null);
    }
  };

  const exportPdf = async () => {
    const current = preview ?? { report: draft, html: inspectorReportHtml(draft, analysis) };
    if (!preview) setPreview(current);
    await printDocument(current.html, `تقرير_التقويم_الشخصي_للمفتش_${current.report.className || "القسم"}`);
  };

  const openStored = (report: InspectorReport) => {
    setDraft(report);
    if (report.htmlSnapshot) {
      setPreview({ report, html: report.htmlSnapshot });
      setNotice({ kind: "ok", text: "تم فتح النسخة المحفوظة للمعاينة. اضغط إعادة إنشاء لتحديثها من النتائج الحالية." });
    } else {
      setPreview(null);
      setNotice({ kind: "warn", text: "هذا التقرير محفوظ دون نسخة HTML؛ أعد إنشاء التقرير لبناء نسخة قابلة للطباعة." });
    }
  };

  const remove = async (report: InspectorReport) => {
    if (!central || !window.confirm(`حذف التقرير «${reportClassLabel(report)}»؟`)) return;
    setBusy("delete");
    try {
      await deleteInspectorReport(report.id);
      setReports((previous) => previous.filter((item) => item.id !== report.id));
      if (draft.id === report.id) newReport();
      setNotice({ kind: "ok", text: "تم حذف التقرير وفق صلاحية الأستاذ." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "تعذّر حذف التقرير." });
    } finally {
      setBusy(null);
    }
  };

  const filteredReports = reports.filter((report) => {
    const query = historySearch.trim().toLocaleLowerCase("ar");
    const matchesQuery = !query || [report.className, report.level, report.subject, report.schoolYear, report.periodFrom, report.periodTo, report.updatedAt.slice(0, 10)].some((value) => value.toLocaleLowerCase("ar").includes(query));
    return matchesQuery && (historyStatus === "all" || report.status === historyStatus);
  });

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="rounded-3xl border border-brand-200/70 bg-white p-5 shadow-[0_22px_55px_-30px_rgba(4,36,26,0.35)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-extrabold text-brand-700"><FileBarChart className="size-4" aria-hidden="true" /> تقارير المفتش</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold ${central ? "bg-emerald-50 text-emerald-700" : "bg-gold-50 text-gold-800"}`}><Database className="size-3.5" aria-hidden="true" />{central ? "قاعدة مركزية مفعّلة" : "المعاينة فقط — قاعدة البيانات غير مفعّلة"}</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold ${dataMode === "demo" ? "bg-amber-100 text-amber-800" : "bg-brand-50 text-brand-700"}`}>{dataMode === "demo" ? "مصدر Demo معزول" : "مصدر النتائج المركزية"}</span>
              </div>
              <h2 className="mt-4 font-display text-2xl font-black text-ink-900">تقرير التقويم الشخصي للمفتش</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-500">{dataMode === "demo" ? "استعمل البيانات التجريبية المعزولة لإنجاز تقرير كامل للمعاينة والتصدير. لا تُحفظ هذه النسخة ضمن التقارير المركزية." : "أنشئ تقريرًا رسميًا من النتائج المركزية الفعلية المرتبطة بالقسم والفترة المحددين. لا تُعرض هذه المعطيات خارج فضاء الأستاذ المحمي."}</p>
            </div>
            <button type="button" onClick={newReport} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-xs font-extrabold text-brand-700 hover:bg-brand-100"><Plus className="size-4" aria-hidden="true" /> تقرير جديد</button>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl bg-paper-warm/70 p-3 text-center"><b className="block font-display text-xl font-black text-ink-900">{analysis.totalStudents}</b><span className="text-[10px] font-bold text-ink-500">تلاميذ اللائحة</span></div>
            <div className="rounded-2xl bg-brand-50 p-3 text-center"><b className="block font-display text-xl font-black text-brand-700">{analysis.participants}</b><span className="text-[10px] font-bold text-ink-500">{dataMode === "demo" ? "نتائج Demo مطابقة" : "نتائج مركزية مطابقة"}</span></div>
            <div className="rounded-2xl bg-gold-50 p-3 text-center"><b className="block font-display text-xl font-black text-gold-800">{realCount}</b><span className="text-[10px] font-bold text-ink-500">النتائج المركزية المتاحة</span></div>
          </div>
        </div>
      </Reveal>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <Reveal delay={80}>
          <form className="rounded-3xl border border-ink-900/6 bg-white p-5 sm:p-6" onSubmit={(event) => { event.preventDefault(); void generate(true); }}>
            <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900"><ClipboardCheck className="size-5 text-brand-600" aria-hidden="true" /> معطيات التقرير</p><span className="text-[10px] font-bold text-ink-400">{dataMode === "demo" ? "بيانات تجريبية للمعاينة" : "كل المؤشرات من النتائج المركزية"}</span></div>
            <div className="mt-4 rounded-2xl border border-ink-900/8 bg-paper-warm/50 p-3">
              <p className="text-[11px] font-extrabold text-ink-700">مصدر البيانات المستعمل في التقرير</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => chooseDataMode("demo")} className={`rounded-xl border px-3 py-2.5 text-start text-[11px] font-extrabold transition ${dataMode === "demo" ? "border-amber-300 bg-amber-100 text-amber-900" : "border-ink-900/10 bg-white text-ink-600 hover:border-amber-200"}`}>Demo — بيانات تجريبية معزولة<span className="mt-0.5 block text-[10px] font-semibold opacity-75">للمعاينة والتصدير فقط، دون حفظ مركزي</span></button>
                <button type="button" onClick={() => chooseDataMode("central")} className={`rounded-xl border px-3 py-2.5 text-start text-[11px] font-extrabold transition ${dataMode === "central" ? "border-brand-300 bg-brand-50 text-brand-800" : "border-ink-900/10 bg-white text-ink-600 hover:border-brand-200"}`}>النتائج المركزية<span className="mt-0.5 block text-[10px] font-semibold opacity-75">المصدر الرسمي المرتبط بالأستاذ والقسم</span></button>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Field label="المستوى الدراسي"><select value={draft.level} onChange={(event) => { setField("level", event.target.value); setField("className", ""); }} className="field"><option value="">كل المستويات</option>{levels.map((level) => <option key={level} value={level}>{level}</option>)}</select></Field>
              <Field label="المادة الدراسية"><select value={draft.subject} onChange={(event) => setField("subject", event.target.value)} className="field"><option value="الاجتماعيات">الاجتماعيات</option><option value="التاريخ">التاريخ</option><option value="الجغرافيا">الجغرافيا</option></select></Field>
              <Field label="القسم الدراسي"><select value={draft.className} onChange={(event) => { const className = event.target.value; setField("className", className); const level = levelForClass(className, submissions); if (level !== "غير محدد") setField("level", level); }} className="field"><option value="">اختر القسم</option>{classesForLevel.map((className) => <option key={className} value={className}>{displayClassName(className)}</option>)}</select></Field>
              <Field label="نوع التقويم"><select value={draft.assessmentType} onChange={(event) => setField("assessmentType", event.target.value as InspectorReport["assessmentType"])} className="field"><option value="diagnostic">التقويم التشخيصي</option><option value="personal">التقويم الشخصي</option></select></Field>
              <Field label="من تاريخ"><input type="date" value={draft.periodFrom} onChange={(event) => setField("periodFrom", event.target.value)} className="field" /></Field>
              <Field label="إلى تاريخ"><input type="date" value={draft.periodTo} onChange={(event) => setField("periodTo", event.target.value)} className="field" /></Field>
              <Field label="السنة الدراسية"><input value={draft.schoolYear} onChange={(event) => setField("schoolYear", event.target.value)} className="field" /></Field>
              <Field label="عتبة النجاح/الدعم (%)"><input type="number" min={0} max={100} step={1} value={draft.threshold} onChange={(event) => setField("threshold", Math.min(100, Math.max(0, Number(event.target.value) || 0)))} className="field" /></Field>
              <Field label="حالة التقرير"><select value={draft.status} onChange={(event) => setField("status", event.target.value as InspectorReport["status"])} className="field"><option value="draft">مسودة — قابل للتعديل</option><option value="approved">معتمد</option><option value="archived">مؤرشف</option></select></Field>
              <Field label="اسم الأستاذ(ة)"><input value={draft.teacherName} onChange={(event) => setField("teacherName", event.target.value)} className="field" /></Field>
              <Field label="المؤسسة"><input value={draft.institution} onChange={(event) => setField("institution", event.target.value)} className="field" /></Field>
              <Field label="الأكاديمية الجهوية"><input value={draft.academy} onChange={(event) => setField("academy", event.target.value)} className="field" /></Field>
              <Field label="المديرية الإقليمية"><input value={draft.directorate} onChange={(event) => setField("directorate", event.target.value)} className="field" /></Field>
            </div>
            <div className="mt-3 grid gap-3"><TextField label="السياق العام" value={draft.context} onChange={(value) => setField("context", value)} /><TextField label="أهداف التقويم" value={draft.objectives} onChange={(value) => setField("objectives", value)} /><TextField label="الأدوات المعتمدة" value={draft.tools} onChange={(value) => setField("tools", value)} /><TextField label="مدة خطة الدعم" value={draft.supportDuration} onChange={(value) => setField("supportDuration", value)} /></div>
            <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50/60 p-3 text-[11px] font-semibold leading-relaxed text-brand-900"><strong>تحقق البيانات:</strong> {analysis.hasRealResults ? (dataMode === "demo" ? `سيُبنى التقرير من ${analysis.participants} نتيجة Demo معزولة، ولن تُحفظ كتقرير مركزي.` : `سيُبنى التقرير من ${analysis.participants} نتيجة مركزية، ولن تدخل سجلات Demo.`) : (dataMode === "demo" ? "لا توجد بيانات Demo مطابقة؛ سيظهر التقرير بصفر/شرطة دون اختلاق أي نتيجة." : "لا توجد نتائج مركزية مطابقة؛ سيظهر التقرير بصفر/شرطة دون اختلاق أي نتيجة.")}</div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="submit" disabled={busy !== null || !draft.className} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-brand-700/20 enabled:hover:bg-brand-700 disabled:opacity-40"><FileBarChart className="size-4" aria-hidden="true" />{busy === "generate" || busy === "save" ? "جارٍ الإنشاء والحفظ…" : (dataMode === "demo" ? "إنشاء تقرير Demo للمعاينة" : "إنشاء تقرير التقويم الشخصي للمفتش")}</button>
              <button type="button" disabled={busy !== null || !draft.className} onClick={() => void generate(false)} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-3 text-xs font-extrabold text-brand-700 enabled:hover:bg-brand-50 disabled:opacity-40"><Eye className="size-4" aria-hidden="true" /> معاينة دون حفظ</button>
            </div>
          </form>
        </Reveal>

        <Reveal delay={130}>
          <div className="rounded-3xl border border-ink-900/6 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900"><BarChart3 className="size-5 text-brand-600" aria-hidden="true" /> ملخص التحليل الحقيقي</p><p className="mt-1 text-[11px] text-ink-500">تتغير المؤشرات عند اختيار القسم أو الفترة أو نوع التقويم.</p></div><span className="rounded-full bg-brand-50 px-3 py-1.5 text-[10px] font-extrabold text-brand-700">{analysis.participationPercent}٪ مشاركة</span></div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{[["اللائحة", analysis.totalStudents], ["المشاركون", analysis.participants], ["المعدل", analysis.average === null ? "—" : `${analysis.average}/${analysis.maxScoreScale}`], ["النجاح", analysis.successPercent === null ? "—" : `${analysis.successPercent}٪`], ["أعلى", analysis.maxScore === null ? "—" : analysis.maxScore], ["أدنى", analysis.minScore === null ? "—" : analysis.minScore], ["الدعم", analysis.supportCount], ["الغائبون", analysis.absent]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-ink-900/6 bg-paper-warm/40 p-3 text-center"><b className="block font-display text-lg font-black text-ink-900">{value}</b><span className="text-[10px] font-bold text-ink-500">{label}</span></div>)}</div>
            <div className="mt-5 space-y-2">{analysis.skills.slice(0, 8).map((skill) => <div key={skill.skill}><div className="flex justify-between text-[11px] font-bold text-ink-700"><span>{skill.skill}</span><span>{skill.percent}٪</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-paper-warm"><div className={`h-full rounded-full ${skill.percent >= draft.threshold ? "bg-brand-500" : "bg-rose-500"}`} style={{ width: `${skill.percent}%` }} /></div></div>)}{analysis.skills.length === 0 && <p className="rounded-xl border border-dashed border-ink-900/10 p-5 text-center text-xs font-bold text-ink-500">لا توجد كفايات قابلة للتحليل دون نتائج فعلية.</p>}</div>
            <div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={!draft.className || busy !== null} onClick={() => void generate(false)} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 px-3 py-2.5 text-xs font-extrabold text-brand-700 enabled:hover:bg-brand-50 disabled:opacity-40"><RefreshCw className="size-4" aria-hidden="true" /> إعادة إنشاء من البيانات الحالية</button>{preview && <button type="button" onClick={() => setPreview(preview)} className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-3 py-2.5 text-xs font-extrabold text-white hover:bg-gold-600"><Eye className="size-4" aria-hidden="true" /> فتح المعاينة</button>}</div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={150}>
        <section className="rounded-3xl border border-ink-900/6 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900"><ClipboardCheck className="size-5 text-brand-600" aria-hidden="true" /> التقرير الفردي للتلاميذ</p><p className="mt-1 text-[11px] leading-relaxed text-ink-500">افتح بطاقة أي تلميذ(ة) للاطلاع على النقطة والكفايات والاحتياجات والتوصيات. الغائب يظهر بلا نتيجة ولا يُنشأ له تحليل.</p></div><span className="rounded-full bg-paper-warm px-3 py-1.5 text-[10px] font-extrabold text-ink-600">{analysis.students.length} سجلًا في النطاق</span></div>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[860px] text-[11px]"><thead><tr className="border-b border-ink-900/10 text-ink-500"><th className="px-3 py-3 text-start">ر.ت</th><th className="px-3 py-3 text-start">التلميذ(ة)</th><th className="px-3 py-3 text-start">القسم والمستوى</th><th className="px-3 py-3 text-center">النقطة</th><th className="px-3 py-3 text-center">النسبة</th><th className="px-3 py-3 text-start">الكفايات</th><th className="px-3 py-3 text-start">الاحتياجات</th><th className="px-3 py-3 text-start">البطاقة</th></tr></thead><tbody>{analysis.students.map((student) => <tr key={`${student.className}-${student.massar ?? student.rank}`} className="border-b border-ink-900/5"><td className="px-3 py-3">{student.rosterNo ?? student.rank}</td><td className="px-3 py-3 font-bold text-ink-900">{student.name}<br /><span className="font-mono text-[9px] text-ink-400" dir="ltr">{student.massar ?? "—"}</span></td><td className="px-3 py-3">{student.level}<br /><span className="text-[10px] text-ink-400">{displayClassName(student.className)}</span></td><td className="px-3 py-3 text-center font-extrabold">{student.score === undefined ? "—" : `${student.score}/${student.maxScore}`}</td><td className="px-3 py-3 text-center font-extrabold">{student.percent === undefined ? "—" : `${student.percent}٪`}</td><td className="max-w-[190px] px-3 py-3">{student.controlled.length ? student.controlled.slice(0, 2).join("، ") : "—"}</td><td className="max-w-[210px] px-3 py-3">{student.needs.length ? student.needs.slice(0, 2).join("، ") : student.attendance === "غائب" ? "لم ينجز" : "لا توجد"}</td><td className="px-3 py-3"><button type="button" onClick={() => setStudentCard(student)} className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-[10px] font-extrabold text-brand-700"><Eye className="size-3" /> فتح البطاقة</button></td></tr>)}</tbody></table></div>
        </section>
      </Reveal>

      {notice && <p role={notice.kind === "error" ? "alert" : "status"} className={`rounded-2xl border px-4 py-3 text-xs font-bold leading-relaxed ${notice.kind === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : notice.kind === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-gold-200 bg-gold-50 text-gold-800"}`}>{notice.text}</p>}

      <Reveal delay={160}>
        <section className="rounded-3xl border border-ink-900/6 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900"><History className="size-5 text-brand-600" aria-hidden="true" /> التقارير السابقة</p><p className="mt-1 text-[11px] text-ink-500">البحث بالقسم والتاريخ والمستوى. السجل المركزي لا يظهر إلا بعد مصادقة الأستاذ.</p></div><div className="flex flex-wrap gap-2"><label className="relative"><Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-400" aria-hidden="true" /><input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="بحث في التقارير" className="field py-2 ps-8 text-xs" /></label><select value={historyStatus} onChange={(event) => setHistoryStatus(event.target.value as typeof historyStatus)} className="field py-2 text-xs"><option value="all">كل الحالات</option><option value="draft">مسودة</option><option value="approved">معتمد</option><option value="archived">مؤرشف</option></select></div></div>
          {!central ? <div className="mt-5 rounded-2xl border border-dashed border-gold-300 bg-gold-50/60 p-5 text-center text-xs font-bold leading-relaxed text-gold-800">الحفظ الدائم للتقارير غير متاح في هذه النسخة حتى تضبط متغيرات Supabase وتنفذ ملف RLS. يمكنك معاينة التقرير وتصديره، لكن لن ندّعي أنه محفوظ في قاعدة البيانات.</div> : filteredReports.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-ink-900/10 p-8 text-center text-xs font-bold text-ink-500">{busy === "reports" ? "جارٍ جلب التقارير…" : "لا توجد تقارير محفوظة مطابقة للبحث."}</div> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-xs"><thead><tr className="border-b border-ink-900/10 text-ink-500"><th className="px-3 py-3 text-start">تاريخ الإنشاء</th><th className="px-3 py-3 text-start">القسم</th><th className="px-3 py-3 text-start">المادة/التقويم</th><th className="px-3 py-3 text-start">النتائج المرتبطة</th><th className="px-3 py-3 text-start">الحالة</th><th className="px-3 py-3 text-start">إجراءات</th></tr></thead><tbody>{filteredReports.map((report) => <tr key={report.id} className="border-b border-ink-900/5"><td className="px-3 py-3 text-ink-600">{dateText(report.updatedAt.slice(0, 10))}</td><td className="px-3 py-3 font-bold text-ink-900">{reportClassLabel(report)}<br /><span className="text-[10px] font-semibold text-ink-400">{report.level}</span></td><td className="px-3 py-3">{report.subject}<br /><span className="text-[10px] text-ink-400">{report.assessmentType === "diagnostic" ? "تشخيصي" : "شخصي"}</span></td><td className="px-3 py-3">{report.submissionIds.length}</td><td className="px-3 py-3"><span className="rounded-full bg-brand-50 px-2 py-1 text-[10px] font-extrabold text-brand-700">{statusLabel(report.status)}</span></td><td className="px-3 py-3"><div className="flex flex-wrap gap-1.5"><button type="button" onClick={() => openStored(report)} className="inline-flex items-center gap-1 rounded-lg border border-brand-200 px-2 py-1.5 text-[10px] font-extrabold text-brand-700"><Eye className="size-3" /> عرض</button><button type="button" onClick={() => { setDraft(report); setPreview(null); }} className="inline-flex items-center gap-1 rounded-lg border border-ink-900/10 px-2 py-1.5 text-[10px] font-extrabold text-ink-700"><Pencil className="size-3" /> تعديل</button><button type="button" onClick={() => void remove(report)} disabled={busy === "delete"} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1.5 text-[10px] font-extrabold text-rose-600 disabled:opacity-40"><Trash2 className="size-3" /> حذف</button></div></td></tr>)}</tbody></table></div>}
        </section>
      </Reveal>

      {preview && <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="معاينة تقرير المفتش"><button type="button" onClick={() => setPreview(null)} className="absolute inset-0 bg-brand-950/70 backdrop-blur-sm" aria-label="إغلاق المعاينة" /><div className="relative flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"><header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-900/10 bg-white px-4 py-3"><div><p className="font-display text-sm font-black text-ink-900">معاينة: تقرير التقويم الشخصي للمفتش</p><p className="text-[10px] font-semibold text-ink-500">{reportClassLabel(preview.report)} · النسخة المبنية من {preview.report.submissionIds.length} نتيجة مرتبطة</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void save(preview.report, preview.html)} disabled={!central || dataMode === "demo" || busy === "save"} className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-[10px] font-extrabold text-brand-700 disabled:opacity-40"><Save className="size-3.5" /> {dataMode === "demo" ? "الحفظ المركزي غير متاح لـDemo" : "حفظ مركزي"}</button><button type="button" onClick={() => void exportPdf()} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-[10px] font-extrabold text-white"><FileDown className="size-3.5" /> تصدير PDF</button><button type="button" onClick={() => setPreview(null)} className="grid size-8 place-items-center rounded-xl border border-ink-900/10 text-ink-500" aria-label="إغلاق"><X className="size-4" /></button></div></header><iframe title="معاينة تقرير التقويم الشخصي للمفتش" srcDoc={preview.html} className="min-h-0 flex-1 bg-[#eeeae1]" /></div></div>}

      {studentCard && <div className="fixed inset-0 z-[75] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="البطاقة الفردية للتلميذ"><button type="button" onClick={() => setStudentCard(null)} className="absolute inset-0 bg-brand-950/65 backdrop-blur-sm" aria-label="إغلاق البطاقة" /><div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-3"><div><p className="font-display text-xl font-black text-ink-900">البطاقة الفردية للتلميذ(ة)</p><p className="mt-1 text-xs font-semibold text-ink-500">{studentCard.name} · {studentCard.level} · {displayClassName(studentCard.className)}</p></div><button type="button" onClick={() => setStudentCard(null)} className="grid size-9 place-items-center rounded-xl border border-ink-900/10 text-ink-500" aria-label="إغلاق"><X className="size-4" /></button></div><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-xl bg-paper-warm p-3 text-center"><b className="block font-display text-lg font-black text-ink-900">{studentCard.score === undefined ? "—" : `${studentCard.score}/${studentCard.maxScore}`}</b><span className="text-[10px] font-bold text-ink-500">النقطة</span></div><div className="rounded-xl bg-brand-50 p-3 text-center"><b className="block font-display text-lg font-black text-brand-700">{studentCard.percent === undefined ? "—" : `${studentCard.percent}٪`}</b><span className="text-[10px] font-bold text-ink-500">النسبة</span></div><div className="rounded-xl bg-sky-50 p-3 text-center"><b className="block font-display text-lg font-black text-sky-700">{studentCard.attendance}</b><span className="text-[10px] font-bold text-ink-500">الحضور</span></div><div className="rounded-xl bg-gold-50 p-3 text-center"><b className="block font-display text-lg font-black text-gold-800">{studentCard.assessment}</b><span className="text-[10px] font-bold text-ink-500">التقويم</span></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4"><p className="font-display text-sm font-extrabold text-emerald-800">الكفايات المتحكم فيها</p><p className="mt-2 text-xs leading-relaxed text-ink-700">{studentCard.controlled.length ? studentCard.controlled.join("، ") : "لا توجد كفاية بلغت العتبة في النتيجة الحالية."}</p></div><div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4"><p className="font-display text-sm font-extrabold text-rose-800">الكفايات غير المتحكم فيها</p><p className="mt-2 text-xs leading-relaxed text-ink-700">{studentCard.uncontrolled.length ? studentCard.uncontrolled.join("، ") : "لا توجد كفاية تحت العتبة."}</p></div></div><div className="mt-4 rounded-2xl border border-gold-200 bg-gold-50/60 p-4"><p className="font-display text-sm font-extrabold text-gold-800">الاحتياجات والتوصيات التربوية</p>{studentCard.recommendations.length ? <ul className="mt-2 list-disc space-y-1 ps-5 text-xs leading-relaxed text-ink-700">{studentCard.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul> : <p className="mt-2 text-xs text-ink-600">{studentCard.attendance === "غائب" ? "لم ينجز التلميذ(ة) التقويم؛ لا تُنشأ توصية مبنية على نتيجة غير موجودة." : "لا توجد توصيات إضافية من النتائج الحالية."}</p>}</div>{studentCard.submission && <div className="mt-5"><StudentDownloads sub={studentCard.submission} variant="card" onNotice={(text) => setNotice({ kind: "ok", text })} /></div>}<p className="mt-4 text-center text-[10px] font-semibold text-ink-400">هذه البطاقة جزء من الفضاء الخاص ولا تُعرض في الواجهة العامة.</p></div></div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-extrabold text-ink-700">{label}</span>{children}</label>;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-extrabold text-ink-700">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={2} className="field min-h-16 resize-y text-xs leading-relaxed" /></label>;
}

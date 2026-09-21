import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowDownUp,
  Award,
  BarChart3,
  ChartColumn,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Search,
  PieChart,
  ShieldAlert,
  RotateCcw,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  clearAllData,
  clearDemoData,
  ensureSeeded,
  exportCsv,
  getDiagnosticAttendance,
  getSubmissions,
  isDemoSubmission,
  reseedDemoData,
} from "../lib/storage";
import { classReportFile, classReportPdf, resultsXlsx, scopeOf, selectionZip } from "../lib/reportExport";
import StudentDownloads from "./StudentDownloads";
import { DIAGNOSTIC_LEVELS, DiagnosticQRButton, DiagnosticQRPanel } from "./Diagnostic";
import { DIAGNOSTIC_SESSIONS, displayClassName, scheduledClassesForLevel } from "../data/diagnosticSchedule";
import { activeCreds, isUnlocked, lock } from "../lib/teacherAuth";
import type { Submission } from "../types";
import type { DiagnosticLevel, Route } from "../routes";
import Reveal from "./Reveal";
import TeacherLogin from "./TeacherLogin";
import TeacherSecurity from "./TeacherSecurity";
import Jadadat from "./Jadadat";

const round1 = (n: number) => Math.round(n * 10) / 10;

/* لوحة نتائج التقويم التشخيصي (المحتوى الأصلي) — تُعرض داخل تبويب اللوحة المحمية */
function TestResultsPanel({ go }: { go: (route: Route) => void }) {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [qrLevel, setQrLevel] = useState<DiagnosticLevel>("jad3-moshtarak");
  const [confirmClear, setConfirmClear] = useState<null | "all">(null);
  /* تصفية حسب المستوى والقسم + اختيار عدة تلاميذ للتحميل الجماعي */
  const [showDemo, setShowDemo] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [bankFilter, setBankFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    ensureSeeded();
    setSubs(getSubmissions());
  }, []);

  const visibleSubs = useMemo(
    () => (showDemo ? subs : subs.filter((submission) => !isDemoSubmission(submission))),
    [showDemo, subs],
  );

  const levels = useMemo(
    () => Array.from(new Set([
      ...DIAGNOSTIC_SESSIONS.map((session) => session.bankLevel),
      ...visibleSubs.map((submission) => submission.bankLevel).filter(Boolean) as string[],
    ])).sort(),
    [visibleSubs],
  );
  const levelFiltered = useMemo(
    () => (levelFilter === "all" ? visibleSubs : visibleSubs.filter((submission) => submission.bankLevel === levelFilter)),
    [visibleSubs, levelFilter],
  );
  const bankOptions = useMemo(() => {
    const options = new Map<string, string>();
    DIAGNOSTIC_SESSIONS.forEach((session) => options.set(session.bankId, session.branch));
    visibleSubs.forEach((submission) => {
      if (submission.bankId) options.set(submission.bankId, submission.bankLabel ?? submission.bankId);
    });
    return Array.from(options.entries()).sort((a, b) => a[1].localeCompare(b[1], "ar"));
  }, [visibleSubs]);
  const visibleBankOptions = useMemo(
    () => bankOptions.filter(([id]) => levelFilter === "all" || levelFiltered.some((submission) => submission.bankId === id) || DIAGNOSTIC_SESSIONS.some((session) => session.bankId === id && session.bankLevel === levelFilter)),
    [bankOptions, levelFilter, levelFiltered],
  );
  const bankFiltered = useMemo(
    () => (bankFilter === "all" ? levelFiltered : levelFiltered.filter((submission) => submission.bankId === bankFilter)),
    [levelFiltered, bankFilter],
  );
  const scopedResults = useMemo(
    () => (classFilter === "all" ? bankFiltered : bankFiltered.filter((submission) => submission.className === classFilter)),
    [bankFiltered, classFilter],
  );
  const qrLevelInfo = DIAGNOSTIC_LEVELS.find((item) => item.id === qrLevel) ?? DIAGNOSTIC_LEVELS[0];
  const attendance = useMemo(
    () => getDiagnosticAttendance(bankFiltered, classFilter === "all" ? undefined : classFilter),
    [bankFiltered, classFilter],
  );
  const attendanceTotal = attendance.reduce((sum, summary) => sum + summary.total, 0);
  const attendancePresent = attendance.reduce((sum, summary) => sum + summary.present, 0);
  const attendanceAbsent = attendance.reduce((sum, summary) => sum + summary.absent, 0);

  const stats = useMemo(() => {
    const n = scopedResults.length;
    if (n === 0) return null;
    const avg = (f: (s: Submission) => number) => round1(scopedResults.reduce((s, x) => s + f(x), 0) / n);
    const totals = scopedResults.map((s) => s.total);
    const support = scopedResults.filter((s) => s.percent < 50).length;
    const skills: Record<string, { got: number; max: number }> = {};
    scopedResults.forEach((s) => {
      Object.entries(s.skills).forEach(([k, v]) => {
        if (!skills[k]) skills[k] = { got: 0, max: 0 };
        skills[k].got += v.got;
        skills[k].max += v.max;
      });
    });
    return {
      n,
      avg: avg((s) => s.total),
      avgPct: avg((s) => s.percent),
      best: Math.max(...totals),
      worst: Math.min(...totals),
      avgHist: avg((s) => s.history),
      avgGeo: avg((s) => s.geography),
      support,
      answersSaved: scopedResults.filter((submission) => Array.isArray(submission.answers) && submission.answers.length > 0).length,
      rosterTotal: attendanceTotal || n,
      present: attendance.length > 0 ? attendancePresent : n,
      absent: attendance.length > 0 ? attendanceAbsent : 0,
      skills,
    };
  }, [attendance.length, attendanceAbsent, attendancePresent, attendanceTotal, scopedResults]);

  const histBins = useMemo(() => {
    const bins = [
      { label: "أقل من 5", range: "0 – 4.99", count: 0 },
      { label: "من 5 إلى 9.99", range: "5 – 9.99", count: 0 },
      { label: "من 10 إلى 14.99", range: "10 – 14.99", count: 0 },
      { label: "من 15 إلى 20", range: "15 – 20", count: 0 },
    ];
    scopedResults.forEach((s) => {
      const idx = s.total < 5 ? 0 : s.total < 10 ? 1 : s.total < 15 ? 2 : 3;
      bins[idx].count++;
    });
    return bins;
  }, [scopedResults]);

  const maxBin = Math.max(1, ...histBins.map((b) => b.count));
  /* ---------- التحميل الفردي والجماعي ---------- */
  const visibleSessions = useMemo(
    () => scheduledClassesForLevel(levelFilter === "all" ? undefined : levelFilter, bankFilter === "all" ? undefined : bankFilter),
    [levelFilter, bankFilter],
  );
  const classes = useMemo(() => {
    const scheduled = visibleSessions.map((session) => session.className);
    return Array.from(new Set([...scheduled, ...bankFiltered.map((s) => s.className)])).sort();
  }, [bankFiltered, visibleSessions]);
  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("ar");
    if (!query) return scopedResults;
    return scopedResults.filter((submission) => [submission.name, submission.studentNo, submission.className, submission.bankLabel]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("ar").includes(query)));
  }, [scopedResults, searchTerm]);
  const chosen = useMemo(() => (selected.length > 0 ? filtered.filter((s) => selected.includes(s.id)) : filtered), [filtered, selected]);
  const allChecked = filtered.length > 0 && filtered.every((s) => selected.includes(s.id));

  const toggleOne = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () => setSelected(allChecked ? [] : filtered.map((s) => s.id));

  /** تنفيذ عملية تحميل جماعية مع رسالة نتيجة للأستاذ */
  const runBulk = async (id: string, task: () => Promise<string>) => {
    if (chosen.length === 0) {
      setNotice("لا توجد نتائج للتحميل في هذا الاختيار.");
      return;
    }
    setBusy(id);
    setNotice(null);
    try {
      setNotice(await task());
    } catch {
      setNotice("تعذّر إنشاء الملف في هذا المتصفح — جرّب مرة أخرى أو قلّل عدد المحدَّدين.");
    } finally {
      setBusy(null);
    }
  };

  const scope = () => scopeOf(filtered, classFilter === "all" ? undefined : classFilter);
  const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} م.ب` : `${Math.max(1, Math.round(n / 1024))} ك.ب`);

  const doClear = () => {
    if (confirmClear === "all") clearAllData();
    setSubs(getSubmissions());
    setConfirmClear(null);
  };

  const lvlColor = (percent: number) =>
    percent >= 80 ? "bg-emerald-100 text-emerald-700" : percent >= 70 ? "bg-brand-100 text-brand-700" : percent >= 60 ? "bg-sky-100 text-sky-700" : percent >= 50 ? "bg-gold-100 text-gold-700" : "bg-rose-100 text-rose-700";

  return (
    <div>
        {/* الترويسة */}
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-black text-ink-900">نتائج التقويم التشخيصي</h2>
              <p className="mt-2 text-sm text-ink-500">الأقسام والنتائج — التاريخ والجغرافيا · النقطة /20</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="inline-flex items-center gap-2 rounded-xl border border-gold-200 bg-gold-50 px-3.5 py-2.5 text-xs font-extrabold text-gold-800">
                <input
                  type="checkbox"
                  checked={showDemo}
                  onChange={(event) => {
                    setShowDemo(event.target.checked);
                    setSelected([]);
                    setLevelFilter("all");
                    setBankFilter("all");
                    setClassFilter("all");
                  }}
                  className="size-4 accent-gold-600"
                />
                عرض البيانات التجريبية ({subs.filter(isDemoSubmission).length})
              </label>
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm("ستُعاد إنشاء العينة التجريبية مع الحفاظ على اللائحة الكاملة ونتائج التلاميذ الحقيقية. هل تريد المتابعة؟")) return;
                  reseedDemoData();
                  setSubs(getSubmissions());
                  setShowDemo(true);
                  setNotice("تمت إعادة إنشاء العينة التجريبية فقط؛ اللائحة الكاملة والنتائج الحقيقية لم تُمس.");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-gold-200 bg-white px-3.5 py-2.5 text-xs font-extrabold text-gold-800 transition-transform hover:-translate-y-0.5"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                إعادة ضبط البيانات التجريبية
              </button>
              <button
                type="button"
                disabled={subs.filter(isDemoSubmission).length === 0}
                onClick={() => {
                  if (!window.confirm("سيُحذف النموذج التجريبي فقط، ولن تُحذف أي نتيجة حقيقية. هل تريد المتابعة؟")) return;
                  clearDemoData();
                  setSubs(getSubmissions());
                  setShowDemo(false);
                  setNotice("تم حذف البيانات التجريبية فقط. النتائج الحقيقية محفوظة.");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-gold-200 bg-white px-3.5 py-2.5 text-xs font-extrabold text-gold-800 transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-40"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                حذف البيانات التجريبية
              </button>
              <button
                type="button"
                onClick={() => exportCsv(filtered)}
                disabled={filtered.length === 0}
                title="تصدير النتائج المعروضة في الجدول (CSV يفتح في Excel)"
                className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-xs font-extrabold text-brand-700 transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-40"
              >
                <Download className="size-4" aria-hidden="true" />
                تصدير CSV
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear("all")}
                disabled={subs.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-extrabold text-rose-600 transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-40"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                مسح جميع النتائج
              </button>
            </div>
          </div>
        </Reveal>


        <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
          <Reveal delay={120}>
            <div className="rounded-2xl border border-brand-200/70 bg-brand-50/50 p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-base font-extrabold text-ink-900">رمز الدخول المباشر للتقويم</p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-500">اختر المستوى ثم اطبع أو شارك الرمز مع التلاميذ. هذه البطاقة خاصة بلوحة الأستاذ.</p>
              </div>
              <label className="flex items-center gap-2 text-xs font-extrabold text-ink-700">
                <span className="whitespace-nowrap">المستوى</span>
                <select value={qrLevel} onChange={(event) => setQrLevel(event.target.value as DiagnosticLevel)} className="field min-w-[190px] py-2 text-xs">
                  {DIAGNOSTIC_LEVELS.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </label>
            </div>
              <DiagnosticQRPanel compact level={qrLevelInfo} onView={() => go({ view: "diagnostic", level: qrLevelInfo.id })} />
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="rounded-2xl border border-gold-200/80 bg-gold-50/45 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-base font-extrabold text-ink-900">أقسام التقويم التشخيصي</p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                  تُعرض النتائج المحفوظة فقط؛ القسم الذي لا يملك سجلات يبقى دون أسماء أو إجابات مُنشأة.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold text-gold-700">{visibleSessions.length} أقسام مهيأة</span>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {visibleSessions.map((session) => {
                const sessionResults = visibleSubs.filter((submission) => submission.className === session.className && (!submission.bankId || submission.bankId === session.bankId));
                const sessionAttendance = attendance.find((summary) => summary.className === session.className);
                const support = sessionResults.length > 0 ? sessionResults.filter((submission) => submission.percent < 50).length : null;
                const qrLevel = DIAGNOSTIC_LEVELS.find((item) => item.defaultBank === session.bankId) ?? DIAGNOSTIC_LEVELS[0];
                return (
                  <div key={session.id} className="rounded-2xl border border-white bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display text-[13px] font-extrabold text-ink-900">{session.displayClass}</p>
                      <span className="rounded-full bg-brand-50 px-2 py-1 text-[10px] font-bold text-brand-700">{sessionAttendance ? `${sessionAttendance.present}/${sessionAttendance.total} حاضرون` : `${sessionResults.length} نتائج`}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-ink-500">
                      {sessionAttendance && <span>غائبون: {sessionAttendance.absent} · أنجزوا: {sessionAttendance.participants}</span>}
                      <span>{support === null ? "نسبة الدعم: لا توجد نتائج فعلية" : `نسبة الدعم: ${Math.round((support / sessionResults.length) * 100)}٪ (${support}/${sessionResults.length})`}</span>
                    </div>
                    <div className="mt-2">
                      <DiagnosticQRButton
                        level={qrLevel}
                        className={session.className}
                        onView={() => go({ view: "diagnostic", level: qrLevel.id, className: session.className })}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-ink-900/6 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLevelFilter(session.bankLevel);
                          setBankFilter(session.bankId);
                          setClassFilter(session.className);
                          setSelected([]);
                        }}
                        className="rounded-lg border border-brand-200 bg-brand-50 px-2 py-1 text-[9px] font-extrabold text-brand-700"
                      >
                        عرض القسم
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          classReportFile(sessionResults, scopeOf(sessionResults, session.className));
                          setNotice(`نزّل تقرير ${session.displayClass} — يتضمن النتائج المحفوظة فقط.`);
                        }}
                        className="rounded-lg border border-ink-900/10 bg-white px-2 py-1 text-[9px] font-extrabold text-ink-700"
                      >
                        تقرير القسم HTML
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void classReportPdf(sessionResults, scopeOf(sessionResults, session.className));
                          setNotice(`فتحت نافذة طباعة تقرير ${session.displayClass} — لا تُعرض أسماء أو نقاط غير محفوظة.`);
                        }}
                        className="rounded-lg border border-ink-900/10 bg-white px-2 py-1 text-[9px] font-extrabold text-ink-700"
                      >
                        تقرير القسم PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
        </div>

        {stats && (
          <>
            {/* بطاقات الإحصاء */}
            <div className="mt-8 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-12">
              {[
                { icon: Users, v: String(stats.rosterTotal), l: "إجمالي تلاميذ القسم", c: "text-brand-600 bg-brand-50" },
                { icon: ClipboardList, v: String(stats.present), l: "الحاضرون", c: "text-sky-600 bg-sky-50" },
                { icon: ShieldAlert, v: String(stats.absent), l: "الغائبون", c: "text-rose-500 bg-rose-50" },
                { icon: Archive, v: String(stats.n), l: "المشاركون في التقويم", c: "text-gold-600 bg-gold-50" },
                { icon: TrendingUp, v: `${stats.avg}`, l: "متوسط المشاركين /20", c: "text-brand-600 bg-brand-50" },
                { icon: Award, v: `${Math.round(((stats.n - stats.support) / stats.n) * 100)}٪`, l: "نسبة النجاح", c: "text-emerald-600 bg-emerald-50" },
                { icon: Award, v: `${stats.best}`, l: "أعلى نقطة", c: "text-gold-600 bg-gold-50" },
                { icon: ArrowDownUp, v: `${stats.worst}`, l: "أدنى نقطة", c: "text-ink-500 bg-paper-warm" },
                { icon: BarChart3, v: `${stats.avgHist}`, l: "متوسط التاريخ /10", c: "text-gold-600 bg-gold-50" },
                { icon: PieChart, v: `${stats.avgGeo}`, l: "متوسط الجغرافيا /10", c: "text-brand-600 bg-brand-50" },
                { icon: ShieldAlert, v: `${stats.support}/${stats.n}`, l: `يحتاجون الدعم (${Math.round((stats.support / stats.n) * 100)}٪)`, c: "text-rose-500 bg-rose-50" },
                { icon: FileText, v: `${stats.answersSaved}/${stats.n}`, l: "الإجابات المسجلة", c: "text-sky-600 bg-sky-50" },
              ].map((s, i) => (
                <Reveal key={s.l} delay={i * 60}>
                  <div className="h-full rounded-2xl border border-ink-900/6 bg-white p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(12,124,91,0.3)]">
                    <span className={`mx-auto grid size-9 place-items-center rounded-xl ${s.c}`}>
                      <s.icon className="size-4.5" aria-hidden="true" />
                    </span>
                    <p className="mt-2 font-display text-xl font-black text-ink-900 sm:text-2xl">{s.v}</p>
                    <p className="mt-0.5 text-[10px] font-semibold leading-tight text-ink-500 sm:text-[11px]">{s.l}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* الحضور والغياب حسب اللوائح الرسمية */}
            {attendance.length > 0 && (
              <Reveal delay={90}>
                <div className="mt-8 rounded-3xl border border-brand-200/70 bg-brand-50/60 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900">
                        <Users className="size-5 text-brand-700" aria-hidden="true" />
                        حضور التقويم التشخيصي
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                        مقارنة النتائج المسجلة مع اللوائح الرسمية 2026–2027؛ الغائب لا تُنشأ له نتيجة.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {attendance.map((summary) => (
                      <div key={summary.className} className="rounded-2xl border border-white bg-white p-4">
                        <p className="font-display text-sm font-extrabold text-ink-900">{displayClassName(summary.className)}</p>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                          <div className="rounded-xl bg-paper-warm p-2.5">
                            <p className="font-display text-xl font-black text-ink-900">{summary.total}</p>
                            <p className="text-[10px] font-bold text-ink-500">مجموع اللائحة</p>
                          </div>
                          <div className="rounded-xl bg-brand-50 p-2.5">
                            <p className="font-display text-xl font-black text-brand-700">{summary.present}</p>
                            <p className="text-[10px] font-bold text-ink-500">حاضرون</p>
                          </div>
                          <div className="rounded-xl bg-rose-50 p-2.5">
                            <p className="font-display text-xl font-black text-rose-600">{summary.absent}</p>
                            <p className="text-[10px] font-bold text-ink-500">غائبون</p>
                          </div>
                          <div className="rounded-xl bg-sky-50 p-2.5">
                            <p className="font-display text-xl font-black text-sky-700">{summary.participants}</p>
                            <p className="text-[10px] font-bold text-ink-500">أنجزوا التقويم</p>
                          </div>
                        </div>
                        <p className="mt-2 text-center text-[10px] font-bold text-ink-500">نسبة الحضور: {Math.round((summary.present / summary.total) * 100)}٪ · نسبة الغياب: {Math.round((summary.absent / summary.total) * 100)}٪</p>
                        <details className="mt-3 rounded-xl border border-ink-900/6 bg-white px-3 py-2 text-[11px] text-ink-700">
                          <summary className="cursor-pointer font-extrabold text-brand-800">عرض سجل الحضور والمشاركة الكامل ({summary.total})</summary>
                          <div className="mt-2 overflow-x-auto">
                            <table className="w-full min-w-[560px] text-[10px]">
                              <thead><tr className="border-b border-ink-900/8 text-ink-500"><th className="px-2 py-2 text-start">ر.ت</th><th className="px-2 py-2 text-start">التلميذ(ة)</th><th className="px-2 py-2 text-start">رقم مسار</th><th className="px-2 py-2 text-center">الحضور</th><th className="px-2 py-2 text-center">التقويم</th><th className="px-2 py-2 text-center">النتيجة</th></tr></thead>
                              <tbody>
                                {summary.students
                                  .filter((entry) => {
                                    const query = searchTerm.trim().toLocaleLowerCase("ar");
                                    if (!query) return true;
                                    return [entry.student.name, entry.student.massar, entry.submission?.name, entry.submission?.studentNo]
                                      .filter(Boolean)
                                      .some((value) => String(value).toLocaleLowerCase("ar").includes(query));
                                  })
                                  .map((entry) => (
                                    <tr key={`${summary.className}-${entry.student.massar}`} className="border-b border-ink-900/5 last:border-0">
                                      <td className="px-2 py-2">{entry.student.n}</td>
                                      <td className="px-2 py-2 font-semibold">{entry.student.name}</td>
                                      <td className="px-2 py-2 font-mono text-[9px]" dir="ltr">{entry.student.massar}</td>
                                      <td className={`px-2 py-2 text-center font-bold ${entry.attendanceStatus === "present" ? "text-brand-700" : "text-rose-600"}`}>{entry.attendanceStatus === "present" ? "حاضر" : "غائب"}</td>
                                      <td className="px-2 py-2 text-center font-bold">{entry.assessmentStatus === "completed" ? "أنجز" : "لم ينجز"}</td>
                                      <td className="px-2 py-2 text-center font-bold">{entry.submission ? `${entry.submission.total}/20` : "—"}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* الرسوم */}
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {/* توزيع النتائج */}
              <Reveal delay={100}>
                <div className="h-full rounded-3xl border border-ink-900/6 bg-white p-6">
                  <p className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900">
                    <ChartColumn className="size-5 text-brand-600" aria-hidden="true" />
                    توزيع النتائج /20
                  </p>
                  <div className="mt-6 flex h-44 items-end justify-between gap-3 border-b border-ink-900/10 pb-2">
                    {histBins.map((b, i) => (
                      <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                        <span className="text-xs font-extrabold text-ink-900">{b.count}</span>
                        <div
                          className={`w-full rounded-t-lg transition-all duration-1000 ${
                            i === 3 ? "bg-gradient-to-t from-brand-600 to-brand-400" : i === 2 ? "bg-gradient-to-t from-brand-500/80 to-brand-300" : i === 1 ? "bg-gradient-to-t from-gold-500/80 to-gold-300" : "bg-gradient-to-t from-rose-500/70 to-rose-300"
                          }`}
                          style={{ height: `${(b.count / maxBin) * 100}%`, minHeight: b.count > 0 ? "8px" : "2px" }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between gap-3">
                    {histBins.map((b) => (
                      <span key={b.label} className="flex-1 text-center text-[9px] font-semibold leading-tight text-ink-500">
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* مقارنة المادتين */}
              <Reveal delay={200}>
                <div className="h-full rounded-3xl border border-ink-900/6 bg-white p-6">
                  <p className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900">
                    <BarChart3 className="size-5 text-brand-600" aria-hidden="true" />
                    مقارنة التاريخ والجغرافيا
                  </p>
                  <p className="mt-1 text-[11px] text-ink-500">المتوسط العام للقسم في كل مادة /10</p>
                  <div className="mt-8 space-y-6">
                    {[
                      { label: "التاريخ", val: stats.avgHist, grad: "from-gold-400 to-gold-600" },
                      { label: "الجغرافيا", val: stats.avgGeo, grad: "from-brand-400 to-brand-600" },
                    ].map((b) => (
                      <div key={b.label}>
                        <div className="flex items-center justify-between text-sm font-extrabold text-ink-900">
                          <span>{b.label}</span>
                          <span>{b.val} / 10</span>
                        </div>
                        <div className="mt-2 h-4 overflow-hidden rounded-full bg-paper-warm">
                          <div className={`h-full rounded-full bg-gradient-to-l ${b.grad} transition-all duration-1000`} style={{ width: `${(b.val / 10) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 rounded-xl bg-paper-warm/70 p-3 text-[11px] leading-relaxed text-ink-500">
                    {stats.avgHist >= stats.avgGeo
                      ? "يظهر القسم تحكمًا أعمق نسبيًا في التاريخ مقارنة بالجغرافيا — يُقترح تكثيف التمارين الجغرافية التطبيقية."
                      : "يظهر القسم تحكمًا أعمق نسبيًا في الجغرافيا — يُقترح تدعيم المكتسبات التاريخية التأسيسية."}
                  </p>
                </div>
              </Reveal>

              {/* التحكم في المهارات */}
              <Reveal delay={300}>
                <div className="h-full rounded-3xl border border-ink-900/6 bg-white p-6">
                  <p className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900">
                    <PieChart className="size-5 text-brand-600" aria-hidden="true" />
                    مستوى التحكم في المهارات
                  </p>
                  <div className="mt-5 space-y-3.5">
                    {Object.entries(stats.skills).map(([skill, v]) => {
                      const pct = v.max > 0 ? Math.round((v.got / v.max) * 100) : 0;
                      return (
                        <div key={skill}>
                          <div className="flex items-center justify-between text-[12px] font-bold text-ink-700">
                            <span className="line-clamp-1">{skill}</span>
                            <span className="shrink-0 text-ink-500">{pct}٪</span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper-warm">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-gold-500" : "bg-rose-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
            </div>

            {/* أدوات التحميل الفردي والجماعي */}
            <Reveal delay={160}>
              <div className="mt-8 rounded-3xl border border-ink-900/6 bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-base font-extrabold text-ink-900">تحميل ملفات التلاميذ</p>
                    <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-ink-500">
                      لكل تلميذ(ة) في الجدول أسفله أزرار: عرض التفاصيل · أجوبة PDF مختصرة في صفحتين · تقرير النتائج PDF · طباعة الملف الفردي · Word · Excel.
                      ولمجموعة من التلاميذ: أرشيف ZIP مرتّب حسب المستوى والقسم، جدول نتائج Excel، وتقرير شامل PDF.
                      أسماء الملفات تُبنى تلقائيًا بالصيغة: <b className="font-extrabold text-brand-700">اسم_التلميذ_رقم_التلميذ_التقويم_التشخيصي.pdf</b>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-extrabold text-ink-700">
                      <span className="whitespace-nowrap">بحث</span>
                      <span className="relative">
                        <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-400" aria-hidden="true" />
                        <input
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          placeholder="اسم أو رقم تجريبي"
                          className="field min-w-[180px] py-2 ps-8 text-xs"
                          type="search"
                        />
                      </span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-extrabold text-ink-700">
                      <span className="whitespace-nowrap">المستوى</span>
                      <select
                        value={levelFilter}
                        onChange={(e) => {
                          setLevelFilter(e.target.value);
                          setBankFilter("all");
                          setClassFilter("all");
                          setSelected([]);
                        }}
                        className="field min-w-[170px] py-2 text-xs"
                      >
                        <option value="all">كل المستويات ({visibleSubs.length})</option>
                        {levels.map((level) => (
                          <option key={level} value={level}>
                            {level} ({visibleSubs.filter((s) => s.bankLevel === level).length})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-extrabold text-ink-700">
                      <span className="whitespace-nowrap">البنك</span>
                      <select
                        value={bankFilter}
                        onChange={(e) => {
                          setBankFilter(e.target.value);
                          setClassFilter("all");
                          setSelected([]);
                        }}
                        className="field min-w-[210px] py-2 text-xs"
                      >
                        <option value="all">كل البنوك ({levelFiltered.length})</option>
                        {visibleBankOptions.map(([id, label]) => (
                          <option key={id} value={id}>
                            {label} ({levelFiltered.filter((s) => s.bankId === id).length})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-extrabold text-ink-700">
                      <span className="whitespace-nowrap">القسم</span>
                      <select
                        value={classFilter}
                        onChange={(e) => {
                          setClassFilter(e.target.value);
                          setSelected([]);
                        }}
                        className="field min-w-[190px] py-2 text-xs"
                      >
                        <option value="all">كل الأقسام ({bankFiltered.length})</option>
                        {classes.map((c) => (
                          <option key={c} value={c}>
                            {displayClassName(c)} ({bankFiltered.filter((s) => s.className === c).length})
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleAll}
                    disabled={filtered.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-white px-4 py-2.5 text-xs font-extrabold text-ink-700 transition-all enabled:hover:-translate-y-0.5 enabled:hover:border-brand-300 disabled:opacity-40"
                  >
                    <ListChecks className="size-4 text-brand-600" aria-hidden="true" />
                    {allChecked ? "إلغاء تحديد الكل" : `تحديد كل القسم (${filtered.length})`}
                  </button>

                  <button
                    type="button"
                    disabled={busy !== null || chosen.length === 0}
                    onClick={() =>
                      runBulk("zip-sel", async () => {
                        const r = await selectionZip(chosen, scope());
                        return `نزّل الأرشيف «${r.name}» (${kb(r.size)}) — ${r.count} تلميذ(ة)، لكل واحد ملف HTML جاهز للطباعة وملف Word، مع جدول النتائج والتقرير الشامل، مرتّبة في مجلدات حسب المستوى والقسم.`;
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-brand-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-brand-700/20 transition-all enabled:hover:-translate-y-0.5 disabled:opacity-40"
                  >
                    <Archive className="size-4" aria-hidden="true" />
                    {busy === "zip-sel" ? "جارٍ بناء الأرشيف…" : `تحميل أجوبة التلاميذ ZIP (${chosen.length})`}
                  </button>

                  <button
                    type="button"
                    disabled={busy !== null || filtered.length === 0}
                    onClick={() =>
                      runBulk("zip-class", async () => {
                        const r = await selectionZip(filtered, scope());
                        return `نزّل أرشيف القسم كاملًا «${r.name}» (${kb(r.size)}) — ${r.count} تلميذ(ة).`;
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-xs font-extrabold text-brand-700 transition-all enabled:hover:-translate-y-0.5 disabled:opacity-40"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    تحميل جميع نتائج القسم
                  </button>

                  <button
                    type="button"
                    disabled={busy !== null || chosen.length === 0}
                    onClick={() =>
                      runBulk("xlsx", async () => {
                        await resultsXlsx(chosen, scope());
                        return `نزّل جدول النتائج Excel (.xlsx) لـ${chosen.length} تلميذ(ة): ورقة النتائج، ورقة تحليل المهارات والتوصيات، وورقة الأجوبة سؤالًا بسؤال.`;
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-xs font-extrabold text-brand-700 transition-all enabled:hover:-translate-y-0.5 disabled:opacity-40"
                  >
                    <FileSpreadsheet className="size-4" aria-hidden="true" />
                    جدول النتائج Excel
                  </button>

                  <button
                    type="button"
                    disabled={busy !== null || chosen.length === 0}
                    onClick={() =>
                      runBulk("report-pdf", async () => {
                        await classReportPdf(chosen, scope());
                        return `فتحت نافذة طباعة التقرير الشامل لـ${chosen.length} تلميذ(ة) — اختر «حفظ بصيغة PDF» وسيُقترح الاسم تلقائيًا.`;
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-xs font-extrabold text-brand-700 transition-all enabled:hover:-translate-y-0.5 disabled:opacity-40"
                  >
                    <FileText className="size-4" aria-hidden="true" />
                    تقرير شامل للقسم PDF
                  </button>

                  <button
                    type="button"
                    disabled={chosen.length === 0}
                    onClick={() => {
                      classReportFile(chosen, scope());
                      setNotice(`نزّل التقرير الشامل بصيغة HTML لـ${chosen.length} تلميذ(ة) — يُفتح ويُطبع في أي وقت.`);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-white px-4 py-2.5 text-xs font-extrabold text-ink-700 transition-all enabled:hover:-translate-y-0.5 disabled:opacity-40"
                  >
                    <FileText className="size-4 text-brand-600" aria-hidden="true" />
                    التقرير الشامل HTML
                  </button>
                </div>

                {notice && (
                  <p role="status" className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-3 text-xs font-bold leading-relaxed text-brand-800">
                    {notice}
                  </p>
                )}

                <p className="mt-3 text-[10.5px] leading-relaxed text-ink-500">
                  ملاحظة تقنية صريحة: الموقع ثابت بلا خادم، وتوليد PDF عربي سليم يحتاج محرك طباعة وخطوطًا عربية، لذلك أزرار
                  PDF تفتح نافذة الطباعة باسم الملف جاهزًا — اختر الوجهة «حفظ بصيغة PDF» فيُنزَّل بالاسم المطلوب. أما أرشيف
                  ZIP فيضمّ لكل تلميذ(ة) ملف HTML جاهزًا للطباعة بنقرة واحدة ونسخة Word، إضافة إلى جدول Excel والتقرير الشامل.
                  ولتحويل الأرشيف كله إلى PDF دفعة واحدة على حاسوبك:{" "}
                  <code dir="ltr" className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-brand-800">npm run pdf:batch -- &lt;الأرشيف.zip&gt; --zip</code>{" "}
                  (التفاصيل في docs/export-pdf.md). السجلات المحفوظة قبل هذا التحديث لا تحتوي أجوبة كل
                  سؤال، وتُعلن وثيقتها ذلك صراحة.
                </p>
              </div>
            </Reveal>

            {/* الجدول */}
            <Reveal delay={200}>
              <div className="mt-8 overflow-hidden rounded-3xl border border-ink-900/6 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-900/6 px-6 py-4">
                  <p className="font-display text-base font-extrabold text-ink-900">جدول نتائج التلاميذ</p>
                  <span className="text-xs font-semibold text-ink-500">
                    {filtered.length} مشاركًا{selected.length > 0 ? ` · ${selected.length} محدَّد` : ""}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead>
                      <tr className="bg-brand-50 text-brand-800">
                        <th className="px-3 py-3.5 text-center font-display text-xs font-extrabold">
                          <input
                            type="checkbox"
                            checked={allChecked}
                            onChange={toggleAll}
                            aria-label="تحديد كل التلاميذ المعروضين"
                            className="size-4 cursor-pointer accent-brand-600"
                          />
                        </th>
                        <th className="px-6 py-3.5 text-start font-display text-xs font-extrabold">التلميذ(ة)</th>
                        <th className="px-4 py-3.5 text-start font-display text-xs font-extrabold">رقم مسار</th>
                        <th className="px-4 py-3.5 text-start font-display text-xs font-extrabold">القسم</th>
                        <th className="px-4 py-3.5 text-start font-display text-xs font-extrabold">المستوى / المسلك</th>
                        <th className="px-4 py-3.5 text-center font-display text-xs font-extrabold">التاريخ /10</th>
                        <th className="px-4 py-3.5 text-center font-display text-xs font-extrabold">الجغرافيا /10</th>
                        <th className="px-4 py-3.5 text-center font-display text-xs font-extrabold">المجموع /20</th>
                        <th className="px-4 py-3.5 text-center font-display text-xs font-extrabold">المستوى</th>
                        <th className="px-3 py-3.5 text-center font-display text-xs font-extrabold">تحميل ملف التلميذ(ة)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...filtered]
                        .sort((a, b) => b.total - a.total)
                        .map((s, i) => (
                          <tr key={s.id} className={`${i % 2 === 0 ? "bg-white" : "bg-paper-warm/40"} ${selected.includes(s.id) ? "ring-1 ring-inset ring-brand-300 bg-brand-50/40" : ""}`}>
                            <td className="px-3 py-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={selected.includes(s.id)}
                                onChange={() => toggleOne(s.id)}
                                aria-label={`اختيار ${s.name}`}
                                className="size-4 cursor-pointer accent-brand-600"
                              />
                            </td>
                            <td className="px-6 py-3.5">
                              <span className="font-bold text-ink-900">{s.name}</span>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-[10px] text-ink-600" dir="ltr">{s.massar ?? "—"}</td>
                            <td className="px-4 py-3.5 text-xs text-ink-500">{displayClassName(s.className)}</td>
                            <td className="px-4 py-3.5">
                              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold text-brand-700">{s.bankLabel ?? "الجذع المشترك"}</span>
                            </td>
                            <td className="px-4 py-3.5 text-center font-semibold text-ink-700">{s.history}</td>
                            <td className="px-4 py-3.5 text-center font-semibold text-ink-700">{s.geography}</td>
                            <td className="px-4 py-3.5 text-center font-display text-base font-black text-ink-900">{s.total}</td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold ${lvlColor(s.percent)}`}>{s.level}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <StudentDownloads sub={s} variant="row" onNotice={setNotice} />
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Reveal>
          </>
        )}

        {!stats && (
          <Reveal delay={120}>
            <div className="mt-12 rounded-3xl border border-dashed border-brand-300 bg-white p-12 text-center">
              <Users className="mx-auto size-10 text-brand-300" aria-hidden="true" />
              <p className="mt-4 font-display text-lg font-extrabold text-ink-900">لا توجد نتائج بعد</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                بمجرد إجراء التلميذ للتقويم التشخيصي، تظهر نتيجته هنا مباشرة مع تحليله التربوي.
              </p>
            </div>
          </Reveal>
        )}

      {/* تأكيد الحذف */}
      {confirmClear && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="dialog" aria-modal="true">
          <button type="button" aria-label="إغلاق" onClick={() => setConfirmClear(null)} className="animate-fade-in absolute inset-0 bg-brand-950/60 backdrop-blur-sm" />
          <div className="animate-modal-in relative w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
            <Trash2 className="mx-auto size-8 text-rose-500" aria-hidden="true" />
            <p className="mt-3 font-display text-lg font-black text-ink-900">
              مسح جميع النتائج؟
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              ستُحذف جميع النتائج المحفوظة نهائيًا، ولا يمكن التراجع.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setConfirmClear(null)} className="rounded-xl border border-ink-900/10 px-4 py-2.5 text-sm font-bold text-ink-700 hover:bg-paper-warm">
                إلغاء
              </button>
              <button type="button" onClick={doClear} className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-rose-600">
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
/* ============================================================
   لوحة الأستاذ — فضاء خاص محمي باسم مستعمل وكلمة مرور
   ============================================================
   تبويبان:
     results  → نتائج التقويم التشخيصي (اللوحة الأصلية كما هي)
     security → تغيير بيانات الدخول + حدود الحماية على موقع ثابت

   لا يُعرض أي محتوى (نتائج، تصدير، مسح) قبل التحقّق من الدخول؛
   وعند تسجيل الخروج تُقفل الجلسة وتُحجب اللوحة من جديد.
   ============================================================ */

const TABS = [
  { id: "results", label: "نتائج التقويم التشخيصي", hint: "الحضور، النتائج، التقارير والتصدير", icon: ChartColumn },
  { id: "jadadat", label: "الجذاذات", hint: "إعداد الدروس والأنشطة والتقويم", icon: FileText },
  { id: "security", label: "الدخول والأمان", hint: "حماية الفضاء وإدارة الجلسة", icon: KeyRound },
] as const;

export type DashboardTab = (typeof TABS)[number]["id"];

/** هل القيمة معرّف تبويب صالح؟ (للتوجيه والعناوين المباشرة) */
export const isDashboardTab = (v?: string): v is DashboardTab => TABS.some((t) => t.id === v);

interface DashboardProps {
  tab?: string;
  go: (r: Route) => void;
}

export default function Dashboard({ tab, go }: DashboardProps) {
  const [unlocked, setUnlocked] = useState<boolean>(() => isUnlocked());
  const [who, setWho] = useState("");

  useEffect(() => {
    if (!unlocked) return;
    let alive = true;
    activeCreds().then((c) => {
      if (alive) setWho(c.user);
    });
    return () => {
      alive = false;
    };
  }, [unlocked]);

  /* البوابة: لا شيء من اللوحة يُعرض قبل الدخول */
  if (!unlocked) return <TeacherLogin go={go} onUnlock={() => setUnlocked(true)} />;

  const active: DashboardTab = isDashboardTab(tab) ? tab : "results";

  const signOut = () => {
    lock();
    setUnlocked(false);
    go({ view: "home" });
  };

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-36">
      <div className="pointer-events-none absolute inset-0 pattern-zellige-dark opacity-40" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* الترويسة */}
        <Reveal>
          <header className="relative overflow-hidden rounded-3xl border border-brand-200/70 bg-white p-5 shadow-[0_22px_55px_-30px_rgba(4,36,26,0.35)] sm:p-6">
            <div className="pointer-events-none absolute inset-y-0 start-0 w-1.5 bg-gradient-to-b from-gold-400 via-brand-500 to-brand-900" aria-hidden="true" />
            <div className="relative flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700">
                    <LayoutDashboard className="size-3.5" aria-hidden="true" />
                    فضاء الأستاذ الخاص
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold text-emerald-700">
                    <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" /> جلسة محمية
                  </span>
                </div>
                <h1 className="mt-4 font-display text-2xl font-black text-ink-900 sm:text-3xl">لوحة القيادة التعليمية</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
                  مركز واحد لتنظيم التقويم التشخيصي، متابعة الحضور، قراءة النتائج، وإعداد التقارير.
                  {who && (
                    <>
                      {" "}المستخدم المتصل: <strong dir="ltr" className="font-extrabold text-brand-700">{who}</strong>
                    </>
                  )}
                </p>
                <p className="mt-2 text-[11px] font-semibold text-ink-400">إعداد وإنجاز: الأستاذ عماد طليل — ثانوية القدس، القنيطرة</p>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-extrabold text-rose-600 transition-transform hover:-translate-y-0.5"
              >
                <LogOut className="size-4" aria-hidden="true" />
                تسجيل الخروج
              </button>
            </div>
          </header>
        </Reveal>

        {/* التبويبات */}
        <nav className="mt-5 rounded-3xl border border-ink-900/8 bg-white/80 p-2 shadow-[0_18px_45px_-32px_rgba(4,36,26,0.3)]" role="tablist" aria-label="أقسام لوحة الأستاذ">
          <div className="grid gap-2 md:grid-cols-3">
          {TABS.map((t) => {
            const on = active === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => go({ view: "dashboard", tab: t.id })}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-start transition-all ${
                  on
                    ? "border-brand-500 bg-brand-600 text-white shadow-[0_14px_30px_-16px_rgba(12,124,91,0.9)]"
                    : "border-ink-900/10 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-700"
                }`}
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${on ? "bg-white/15 text-gold-200" : "bg-brand-50 text-brand-700"}`}>
                  <t.icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-extrabold">{t.label}</span>
                  <span className={`mt-0.5 block truncate text-[10px] font-semibold ${on ? "text-white/70" : "text-ink-400"}`}>{t.hint}</span>
                </span>
              </button>
            );
          })}
          </div>
        </nav>

        {/* محتوى التبويب */}
        <div className="mt-7">
          {active === "results" && <TestResultsPanel go={go} />}
          {active === "jadadat" && <Jadadat go={go} embedded />}
          {active === "security" && <TeacherSecurity />}
        </div>
      </div>
    </section>
  );
}

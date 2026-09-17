import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  Award,
  BarChart3,
  ChartColumn,
  Download,
  KeyRound,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  PieChart,
  ShieldAlert,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { clearAllData, clearDemoData, ensureSeeded, exportCsv, getSubmissions } from "../lib/storage";
import { activeCreds, isUnlocked, lock } from "../lib/teacherAuth";
import type { Submission } from "../types";
import type { Route } from "../routes";
import Reveal from "./Reveal";
import TeacherLogin from "./TeacherLogin";
import TeacherSecurity from "./TeacherSecurity";
import JadadatTracker from "./JadadatTracker";

const round1 = (n: number) => Math.round(n * 10) / 10;

/* لوحة نتائج التقويم التشخيصي (المحتوى الأصلي) — تُعرض داخل تبويب اللوحة المحمية */
function TestResultsPanel() {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [confirmClear, setConfirmClear] = useState<null | "demo" | "all">(null);

  useEffect(() => {
    ensureSeeded();
    setSubs(getSubmissions());
  }, []);

  const stats = useMemo(() => {
    const n = subs.length;
    if (n === 0) return null;
    const avg = (f: (s: Submission) => number) => round1(subs.reduce((s, x) => s + f(x), 0) / n);
    const totals = subs.map((s) => s.total);
    const support = subs.filter((s) => s.percent < 50).length;
    const skills: Record<string, { got: number; max: number }> = {};
    subs.forEach((s) => {
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
      skills,
    };
  }, [subs]);

  const histBins = useMemo(() => {
    const bins = [
      { label: "أقل من 5", range: "0 – 4.99", count: 0 },
      { label: "من 5 إلى 9.99", range: "5 – 9.99", count: 0 },
      { label: "من 10 إلى 14.99", range: "10 – 14.99", count: 0 },
      { label: "من 15 إلى 20", range: "15 – 20", count: 0 },
    ];
    subs.forEach((s) => {
      const idx = s.total < 5 ? 0 : s.total < 10 ? 1 : s.total < 15 ? 2 : 3;
      bins[idx].count++;
    });
    return bins;
  }, [subs]);

  const maxBin = Math.max(1, ...histBins.map((b) => b.count));
  const hasDemo = subs.some((s) => s.demo);

  const doClear = () => {
    if (confirmClear === "demo") clearDemoData();
    else if (confirmClear === "all") clearAllData();
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
              <p className="mt-2 text-sm text-ink-500">الجذع المشترك — التاريخ والجغرافيا · النقطة /20</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {hasDemo && (
                <button
                  type="button"
                  onClick={() => setConfirmClear("demo")}
                  className="inline-flex items-center gap-2 rounded-xl border border-gold-300 bg-gold-50 px-4 py-2.5 text-xs font-extrabold text-gold-700 transition-transform hover:-translate-y-0.5"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  حذف البيانات التوضيحية
                </button>
              )}
              <button
                type="button"
                onClick={() => exportCsv(subs)}
                disabled={subs.length === 0}
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

        {hasDemo && (
          <Reveal delay={80}>
            <p className="mt-5 rounded-2xl border border-gold-300/60 bg-gold-50 px-5 py-3 text-xs font-semibold leading-relaxed text-gold-700">
              هذه الإحصاءات تتضمن <strong>بيانات توضيحية بغرض معاينة شكل اللوحة</strong>؛ بمجرد إجراء نتائج حقيقية من طرف
              التلاميذ تُضاف إليها، ويمكن حذف التوضيحية في أي وقت بالزر أعلاه.
            </p>
          </Reveal>
        )}

        {stats && (
          <>
            {/* بطاقات الإحصاء */}
            <div className="mt-8 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-7">
              {[
                { icon: Users, v: String(stats.n), l: "المشاركون", c: "text-brand-600 bg-brand-50" },
                { icon: TrendingUp, v: `${stats.avg}`, l: "متوسط القسم /20", c: "text-brand-600 bg-brand-50" },
                { icon: Award, v: `${stats.best}`, l: "أعلى نقطة", c: "text-gold-600 bg-gold-50" },
                { icon: ArrowDownUp, v: `${stats.worst}`, l: "أدنى نقطة", c: "text-ink-500 bg-paper-warm" },
                { icon: BarChart3, v: `${stats.avgHist}`, l: "متوسط التاريخ /10", c: "text-gold-600 bg-gold-50" },
                { icon: PieChart, v: `${stats.avgGeo}`, l: "متوسط الجغرافيا /10", c: "text-brand-600 bg-brand-50" },
                { icon: ShieldAlert, v: String(stats.support), l: "يحتاجون الدعم", c: "text-rose-500 bg-rose-50" },
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

            {/* الجدول */}
            <Reveal delay={200}>
              <div className="mt-8 overflow-hidden rounded-3xl border border-ink-900/6 bg-white">
                <div className="flex items-center justify-between border-b border-ink-900/6 px-6 py-4">
                  <p className="font-display text-base font-extrabold text-ink-900">جدول نتائج التلاميذ</p>
                  <span className="text-xs font-semibold text-ink-500">{subs.length} مشاركًا</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead>
                      <tr className="bg-brand-50 text-brand-800">
                        <th className="px-6 py-3.5 text-start font-display text-xs font-extrabold">التلميذ(ة)</th>
                        <th className="px-4 py-3.5 text-start font-display text-xs font-extrabold">القسم</th>
                        <th className="px-4 py-3.5 text-start font-display text-xs font-extrabold">المستوى / المسلك</th>
                        <th className="px-4 py-3.5 text-center font-display text-xs font-extrabold">التاريخ /10</th>
                        <th className="px-4 py-3.5 text-center font-display text-xs font-extrabold">الجغرافيا /10</th>
                        <th className="px-4 py-3.5 text-center font-display text-xs font-extrabold">المجموع /20</th>
                        <th className="px-4 py-3.5 text-center font-display text-xs font-extrabold">المستوى</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...subs]
                        .sort((a, b) => b.total - a.total)
                        .map((s, i) => (
                          <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-paper-warm/40"}>
                            <td className="px-6 py-3.5">
                              <span className="font-bold text-ink-900">{s.name}</span>
                              {s.studentNo && <span className="ms-1.5 text-[11px] text-ink-500">(رقم {s.studentNo})</span>}
                              {s.demo && <span className="ms-2 rounded-full bg-gold-100 px-2 py-0.5 text-[9px] font-extrabold text-gold-700">توضيحي</span>}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-ink-500">{s.className}</td>
                            <td className="px-4 py-3.5">
                              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold text-brand-700">{s.bankLabel ?? "الجذع المشترك"}</span>
                            </td>
                            <td className="px-4 py-3.5 text-center font-semibold text-ink-700">{s.history}</td>
                            <td className="px-4 py-3.5 text-center font-semibold text-ink-700">{s.geography}</td>
                            <td className="px-4 py-3.5 text-center font-display text-base font-black text-ink-900">{s.total}</td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold ${lvlColor(s.percent)}`}>{s.level}</span>
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
              {confirmClear === "demo" ? "حذف البيانات التوضيحية؟" : "مسح جميع النتائج؟"}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              {confirmClear === "demo"
                ? "ستُحذف النماذج التوضيحية فقط وتبقى نتائج التلاميذ الحقيقية."
                : "ستُحذف جميع النتائج المحفوظة نهائيًا، ولا يمكن التراجع."}
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
   ثلاثة تبويبات:
     results  → نتائج التقويم التشخيصي (اللوحة الأصلية كما هي)
     jadadat  → تتبّع إنجاز جذاذات الجذع المشترك العلمي (25 جذاذة)
     security → تغيير بيانات الدخول + حدود الحماية على موقع ثابت

   لا يُعرض أي محتوى (نتائج، تصدير، مسح) قبل التحقّق من الدخول؛
   وعند تسجيل الخروج تُقفل الجلسة وتُحجب اللوحة من جديد.
   ============================================================ */

const TABS = [
  { id: "results", label: "نتائج التقويم التشخيصي", icon: ChartColumn },
  { id: "jadadat", label: "تتبّع الجذاذات", icon: NotebookPen },
  { id: "security", label: "الدخول والأمان", icon: KeyRound },
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
                <LayoutDashboard className="size-3.5" aria-hidden="true" />
                لوحة الأستاذ · فضاء محمي
              </span>
              <h1 className="mt-4 font-display text-3xl font-black text-ink-900 sm:text-4xl">
                فضاء الأستاذ الخاص
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                نتائج التقويم التشخيصي · تتبّع إنجاز الجذاذات
                {who && (
                  <>
                    {" "}
                    · متصل باسم <strong dir="ltr" className="font-extrabold text-brand-700">{who}</strong>
                  </>
                )}
                <br />
                إعداد وإنجاز: الأستاذ عماد طليل — ثانوية القدس، القنيطرة
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-extrabold text-rose-600 transition-transform hover:-translate-y-0.5"
            >
              <LogOut className="size-4" aria-hidden="true" />
              تسجيل الخروج
            </button>
          </div>
        </Reveal>

        {/* التبويبات */}
        <div className="mt-7 flex flex-wrap gap-2" role="tablist" aria-label="أقسام لوحة الأستاذ">
          {TABS.map((t) => {
            const on = active === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => go({ view: "dashboard", tab: t.id })}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-extrabold transition-all ${
                  on
                    ? "border-brand-500 bg-brand-600 text-white shadow-[0_14px_30px_-16px_rgba(12,124,91,0.9)]"
                    : "border-ink-900/10 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-700"
                }`}
              >
                <t.icon className="size-4" aria-hidden="true" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* محتوى التبويب */}
        <div className="mt-7">
          {active === "results" && <TestResultsPanel />}
          {active === "jadadat" && <JadadatTracker />}
          {active === "security" && <TeacherSecurity />}
        </div>
      </div>
    </section>
  );
}

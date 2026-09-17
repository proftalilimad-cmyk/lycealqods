import { useMemo, useState } from "react";
import {
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Download,
  Hourglass,
  ListChecks,
  NotebookPen,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import {
  TRACKER_STATUS,
  TRACKER_STATUS_ORDER,
  TRACKER_SLOTS,
  TRACKER_TOTAL,
  TRACKER_UNITS,
  type TrackerStatus,
  type TrackerSubject,
} from "../data/jadadatTracker";
import { ROSTER_CLASSES } from "../data/rosters";
import {
  clearAllProgress,
  emptyProgress,
  exportTrackerCsv,
  getProgress,
  progressOf,
  setSlotProgress,
  setUnitProgress,
  trackerStats,
  type ProgressMap,
} from "../lib/trackerStorage";
import Reveal from "./Reveal";

/* ============================================================
   تتبّع إنجاز الجذاذات — الجذع المشترك العلمي (25 جذاذة)
   ============================================================
   لوحة تحكّم للأستاذ داخل اللوحة المحمية:
     • تعليم كل جذاذة: أُنجزت / قيد الإنجاز / لم تُنجز بعد
     • تاريخ الإنجاز، القسم المنجَزة معه، وملاحظة حرّة
     • تصفية بالمادة والدورة والحالة والقسم + بحث في العناوين
     • نسبة الإنجاز العامة وحسب المادة والدورة والوحدة
     • تصدير CSV للمسك الورقي/الإداري، ومسح التتبّع
   الحالة تُحفظ في متصفّح الأستاذ (localStorage).
   ============================================================ */

const today = () => new Date().toISOString().slice(0, 10);

const STATUS_ICON: Record<TrackerStatus, typeof CheckCircle2> = {
  done: CheckCircle2,
  progress: Hourglass,
  pending: ClipboardList,
};

const CLASS_OPTIONS = ROSTER_CLASSES.map((c) => c.label);

export default function JadadatTracker() {
  const [map, setMap] = useState<ProgressMap>(() => getProgress());
  const [subject, setSubject] = useState<"all" | TrackerSubject>("all");
  const [cycle, setCycle] = useState<"all" | string>("all");
  const [status, setStatus] = useState<"all" | TrackerStatus>("all");
  const [klass, setKlass] = useState<"all" | string>("all");
  const [query, setQuery] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [savedFlash, setSavedFlash] = useState("");

  const stats = useMemo(() => trackerStats(map), [map]);

  const rows = useMemo(() => {
    const q = query.trim();
    return TRACKER_SLOTS.filter((s) => {
      if (subject !== "all" && s.subject !== subject) return false;
      if (cycle !== "all" && s.cycle !== cycle) return false;
      if (status !== "all" && progressOf(map, s.id).status !== status) return false;
      if (klass !== "all" && progressOf(map, s.id).className !== klass) return false;
      if (q && !`${s.number} ${s.title} ${s.unitTitle}`.includes(q)) return false;
      return true;
    });
  }, [map, subject, cycle, status, klass, query]);

  const grouped = useMemo(() => {
    const out: { unitId: string; title: string; subject: string; cycle: string; module: string; items: typeof rows }[] = [];
    rows.forEach((s) => {
      let g = out.find((u) => u.unitId === s.unitId);
      if (!g) {
        g = { unitId: s.unitId, title: s.unitTitle, subject: s.subject, cycle: s.cycle, module: s.module, items: [] };
        out.push(g);
      }
      g.items.push(s);
    });
    return out;
  }, [rows]);

  const flash = (slotTitle: string) => {
    setSavedFlash(slotTitle);
    window.setTimeout(() => setSavedFlash((v) => (v === slotTitle ? "" : v)), 1800);
  };

  const update = (slotId: string, patch: Partial<ReturnType<typeof emptyProgress>>, title: string) => {
    setMap(setSlotProgress(slotId, patch));
    flash(title);
  };

  const onStatus = (slotId: string, next: TrackerStatus, title: string) => {
    const current = progressOf(map, slotId);
    update(
      slotId,
      {
        status: next,
        date: next === "pending" ? "" : current.date || today(),
      },
      title
    );
  };

  const onDate = (slotId: string, date: string, title: string) => {
    const current = progressOf(map, slotId);
    update(slotId, { date, status: date && current.status === "pending" ? "done" : current.status }, title);
  };

  const unitDone = (unitId: string) => {
    setMap(setUnitProgress(unitId, "done"));
    flash("الوحدة كاملة");
  };

  const unitReset = (unitId: string) => {
    setMap(setUnitProgress(unitId, "pending"));
    flash("تصفير الوحدة");
  };

  const doResetAll = () => {
    setMap(clearAllProgress());
    setConfirmReset(false);
  };

  const cycles = Array.from(new Set(TRACKER_SLOTS.map((s) => s.cycle)));

  return (
    <div>
      {/* ---------- شريط الإحصاء ---------- */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { icon: NotebookPen, v: String(stats.total), l: "جذاذات المقرر", c: "text-brand-600 bg-brand-50" },
          { icon: CheckCircle2, v: String(stats.done), l: "أُنجزت", c: "text-emerald-600 bg-emerald-50" },
          { icon: Hourglass, v: String(stats.progress), l: "قيد الإنجاز", c: "text-gold-600 bg-gold-50" },
          { icon: ClipboardList, v: String(stats.pending), l: "لم تُنجز بعد", c: "text-ink-500 bg-paper-warm" },
          { icon: ListChecks, v: `${stats.percent}٪`, l: "نسبة الإنجاز", c: "text-brand-600 bg-brand-50" },
          {
            icon: CalendarCheck2,
            v: stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleDateString("fr-MA") : "—",
            l: "آخر إنجاز",
            c: "text-gold-600 bg-gold-50",
          },
        ].map((s, i) => (
          <Reveal key={s.l} delay={i * 50}>
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

      {/* ---------- التقدّم العام ---------- */}
      <Reveal delay={80}>
        <div className="mt-5 rounded-3xl border border-ink-900/6 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-base font-extrabold text-ink-900">
              التقدّم في إنجاز جذاذات الجذع المشترك العلمي
            </p>
            <p className="text-xs font-bold text-ink-500">
              <span className="text-brand-700">{stats.done}</span> / {stats.total} جذاذة · {stats.percent}٪
            </p>
          </div>
          <div className="mt-3 h-4 overflow-hidden rounded-full bg-paper-warm">
            <div
              className="h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-600 transition-all duration-1000"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[...stats.bySubject, ...stats.byCycle].map((b) => {
              const label = "subject" in b ? b.subject : b.cycle;
              return (
                <div key={label}>
                  <div className="flex items-center justify-between text-[12px] font-bold text-ink-700">
                    <span>{label}</span>
                    <span className="text-ink-500">
                      {b.done} / {b.total} · {b.percent}٪
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper-warm">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        b.percent >= 80 ? "bg-emerald-500" : b.percent >= 40 ? "bg-brand-500" : "bg-gold-500"
                      }`}
                      style={{ width: `${b.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* ---------- الأدوات ---------- */}
      <Reveal delay={120}>
        <div className="mt-5 flex flex-wrap items-center gap-2.5 rounded-3xl border border-ink-900/6 bg-white p-4">
          <div className="relative min-w-[190px] flex-1">
            <Search className="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-4 text-ink-300" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في عناوين الدروس والوحدات…"
              className="w-full rounded-xl border border-ink-900/10 bg-paper-warm/40 py-2.5 ps-10 pe-3.5 text-xs font-bold text-ink-900 outline-none transition-colors placeholder:font-medium placeholder:text-ink-300 focus:border-brand-400 focus:bg-white"
            />
          </div>

          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as "all" | TrackerSubject)}
            aria-label="المادة"
            className="rounded-xl border border-ink-900/10 bg-white px-3 py-2.5 text-xs font-bold text-ink-700 outline-none focus:border-brand-400"
          >
            <option value="all">كل المواد</option>
            <option value="التاريخ">التاريخ</option>
            <option value="الجغرافيا">الجغرافيا</option>
          </select>

          <select
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            aria-label="الدورة"
            className="rounded-xl border border-ink-900/10 bg-white px-3 py-2.5 text-xs font-bold text-ink-700 outline-none focus:border-brand-400"
          >
            <option value="all">كل الدورات</option>
            {cycles.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | TrackerStatus)}
            aria-label="الحالة"
            className="rounded-xl border border-ink-900/10 bg-white px-3 py-2.5 text-xs font-bold text-ink-700 outline-none focus:border-brand-400"
          >
            <option value="all">كل الحالات</option>
            {TRACKER_STATUS_ORDER.map((st) => (
              <option key={st} value={st}>
                {TRACKER_STATUS[st].label}
              </option>
            ))}
          </select>

          <select
            value={klass}
            onChange={(e) => setKlass(e.target.value)}
            aria-label="القسم"
            className="max-w-[190px] rounded-xl border border-ink-900/10 bg-white px-3 py-2.5 text-xs font-bold text-ink-700 outline-none focus:border-brand-400"
          >
            <option value="all">كل الأقسام</option>
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => exportTrackerCsv(map)}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-xs font-extrabold text-brand-700 transition-transform hover:-translate-y-0.5"
          >
            <Download className="size-4" aria-hidden="true" />
            تصدير CSV
          </button>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            disabled={stats.done + stats.progress === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-extrabold text-rose-600 transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-40"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            مسح التتبّع
          </button>
        </div>
      </Reveal>

      {savedFlash && (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-bold text-emerald-700" role="status">
          حُفظ التغيير: {savedFlash}
        </p>
      )}

      {/* ---------- الجدول ---------- */}
      <Reveal delay={160}>
        <div className="mt-5 overflow-hidden rounded-3xl border border-ink-900/6 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-900/6 px-6 py-4">
            <p className="font-display text-base font-extrabold text-ink-900">لائحة الجذاذات وحالة إنجازها</p>
            <span className="text-xs font-semibold text-ink-500">
              {rows.length} جذاذة معروضة · الترتيب حسب المقرر الرسمي
            </span>
          </div>

          {rows.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm font-semibold text-ink-500">
              لا جذاذة تطابق هذه التصفية — أعد ضبط المرشّحات.
            </p>
          ) : (
            <div className="divide-y divide-ink-900/6">
              {grouped.map((g) => (
                <div key={g.unitId}>
                  {/* ترويسة الوحدة */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-brand-50/60 px-6 py-3">
                    <p className="text-xs font-black text-brand-800">
                      {g.subject} · {g.cycle} · المجزوءة {g.module} — {g.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-ink-500">
                        {g.items.filter((s) => progressOf(map, s.id).status === "done").length} / {g.items.length} منجزة
                      </span>
                      <button
                        type="button"
                        onClick={() => unitDone(g.unitId)}
                        className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-extrabold text-emerald-700 transition-colors hover:bg-emerald-50"
                      >
                        إنجاز الوحدة كاملة
                      </button>
                      <button
                        type="button"
                        onClick={() => unitReset(g.unitId)}
                        className="rounded-lg border border-ink-900/10 bg-white px-2.5 py-1 text-[10px] font-extrabold text-ink-500 transition-colors hover:bg-paper-warm"
                      >
                        <RotateCcw className="size-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead>
                        <tr className="bg-paper-warm/50 text-ink-700">
                          <th className="px-4 py-3 text-center font-display text-[11px] font-extrabold">الجذاذة</th>
                          <th className="px-4 py-3 text-start font-display text-[11px] font-extrabold">عنوان الدرس</th>
                          <th className="px-4 py-3 text-center font-display text-[11px] font-extrabold">الحالة</th>
                          <th className="px-4 py-3 text-center font-display text-[11px] font-extrabold">تاريخ الإنجاز</th>
                          <th className="px-4 py-3 text-start font-display text-[11px] font-extrabold">القسم</th>
                          <th className="px-4 py-3 text-start font-display text-[11px] font-extrabold">ملاحظة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.items.map((s, i) => {
                          const p = progressOf(map, s.id);
                          const meta = TRACKER_STATUS[p.status];
                          return (
                            <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-paper-warm/25"}>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex min-w-9 justify-center rounded-lg bg-brand-50 px-2 py-1 font-display text-xs font-black text-brand-700">
                                  {s.number}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-[13px] font-bold leading-snug text-ink-900">{s.title}</p>
                                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-ink-500">
                                  <span>{s.subject}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{s.cycle}</span>
                                  {s.tag && (
                                    <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[9px] font-extrabold text-gold-700">
                                      {s.tag}
                                    </span>
                                  )}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="mx-auto flex w-[150px] items-center gap-1 rounded-full border border-ink-900/6 bg-paper-warm/60 p-1">
                                  {TRACKER_STATUS_ORDER.map((st) => {
                                    const M = TRACKER_STATUS[st];
                                    const SI = STATUS_ICON[st];
                                    const active = p.status === st;
                                    return (
                                      <button
                                        key={st}
                                        type="button"
                                        onClick={() => onStatus(s.id, st, s.title)}
                                        title={M.label}
                                        aria-pressed={active}
                                        className={`flex flex-1 items-center justify-center gap-1 rounded-full px-1.5 py-1.5 text-[9px] font-extrabold transition-colors ${
                                          active ? `${M.chip} border` : "text-ink-500 hover:bg-white"
                                        }`}
                                      >
                                        <SI className="size-3.5" aria-hidden="true" />
                                        <span className="hidden sm:inline">{M.short}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                                <span className={`mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold ${meta.chip.split(" ").pop()}`}>
                                  <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
                                  {meta.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="date"
                                  value={p.date}
                                  onChange={(e) => onDate(s.id, e.target.value, s.title)}
                                  aria-label={`تاريخ إنجاز ${s.title}`}
                                  dir="ltr"
                                  className="w-[135px] rounded-lg border border-ink-900/10 bg-white px-2 py-1.5 text-[11px] font-bold text-ink-700 outline-none focus:border-brand-400"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={p.className}
                                  onChange={(e) => update(s.id, { className: e.target.value }, s.title)}
                                  aria-label={`قسم إنجاز ${s.title}`}
                                  className="w-[165px] rounded-lg border border-ink-900/10 bg-white px-2 py-1.5 text-[11px] font-bold text-ink-700 outline-none focus:border-brand-400"
                                >
                                  <option value="">— لم يُحدَّد —</option>
                                  {CLASS_OPTIONS.map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={p.note}
                                  onChange={(e) => update(s.id, { note: e.target.value }, s.title)}
                                  placeholder="ملاحظة (دعم، تعديل، وثيقة…)"
                                  aria-label={`ملاحظة حول ${s.title}`}
                                  className="w-[210px] rounded-lg border border-ink-900/10 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-ink-700 outline-none transition-colors placeholder:font-medium placeholder:text-ink-300 focus:border-brand-400"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="border-t border-ink-900/6 bg-paper-warm/40 px-6 py-3 text-[10px] leading-relaxed text-ink-500">
            اللائحة مطابقة للمقرر الرسمي للجذع المشترك العلمي ({TRACKER_TOTAL} جذاذة: 13 تاريخ + 12 جغرافيا) —
            وحدات: {TRACKER_UNITS.length}. التتبّع محفوظ في هذا المتصفّح فقط؛ صدّر CSV لأرشفته أو نقله.
          </p>
        </div>
      </Reveal>

      {/* ---------- تأكيد المسح ---------- */}
      {confirmReset && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="إغلاق"
            onClick={() => setConfirmReset(false)}
            className="animate-fade-in absolute inset-0 bg-brand-950/60 backdrop-blur-sm"
          />
          <div className="animate-modal-in relative w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
            <Trash2 className="mx-auto size-8 text-rose-500" aria-hidden="true" />
            <p className="mt-3 font-display text-lg font-black text-ink-900">مسح تتبّع الجذاذات؟</p>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              ستُحذف حالات الإنجاز والتواريخ والأقسام والملاحظات نهائيًا من هذا المتصفّح، ولا يمكن التراجع.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-xl border border-ink-900/10 px-4 py-2.5 text-sm font-bold text-ink-700 hover:bg-paper-warm"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={doResetAll}
                className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-rose-600"
              >
                تأكيد المسح
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

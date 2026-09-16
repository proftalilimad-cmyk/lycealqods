import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, Clock3, NotebookPen, Printer, X } from "lucide-react";
import { JADADAT, JADADA_LEVELS, getJadada } from "../data/jadadat";
import type { Jadada } from "../data/jadadat";
import type { Route } from "../routes";

/* ============================================================
   الجذاذات: عناوين فرعية للمستويات (جذع مشترك / أولى باك / ثانية باك)
   وداخل كل مستوى بطاقات حسب المادة، مع عارض جذاذة قابل للطباعة.
   ============================================================ */

interface JadadatProps {
  level?: string;
  open?: string;
  go: (r: Route) => void;
}

function FicheModal({ id, onClose, go }: { id: string; onClose: () => void; go: (r: Route) => void }) {
  const j = getJadada(id);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  if (!j) return null;
  const levelLabel = JADADA_LEVELS.find((l) => l.id === j.level)?.label ?? j.level;
  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={`جذاذة: ${j.title}`}>
      <button type="button" aria-label="إغلاق" onClick={onClose} className="animate-fade-in absolute inset-0 bg-brand-950/60 backdrop-blur-sm" data-no-print />
      <div className="animate-modal-in absolute inset-x-0 top-4 bottom-4 mx-auto w-[calc(100%-1.5rem)] max-w-3xl sm:top-8 sm:bottom-8">
        <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-paper shadow-2xl shadow-brand-950/40">
          <div className="flex items-start justify-between gap-3 border-b border-ink-900/8 bg-white px-5 py-4" data-no-print>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold text-brand-700">
                  {levelLabel} · {j.track}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-2.5 py-1 text-[10px] font-extrabold text-gold-700">
                  {j.subject} · {j.unit}
                </span>
              </div>
              <h2 className="mt-2 font-display text-base font-extrabold leading-snug text-ink-900 sm:text-lg">{j.title}</h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => window.print()} title="طباعة الجذاذة" aria-label="طباعة الجذاذة" className="grid size-9 place-items-center rounded-xl border border-ink-900/10 bg-white text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700">
                <Printer className="size-4" />
              </button>
              <button type="button" onClick={onClose} aria-label="إغلاق" className="grid size-9 place-items-center rounded-xl border border-ink-900/10 bg-white text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700">
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            {/* البطاقة التقنية */}
            <div className="overflow-hidden rounded-2xl border border-ink-900/8">
              <table className="w-full border-collapse text-xs">
                <caption className="bg-brand-700 px-4 py-2.5 text-start text-xs font-extrabold text-white">البطاقة التقنية</caption>
                <tbody>
                  {[
                    ["المرجع", j.book],
                    ["المستوى والمسلك", `${levelLabel} — ${j.track}`],
                    ["المادة والمجال", `${j.subject} · ${j.unit}`],
                    ["المدة", j.duration],
                  ].map(([k, v]) => (
                    <tr key={k} className="border-t border-ink-900/8">
                      <th className="w-32 bg-brand-50 px-4 py-2 text-start font-extrabold text-brand-800">{k}</th>
                      <td className="px-4 py-2 font-semibold text-ink-700">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* الأهداف والمفاهيم */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <section className="rounded-2xl border border-ink-900/8 bg-white p-4">
                <h3 className="text-xs font-extrabold text-brand-700">الأهداف التعلمية</h3>
                <ul className="mt-2 space-y-1.5">
                  {j.objectives.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-ink-700">
                      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-brand-100 text-[9px] font-black text-brand-700">{i + 1}</span>
                      {o}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="space-y-4">
                <div className="rounded-2xl border border-ink-900/8 bg-white p-4">
                  <h3 className="text-xs font-extrabold text-brand-700">المفاهيم الأساسية</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {j.concepts.map((c) => (
                      <span key={c} className="rounded-full bg-gold-50 px-2.5 py-1 text-[10px] font-extrabold text-gold-700 ring-1 ring-gold-300/60">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-ink-900/8 bg-white p-4">
                  <h3 className="text-xs font-extrabold text-brand-700">المكتسبات القبلية</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-[12px] text-ink-700">
                    {j.prerequisites.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>

            {/* الوسائل */}
            <section className="mt-4 rounded-2xl border border-ink-900/8 bg-white p-4">
              <h3 className="text-xs font-extrabold text-brand-700">الوسائل والوثائق</h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {j.materials.map((m) => (
                  <li key={m} className="rounded-full bg-paper px-2.5 py-1 text-[10px] font-bold text-ink-700 ring-1 ring-ink-900/10">
                    {m}
                  </li>
                ))}
              </ul>
            </section>

            {/* سير الدرس */}
            <div className="mt-5 overflow-x-auto rounded-2xl border border-ink-900/8">
              <table className="w-full min-w-[520px] border-collapse text-xs">
                <caption className="bg-brand-700 px-4 py-2.5 text-start text-xs font-extrabold text-white">سير الدرس (المراحل والأنشطة)</caption>
                <thead>
                  <tr className="bg-brand-600 text-white">
                    <th className="px-3 py-2 text-start font-extrabold">المرحلة</th>
                    <th className="px-3 py-2 text-start font-extrabold">نشاط الأستاذ(ة)</th>
                    <th className="px-3 py-2 text-start font-extrabold">نشاط التلاميذ</th>
                    <th className="px-3 py-2 text-start font-extrabold">التوقيت</th>
                  </tr>
                </thead>
                <tbody>
                  {j.steps.map((s, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-paper"}>
                      <td className="px-3 py-2 font-extrabold text-brand-800">{s.phase}</td>
                      <td className="px-3 py-2 font-semibold leading-relaxed text-ink-700">{s.teacher}</td>
                      <td className="px-3 py-2 font-semibold leading-relaxed text-ink-700">{s.students}</td>
                      <td className="px-3 py-2 font-bold text-ink-500">{s.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* التقويم والامتداد */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <section className="rounded-2xl border border-ink-900/8 bg-white p-4">
                <h3 className="text-xs font-extrabold text-brand-700">مؤشرات التقويم</h3>
                <ul className="mt-2 list-inside list-disc space-y-1 text-[12px] text-ink-700">
                  {j.assessment.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </section>
              <section className="rounded-2xl border border-gold-300/60 bg-gold-50 p-4">
                <h3 className="text-xs font-extrabold text-gold-700">الامتداد (العمل المنزلي)</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-ink-700">{j.extension}</p>
              </section>
            </div>

            <div className="mt-5 flex flex-wrap gap-2" data-no-print>
              {j.lessonKey && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    go({ view: "lesson", id: j.lessonKey! });
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-700"
                >
                  <BookOpenCheck className="size-4" />
                  الدرس التفاعلي المقابل ←
                </button>
              )}
              <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-xs font-extrabold text-brand-700 transition-all hover:-translate-y-0.5 hover:border-brand-400">
                <Printer className="size-4" />
                طباعة الجذاذة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Jadadat({ level, open, go }: JadadatProps) {
  const [activeLevel, setActiveLevel] = useState<string>(level && JADADA_LEVELS.some((l) => l.id === level) ? level : "tc");
  const [openId, setOpenId] = useState<string | null>(open && getJadada(open) ? open : null);

  const byLevel = useMemo(() => {
    const m = new Map<string, Jadada[]>();
    for (const j of JADADAT) m.set(j.level, [...(m.get(j.level) ?? []), j]);
    return m;
  }, []);

  const pickLevel = (id: string) => {
    setActiveLevel(id);
    go({ view: "jadadat", level: id });
  };
  const pickFiche = (id: string) => {
    setOpenId(id);
    go({ view: "jadadat", level: activeLevel, open: id });
  };
  const closeFiche = () => {
    setOpenId(null);
    go({ view: "jadadat", level: activeLevel });
  };

  const levelFiches = byLevel.get(activeLevel) ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6">
      <header className="animate-fade-in">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-extrabold text-brand-700">
          <NotebookPen className="size-3.5" aria-hidden="true" />
          وثائق الأستاذ
        </span>
        <h1 className="mt-3 font-display text-2xl font-black text-ink-900 sm:text-3xl">الجذاذات</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
          بطاقات تحضير الدروس بصيغة الجذاذة المغربية: البطاقة التقنية، الأهداف، المفاهيم، الوسائل، سير الدرس بمراحله
          وأنشطته، التقويم والامتداد — منظمة بعناوين فرعية حسب المستويات، وقابلة للطباعة مباشرة.
        </p>
      </header>

      {/* عناوين فرعية: المستويات */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {JADADA_LEVELS.map((l) => {
          const count = (byLevel.get(l.id) ?? []).length;
          const active = l.id === activeLevel;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => pickLevel(l.id)}
              aria-pressed={active}
              className={`rounded-2xl border p-4 text-start transition-all hover:-translate-y-0.5 ${active ? "border-brand-500 bg-brand-600 text-white shadow-lg shadow-brand-600/25" : "border-ink-900/10 bg-white text-ink-900 hover:border-brand-300"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-extrabold">{l.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${active ? "bg-white/20 text-white" : "bg-brand-50 text-brand-700"}`}>
                  {count > 0 ? `${count} جذاذة` : "قريبًا"}
                </span>
              </div>
              <div className={`mt-2 flex flex-wrap gap-1 ${active ? "text-white/85" : "text-ink-500"}`}>
                {l.tracks.map((t) => (
                  <span key={t} className="rounded-full bg-black/5 px-2 py-0.5 text-[9.5px] font-bold ring-1 ring-black/5">
                    {t}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* محتوى المستوى النشط */}
      {levelFiches.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-ink-900/15 bg-white p-8 text-center">
          <p className="font-display text-sm font-extrabold text-ink-700">جذاذات هذا المستوى في الإعداد</p>
          <p className="mt-2 text-xs text-ink-500">أول حزمة جاهزة: الجذع المشترك العلمي (تاريخ وجغرافيا) من كتاب منار الاجتماعيات.</p>
        </div>
      ) : (
        (["التاريخ", "الجغرافيا"] as const).map((subject) => {
          const list = levelFiches.filter((j) => j.subject === subject);
          if (list.length === 0) return null;
          return (
            <section key={subject} className="mt-8">
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink-900">
                <span className="size-2.5 rounded-full bg-gold-500" aria-hidden="true" />
                {subject} — {JADADA_LEVELS.find((l) => l.id === activeLevel)?.label}
                <span className="text-xs font-bold text-ink-500">({list.length} جذاذات)</span>
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {list.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => pickFiche(j.id)}
                    className="group rounded-2xl border border-ink-900/10 bg-white p-5 text-start transition-all hover:-translate-y-1 hover:border-brand-400 hover:shadow-xl hover:shadow-brand-900/10"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold text-brand-700">{j.unit}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-ink-500">
                        <Clock3 className="size-3" aria-hidden="true" />
                        {j.duration}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-sm font-extrabold leading-snug text-ink-900 transition-colors group-hover:text-brand-700">
                      {j.title}
                    </h3>
                    <p className="mt-2 text-[11px] font-bold text-ink-500">{j.book} · {j.track}</p>
                    <p className="mt-3 text-[11px] font-extrabold text-brand-600">عرض الجذاذة وطباعتها ←</p>
                  </button>
                ))}
              </div>
            </section>
          );
        })
      )}

      {openId && <FicheModal id={openId} onClose={closeFiche} go={go} />}
    </div>
  );
}

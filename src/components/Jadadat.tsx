import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, Clock3, NotebookPen, Printer, X } from "lucide-react";
import { JADADAT, JADADA_LEVELS, TEACHER_NAME, TEACHER_SCHOOL, getJadada } from "../data/jadadat";
import type { Jadada } from "../data/jadadat";
import type { Route } from "../routes";

/* ============================================================
   الجذاذات: عناوين فرعية للمستويات + عارض الجذاذة بالصيغة
   الرسمية (جدول: مراحل إنجاز الدرس / أهداف التعلم / التدبير
   الديداكتيكي / الدعائم / المتن) مع تقويمات مرحلية وإجمالية
   وتوقيع «إنجاز الأستاذ».
   ============================================================ */

const C = {
  head: "#7d5f3d",
  headDark: "#6a4f31",
  olive: "#8a7a4f",
  beige: "#f6edda",
  beigeDark: "#efe3c4",
  line: "#d9c9a8",
};

function Th({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <th className="border px-3 py-2 text-start text-[11px] font-extrabold text-white" style={{ background: dark ? C.headDark : C.head, borderColor: C.line }}>
      {children}
    </th>
  );
}
function Td({ children, bg, className }: { children?: React.ReactNode; bg?: string; className?: string }) {
  return (
    <td className={`border px-3 py-2 align-top text-[11px] font-semibold leading-relaxed text-ink-800 ${className ?? ""}`} style={{ background: bg ?? "#ffffff", borderColor: C.line }}>
      {children}
    </td>
  );
}
function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((t, i) => (
        <li key={i} className="flex items-start gap-1.5">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: C.olive }} aria-hidden="true" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

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
      <div className="animate-modal-in absolute inset-x-0 top-3 bottom-3 mx-auto w-[calc(100%-1rem)] max-w-5xl sm:top-6 sm:bottom-6">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-brand-950/40">
          {/* شريط الأدوات */}
          <div className="flex items-center justify-between gap-3 border-b bg-white px-4 py-2.5" style={{ borderColor: C.line }} data-no-print>
            <p className="truncate text-xs font-extrabold text-ink-700">
              {j.subject} · مجزوءة {j.module} · درس {j.number} — {levelLabel} {j.track}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {j.lessonKey && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    go({ view: "lesson", id: j.lessonKey! });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-[11px] font-extrabold text-white transition-colors hover:bg-brand-700"
                >
                  <BookOpenCheck className="size-3.5" />
                  الدرس التفاعلي
                </button>
              )}
              <button type="button" onClick={() => window.print()} title="طباعة الجذاذة" aria-label="طباعة الجذاذة" className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-extrabold text-ink-700 transition-colors hover:text-brand-700" style={{ borderColor: C.line }}>
                <Printer className="size-3.5" />
                طباعة
              </button>
              <button type="button" onClick={onClose} aria-label="إغلاق" className="grid size-8 place-items-center rounded-lg border text-ink-700 transition-colors hover:text-brand-700" style={{ borderColor: C.line }}>
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white p-4 sm:p-5">
            {/* البطاقة التقنية العليا */}
            <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_1fr]">
              <table className="w-full border-collapse">
                <tbody>
                  {[
                    ["مادة", j.subject],
                    ["المستوى", `${levelLabel} ${j.track.replace("مسلك ", "")}`],
                    ["المجزوءة", j.module],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <th className="w-24 border px-3 py-2 text-start text-[11px] font-extrabold text-white" style={{ background: C.head, borderColor: C.line }}>
                        {k}
                      </th>
                      <td className="border px-3 py-2 text-[11px] font-extrabold text-ink-900" style={{ background: C.beige, borderColor: C.line }}>
                        {v}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "#8a6248" }}>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white font-display text-sm font-black" style={{ color: "#8a6248" }}>
                  {j.number}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold text-white/80">عنوان الدرس</p>
                  <p className="font-display text-[13px] font-extrabold leading-snug text-white">{j.title}</p>
                </div>
              </div>

              <table className="w-full border-collapse">
                <tbody>
                  {[
                    ["مدة الإنجاز", j.duration],
                    ["الكتاب المعتمد", j.book],
                    ["إنجاز الأستاذ", TEACHER_NAME],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <th className="w-28 border px-3 py-2 text-start text-[11px] font-extrabold text-white" style={{ background: C.head, borderColor: C.line }}>
                        {k}
                      </th>
                      <td className="border px-3 py-2 text-[11px] font-extrabold text-ink-900" style={{ background: C.beige, borderColor: C.line }}>
                        {v}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* الكفايات */}
            <table className="mt-3 w-full border-collapse">
              <tbody>
                <tr>
                  <th className="w-44 border px-3 py-2 text-start text-[11px] font-extrabold text-white" style={{ background: C.olive, borderColor: C.line }}>
                    الكفاية المركزية/المجالية :
                  </th>
                  <td className="border px-3 py-2 text-[11px] font-bold leading-relaxed text-ink-900" style={{ background: C.beige, borderColor: C.line }}>
                    {j.kifayaMarkaziya}
                  </td>
                </tr>
                <tr>
                  <th className="border px-3 py-2 text-start text-[11px] font-extrabold text-white" style={{ background: C.olive, borderColor: C.line }}>
                    الكفاية المحورية للوحدة :
                  </th>
                  <td className="border px-3 py-2 text-[11px] font-bold leading-relaxed text-ink-900" style={{ background: C.beige, borderColor: C.line }}>
                    {j.kifayaMihwariya}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* الأهداف */}
            <table className="mt-3 w-full border-collapse">
              <thead>
                <tr>
                  <Th>معرفيًا</Th>
                  <Th>مهاريًا</Th>
                  <Th>وجدانيا</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td bg={C.beige}>
                    <Bullets items={j.goals.cognitive} />
                  </Td>
                  <Td bg={C.beige}>
                    <Bullets items={j.goals.skills} />
                  </Td>
                  <Td bg={C.beige}>
                    <Bullets items={j.goals.affective} />
                  </Td>
                </tr>
              </tbody>
            </table>

            {/* جدول سير الدرس */}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr>
                    <Th dark>مراحل إنجاز الدرس</Th>
                    <Th dark>أهداف التعلم المرتبطة بالنشاط</Th>
                    <Th dark>التدبير الديداكتيكي</Th>
                    <Th dark>الدعامات الديداكتيكية</Th>
                    <Th dark>المتنوع</Th>
                  </tr>
                </thead>
                <tbody>
                  {j.segments.map((s, i) =>
                    s.phase.startsWith("تقويم مرحلي") ? (
                      <tr key={i}>
                        <td className="border px-3 py-2 text-center text-[11px] font-extrabold text-white" style={{ background: C.olive, borderColor: C.line }}>
                          تقويم مرحلي
                        </td>
                        <td colSpan={4} className="border px-3 py-2 text-[11px] font-bold leading-relaxed text-ink-900" style={{ background: C.beigeDark, borderColor: C.line }}>
                          <Bullets items={s.content} />
                        </td>
                      </tr>
                    ) : (
                      <tr key={i}>
                        <Td bg={C.beigeDark} className="text-center font-extrabold text-ink-900">
                          {s.phase}
                        </Td>
                        <Td>
                          <Bullets items={s.objectives} />
                        </Td>
                        <Td>
                          <Bullets items={s.management} />
                        </Td>
                        <Td bg="#fdf8ec" className="text-center font-extrabold" >
                          {s.supports.length > 0 ? (
                            <Bullets items={s.supports} />
                          ) : (
                            <span className="text-ink-400">—</span>
                          )}
                        </Td>
                        <Td>
                          <Bullets items={s.content} />
                        </Td>
                      </tr>
                    ),
                  )}
                  <tr>
                    <td className="border px-3 py-2 text-center text-[11px] font-extrabold text-white" style={{ background: C.headDark, borderColor: C.line }}>
                      تقويم إجمالي
                    </td>
                    <td colSpan={4} className="border px-3 py-2 text-[11px] font-bold leading-relaxed text-ink-900" style={{ background: C.beige, borderColor: C.line }}>
                      <Bullets items={j.taqwimIjmali} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* التوقيع */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3" style={{ background: C.beige, border: `1px solid ${C.line}` }}>
              <p className="text-[11px] font-extrabold text-ink-900">
                إنجاز: {TEACHER_NAME} — {TEACHER_SCHOOL}
              </p>
              <p className="inline-flex items-center gap-1.5 text-[10px] font-bold text-ink-500">
                <Clock3 className="size-3" aria-hidden="true" />
                {j.duration} · المرجع: {j.book}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2" data-no-print>
              <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-700">
                <Printer className="size-4" />
                طباعة الجذاذة
              </button>
              {j.lessonKey && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    go({ view: "lesson", id: j.lessonKey! });
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-xs font-extrabold text-brand-700 transition-all hover:-translate-y-0.5 hover:border-brand-400"
                >
                  <BookOpenCheck className="size-4" />
                  الدرس التفاعلي المقابل ←
                </button>
              )}
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
          جذاذات الدروس بالصيغة الرسمية: البطاقة التقنية، الكفاية المركزية والمحورية، الأهداف معرفيًا ومهاريًا ووجدانيًا،
          جدول مراحل إنجاز الدرس (التدبير الديداكتيكي، الدعائم، المتن) مع التقويمات المرحلية والإجمالية — من إنجاز{" "}
          <span className="font-extrabold text-ink-700">{TEACHER_NAME}</span>، قابلة للطباعة مباشرة.
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
          <p className="mt-2 text-xs text-ink-500">أول حزمة جاهزة: الجذع المشترك العلمي (تاريخ وجغرافيا) من كتاب منار التاريخ والجغرافيا.</p>
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
                      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold text-brand-700">
                        مجزوءة {j.module} · درس {j.number}
                      </span>
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

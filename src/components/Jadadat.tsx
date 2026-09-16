import { useMemo, useState } from "react";
import { BookOpenCheck, Clock3, NotebookPen, Printer } from "lucide-react";
import { JADADAT, JADADA_LEVELS, TEACHER_NAME, TEACHER_SCHOOL, getJadada } from "../data/jadadat";
import type { Jadada } from "../data/jadadat";
import type { Route } from "../routes";

/* ============================================================
   الجذاذات: عناوين فرعية للمستويات + عارض الجذاذة بالصيغة
   الرسمية (جدول: مراحل إنجاز الدرس / أهداف التعلم / التدبير
   الديداكتيكي / الدعائم / المتن) مع تقويمات مرحلية وإجمالية
   وتوقيع «إنجاز الأستاذ».
   ============================================================ */

/* ألوان جداول الجذاذات = هوية المنصة (أخضر brand + لمسة gold) */
const C = {
  head: "#0c6147",      /* brand-700 */
  headDark: "#0a4d3a",  /* brand-800 */
  olive: "#0f7c5b",     /* brand-600 */
  beige: "#edf7f2",     /* brand-50 */
  beigeDark: "#d4ede0", /* brand-100 */
  line: "#a9dcc4",      /* brand-200 */
  gold: "#fdf7e9",      /* gold-50 */
  goldLine: "#f5dfae",  /* gold-200 */
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

function FichePage({ j, onBack, go }: { j: Jadada; onBack: () => void; go: (r: Route) => void }) {
  const levelLabel = JADADA_LEVELS.find((l) => l.id === j.level)?.label ?? j.level;
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 sm:px-6">
      {/* شريط أدوات الصفحة */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2" data-no-print>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-ink-900/10 bg-white px-3.5 py-2 text-[11px] font-extrabold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
        >
          ← رجوع إلى لائحة الجذاذات
        </button>
        <div className="flex items-center gap-2">
          {j.lessonKey && (
            <button
              type="button"
              onClick={() => go({ view: "lesson", id: j.lessonKey! })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-[11px] font-extrabold text-white transition-colors hover:bg-brand-700"
            >
              <BookOpenCheck className="size-3.5" />
              الدرس التفاعلي المقابل
            </button>
          )}
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-xl border border-ink-900/10 bg-white px-3.5 py-2 text-[11px] font-extrabold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700">
            <Printer className="size-3.5" />
            طباعة الجذاذة
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-brand-900/10 ring-1 ring-ink-900/10">
        {/* البطاقة التقنية العليا */}
        <div className="grid gap-3 p-4 sm:grid-cols-[1fr_1.4fr_1fr] sm:p-5">
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

          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: C.head }}>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white font-display text-sm font-black" style={{ color: C.head }}>
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

        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          {/* الكفايات */}
          <table className="w-full border-collapse">
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
                  <Th dark>التدبير الديداكتيكي (أنشطة الأستاذ والمتعلم)</Th>
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
                      <Td bg={C.gold} className="text-center font-extrabold">
                        {s.supports.length > 0 ? <Bullets items={s.supports} /> : <span className="text-ink-400">—</span>}
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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3" style={{ background: C.gold, border: `1px solid ${C.goldLine}` }}>
            <p className="text-[11px] font-extrabold text-ink-900">
              إنجاز: {TEACHER_NAME} — {TEACHER_SCHOOL}
            </p>
            <p className="inline-flex items-center gap-1.5 text-[10px] font-bold text-ink-500">
              <Clock3 className="size-3" aria-hidden="true" />
              {j.duration} · المرجع: {j.book}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" data-no-print>
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-700">
          <Printer className="size-4" />
          طباعة الجذاذة
        </button>
        {j.lessonKey && (
          <button
            type="button"
            onClick={() => go({ view: "lesson", id: j.lessonKey! })}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-xs font-extrabold text-brand-700 transition-all hover:-translate-y-0.5 hover:border-brand-400"
          >
            <BookOpenCheck className="size-4" />
            الدرس التفاعلي المقابل ←
          </button>
        )}
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
  const openJadada = openId ? getJadada(openId) : undefined;
  if (openJadada) return <FichePage j={openJadada} onBack={closeFiche} go={go} />;

  const levelLabel = JADADA_LEVELS.find((l) => l.id === activeLevel)?.label ?? "";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6">
      <header className="animate-fade-in">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-extrabold text-brand-700">
          <NotebookPen className="size-3.5" aria-hidden="true" />
          وثائق الأستاذ
        </span>
        <h1 className="mt-3 font-display text-2xl font-black text-ink-900 sm:text-3xl">
          {activeLevel === "tc" ? "جذاذات الجذع المشترك العلمي" : `جذاذات ${levelLabel}`}
        </h1>
        <p className="mt-1 text-xs font-extrabold text-brand-700">
          المادة: الاجتماعيات – التاريخ والجغرافيا · المستوى: {levelLabel} – الثانوي التأهيلي بالمغرب
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
          جذاذات الدروس بالصيغة الرسمية: البطاقة التقنية، الكفاية المركزية والمحورية، الأهداف معرفيًا ومهاريًا ووجدانيًا،
          جدول مراحل إنجاز الدرس (التدبير الديداكتيكي، الدعائم، المتن) مع التقويمات المرحلية والإجمالية — من إنجاز{" "}
          <span className="font-extrabold text-ink-700">{TEACHER_NAME}</span>، معروضة في صفحة منظمة سهلة الطباعة والاستعمال داخل القسم.
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
                {subject} — {levelLabel}
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
    </div>
  );
}

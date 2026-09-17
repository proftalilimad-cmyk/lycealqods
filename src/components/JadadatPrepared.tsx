import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Hash,
  Info,
  Layers,
  LayoutDashboard,
  Library,
  NotebookPen,
  Printer,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import CopyLinkButton from "./CopyLinkButton";
import { D } from "./Jadadat";
import { normalizeArabic } from "../lib/arabic";
import {
  PREPARED_META,
  getPreparedCatalog,
  getPreparedFiche,
  getPreparedStats,
  getPreparedUnits,
  preparedToHtml,
  type PreparedFiche,
} from "../lib/preparedJadadat";
import type { Route } from "../routes";

/* ============================================================
   الجذاذات المُعدَّة — الجذع المشترك العلمي
   ============================================================
   قسم مستقل يعرض جذاذات مُركَّبة في زمن التشغيل من:
     • مضامين دروس الموقع المنشورة (25 درسًا كاملًا)؛
     • الصياغة الديداكتيكية للتوجيهات التربوية ومنهجية المادة.
   وثيقة الجذاذة تُعرض بهوية القسم البني/البيج نفسها، وتُطبع أو تُحمَّل.
   لا يمسّ هذا القسم جذاذات الأستاذ الأصلية ولا مكتبة ملفاته.
   ============================================================ */

const SUBJECTS = ["التاريخ", "الجغرافيا"] as const;
const CYCLES = ["الدورة الأولى", "الدورة الثانية"] as const;
type SortKey = "order" | "title" | "subject" | "cycle" | "segments" | "quiz";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "order", label: "الترتيب الدراسي" },
  { key: "title", label: "اسم الدرس" },
  { key: "subject", label: "المادة" },
  { key: "cycle", label: "الدورة" },
  { key: "segments", label: "عدد المقاطع" },
  { key: "quiz", label: "عدد أسئلة التقويم" },
];

const slug = (s: string) =>
  s
    .replace(/[()[\]{}«»"'.,;:!?؟،ـ]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/** تنزيل وثيقة الجذاذة (HTML بهوية القسم: تُطبع أو تُحفظ PDF من المتصفح) */
function downloadPrepared(p: PreparedFiche) {
  if (typeof document === "undefined") return;
  const html = preparedToHtml(p);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `جذاذة-مُعدَّة-${p.fiche.number}-${p.fiche.subject}-${slug(p.fiche.title)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const arabicCompare = (a: string, b: string) => a.localeCompare(b, "ar");

/* ============================================================
   عناصر مشتركة
   ============================================================ */
function Chip({ children, tone = "brand" }: { children: React.ReactNode; tone?: "brand" | "gold" | "ink" | "rose" | "sky" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    gold: "bg-gold-100 text-gold-700",
    ink: "bg-paper-warm text-ink-600",
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-700",
  } as const;
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${tones[tone]}`}>{children}</span>;
}

/** بطاقة مصدر/مرجع (التوجيهات التربوية، ديداكتيك المادة، دروس الموقع…) */
function SourceCard({ name, detail, url, go }: { name: string; detail: string; url: string; go: (r: Route) => void }) {
  const internal = url.startsWith("#/");
  const body = (
    <>
      <p className="text-[11.5px] font-extrabold text-ink-900">{name}</p>
      <p className="mt-1 text-[10.5px] leading-relaxed text-ink-500">{detail}</p>
    </>
  );
  if (internal) {
    const route: Route = url.startsWith("#/lessons") ? { view: "lessons", level: "tc" } : { view: "jadadatPrepared" };
    return (
      <button type="button" onClick={() => go(route)} className="block w-full rounded-xl border border-ink-900/8 bg-white p-3 text-start transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
        {body}
      </button>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block rounded-xl border border-ink-900/8 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
      {body}
      <p className="mt-1.5 inline-flex items-center gap-1 text-[9.5px] font-bold text-brand-600">
        <ExternalLink className="size-3" aria-hidden="true" />
        مرجع خارجي
      </p>
    </a>
  );
}

/* ============================================================
   بطاقة الجذاذة المُعدَّة
   ============================================================ */
function PreparedCard({ p, go }: { p: PreparedFiche; go: (r: Route) => void }) {
  const { fiche, extra } = p;
  const btn = "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-extrabold transition-all sm:flex-none";
  return (
    <article className="flex h-full flex-col rounded-2xl border border-ink-900/8 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-[0_20px_45px_-24px_rgba(12,124,91,0.45)]">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 font-display text-sm font-black text-brand-700">{fiche.number}</span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5">
            <Chip>{fiche.subject}</Chip>
            <Chip tone="gold">{fiche.cycle}</Chip>
            <Chip tone="ink">
              <span className="inline-flex items-center gap-1">
                <Hash className="size-2.5" aria-hidden="true" />
                الدرس {Number(fiche.number)}
              </span>
            </Chip>
            <Chip tone="brand">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="size-2.5" aria-hidden="true" />
                مُعدَّة
              </span>
            </Chip>
            {extra.tag && <Chip tone="rose">{extra.tag}</Chip>}
          </p>
          <h3 className="mt-1.5 font-display text-[13.5px] font-black leading-snug text-ink-900">{fiche.title}</h3>
          <p className="mt-0.5 text-[10px] font-semibold text-ink-500">
            مجزوءة {fiche.module} · {fiche.unitTitle}
          </p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10.5px]">
        {[
          ["عدد الحصص", extra.sessionsCount ? `${extra.sessionsCount} حصص` : "حصتان (مقترح)"],
          ["الحيز الزمني", `${extra.totalMinutes} دقيقة`],
          ["المقاطع", `${fiche.segments.length} مقطعًا`],
          ["المفاهيم", `${extra.glossary.length} مفاهيم`],
          ["أسئلة التقويم", `${extra.quiz.length} أسئلة`],
          ["الملفات الأصلية", extra.originalFiles.length ? `${extra.originalFiles.length} ملفًا` : "لا ملف مستقل"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <dt className="font-extrabold text-ink-500">{k}:</dt>
            <dd className="font-black text-ink-900">{v}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 line-clamp-3 text-[11px] leading-relaxed text-ink-500">{PREPARED_META.provenance.content}</p>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-900/6 pt-3.5" data-no-print>
        <button type="button" onClick={() => go({ view: "jadadatPrepared", open: fiche.id })} className={`${btn} border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-400 hover:bg-brand-100`}>
          <NotebookPen className="size-3.5" aria-hidden="true" />
          فتح الجذاذة
        </button>
        <button type="button" onClick={() => go({ view: "lesson", id: extra.lessonKey })} className={`${btn} border-ink-900/10 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-700`}>
          <BookOpenCheck className="size-3.5" aria-hidden="true" />
          درس الموقع
        </button>
        <button type="button" onClick={() => downloadPrepared(p)} className={`${btn} border-gold-200 bg-gold-100/60 text-gold-700 hover:border-gold-300 hover:bg-gold-100`}>
          <Download className="size-3.5" aria-hidden="true" />
          تحميل الوثيقة
        </button>
        {extra.originalFiles.length > 0 && (
          <button type="button" onClick={() => go({ view: "jadadatLib", open: fiche.id })} className={`${btn} border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:bg-rose-100`}>
            <FileText className="size-3.5" aria-hidden="true" />
            ملفاتها ({extra.originalFiles.length})
          </button>
        )}
      </div>
    </article>
  );
}

/* ============================================================
   وثيقة الجذاذة (صفحة مستقلة، بهوية القسم البني/البيج)
   ============================================================ */
function DocBlock({ title, icon: Icon, children }: { title: string; icon: typeof Info; children: React.ReactNode }) {
  return (
    <section className="mt-4 overflow-hidden rounded-xl border" style={{ borderColor: D.line }}>
      <h2 className="flex items-center gap-2 px-3.5 py-2 font-display text-[12.5px] font-extrabold text-white" style={{ background: D.head }}>
        <Icon className="size-4" aria-hidden="true" />
        {title}
      </h2>
      <div className="p-3.5" style={{ background: "#fffdf7" }}>
        {children}
      </div>
    </section>
  );
}

const Th = ({ children, w }: { children: React.ReactNode; w?: string }) => (
  <th className={`border px-2.5 py-2 text-start text-[10.5px] font-extrabold text-white ${w ?? ""}`} style={{ background: D.nest, borderColor: D.line }}>
    {children}
  </th>
);
const Td = ({ children }: { children: React.ReactNode }) => (
  <td className="border px-2.5 py-2 align-top text-[10.5px] font-semibold leading-relaxed text-ink-900" style={{ background: D.beigeLight, borderColor: D.line }}>
    {children}
  </td>
);

function PreparedDocument({ p, onBack, go }: { p: PreparedFiche; onBack: () => void; go: (r: Route) => void }) {
  const { fiche, extra, lesson } = p;
  const btn = "inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-white px-3.5 py-2 text-[11px] font-extrabold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700";

  useEffect(() => {
    document.title = `جذاذة مُعدَّة ${fiche.number} — ${fiche.title} | ${PREPARED_META.title}`;
    return () => {
      document.title = "فضاء الاجتماعيات — الأستاذ عماد طليل | ثانوية القدس، القنيطرة";
    };
  }, [fiche.number, fiche.title]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6">
      {/* ترويسة الطباعة */}
      <div className="jadada-print-only mb-3 border-b pb-2" style={{ borderColor: D.line }}>
        <p className="font-display text-base font-black" style={{ color: D.head }}>
          {PREPARED_META.title} — {PREPARED_META.subtitle}
        </p>
        <p className="text-[11px] font-bold text-ink-700">
          {PREPARED_META.authorLabel} — {PREPARED_META.school} · {fiche.subject} · {fiche.cycle} · الجذاذة {fiche.number}: {fiche.title}
        </p>
      </div>

      {/* شريط الأدوات */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2" data-no-print>
        <button type="button" onClick={onBack} className={btn}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          رجوع إلى لائحة الجذاذات المُعدَّة
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3.5 py-2 text-[11px] font-extrabold text-white transition-colors hover:bg-brand-700">
            <Printer className="size-3.5" aria-hidden="true" />
            طباعة / حفظ PDF
          </button>
          <button type="button" onClick={() => downloadPrepared(p)} className={btn}>
            <Download className="size-3.5" aria-hidden="true" />
            تحميل وثيقة الجذاذة
          </button>
          <button type="button" onClick={() => go({ view: "lesson", id: extra.lessonKey })} className={btn}>
            <BookOpenCheck className="size-3.5" aria-hidden="true" />
            فتح درس الموقع
          </button>
          <button type="button" onClick={() => go({ view: "jadadat", level: "tc", open: fiche.id })} className={btn}>
            <Library className="size-3.5" aria-hidden="true" />
            جذاذتك الأصلية
          </button>
          {extra.originalFiles.length > 0 && (
            <button type="button" onClick={() => go({ view: "jadadatLib", open: fiche.id })} className={btn}>
              <FileText className="size-3.5" aria-hidden="true" />
              ملفاتها ({extra.originalFiles.length})
            </button>
          )}
          <button type="button" onClick={() => go({ view: "dashboard", tab: "jadadat" })} className={btn}>
            <LayoutDashboard className="size-3.5" aria-hidden="true" />
            لوحة التتبع
          </button>
          <CopyLinkButton route={{ view: "jadadatPrepared", open: fiche.id }} label="نسخ الرابط" ariaLabel={`نسخ رابط الجذاذة المُعدَّة ${fiche.title}`} className="px-3.5 py-2 text-[11px]" />
        </div>
      </div>

      {/* شفافية المصدر */}
      <p className="mb-4 flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-[10.5px] font-semibold leading-relaxed" style={{ borderColor: D.line, background: D.beige, color: D.ink }} data-no-print>
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>{fiche.sourceNote}</span>
      </p>

      {/* رأس الوثيقة */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-brand-900/10 ring-1 ring-ink-900/10">
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: D.head }}>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white font-display text-sm font-black" style={{ color: D.head }}>
              {fiche.number}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold text-white/80">
                الجذاذة {fiche.number} · {fiche.subject} · {fiche.cycle}
              </p>
              <p className="font-display text-[13.5px] font-extrabold leading-snug text-white">{fiche.title}</p>
            </div>
          </div>

          {/* بطاقة التعريف */}
          <table className="jadada-table mt-3 w-full border-collapse">
            <tbody>
              <tr>
                <Th w="w-28">المستوى</Th>
                <Td>{PREPARED_META.level} ({fiche.track})</Td>
                <Th w="w-24">المادة</Th>
                <Td>{fiche.subject}</Td>
              </tr>
              <tr>
                <Th>الدورة</Th>
                <Td>{fiche.cycle}</Td>
                <Th>المجزوءة / الوحدة</Th>
                <Td>
                  {fiche.module} — {fiche.unitTitle}
                </Td>
              </tr>
              <tr>
                <Th>عدد الحصص</Th>
                <Td>
                  {extra.sessionsCount ? `${extra.sessionsCount} حصص` : "حصتان (توزيع مقترح)"}
                  {extra.sessionsSource && <span className="ms-1 text-[9.5px] font-bold text-ink-500">({extra.sessionsSource})</span>}
                </Td>
                <Th>الحيز الزمني</Th>
                <Td>
                  {extra.totalMinutes} دقيقة ({extra.stageTiming.map((t) => `${t.minutes}د`).join(" + ")})
                </Td>
              </tr>
              <tr>
                <Th>الكتاب المعتمد</Th>
                <Td>{fiche.book}</Td>
                <Th>حالة الجذاذة</Th>
                <Td>مُعدَّة وفق التوجيهات التربوية — لا تُعوّض الوثيقة الأصلية</Td>
              </tr>
            </tbody>
          </table>

          {/* الكفايات */}
          <DocBlock title="الكفايات المستهدفة" icon={Target}>
            <div className="space-y-2 text-[11px] font-semibold leading-relaxed text-ink-900">
              <p>
                <span className="font-extrabold" style={{ color: D.head }}>
                  الكفاية المركزية/المجالية:{" "}
                </span>
                {fiche.kifayaMarkaziya}
              </p>
              <p>
                <span className="font-extrabold" style={{ color: D.head }}>
                  الكفاية المحورية للوحدة:{" "}
                </span>
                {fiche.kifayaMihwariya}
              </p>
            </div>
          </DocBlock>

          {/* الأهداف */}
          <DocBlock title="أهداف التعلم" icon={CheckCircle2}>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { t: "أهداف معرفية (من درس الموقع)", items: fiche.goals.cognitive },
                { t: "أهداف منهجية/مهارية (مرجعية المادة)", items: fiche.goals.skills },
                { t: "القيم والمواقف المستهدفة", items: fiche.goals.affective },
              ].map((g) => (
                <div key={g.t} className="rounded-lg border p-2.5" style={{ borderColor: D.line, background: D.beigeLight }}>
                  <p className="text-[10.5px] font-extrabold" style={{ color: D.nest }}>
                    {g.t}
                  </p>
                  <ul className="mt-1.5 space-y-1 text-[10.5px] font-semibold leading-relaxed text-ink-800">
                    {g.items.map((x) => (
                      <li key={x}>• {x}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </DocBlock>

          {/* الإشكالية والمفاهيم */}
          <DocBlock title="الإشكالية والمفاهيم والمصطلحات" icon={Sparkles}>
            <p className="rounded-lg border px-3 py-2 text-[11.5px] font-extrabold leading-relaxed" style={{ borderColor: D.line, background: D.beige, color: D.ink }}>
              {fiche.problematic}
            </p>
            {extra.glossary.length > 0 && (
              <table className="jadada-table mt-3 w-full border-collapse">
                <thead>
                  <tr>
                    <Th w="w-40">المفهوم / المصطلح</Th>
                    <Th>دلالته كما وردت في درس الموقع</Th>
                  </tr>
                </thead>
                <tbody>
                  {extra.glossary.map((g) => (
                    <tr key={g.term}>
                      <Td>
                        <span className="font-extrabold" style={{ color: D.nest }}>
                          {g.term}
                        </span>
                      </Td>
                      <Td>{g.def}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </DocBlock>

          {/* الضبط الزمني */}
          {extra.timeline.length > 0 && (
            <DocBlock title="الضبط الزمني (كرونولوجيا الدرس)" icon={CalendarDays}>
              <ul className="space-y-1 text-[10.5px] font-semibold leading-relaxed text-ink-800">
                {extra.timeline.map((t, i) => (
                  <li key={`${t.date}-${i}`} className="flex flex-wrap gap-2">
                    <span className="rounded-md px-2 py-0.5 font-extrabold text-white" style={{ background: D.nest }}>
                      {t.date}
                    </span>
                    <span>{t.event}</span>
                  </li>
                ))}
              </ul>
            </DocBlock>
          )}

          {/* مراحل إنجاز الدرس — قلب الجذاذة */}
          <DocBlock title="مراحل إنجاز الدرس: الأهداف، التدبير الديداكتيكي، الدعامات والمتن" icon={Layers}>
            <div className="overflow-x-auto">
              <table className="jadada-table w-full border-collapse">
                <thead>
                  <tr>
                    <Th w="w-44">مراحل إنجاز الدرس</Th>
                    <Th w="w-52">أهداف التعلم المرتبطة بالنشاط</Th>
                    <Th w="w-64">التدبير الديداكتيكي (أنشطة الأستاذ والمتعلم)</Th>
                    <Th w="w-52">الدعامات الديداكتيكية</Th>
                    <Th>المتن (مضامين منقولة من درس الموقع)</Th>
                  </tr>
                </thead>
                <tbody>
                  {fiche.segments.map((s) => (
                    <tr key={s.phase} className="align-top">
                      <Td>
                        <span className="inline-block rounded-md px-2 py-1 text-[10px] font-extrabold text-white" style={{ background: D.head }}>
                          {s.phase}
                        </span>
                      </Td>
                      <Td>
                        {s.objectives.map((o) => (
                          <p key={o}>• {o}</p>
                        ))}
                      </Td>
                      <Td>
                        {s.management.map((m) => (
                          <p key={m} className={m.startsWith("المتعلم") ? "font-extrabold" : ""}>
                            {m}
                          </p>
                        ))}
                      </Td>
                      <Td>
                        {s.supports.map((sp) => (
                          <p key={sp}>– {sp}</p>
                        ))}
                      </Td>
                      <Td>
                        {s.content.map((c, i) => (
                          <p key={`${i}-${c.slice(0, 24)}`} className="mb-1 last:mb-0">
                            {c}
                          </p>
                        ))}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DocBlock>

          {/* وثائق الاشتغال */}
          {extra.docs.length > 0 && (
            <DocBlock title="وثائق الاشتغال بأسئلتها وعناصر إجابتها" icon={FileText}>
              <div className="space-y-3">
                {extra.docs.map((d) => (
                  <div key={d.label} className="rounded-lg border p-3" style={{ borderColor: D.line, background: D.beigeLight }}>
                    <p className="text-[11px] font-extrabold" style={{ color: D.nest }}>
                      {d.label}
                    </p>
                    <p className="mt-1 text-[10.5px] font-semibold leading-relaxed text-ink-800">{d.text}</p>
                    <ul className="mt-2 space-y-1.5">
                      {d.questions.map((q) => (
                        <li key={q.q} className="rounded-md bg-white p-2 text-[10.5px] font-semibold ring-1" style={{ borderColor: D.line }}>
                          <p className="font-extrabold text-ink-900">
                            {q.q} <span className="text-[9.5px] text-ink-500">({q.pts} ن)</span>
                          </p>
                          <p className="mt-0.5 text-ink-700">
                            <span className="font-extrabold" style={{ color: D.head }}>
                              عنصر الإجابة:{" "}
                            </span>
                            {q.answer}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </DocBlock>
          )}

          {/* الخلاصة */}
          {fiche.conclusion && fiche.conclusion.length > 0 && (
            <DocBlock title="الخلاصة والاستنتاج" icon={NotebookPen}>
              <ul className="space-y-1.5 text-[11px] font-semibold leading-relaxed text-ink-900">
                {fiche.conclusion.map((c) => (
                  <li key={c} className="rounded-md px-2.5 py-1.5" style={{ background: D.beigeLight }}>
                    {c}
                  </li>
                ))}
              </ul>
              {extra.schema && (
                <div className="mt-3 rounded-lg border p-2.5" style={{ borderColor: D.line }}>
                  <p className="text-[10.5px] font-extrabold" style={{ color: D.nest }}>
                    الخطاطة التركيبية — {extra.schema.title ?? "خطاطة الدرس"}
                  </p>
                  <ul className="mt-1.5 space-y-1 text-[10.5px] font-semibold text-ink-800">
                    {extra.schema.rows.map((r) => (
                      <li key={r.label}>
                        <span className="font-extrabold">{r.label}: </span>
                        {r.value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </DocBlock>
          )}

          {/* التقويم */}
          <DocBlock title="التقويم الإجمالي والدعم" icon={Target}>
            <ol className="space-y-2.5">
              {extra.quiz.map((q, i) => (
                <li key={q.q} className="rounded-lg border p-2.5" style={{ borderColor: D.line, background: D.beigeLight }}>
                  <p className="text-[11px] font-extrabold text-ink-900">
                    {i + 1}) {q.q}
                  </p>
                  <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
                    {q.options.map((o, oi) => (
                      <li
                        key={o}
                        className={`flex items-start gap-1.5 rounded-md px-2 py-1 text-[10.5px] font-semibold ${oi === q.answer ? "bg-brand-50 text-brand-800 ring-1 ring-brand-200" : "bg-white text-ink-700"}`}
                      >
                        {oi === q.answer && <CheckCircle2 className="mt-0.5 size-3 shrink-0" aria-hidden="true" />}
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-[10px] font-semibold text-ink-500">
                    <span className="font-extrabold" style={{ color: D.head }}>
                      التعليل:{" "}
                    </span>
                    {q.why}
                  </p>
                </li>
              ))}
            </ol>
            {extra.examTips.length > 0 && (
              <div className="mt-3 rounded-lg border p-2.5" style={{ borderColor: D.line, background: D.beige }}>
                <p className="text-[10.5px] font-extrabold" style={{ color: D.ink }}>
                  توجيهات منهجية للوضعيات الاختبارية
                </p>
                <ul className="mt-1 space-y-1 text-[10.5px] font-semibold text-ink-800">
                  {extra.examTips.map((t) => (
                    <li key={t}>• {t}</li>
                  ))}
                </ul>
              </div>
            )}
          </DocBlock>

          {/* الوضعية التطبيقية */}
          {extra.application && (
            <DocBlock title={`وضعية تطبيقية منهجية: ${extra.application.title} (${extra.application.duration})`} icon={BookOpenCheck}>
              <p className="text-[11px] font-semibold leading-relaxed text-ink-900">{extra.application.prompt}</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-2.5" style={{ borderColor: D.line, background: D.beigeLight }}>
                  <p className="text-[10.5px] font-extrabold" style={{ color: D.nest }}>
                    خطوات الإنجاز
                  </p>
                  <ul className="mt-1 space-y-1 text-[10.5px] font-semibold text-ink-800">
                    {extra.application.guide.map((g) => (
                      <li key={g}>• {g}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border p-2.5" style={{ borderColor: D.line, background: "#fff" }}>
                  <p className="text-[10.5px] font-extrabold" style={{ color: D.nest }}>
                    عناصر الإنتاج المنتظر
                  </p>
                  <ul className="mt-1 space-y-1 text-[10.5px] font-semibold text-ink-800">
                    {extra.application.model.map((m) => (
                      <li key={m}>• {m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </DocBlock>
          )}

          {/* الملفات الأصلية المرتبطة */}
          {extra.originalFiles.length > 0 && (
            <DocBlock title={`وثائق الأستاذ الأصلية المرتبطة بالدرس (${extra.originalFiles.length})`} icon={FileText}>
              <ul className="divide-y" style={{ borderColor: D.line }}>
                {extra.originalFiles.map((f) => (
                  <li key={f.url} className="flex flex-wrap items-center gap-2 py-2 text-[10.5px] font-semibold text-ink-800">
                    <span className="rounded-md px-2 py-0.5 text-[9.5px] font-extrabold text-white" style={{ background: f.kind === "pdf" ? "#b4232a" : D.nest }}>
                      {f.kind === "pdf" ? "PDF" : f.kind === "doc" ? "Word 97" : "Word"}
                    </span>
                    <span className="min-w-0 flex-1 truncate" dir="rtl">
                      {f.name}
                    </span>
                    <span className="text-[9.5px] text-ink-500">{f.folder}</span>
                    <button type="button" onClick={() => go({ view: "jadadatLib", open: fiche.id })} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-extrabold hover:border-brand-300" style={{ borderColor: D.line, color: D.head }} data-no-print>
                      <ExternalLink className="size-3" aria-hidden="true" />
                      معاينة/تحميل
                    </button>
                  </li>
                ))}
              </ul>
            </DocBlock>
          )}

          {/* المراجع */}
          {fiche.references && fiche.references.length > 0 && (
            <DocBlock title="المراجع ومعطيات المصدر" icon={Library}>
              <ul className="space-y-1 text-[10.5px] font-semibold leading-relaxed text-ink-800">
                {fiche.references.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </DocBlock>
          )}

          {/* التوقيع */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-[11.5px] font-extrabold" style={{ borderColor: D.line, background: D.beige, color: D.ink }}>
            <span>
              {PREPARED_META.authorLabel} — {PREPARED_META.school}
            </span>
            <span className="text-[10.5px] font-bold text-ink-600">
              {fiche.duration} · {fiche.book}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[10.5px] leading-relaxed text-ink-500" data-no-print>
        مضامين هذه الجذاذة من درس الموقع «{lesson.title}»؛ والصياغة الديداكتيكية (الكفايات، المراحل، التدبير، الدعامات، الحيز الزمني) وفق التوجيهات التربوية والبرامج الخاصة بتدريس مادة الاجتماعيات بالتعليم الثانوي التأهيلي وديداكتيك المادة. راجع لائحة المراجع داخل الوثيقة.
      </p>
    </div>
  );
}

/* ============================================================
   الصفحة الرئيسية للقسم
   ============================================================ */
interface Props {
  open?: string;
  go: (r: Route) => void;
}

export default function JadadatPrepared({ open, go }: Props) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<"all" | (typeof SUBJECTS)[number]>("all");
  const [cycle, setCycle] = useState<"all" | (typeof CYCLES)[number]>("all");
  const [unit, setUnit] = useState("all");
  const [onlyFiles, setOnlyFiles] = useState(false);
  const [sort, setSort] = useState<SortKey>("order");
  const [showSources, setShowSources] = useState(false);

  const catalog = useMemo(() => getPreparedCatalog(), []);
  const stats = useMemo(() => getPreparedStats(), []);
  const units = useMemo(() => getPreparedUnits(), []);
  const order = useMemo(() => new Map(catalog.map((p, i) => [p.fiche.id, i])), [catalog]);

  const current = open ? getPreparedFiche(open) : undefined;
  const notFound = Boolean(open) && !current;

  useEffect(() => {
    if (!open) document.title = `${PREPARED_META.title} | فضاء الاجتماعيات — الأستاذ عماد طليل`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [open]);

  const filtered = useMemo(() => {
    const q = normalizeArabic(query);
    const list = catalog.filter((p) => {
      if (subject !== "all" && p.fiche.subject !== subject) return false;
      if (cycle !== "all" && p.fiche.cycle !== cycle) return false;
      if (unit !== "all" && p.fiche.unitId !== unit) return false;
      if (onlyFiles && p.extra.originalFiles.length === 0) return false;
      if (q.length >= 2) {
        const hay = normalizeArabic(
          [
            p.fiche.title,
            p.fiche.subject,
            p.fiche.cycle,
            p.fiche.unitTitle,
            p.extra.lessonTitle,
            p.fiche.problematic ?? "",
            p.extra.glossary.map((g) => `${g.term} ${g.def}`).join(" "),
            p.extra.keywords.join(" "),
            p.fiche.goals.cognitive.join(" "),
            `الجذاذة ${p.fiche.number} الدرس ${Number(p.fiche.number)}`,
            p.extra.originalFiles.map((f) => f.name).join(" "),
            PREPARED_META.level,
            p.fiche.book,
          ].join(" "),
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sorted = [...list];
    switch (sort) {
      case "title":
        sorted.sort((a, b) => arabicCompare(a.fiche.title, b.fiche.title));
        break;
      case "subject":
        sorted.sort((a, b) => (a.fiche.subject === b.fiche.subject ? order.get(a.fiche.id)! - order.get(b.fiche.id)! : a.fiche.subject === "التاريخ" ? -1 : 1));
        break;
      case "cycle":
        sorted.sort((a, b) => (a.fiche.cycle === b.fiche.cycle ? order.get(a.fiche.id)! - order.get(b.fiche.id)! : a.fiche.cycle === "الدورة الأولى" ? -1 : 1));
        break;
      case "segments":
        sorted.sort((a, b) => b.fiche.segments.length - a.fiche.segments.length || order.get(a.fiche.id)! - order.get(b.fiche.id)!);
        break;
      case "quiz":
        sorted.sort((a, b) => b.extra.quiz.length - a.extra.quiz.length || order.get(a.fiche.id)! - order.get(b.fiche.id)!);
        break;
      default:
        sorted.sort((a, b) => order.get(a.fiche.id)! - order.get(b.fiche.id)!);
    }
    return sorted;
  }, [catalog, query, subject, cycle, unit, onlyFiles, sort, order]);

  const grouped = SUBJECTS.flatMap((s) =>
    CYCLES.flatMap((c) =>
      units
        .filter((u) => u.subject === s && u.cycle === c)
        .map((u) => ({ unit: u, items: filtered.filter((p) => p.fiche.unitId === u.unitId) }))
        .filter((g) => g.items.length > 0),
    ),
  );

  /* ------------------------- وثيقة جذاذة ------------------------- */
  if (current) return <PreparedDocument p={current} onBack={() => go({ view: "jadadatPrepared" })} go={go} />;

  const sel = "rounded-xl border border-ink-900/10 bg-white px-3 py-2.5 text-xs font-bold text-ink-700 outline-none transition-colors focus:border-brand-400";

  return (
    <section className="relative overflow-hidden pt-32 md:pt-36">
      <div className="pointer-events-none absolute inset-0 pattern-zellige-dark opacity-30" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        {/* رأس القسم */}
        <div className="rounded-3xl border border-ink-900/8 bg-white/92 p-5 shadow-xl shadow-brand-900/10 backdrop-blur sm:p-7">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[10.5px] font-extrabold text-brand-700">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {PREPARED_META.subtitle}
          </p>
          <h1 className="mt-3 font-display text-2xl font-black text-ink-900 sm:text-[32px]">{PREPARED_META.title}</h1>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-ink-600">{PREPARED_META.description}</p>

          <div className="mt-4 grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-4" style={{ borderColor: D.line, background: D.line }}>
            {[
              { k: "جذاذات مُعدَّة", v: `${stats.total}`, s: `${stats.history} تاريخ · ${stats.geography} جغرافيا` },
              { k: "مقاطع وأنشطة", v: `${stats.segments}`, s: `في ${stats.units} وحدات ومجزوءات` },
              { k: "مفاهيم ومصطلحات", v: `${stats.concepts}`, s: "من معجم دروس الموقع" },
              { k: "أسئلة تقويم", v: `${stats.quiz}`, s: "مع عناصر الإجابة والتعليل" },
            ].map((x) => (
              <div key={x.k} className="bg-white p-3.5">
                <p className="text-[10.5px] font-extrabold text-ink-500">{x.k}</p>
                <p className="font-display text-xl font-black" style={{ color: D.head }}>
                  {x.v}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold text-ink-500">{x.s}</p>
              </div>
            ))}
          </div>

          {/* شفافية المصدر */}
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              { t: "المضامين", d: PREPARED_META.provenance.content },
              { t: "الصياغة الديداكتيكية", d: PREPARED_META.provenance.didactics },
              { t: "جذاذاتك الأصلية", d: PREPARED_META.provenance.originals },
            ].map((x) => (
              <p key={x.t} className="rounded-xl border px-3 py-2 text-[10.5px] font-semibold leading-relaxed" style={{ borderColor: D.line, background: D.beige, color: D.ink }}>
                <span className="font-extrabold">{x.t}: </span>
                {x.d}
              </p>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2" data-no-print>
            <button type="button" onClick={() => setShowSources((v) => !v)} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-xs font-extrabold text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-100">
              <Library className="size-4" aria-hidden="true" />
              {showSources ? "إخفاء المراجع المعتمدة" : `المراجع المعتمدة في الإعداد (${PREPARED_META.sources.length})`}
            </button>
            <button type="button" onClick={() => go({ view: "jadadat", level: "tc" })} className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-white px-4 py-2.5 text-xs font-extrabold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700">
              <NotebookPen className="size-4" aria-hidden="true" />
              جذاذاتك الأصلية (وثائق الأستاذ)
            </button>
            <button type="button" onClick={() => go({ view: "jadadatLib" })} className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-white px-4 py-2.5 text-xs font-extrabold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700">
              <FileText className="size-4" aria-hidden="true" />
              مكتبة الملفات الأصلية (PDF)
            </button>
          </div>

          {showSources && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {PREPARED_META.sources.map((s) => (
                <SourceCard key={s.name} name={s.name} detail={s.detail} url={s.url} go={go} />
              ))}
            </div>
          )}
        </div>

        {notFound && (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-gold-200 bg-gold-100/60 px-4 py-3 text-xs font-extrabold text-gold-700">
            <Info className="size-4" aria-hidden="true" />
            لا توجد جذاذة مُعدَّة بهذا المعرّف ({open}) — تعرض الصفحة اللائحة الكاملة.
          </p>
        )}

        {/* البحث والتصفية */}
        <div className="mt-5 rounded-2xl border border-ink-900/8 bg-white p-4 shadow-lg shadow-brand-900/5" data-no-print>
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-ink-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="🔎 ابحث عن جذاذة مُعدَّة (عنوان الدرس، مفهوم، وحدة، إشكالية...)"
              aria-label="ابحث عن جذاذة مُعدَّة"
              className="w-full rounded-xl border border-ink-900/10 bg-paper-warm/40 py-3 pe-4 ps-10 text-sm font-semibold text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400 focus:bg-white"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="حذف البحث" className="absolute inset-y-0 end-2 my-auto grid size-7 place-items-center rounded-lg text-ink-400 hover:bg-white hover:text-ink-700">
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-[10.5px] font-extrabold text-ink-500">المادة</span>
              <select value={subject} onChange={(e) => setSubject(e.target.value as typeof subject)} className={`${sel} w-full`}>
                <option value="all">الكل</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10.5px] font-extrabold text-ink-500">الدورة</span>
              <select value={cycle} onChange={(e) => setCycle(e.target.value as typeof cycle)} className={`${sel} w-full`}>
                <option value="all">الكل</option>
                {CYCLES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10.5px] font-extrabold text-ink-500">الوحدة / المجزوءة</span>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className={`${sel} w-full`}>
                <option value="all">الكل</option>
                {units.map((u) => (
                  <option key={u.unitId} value={u.unitId}>
                    {u.subject} · {u.cycle} — {u.unitTitle}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10.5px] font-extrabold text-ink-500">ترتيب حسب</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`${sel} w-full`}>
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyFiles((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[11px] font-extrabold transition-colors ${onlyFiles ? "border-brand-400 bg-brand-50 text-brand-700" : "border-ink-900/10 bg-white text-ink-700 hover:border-brand-300"}`}
            >
              <FileText className="size-3.5" aria-hidden="true" />
              لها ملفات أصلية في المكتبة فقط ({stats.withOriginalFiles})
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSubject("all");
                setCycle("all");
                setUnit("all");
                setOnlyFiles(false);
                setSort("order");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-white px-3.5 py-2 text-[11px] font-extrabold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              إعادة الضبط
            </button>
            <span className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-paper-warm px-3 py-1.5 text-[10.5px] font-extrabold text-ink-600">
              <Clock className="size-3" aria-hidden="true" />
              {filtered.length} جذاذة
            </span>
          </div>
        </div>

        {/* اللائحة */}
        {filtered.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-ink-900/8 bg-white px-5 py-10 text-center text-sm font-bold text-ink-500">
            لا جذاذة مُعدَّة تطابق بحثك وتصفيتك. جرّب كلمة أعم (مثل «المناخ» أو «الثورة») أو أعد الضبط.
          </p>
        ) : (
          <div className="mt-6 space-y-7">
            {grouped.map(({ unit: u, items }) => (
              <div key={u.unitId}>
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-ink-900/8 bg-white px-4 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: D.head }}>
                    <Layers className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-[13.5px] font-black text-ink-900">
                      {u.subject} · {u.cycle} — مجزوءة {u.module}: {u.unitTitle}
                    </h2>
                    <p className="mt-0.5 text-[10.5px] font-semibold text-ink-500">
                      {items.length} جذاذة مُعدَّة من أصل {u.count} في الوحدة · الكفاية المحورية ظاهرة داخل كل جذاذة
                    </p>
                  </div>
                  <span className="rounded-full bg-paper-warm px-3 py-1 text-[10px] font-extrabold text-ink-600">{u.subject}</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((p) => (
                    <PreparedCard key={p.fiche.id} p={p} go={go} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* روابط ذات صلة */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3" data-no-print>
          {[
            { t: "دروس الجذع المشترك العلمي", d: "المصدر الكامل لمضامين هذه الجذاذات (25 درسًا)", r: { view: "lessons", level: "tc" } as Route, i: BookOpenCheck },
            { t: "جذاذاتك الأصلية", d: "25 جذاذة من وثائقك: عرض وطباعة وتحميل", r: { view: "jadadat", level: "tc" } as Route, i: NotebookPen },
            { t: "مكتبة ملفات الجذاذات", d: "82 ملفًا أصليًا (32 PDF و50 Word): معاينة وتحميل", r: { view: "jadadatLib" } as Route, i: FileText },
          ].map((x) => (
            <button key={x.t} type="button" onClick={() => go(x.r)} className="rounded-2xl border border-ink-900/8 bg-white p-4 text-start transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
              <x.i className="size-5 text-brand-600" aria-hidden="true" />
              <p className="mt-2 text-[12px] font-extrabold text-ink-900">{x.t}</p>
              <p className="mt-0.5 text-[10.5px] font-semibold text-ink-500">{x.d}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

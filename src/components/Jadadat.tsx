import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Download,
  Hourglass,
  NotebookPen,
  PenLine,
  Printer,
  Search,
  X,
} from "lucide-react";
import {
  JADADA_LEVELS,
  JADADA_STATUS_META,
  SECTION_META,
  TC_SCI_CATALOG,
  TC_SCI_UNITS,
  TEACHER_NAME,
  TEACHER_SCHOOL,
  getCatalogEntry,
  type CatalogEntry,
  type Jadada,
  type JadadaStatus,
} from "../data/jadadat";
import type { Route } from "../routes";

/* ============================================================
   قسم الجذاذات — «جذاذات الجذع المشترك العلمي»
   المادة: الاجتماعيات · المستوى: الجذع المشترك العلمي
   الإطار: الثانوي التأهيلي بالمغرب
   إعداد وإنجاز: الأستاذ عماد طليل

   التنظيم: لائحة رسمية كاملة (13 جذاذة تاريخ + 12 جذاذة جغرافيا)
   مصنّفة حسب المادة then الدورة/الوحدة then رقم الجذاذة، مع بحث،
   وفتح مستقل لكل جذاذة، وطباعة، وتحميل نسخة HTML جاهزة للطباعة.
   المحتوى المعروض هو محتوى الوثائق المُدرجة فقط: كل خانة لم
   تُدرج وثيقتها بعد تبقى معلَّمة «في انتظار الوثيقة الأصلية»
   دون أي تأليف أو تعويض بمحتوى عام.
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

const SUBJECTS = ["التاريخ", "الجغرافيا"] as const;

function Th({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <th
      className="border px-3 py-2 text-start text-[11px] font-extrabold text-white"
      style={{ background: dark ? C.headDark : C.head, borderColor: C.line }}
    >
      {children}
    </th>
  );
}
function Td({ children, bg, className }: { children?: React.ReactNode; bg?: string; className?: string }) {
  return (
    <td
      className={`border px-3 py-2 align-top text-[11px] font-semibold leading-relaxed text-ink-900 ${className ?? ""}`}
      style={{ background: bg ?? "#ffffff", borderColor: C.line }}
    >
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

const STATUS_STYLE: Record<JadadaStatus, { icon: typeof CheckCircle2; chip: string; dot: string }> = {
  original: { icon: CheckCircle2, chip: "bg-brand-600 text-white", dot: "bg-brand-500" },
  model: { icon: PenLine, chip: "bg-gold-100 text-gold-700 ring-1 ring-gold-300", dot: "bg-gold-500" },
  pending: { icon: Hourglass, chip: "bg-paper-warm text-ink-700 ring-1 ring-ink-900/10", dot: "bg-ink-300" },
};

function StatusBadge({ status, compact }: { status: JadadaStatus; compact?: boolean }) {
  const meta = JADADA_STATUS_META[status];
  const s = STATUS_STYLE[status];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold ${s.chip}`}>
      <Icon className="size-3" aria-hidden="true" />
      {compact ? meta.short : meta.label}
    </span>
  );
}

/* ---------- تنزيل الجذاذة كملف HTML مستقل جاهز للطباعة ---------- */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const li = (items: string[]) => items.map((t) => `<li>${esc(t)}</li>`).join("");
function slugify(s: string) {
  return s
    .replace(/[([)\]{}«»"'.,;:!?؟،ـ]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function ficheToHtml(j: Jadada): string {
  const levelLabel = JADADA_LEVELS.find((l) => l.id === j.level)?.label ?? j.level;
  const rows = j.segments
    .map((s) =>
      s.phase.startsWith("تقويم مرحلي")
        ? `<tr>
      <td class="ph" style="background:${C.olive};color:#fff;text-align:center">تقويم مرحلي</td>
      <td colspan="4" style="background:${C.beigeDark}"><ul>${li(s.content)}</ul></td>
    </tr>`
        : `<tr>
      <td class="ph" style="background:${C.beigeDark};text-align:center"><strong>${esc(s.phase)}</strong></td>
      <td>${s.objectives.length ? `<ul>${li(s.objectives)}</ul>` : "—"}</td>
      <td>${s.management.length ? `<ul>${li(s.management)}</ul>` : "—"}</td>
      <td style="background:${C.gold};text-align:center">${s.supports.length ? `<ul>${li(s.supports)}</ul>` : "—"}</td>
      <td>${s.content.length ? `<ul>${li(s.content)}</ul>` : "—"}</td>
    </tr>`,
    )
    .join("\n");

  const opt = (label: string, body: string) =>
    body ? `<div class="block"><h3>${esc(label)}</h3>${body}</div>` : "";

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>جذاذة ${esc(j.number)} — ${esc(j.title)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; background: #f6f8f7; color: #12211b;
         font-family: "Readex Pro", "Cairo", "Noto Naskh Arabic", Tahoma, Arial, sans-serif; }
  .sheet { max-width: 1000px; margin: 0 auto; background: #fff; border: 1px solid ${C.line};
           border-radius: 14px; overflow: hidden; }
  .masthead { background: ${C.head}; color: #fff; padding: 16px 20px; }
  .masthead h1 { margin: 0; font-size: 19px; }
  .masthead p { margin: 6px 0 0; font-size: 12px; opacity: .92; line-height: 1.9; }
  .pad { padding: 18px 20px 22px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { border: 1px solid ${C.line}; padding: 8px 10px; font-size: 12px; vertical-align: top; line-height: 1.85; }
  thead th { background: ${C.headDark}; color: #fff; font-size: 11.5px; }
  ul { margin: 0; padding-inline-start: 16px; }
  li { margin: 2px 0; }
  .k { background: ${C.head}; color: #fff; font-weight: 700; width: 130px; }
  .v { background: ${C.beige}; font-weight: 700; }
  .kf th { background: ${C.olive}; color: #fff; width: 190px; }
  .title-box { display: flex; gap: 12px; align-items: center; background: ${C.head}; color: #fff;
               border-radius: 10px; padding: 12px 14px; margin-top: 12px; }
  .num { flex: 0 0 auto; width: 38px; height: 38px; border-radius: 50%; background: #fff; color: ${C.head};
         display: grid; place-items: center; font-weight: 800; }
  .title-box h2 { margin: 0; font-size: 15px; line-height: 1.6; }
  .title-box small { display: block; font-size: 11px; opacity: .85; margin-bottom: 3px; }
  .block { margin-top: 14px; border: 1px solid ${C.line}; border-radius: 10px; overflow: hidden; }
  .block h3 { margin: 0; padding: 8px 12px; background: ${C.beigeDark}; color: ${C.headDark}; font-size: 12.5px; }
  .block .body { padding: 10px 12px; font-size: 12px; line-height: 1.9; }
  .sign { margin-top: 16px; background: ${C.gold}; border: 1px solid ${C.goldLine}; border-radius: 10px;
          padding: 12px 14px; font-size: 12px; font-weight: 700; display: flex; flex-wrap: wrap;
          gap: 8px; justify-content: space-between; }
  .note { margin-top: 10px; font-size: 11px; color: #4c5b54; line-height: 1.8; }
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { border: none; border-radius: 0; max-width: none; }
    @page { size: A4; margin: 12mm; }
  }
</style>
</head>
<body>
<div class="sheet">
  <div class="masthead">
    <h1>${esc(SECTION_META.title)}</h1>
    <p>المادة: ${esc(SECTION_META.subject)} · المستوى: ${esc(SECTION_META.level)} · الإطار: ${esc(SECTION_META.frame)}<br />
       ${esc(SECTION_META.authorLabel)} — ${esc(TEACHER_SCHOOL)}</p>
  </div>
  <div class="pad">
    <table>
      <tr><th class="k">مادة</th><td class="v">${esc(j.subject)}</td>
          <th class="k">المستوى</th><td class="v">${esc(levelLabel)} ${esc(j.track.replace("مسلك ", ""))}</td></tr>
      <tr><th class="k">الدورة</th><td class="v">${esc(j.cycle)}</td>
          <th class="k">الوحدة/المجزوءة</th><td class="v">${esc(j.unitTitle)} — مجزوءة ${esc(j.module)}</td></tr>
      <tr><th class="k">مدة الإنجاز</th><td class="v">${esc(j.duration)}</td>
          <th class="k">الكتاب المعتمد</th><td class="v">${esc(j.book)}</td></tr>
    </table>

    <div class="title-box">
      <span class="num">${esc(j.number)}</span>
      <div><small>عنوان الدرس</small><h2>${esc(j.title)}</h2></div>
    </div>

    <table class="kf">
      <tr><th>الكفاية المركزية/المجالية :</th><td class="v">${esc(j.kifayaMarkaziya)}</td></tr>
      <tr><th>الكفاية المحورية للوحدة :</th><td class="v">${esc(j.kifayaMihwariya)}</td></tr>
    </table>

    ${opt("الإشكالية", j.problematic ? `<div class="body">${esc(j.problematic)}</div>` : "")}
    ${opt("المفاهيم والمصطلحات", j.concepts && j.concepts.length ? `<div class="body"><ul>${li(j.concepts)}</ul></div>` : "")}

    <table>
      <tr><th class="k">معرفيًا</th><th class="k">مهاريًا</th><th class="k">وجدانيا</th></tr>
      <tr>
        <td class="v"><ul>${li(j.goals.cognitive)}</ul></td>
        <td class="v"><ul>${li(j.goals.skills)}</ul></td>
        <td class="v"><ul>${li(j.goals.affective)}</ul></td>
      </tr>
    </table>

    <table>
      <thead>
        <tr>
          <th>مراحل إنجاز الدرس</th>
          <th>أهداف التعلم المرتبطة بالنشاط</th>
          <th>التدبير الديداكتيكي (أنشطة الأستاذ والمتعلم)</th>
          <th>الدعامات الديداكتيكية</th>
          <th>المتنوع</th>
        </tr>
      </thead>
      <tbody>
${rows}
        <tr>
          <td class="ph" style="background:${C.headDark};color:#fff;text-align:center">تقويم إجمالي</td>
          <td colspan="4" style="background:${C.beige}"><ul>${li(j.taqwimIjmali)}</ul></td>
        </tr>
      </tbody>
    </table>

    ${opt("الخلاصات والاستنتاجات", j.conclusion && j.conclusion.length ? `<div class="body"><ul>${li(j.conclusion)}</ul></div>` : "")}
    ${opt("المراجع والصفحات (الكتاب المدرسي)", j.references && j.references.length ? `<div class="body"><ul>${li(j.references)}</ul></div>` : "")}

    <div class="sign">
      <span>${esc(SECTION_META.authorLabel)} — ${esc(TEACHER_SCHOOL)}</span>
      <span>${esc(j.duration)} · المرجع: ${esc(j.book)}</span>
    </div>
    ${j.sourceNote ? `<p class="note">${esc(j.sourceNote)}</p>` : ""}
  </div>
</div>
</body>
</html>
`;
}

function downloadFiche(j: Jadada) {
  if (typeof document === "undefined") return;
  const html = ficheToHtml(j);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `جذاذة-${j.number}-${slugify(j.title)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* ============================================================
   صفحة الجذاذة (مفتوحة بشكل مستقل) — بالصيغة الرسمية المغربية
   ============================================================ */

function FicheTables({ j }: { j: Jadada }) {
  const levelLabel = JADADA_LEVELS.find((l) => l.id === j.level)?.label ?? j.level;
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-brand-900/10 ring-1 ring-ink-900/10">
      {/* ترويسة الطباعة (تظهر في الورق فقط) */}
      <div className="jadada-print-only border-b px-5 py-3" style={{ borderColor: C.line, background: C.head }}>
        <p className="text-[13px] font-black text-white">{SECTION_META.title}</p>
        <p className="mt-1 text-[10px] font-bold text-white/85">
          المادة: {SECTION_META.subject} · المستوى: {SECTION_META.level} · الإطار: {SECTION_META.frame} ·{" "}
          {SECTION_META.authorLabel} — {TEACHER_SCHOOL}
        </p>
      </div>

      {/* البطاقة التقنية العليا */}
      <div className="grid gap-3 p-4 sm:grid-cols-[1fr_1.4fr_1fr] sm:p-5">
        <table className="w-full border-collapse">
          <tbody>
            {[
              ["مادة", j.subject],
              ["المستوى", `${levelLabel} ${j.track.replace("مسلك ", "")}`],
              ["الدورة", j.cycle],
              ["الوحدة/المجزوءة", `${j.unitTitle} — ${j.module}`],
            ].map(([k, v]) => (
              <tr key={k}>
                <th
                  className="w-28 border px-3 py-2 text-start text-[11px] font-extrabold text-white"
                  style={{ background: C.head, borderColor: C.line }}
                >
                  {k}
                </th>
                <td
                  className="border px-3 py-2 text-[11px] font-extrabold text-ink-900"
                  style={{ background: C.beige, borderColor: C.line }}
                >
                  {v}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: C.head }}>
          <span
            className="grid size-9 shrink-0 place-items-center rounded-full bg-white font-display text-sm font-black"
            style={{ color: C.head }}
          >
            {j.number}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-white/80">
              الجذاذة {j.number} · عنوان الدرس
            </p>
            <p className="font-display text-[13px] font-extrabold leading-snug text-white">{j.title}</p>
          </div>
        </div>

        <table className="w-full border-collapse">
          <tbody>
            {[
              ["مدة الإنجاز", j.duration],
              ["الكتاب المعتمد", j.book],
              ["إعداد وإنجاز", TEACHER_NAME],
            ].map(([k, v]) => (
              <tr key={k}>
                <th
                  className="w-28 border px-3 py-2 text-start text-[11px] font-extrabold text-white"
                  style={{ background: C.head, borderColor: C.line }}
                >
                  {k}
                </th>
                <td
                  className="border px-3 py-2 text-[11px] font-extrabold text-ink-900"
                  style={{ background: C.beige, borderColor: C.line }}
                >
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
              <th
                className="w-44 border px-3 py-2 text-start text-[11px] font-extrabold text-white"
                style={{ background: C.olive, borderColor: C.line }}
              >
                الكفاية المركزية/المجالية :
              </th>
              <td
                className="border px-3 py-2 text-[11px] font-bold leading-relaxed text-ink-900"
                style={{ background: C.beige, borderColor: C.line }}
              >
                {j.kifayaMarkaziya}
              </td>
            </tr>
            <tr>
              <th
                className="border px-3 py-2 text-start text-[11px] font-extrabold text-white"
                style={{ background: C.olive, borderColor: C.line }}
              >
                الكفاية المحورية للوحدة :
              </th>
              <td
                className="border px-3 py-2 text-[11px] font-bold leading-relaxed text-ink-900"
                style={{ background: C.beige, borderColor: C.line }}
              >
                {j.kifayaMihwariya}
              </td>
            </tr>
          </tbody>
        </table>

        {j.problematic && (
          <table className="mt-3 w-full border-collapse">
            <tbody>
              <tr>
                <th
                  className="w-44 border px-3 py-2 text-start text-[11px] font-extrabold text-white"
                  style={{ background: C.headDark, borderColor: C.line }}
                >
                  الإشكالية :
                </th>
                <td
                  className="border px-3 py-2 text-[11px] font-bold leading-relaxed text-ink-900"
                  style={{ background: "#ffffff", borderColor: C.line }}
                >
                  {j.problematic}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {j.concepts && j.concepts.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: C.line }}>
            <p className="px-3 py-2 text-[11px] font-extrabold text-white" style={{ background: C.headDark }}>
              المفاهيم والمصطلحات
            </p>
            <div className="flex flex-wrap gap-1.5 p-3" style={{ background: C.beige }}>
              {j.concepts.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-white px-2.5 py-1 text-[10.5px] font-extrabold text-ink-800 ring-1"
                  style={{ borderColor: C.line, boxShadow: `inset 0 0 0 1px ${C.line}` }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

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
                    <td
                      className="border px-3 py-2 text-center text-[11px] font-extrabold text-white"
                      style={{ background: C.olive, borderColor: C.line }}
                    >
                      تقويم مرحلي
                    </td>
                    <td
                      colSpan={4}
                      className="border px-3 py-2 text-[11px] font-bold leading-relaxed text-ink-900"
                      style={{ background: C.beigeDark, borderColor: C.line }}
                    >
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
                      {s.supports.length > 0 ? <Bullets items={s.supports} /> : <span className="text-ink-500">—</span>}
                    </Td>
                    <Td>
                      <Bullets items={s.content} />
                    </Td>
                  </tr>
                ),
              )}
              <tr>
                <td
                  className="border px-3 py-2 text-center text-[11px] font-extrabold text-white"
                  style={{ background: C.headDark, borderColor: C.line }}
                >
                  تقويم إجمالي
                </td>
                <td
                  colSpan={4}
                  className="border px-3 py-2 text-[11px] font-bold leading-relaxed text-ink-900"
                  style={{ background: C.beige, borderColor: C.line }}
                >
                  <Bullets items={j.taqwimIjmali} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {j.conclusion && j.conclusion.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: C.line }}>
            <p className="px-3 py-2 text-[11px] font-extrabold text-white" style={{ background: C.olive }}>
              الخلاصات والاستنتاجات
            </p>
            <div className="p-3" style={{ background: C.beige }}>
              <Bullets items={j.conclusion} />
            </div>
          </div>
        )}

        {j.references && j.references.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: C.goldLine }}>
            <p className="px-3 py-2 text-[11px] font-extrabold" style={{ background: C.gold, color: C.headDark }}>
              المراجع والصفحات المشار إليها في الكتاب المدرسي
            </p>
            <div className="p-3" style={{ background: "#fffdf7" }}>
              <Bullets items={j.references} />
            </div>
          </div>
        )}

        {/* التوقيع */}
        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3"
          style={{ background: C.gold, border: `1px solid ${C.goldLine}` }}
        >
          <p className="text-[11px] font-extrabold text-ink-900">
            {SECTION_META.authorLabel} — {TEACHER_SCHOOL}
          </p>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold text-ink-500">
            <Clock3 className="size-3" aria-hidden="true" />
            {j.duration} · المرجع: {j.book}
          </p>
        </div>

        {j.sourceNote && <p className="mt-2 text-[10.5px] font-bold leading-relaxed text-ink-500">{j.sourceNote}</p>}
      </div>
    </div>
  );
}

function FichePage({ entry, onBack, go }: { entry: CatalogEntry; onBack: () => void; go: (r: Route) => void }) {
  const { slot, fiche } = entry;
  const btn =
    "inline-flex items-center gap-1.5 rounded-xl border border-ink-900/10 bg-white px-3.5 py-2 text-[11px] font-extrabold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 sm:px-6">
      {/* شريط أدوات الصفحة */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2" data-no-print>
        <button type="button" onClick={onBack} className={btn}>
          ← رجوع إلى لائحة الجذاذات
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {slot.lessonKey && (
            <button
              type="button"
              onClick={() => go({ view: "lesson", id: slot.lessonKey! })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-[11px] font-extrabold text-white transition-colors hover:bg-brand-700"
            >
              <BookOpenCheck className="size-3.5" />
              الدرس التفاعلي المقابل
            </button>
          )}
          {fiche && (
            <button type="button" onClick={() => downloadFiche(fiche)} className={btn}>
              <Download className="size-3.5" />
              تحميل الجذاذة
            </button>
          )}
          {fiche && (
            <button type="button" onClick={() => window.print()} className={btn}>
              <Printer className="size-3.5" />
              طباعة الجذاذة
            </button>
          )}
        </div>
      </div>

      {/* مسار التصنيف */}
      <p className="mb-3 text-[10.5px] font-extrabold text-ink-500" data-no-print>
        {SECTION_META.title} › {slot.subject} › {slot.cycle} — {slot.unitTitle} › الجذاذة {slot.number}
      </p>

      {fiche ? (
        <FicheTables j={fiche} />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-brand-900/10 ring-1 ring-ink-900/10">
          <div className="jadada-print-only border-b px-5 py-3" style={{ borderColor: C.line, background: C.head }}>
            <p className="text-[13px] font-black text-white">{SECTION_META.title}</p>
            <p className="mt-1 text-[10px] font-bold text-white/85">
              المادة: {SECTION_META.subject} · المستوى: {SECTION_META.level} · {SECTION_META.authorLabel}
            </p>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-[1fr_1.4fr_1fr] sm:p-5">
            <table className="w-full border-collapse">
              <tbody>
                {[
                  ["مادة", slot.subject],
                  ["المستوى", SECTION_META.level],
                  ["الدورة", slot.cycle],
                  ["الوحدة/المجزوءة", `${slot.unitTitle} — ${slot.module}`],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <th
                      className="w-28 border px-3 py-2 text-start text-[11px] font-extrabold text-white"
                      style={{ background: C.head, borderColor: C.line }}
                    >
                      {k}
                    </th>
                    <td
                      className="border px-3 py-2 text-[11px] font-extrabold text-ink-900"
                      style={{ background: C.beige, borderColor: C.line }}
                    >
                      {v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: C.head }}>
              <span
                className="grid size-9 shrink-0 place-items-center rounded-full bg-white font-display text-sm font-black"
                style={{ color: C.head }}
              >
                {slot.number}
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-white/80">الجذاذة {slot.number} · عنوان الدرس</p>
                <p className="font-display text-[13px] font-extrabold leading-snug text-white">{slot.title}</p>
              </div>
            </div>
            <table className="w-full border-collapse">
              <tbody>
                {[
                  ["الكتاب المعتمد", SECTION_META.book],
                  ["إعداد وإنجاز", TEACHER_NAME],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <th
                      className="w-28 border px-3 py-2 text-start text-[11px] font-extrabold text-white"
                      style={{ background: C.head, borderColor: C.line }}
                    >
                      {k}
                    </th>
                    <td
                      className="border px-3 py-2 text-[11px] font-extrabold text-ink-900"
                      style={{ background: C.beige, borderColor: C.line }}
                    >
                      {v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 pb-5 sm:px-5">
            <div className="rounded-2xl border border-dashed p-6 text-center" style={{ borderColor: C.line, background: C.beige }}>
              <Hourglass className="mx-auto size-7" style={{ color: C.olive }} aria-hidden="true" />
              <p className="mt-3 font-display text-sm font-extrabold text-ink-900">
                محتوى هذه الجذاذة في انتظار إدراج الوثيقة الأصلية
              </p>
              <p className="mx-auto mt-2 max-w-2xl text-[11.5px] font-bold leading-relaxed text-ink-700">
                خانة الدرس مسجّلة هنا في ترتيبها الرسمي داخل المقرر (الجذاذة {slot.number} — {slot.title})،
                ولم يُؤلف أي محتوى بديل احترامًا لمبدأ المطابقة الحرفية مع جذاذات الأستاذ.
                عند إرسال الوثيقة الأصلية (Word أو PDF أو صورة واضحة) تُدرج كما هي: مراحلها، أهدافها، أنشطة الأستاذ
                والمتعلم، التدبير والدعم الديداكتيكيان، الوثائق والأسئلة وعناصر الإجابة، التقويمات والمرجع والصفحات.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <StatusBadge status="pending" />
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-extrabold text-ink-600 ring-1 ring-ink-900/10">
                  {SECTION_META.authorLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2" data-no-print>
        {fiche && (
          <>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-700"
            >
              <Printer className="size-4" />
              طباعة الجذاذة
            </button>
            <button
              type="button"
              onClick={() => downloadFiche(fiche)}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-xs font-extrabold text-brand-700 transition-all hover:-translate-y-0.5 hover:border-brand-400"
            >
              <Download className="size-4" />
              تحميل الجذاذة (ملف جاهز للطباعة)
            </button>
          </>
        )}
        {slot.lessonKey && (
          <button
            type="button"
            onClick={() => go({ view: "lesson", id: slot.lessonKey! })}
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

/* ============================================================
   صفحة القسم: اللائحة الرسمية + البحث + التصنيف
   ============================================================ */

interface JadadatProps {
  level?: string;
  open?: string;
  go: (r: Route) => void;
}

type SubjectFilter = "الكل" | "التاريخ" | "الجغرافيا";
type StatusFilter = "all" | "ready" | "pending";

export default function Jadadat({ level, open, go }: JadadatProps) {
  const [activeLevel, setActiveLevel] = useState<string>(
    level && JADADA_LEVELS.some((l) => l.id === level) ? level : "tc",
  );
  const [subject, setSubject] = useState<SubjectFilter>("الكل");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const entry = useMemo(() => (open ? getCatalogEntry(open) : undefined), [open]);

  const stats = useMemo(() => {
    const total = TC_SCI_CATALOG.length;
    const ready = TC_SCI_CATALOG.filter((e) => e.fiche).length;
    const original = TC_SCI_CATALOG.filter((e) => e.status === "original").length;
    const pending = total - ready;
    const perSubject = SUBJECTS.map((s) => ({
      subject: s,
      total: TC_SCI_CATALOG.filter((e) => e.slot.subject === s).length,
      ready: TC_SCI_CATALOG.filter((e) => e.slot.subject === s && e.fiche).length,
    }));
    return { total, ready, original, pending, perSubject };
  }, []);

  const q = query.trim();
  const visible = useMemo(() => {
    if (activeLevel !== "tc") return [];
    return TC_SCI_CATALOG.filter((e) => {
      if (subject !== "الكل" && e.slot.subject !== subject) return false;
      if (statusFilter === "ready" && !e.fiche) return false;
      if (statusFilter === "pending" && e.fiche) return false;
      if (!q) return true;
      const f = e.fiche;
      const hay = [
        e.slot.title,
        e.slot.unitTitle,
        e.slot.cycle,
        e.slot.subject,
        `الجذاذة ${e.slot.number}`,
        e.slot.tag ?? "",
        f ? f.title : "",
        f ? f.kifayaMarkaziya : "",
        f ? f.kifayaMihwariya : "",
        f?.concepts?.join(" ") ?? "",
        f?.segments.map((s) => `${s.phase} ${s.objectives.join(" ")} ${s.management.join(" ")} ${s.content.join(" ")} ${s.supports.join(" ")}`).join(" ") ?? "",
        f?.taqwimIjmali.join(" ") ?? "",
        f?.references?.join(" ") ?? "",
      ]
        .join(" ")
        .replace(/[\u064B-\u0652\u0640]/g, "")
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .toLowerCase();
      const needle = q
        .replace(/[\u064B-\u0652\u0640]/g, "")
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [activeLevel, subject, statusFilter, q]);

  const pickLevel = (id: string) => {
    setActiveLevel(id);
    setSubject("الكل");
    setStatusFilter("all");
    setQuery("");
    go({ view: "jadadat", level: id });
  };
  const pickFiche = (id: string) => go({ view: "jadadat", level: activeLevel, open: id });
  const closeFiche = () => go({ view: "jadadat", level: activeLevel });

  if (entry) return <FichePage entry={entry} onBack={closeFiche} go={go} />;

  /* تجميع الخانات: مادة › دورة/وحدة */
  const grouped = SUBJECTS.map((s) => ({
    subject: s,
    units: TC_SCI_UNITS.filter((u) => u.subject === s).map((u) => ({
      unit: u,
      items: visible.filter((e) => e.slot.unitId === u.id),
    })),
  })).filter((g) => g.units.some((u) => u.items.length > 0));

  const chipBase =
    "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-extrabold transition-colors";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6">
      {/* ===== بطاقة تعريف القسم ===== */}
      <section className="animate-fade-in overflow-hidden rounded-3xl bg-white shadow-xl shadow-brand-900/10 ring-1 ring-ink-900/10">
        <div className="p-5 sm:p-7" style={{ background: `linear-gradient(135deg, ${C.beige} 0%, #ffffff 65%)` }}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-extrabold text-white">
            <NotebookPen className="size-3.5" aria-hidden="true" />
            وثائق الأستاذ — الجذاذات
          </span>
          <h1 className="mt-3 font-display text-2xl font-black text-ink-900 sm:text-[32px]">{SECTION_META.title}</h1>

          <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {[
              ["المادة", SECTION_META.subject],
              ["المستوى", SECTION_META.level],
              ["الإطار", SECTION_META.frame],
              ["الكتاب المعتمد", SECTION_META.book],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-2 text-xs">
                <dt className="font-extrabold text-ink-500">{k}:</dt>
                <dd className="font-extrabold text-ink-800">{v}</dd>
              </div>
            ))}
          </dl>

          <p
            className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black"
            style={{ background: C.gold, border: `1px solid ${C.goldLine}`, color: C.headDark }}
          >
            <PenLine className="size-4" aria-hidden="true" />
            {SECTION_META.authorLabel}
            <span className="font-bold text-ink-600">— {TEACHER_SCHOOL}</span>
          </p>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-500">
            لائحة رسمية كاملة لجذاذات المستوى: <span className="font-extrabold text-ink-700">13 جذاذة في التاريخ</span> و
            <span className="font-extrabold text-ink-700"> 12 جذاذة في الجغرافيا</span>، مصنّفة حسب المادة والدورة والوحدة
            وحسب ترتيب الدروس في المقرر. كل جذاذة تُفتح في صفحة مستقلة بالصيغة الرسمية (البطاقة التقنية، الكفايات، الأهداف،
            جدول مراحل إنجاز الدرس بالتدبير والدعم الديداكتيكيين، التقويمات المرحلية والإجمالية) وتُطبع أو تُحمَّل مباشرة.
          </p>
        </div>

        {/* مؤشرات الإدراج */}
        <div className="grid gap-px border-t sm:grid-cols-4" style={{ borderColor: C.line, background: C.line }}>
          {[
            { k: "خانات الجذاذات", v: `${stats.total}`, s: "حسب المقرر الرسمي" },
            { k: "جذاذات مُدرجة", v: `${stats.ready}`, s: `${stats.perSubject[0].ready} تاريخ · ${stats.perSubject[1].ready} جغرافيا` },
            { k: "مطابقة للوثيقة الأصلية", v: `${stats.original}`, s: "تفريغ حرفي دون اختصار" },
            { k: "في انتظار وثيقتها", v: `${stats.pending}`, s: "لا يُؤلف محتوى بديل" },
          ].map((b) => (
            <div key={b.k} className="bg-white px-4 py-3">
              <p className="text-[10px] font-extrabold text-ink-500">{b.k}</p>
              <p className="mt-1 font-display text-xl font-black" style={{ color: C.head }}>
                {b.v}
              </p>
              <p className="mt-0.5 text-[10px] font-bold text-ink-400">{b.s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== المستويات ===== */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3" data-no-print>
        {JADADA_LEVELS.map((l) => {
          const count = l.id === "tc" ? stats.ready : 0;
          const total = l.id === "tc" ? stats.total : 0;
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
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${active ? "bg-white/20 text-white" : "bg-brand-50 text-brand-700"}`}
                >
                  {total > 0 ? `${count}/${total} جذاذة` : "قريبًا"}
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

      {activeLevel !== "tc" ? (
        <div className="mt-8 rounded-2xl border border-dashed border-ink-900/15 bg-white p-8 text-center">
          <p className="font-display text-sm font-extrabold text-ink-700">جذاذات هذا المستوى في الإعداد</p>
          <p className="mt-2 text-xs text-ink-500">
            القسم المتكامل المتوفر حاليًا: {SECTION_META.title} (التاريخ والجغرافيا) — {SECTION_META.authorLabel}.
          </p>
        </div>
      ) : (
        <>
          {/* ===== أدوات البحث والتصنيف ===== */}
          <div className="sticky top-2 z-20 mt-6 rounded-2xl border border-ink-900/10 bg-white/95 p-3 shadow-lg shadow-brand-900/5 backdrop-blur" data-no-print>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-ink-400" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث في الجذاذات: عنوان الدرس، الوحدة، الكفايات، الأنشطة، الصفحات…"
                  className="w-full rounded-xl border border-ink-900/10 bg-white py-2.5 pe-9 ps-9 text-xs font-bold text-ink-800 outline-none transition-colors placeholder:font-semibold placeholder:text-ink-400 focus:border-brand-400"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="مسح البحث"
                    className="absolute inset-y-0 end-2 my-auto grid size-6 place-items-center rounded-full text-ink-400 transition-colors hover:bg-brand-50 hover:text-ink-700"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </label>

              <div className="flex flex-wrap items-center gap-2">
                {(["الكل", "التاريخ", "الجغرافيا"] as SubjectFilter[]).map((s) => {
                  const on = subject === s;
                  const n = s === "الكل" ? stats.total : stats.perSubject.find((p) => p.subject === s)?.total ?? 0;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubject(s)}
                      aria-pressed={on}
                      className={`${chipBase} ${on ? "border-brand-600 bg-brand-600 text-white" : "border-ink-900/10 bg-white text-ink-700 hover:border-brand-300"}`}
                    >
                      {s}
                      <span className={`rounded-full px-1.5 text-[9.5px] font-black ${on ? "bg-white/25" : "bg-brand-50 text-brand-700"}`}>
                        {n}
                      </span>
                    </button>
                  );
                })}
                <span className="mx-1 hidden h-5 w-px bg-ink-900/10 sm:block" aria-hidden="true" />
                {(
                  [
                    ["all", "كل الحالات"],
                    ["ready", "المُدرجة"],
                    ["pending", "في الانتظار"],
                  ] as [StatusFilter, string][]
                ).map(([id, label]) => {
                  const on = statusFilter === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setStatusFilter(id)}
                      aria-pressed={on}
                      className={`${chipBase} ${on ? "border-gold-500 bg-gold-100 text-gold-700" : "border-ink-900/10 bg-white text-ink-700 hover:border-gold-400"}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-900/5 pt-3">
              <span className="text-[10px] font-extrabold text-ink-500">دليل الحالات:</span>
              {(["original", "model", "pending"] as JadadaStatus[]).map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 text-[10px] font-bold text-ink-500">
                  <StatusBadge status={s} compact />
                  {JADADA_STATUS_META[s].note}
                </span>
              ))}
            </div>
          </div>

          {/* ===== اللائحة ===== */}
          {grouped.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-ink-900/15 bg-white p-8 text-center">
              <p className="font-display text-sm font-extrabold text-ink-700">لا توجد جذاذة مطابقة لبحثك</p>
              <p className="mt-2 text-xs text-ink-500">جرّب كلمة أخرى أو أعد التصنيف إلى «الكل».</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSubject("الكل");
                  setStatusFilter("all");
                }}
                className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-[11px] font-extrabold text-white transition-colors hover:bg-brand-700"
              >
                إعادة ضبط التصنيف
              </button>
            </div>
          ) : (
            grouped.map((g) => (
              <section key={g.subject} className="mt-9">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink-900">
                    <span className="size-2.5 rounded-full bg-gold-500" aria-hidden="true" />
                    جذاذات {g.subject} — {SECTION_META.level}
                  </h2>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold text-brand-700">
                    {stats.perSubject.find((p) => p.subject === g.subject)?.total ?? 0} جذاذة حسب المقرر ·{" "}
                    {stats.perSubject.find((p) => p.subject === g.subject)?.ready ?? 0} مُدرجة
                  </span>
                </div>

                {g.units.map(({ unit, items }) => {
                  if (items.length === 0) return null;
                  return (
                    <div key={unit.id} className="mt-5">
                      <div
                        className="flex flex-wrap items-center justify-between gap-2 rounded-t-2xl px-4 py-2.5"
                        style={{ background: C.head }}
                      >
                        <h3 className="font-display text-[13px] font-extrabold text-white">
                          {unit.cycle} — {unit.title}
                        </h3>
                        <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-black text-white/90">
                          مجزوءة {unit.module} · {items.length} جذاذة
                        </span>
                      </div>

                      <div className="grid gap-3 rounded-b-2xl border border-t-0 border-ink-900/10 bg-white/60 p-3 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map(({ slot, fiche, status }) => {
                          const title = fiche?.title ?? slot.title;
                          const ready = Boolean(fiche);
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => pickFiche(slot.id)}
                              aria-label={`الجذاذة ${slot.number}: ${title}`}
                              className={`group flex h-full flex-col rounded-xl border p-3.5 text-start transition-all hover:-translate-y-0.5 hover:shadow-lg ${ready ? "border-ink-900/10 bg-white hover:border-brand-400 hover:shadow-brand-900/10" : "border-dashed border-ink-900/15 bg-paper/70 hover:border-brand-300"}`}
                            >
                              <div className="flex items-start gap-2.5">
                                <span
                                  className="grid size-8 shrink-0 place-items-center rounded-full font-display text-[11px] font-black text-white"
                                  style={{ background: ready ? C.head : "#9aa8a1" }}
                                >
                                  {slot.number}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[9.5px] font-extrabold text-ink-500">
                                    الجذاذة {slot.number} · {g.subject}
                                    {slot.tag ? ` · ${slot.tag}` : ""}
                                  </p>
                                  <h4
                                    className={`mt-0.5 font-display text-[12.5px] font-extrabold leading-snug transition-colors ${ready ? "text-ink-900 group-hover:text-brand-700" : "text-ink-700"}`}
                                  >
                                    {title}
                                  </h4>
                                  {fiche && fiche.title !== slot.title && (
                                    <p className="mt-1 text-[9.5px] font-bold leading-snug text-ink-500">
                                      في المقرر: {slot.title}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                <StatusBadge status={status} compact />
                                {fiche && (
                                  <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-ink-500">
                                    <Clock3 className="size-3" aria-hidden="true" />
                                    {fiche.duration}
                                  </span>
                                )}
                              </div>

                              <p className="mt-auto pt-2.5 text-[10px] font-extrabold text-brand-600">
                                {ready ? "فتح الجذاذة وطباعتها ←" : "تفاصيل الخانة ←"}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </section>
            ))
          )}

          {/* ===== ملاحظة الإدراج ===== */}
          <section className="mt-9 rounded-2xl border p-5" style={{ borderColor: C.goldLine, background: C.gold }}>
            <h2 className="font-display text-sm font-extrabold" style={{ color: C.headDark }}>
              كيف تُدرج بقية الجذاذات؟
            </h2>
            <p className="mt-2 text-[11.5px] font-bold leading-relaxed text-ink-700">
              كل جذاذة تُدرج هنا تُنقل كما هي من وثيقتك الأصلية: عنوان الدرس، أهداف التعلم، الكفايات المستهدفة، الإشكالية،
              المفاهيم والمصطلحات، مراحل إنجاز الدرس وتسلسلها، الوضعية الاستكشافية، أنشطة الأستاذ وأنشطة المتعلم والأهداف
              المرتبطة بكل نشاط، التدبير الديداكتيكي، الدعم الديداكتيكي، الوثائق والمنشور والوسائل التعليمية، الأسئلة
              والتوجيهات وعناصر الإجابة، التقويم المرحلي والتقويم الإجمالي، الخلاصات والاستنتاجات، والمراجع والصفحات
              المشار إليها في الكتاب المدرسي — دون حذف أو اختصار أو تغيير أو إعادة صياغة، ودون تأليف جذاذات جديدة.
            </p>
            <p className="mt-2 text-[11.5px] font-extrabold" style={{ color: C.headDark }}>
              {SECTION_META.authorLabel} — {TEACHER_SCHOOL}
            </p>
          </section>
        </>
      )}
    </div>
  );
}

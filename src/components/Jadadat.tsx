import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Hourglass,
  NotebookPen,
  PenLine,
  Printer,
  ScrollText,
  Search,
  X,
} from "lucide-react";
import {
  JADADA_LEVELS,
  JADADA_STATUS_META,
  SECTION_META,
  TC_SCI_CATALOG,
  TC_SCI_UNITS,
  TEACHER_SCHOOL,
  catalogText,
  collectProduit,
  getCatalogEntry,
  isProduitHeader,
  type CatalogEntry,
  type ImportedFiche,
  type Jadada,
  type JadadaStatus,
  type SrcCell,
  type SrcTable,
} from "../data/jadadat";
import type { Route } from "../routes";
import { detectSegments, detectedTableToHtml } from "../lib/tableDetect";
import SmartText, { AutoTableView } from "./SmartText";

/* ============================================================
   قسم الجذاذات — «جذاذات الجذع المشترك العلمي»
   المادة: الاجتماعيات · المستوى: الجذع المشترك العلمي
   الإطار: الثانوي التأهيلي بالمغرب
   إعداد وإنجاز: الأستاذ عماد طليل

   كل جذاذة معروضة هنا هي وثيقة الأستاذ الأصلية نفسها، مُفرَّغة آليًا
   (scripts/import-jadadat.py) دون حذف أو اختصار أو إعادة صياغة أو
   تغيير في المصطلحات أو الأرقام أو ترتيب المراحل. ويعاد إظهار
   «المنتوج» في موضع واضح مع الحفاظ على نصّه الأصلي وموقعه.
   ============================================================ */

/* ألوان جداول الجذاذات = هوية المنصة (أخضر brand + لمسة gold) لإطار القسم */
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

/* ألوان شكل الوثيقة الأصلية كما وردت في ملف الأستاذ (بني/بيج) — يُحترم هذا الشكل في عرض الجذاذة */
const D = {
  head: "#8c4b2e",      /* بني رؤوس الجداول وصناديق المراحل وعنوان الدرس */
  nest: "#8a3a26",      /* بني رؤوس الجداول المتداخلة */
  beige: "#f6e7c6",     /* بيج الخلايا (المنتوج/التقويم/قيم البطاقة) */
  beigeLight: "#fbf4e2",
  beigeDark: "#f0dfb6",
  line: "#d9c39b",
  yellow: "#f5d878",    /* الخلية الفارغة في «انجاز الاستاذ» كما في الأصل */
  ink: "#5d3a24",
};

/* ترويسات الجداول كما سمّتها الوثائق الأصلية (للتنسيق فقط، لا لتغيير النص) */
const HEAD_WORDS = [
  "مراحل إنجاز الدرس",
  "مراحل الدرس",
  "مراحل",
  "وضعيات التعلمات",
  "أهداف التعلم",
  "اهداف التعلم",
  "أهداف التعليم",
  "التدبير الديداكتيكي",
  "التدبير",
  "الدعامات",
  "المنتوج",
  "المحتوى",
  "المتنوع",
  "معرفيا",
  "معرفيا",
  "مهاريا",
  "وجدانيا",
  "الكفايات",
  "القدرات",
  "القـدرات",
  "أنشطة التعلم",
  "انشطة التعلم",
  "مفاهيم ومصطلحات",
  "التقويم",
  "الإستنتاجات",
  "الاستنتاجات",
  "الإنجازات",
];

const cleanLine = (s: string) => s.replace(/[\u200f\u200e\u0640]/g, "").replace(/\s+/g, " ").trim();
const cellTexts = (c?: SrcCell): string[] => [...(c?.box ?? []), ...(c?.lines ?? [])];
const isHeaderCell = (c: SrcCell) => cellTexts(c).some((l) => HEAD_WORDS.some((w) => cleanLine(l).startsWith(w)));
const isTaqwimRow = (row: SrcCell[]) => /^تقويم|^التقويم/.test(cleanLine(cellTexts(row[0])[0] ?? ""));

/* ============================================================
   عرض محتوى الوثيقة الأصلية (خلايا وجداول)
   ============================================================ */

function CellContent({ c, gold, stage }: { c: SrcCell; gold?: boolean; stage?: boolean }) {
  return (
    <>
      {(c.box ?? []).map((b, i) =>
        gold ? (
          <p key={`b${i}`} className="whitespace-pre-line font-extrabold" style={{ color: D.nest }}>
            {b}
          </p>
        ) : (
          <span
            key={`b${i}`}
            className="mb-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-black text-white"
            style={{ background: D.head }}
          >
            {b}
          </span>
        ),
      )}
      {/* النص داخل الخلية يمرّ على النظام الموحد: بيانات منظمة → جدول حقيقي، وغير ذلك يبقى نصًا */}
      {detectSegments((c.lines ?? []).join("\n")).map((seg, si) =>
        seg.kind === "text" ? (
          seg.text.split("\n").map((l, li) => (
            <p
              key={`${si}-${li}`}
              className={`whitespace-pre-line ${si > 0 || li > 0 || (c.box ?? []).length ? "mt-1" : ""} ${gold ? "font-bold" : ""} ${stage ? "font-extrabold underline underline-offset-4" : ""}`}
              style={stage ? { color: D.ink } : undefined}
            >
              {l}
            </p>
          ))
        ) : (
          <AutoTableView key={`t${si}`} t={seg.table} variant="doc" />
        ),
      )}
      {(c.nested ?? []).map((t, i) => (
        <div key={i} className="mt-2">
          <SrcTable t={t} nested />
        </div>
      ))}
    </>
  );
}

function SrcTable({ t, nested }: { t: SrcTable; nested?: boolean }) {
  const rows = t.rows;
  const headerIdx = rows.findIndex((r) => r.filter(isHeaderCell).length >= 2);
  const produitCol = headerIdx >= 0 ? rows[headerIdx].findIndex((c) => cellTexts(c).some(isProduitHeader)) : -1;
  const cols = Math.max(...rows.map((r) => r.length), 1);
  /* عمود المراحل (نص بني مسطّر كما في الأصل) فقط حين يكون عموده الأول «مراحل/وضعيات» */
  const headFirst = cleanLine(cellTexts(rows[headerIdx]?.[0])[0] ?? "");
  const stageCol = headerIdx >= 0 && /مراحل|وضعيات/.test(headFirst) ? 0 : -1;
  /* جدول من عمودين (الإشكالية ونحوها): خانة العنوان بيج بنص بني كما في الأصل */
  const twoCol = cols === 2;
  /* الجداول المتداخلة: صفّها الأول ترويسة إن كانت خاناته قصيرة بلا تنقيط (كما في الأصل) */
  const BULLET = /^\s*[-=*•·<>=>]|^\s*\d+\s*[).\-]/;
  let head = headerIdx;
  if (head === -1 && nested && rows.length > 1) {
    const r0 = rows[0];
    const shortAll = r0.every((c) => {
      const t = cleanLine(cellTexts(c).join(" "));
      return t.length <= 30 && !BULLET.test(t);
    });
    if (shortAll && r0.some((c) => cellTexts(c).length)) head = 0;
  }
  /* زوج عنوان/محتوى في جدول العمودين: العمود الأقصر كثيرًا هو خانة العنوان */
  const sums = twoCol
    ? [0, 1].map((ci) => rows.reduce((a, r) => a + (cellTexts(r[ci]).join(" ").length), 0))
    : [0, 0];
  const maxSum = Math.max(sums[0], sums[1], 1);
  const minSum = Math.min(sums[0], sums[1]);
  const labelPair = twoCol && minSum / maxSum <= 0.45;
  const labelCol = labelPair ? (sums[0] <= sums[1] ? 0 : 1) : -1;

  const renderRow = (row: SrcCell[], ri: number) => {
    {
      const isHeader = ri === head;
            /* صف مدمج واحد في أول الجدول = ترويسته الممتدة كما في الأصل */
            if (ri === 0 && row.length === 1 && cols > 1 && head !== 0) {
              return (
                <tr key={ri}>
                  <th
                    colSpan={cols}
                    className="border px-2.5 py-2 text-start text-[10.5px] font-extrabold text-white"
                    style={{ background: nested ? D.nest : D.head, borderColor: D.line }}
                  >
                    <CellContent c={row[0] ?? {}} />
                  </th>
                </tr>
              );
            }
            const taqwim = !isHeader && isTaqwimRow(row);
            if (isHeader) {
              return (
                <tr key={ri}>
                  {row.map((c, ci) => (
                    <th
                      key={ci}
                      className="border px-2.5 py-2 text-start text-[10.5px] font-extrabold text-white"
                      style={{ background: nested ? D.nest : D.head, borderColor: D.line }}
                    >
                      <CellContent c={c} />
                    </th>
                  ))}
                </tr>
              );
            }
            if (taqwim) {
              return (
                <tr key={ri}>
                  <td
                    className="border px-2.5 py-2 text-center text-[10.5px] font-extrabold text-white"
                    style={{ background: D.head, borderColor: D.line }}
                  >
                    <CellContent c={row[0] ?? {}} />
                  </td>
                  <td
                    colSpan={Math.max(cols - 1, 1)}
                    className="border px-2.5 py-2 text-[10.5px] font-bold leading-relaxed"
                    style={{ background: D.beige, borderColor: D.line, color: D.ink }}
                  >
                    {row.slice(1).map((c, ci) => (
                      <div key={ci}>
                        <CellContent c={c} />
                      </div>
                    ))}
                  </td>
                </tr>
              );
            }
            // صف من خلية واحدة داخل جدول متعدد الأعمدة = صف مدمج يمتد على عرضه (كما في الأصل)
            const merged = row.length === 1 && cols > 1;
            const lastSpan = row.length < cols ? cols - row.length + 1 : 1;
            return (
              <tr key={ri}>
                {row.map((c, ci) => {
                  const gold = ci === produitCol && produitCol >= 0;
                  const first = ci === 0;
                  const span = merged ? cols : ci === row.length - 1 ? lastSpan : 1;
                  const txt = cellTexts(c).join(" ");
                  /* خلية طويلة أو تحوي جدولًا متداخلًا: يُسمح بقطعها بين صفحتي الطباعة */
                  const splittable = txt.length > 600 || (c.nested ?? []).length > 0;
                  /* عنوان صفّ قصير بدون صندوق = خانة بنية بنص أبيض (كخلية «أهداف التعلم») */
                  const rowLabel = first && !merged && cols >= 3 && !(c.box ?? []).length && cleanLine(txt).length <= 25;
                  /* جدول عمودين: خانة العنوان (الأقصر) بيج غامق/كريمي بنص بني عريض */
                  const label2 = !merged && twoCol && ci === labelCol;
                  const value2 = !merged && twoCol && labelPair && ci !== labelCol;
                  const bg = merged
                    ? D.beigeDark
                    : gold
                      ? D.beige
                      : rowLabel
                        ? D.head
                        : label2
                          ? nested
                            ? D.beigeLight
                            : D.beigeDark
                          : value2
                            ? nested
                              ? D.beige
                              : D.beigeLight
                            : nested
                              ? D.beigeLight
                              : "#ffffff";
                  return (
                    <td
                      key={ci}
                      colSpan={span > 1 ? span : undefined}
                      className={`border px-2.5 py-2 align-top text-[10.5px] leading-relaxed ${splittable ? "splittable" : ""} ${rowLabel ? "font-extrabold text-white" : label2 ? "font-extrabold" : `font-semibold ${gold ? "font-bold" : ""}`} ${merged ? "font-extrabold" : ""}`}
                      style={{
                        background: bg,
                        borderColor: D.line,
                        color: rowLabel ? undefined : D.ink,
                      }}
                    >
                      <CellContent c={c} gold={gold} stage={ci === stageCol && !merged && !rowLabel} />
                    </td>
                  );
                })}
              </tr>
            );
    }
  };

  return (
    <div className={`${nested ? "" : "mt-3"} overflow-x-auto`}>
      <table className="jadada-table w-full border-collapse" style={{ minWidth: nested ? undefined : cols >= 5 ? 780 : undefined }}>
        {head >= 0 && <thead>{renderRow(rows[head], head)}</thead>}
        <tbody>{rows.map((row, ri) => (ri === head ? null : renderRow(row, ri)))}</tbody>
      </table>
    </div>
  );
}

/* وثيقة PDF: سطور النص بترتيبها الأصلي (طبقة النص في الملف لا تحمل بنية الجدول) */
const PDF_HEAD_WORDS = [
  "مراحل", "أهداف", "اهداف", "الدعامات", "التدبير", "مفاهيم", "مصطلحات", "تقويم", "تمهيد",
  "المقطع", "النشاط", "تقديم عام", "المراجع", "المجزوءة", "الوحدة", "المستوى", "رقم الجذاذة",
  "الأستاذ", "مكون", "المنتوج", "المحتوى",
];

function PdfSheet({ f }: { f: ImportedFiche }) {
  const lines = f.blocks.filter((b) => b.type === "para");
  return (
    <div className="mt-2 overflow-hidden rounded-xl border" style={{ borderColor: C.line }}>
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[10px] font-extrabold"
        style={{ background: C.beige, color: C.headDark }}
      >
        <span className="inline-flex items-center gap-1.5">
          <FileText className="size-3.5" aria-hidden="true" />
          الوثيقة المصدر PDF — سطور النص بترتيبها الأصلي كما وردت في الملف، حرفيًا
        </span>
        <span className="text-ink-600">{f.source}</span>
      </div>
      <div className="px-3 py-2">
        {lines.map((b, i) => {
          const t = b.text ?? "";
          const head = t.length <= 46 && PDF_HEAD_WORDS.some((h) => t.includes(h));
          return (
            <p
              key={i}
              className={`whitespace-pre-line border-b py-1 text-[11px] leading-relaxed last:border-0 ${head ? "font-black" : "font-semibold text-ink-800"}`}
              style={{ borderColor: C.beige, color: head ? C.headDark : undefined }}
            >
              {t}
            </p>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- ترويسة الوثيقة كما في ملف الأستاذ: بطاقتان جانبيتان + عنوان الدرس وسطها ---------- */
interface DocLead {
  metas: SrcTable[];
  number?: string;
  pill?: string;
  title?: string;
  rest: number;
}

const isMetaTable = (t?: SrcTable): boolean =>
  Boolean(
    t &&
      t.rows.length >= 2 &&
      t.rows.length <= 4 &&
      t.rows.every(
        (r) =>
          r.length === 2 &&
          cleanLine(cellTexts(r[0])[0] ?? "").length > 0 &&
          cleanLine(cellTexts(r[0])[0] ?? "").length <= 20 &&
          cleanLine(cellTexts(r[1])[0] ?? "").length <= 45,
      ),
  );

/** استخراج ترويسة الوثيقة (إن وجدت في ملفها) دون المساس ببقية الكتل */
function docLead(f: ImportedFiche): DocLead {
  const lead: DocLead = { metas: [], rest: 0 };
  let i = 0;
  while (i < f.blocks.length) {
    const b = f.blocks[i];
    if (b.type === "table" && isMetaTable(b.table ?? undefined)) {
      lead.metas.push(b.table!);
      i += 1;
      continue;
    }
    const t = cleanLine(b.type === "para" ? (b.text ?? "") : "");
    if (b.type === "para" && t && t.length <= 60 && (lead.metas.length > 0 || /^\d{1,2}$/.test(t))) {
      const isNum = /^\d{1,2}$/.test(t);
      if (isNum && !lead.number) lead.number = t;
      else if (!isNum && !lead.pill && t.includes("عنوان")) lead.pill = t;
      else if (!isNum && !lead.title) lead.title = t;
      else break; // لا يُحذف أي سطر من الوثيقة: ما لا يدخل في الترويسة يبقى في جسمها
      i += 1;
      continue;
    }
    break;
  }
  lead.rest = i;
  if (lead.metas.length === 0 && !lead.number) return { metas: [], rest: 0 };
  return lead;
}

function MetaTable({ t }: { t: SrcTable }) {
  return (
    <table className="w-full border-collapse">
      <tbody>
        {t.rows.map((r, ri) => {
          const empty = cellTexts(r[1]).length === 0;
          return (
            <tr key={ri}>
              <th
                className="w-2/5 border px-2.5 py-1.5 text-start text-[10.5px] font-extrabold text-white"
                style={{ background: D.head, borderColor: D.line }}
              >
                {cellTexts(r[0]).map((l, i) => (
                  <p key={i} className="whitespace-pre-line">{l}</p>
                ))}
              </th>
              <td
                className="border px-2.5 py-1.5 text-[10.5px] font-bold text-ink-900"
                style={{ background: empty ? D.yellow : D.beige, borderColor: D.line }}
              >
                {cellTexts(r[1]).map((l, i) => (
                  <p key={i} className="whitespace-pre-line">{l}</p>
                ))}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function DocHeaderBand({ lead, slot }: { lead: DocLead; slot: { number: string; title: string } }) {
  const right = lead.metas.find((t) => cellTexts(t.rows[0]?.[0]).some((l) => l.includes("مادة"))) ?? lead.metas[0];
  const left = lead.metas.find((t) => t !== right);
  return (
    <div className="mt-2 grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,auto)_minmax(0,1fr)]">
      {right && <MetaTable t={right} />}
      <div className="order-first flex flex-col items-center gap-1.5 md:order-none">
        <div className="flex w-full items-center justify-center gap-2">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-full font-display text-[13px] font-black text-white"
            style={{ background: D.head }}
          >
            {lead.number ?? slot.number}
          </span>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="rounded-md bg-ink-500 px-2.5 py-0.5 text-[9.5px] font-black text-white">
              {lead.pill ?? "عنوان الدرس"}
            </span>
            <span
              className="w-full rounded-xl px-3 py-2 text-center font-display text-[12px] font-extrabold leading-snug text-white"
              style={{ background: D.head }}
            >
              {lead.title ?? slot.title}
            </span>
          </div>
        </div>
      </div>
      {left && <MetaTable t={left} />}
    </div>
  );
}

function Blocks({ f, slot }: { f: ImportedFiche; slot: { number: string; title: string } }) {
  if (f.layout === "pdf") {
    return (
      <div className="px-3 pb-4 pt-1 sm:px-4">
        <PdfSheet f={f} />
      </div>
    );
  }
  const lead = docLead(f);
  return (
    <div className="px-3 pb-4 pt-1 sm:px-4">
      {lead.rest > 0 && <DocHeaderBand lead={lead} slot={slot} />}
      {f.blocks.slice(lead.rest).map((b, i) =>
        b.type === "para" ? (
          <SmartText
            key={i}
            text={b.text ?? ""}
            variant="doc"
            className={`text-[11.5px] font-bold leading-relaxed text-ink-900 ${b.frame ? "mt-1" : "mt-2"}`}
          />
        ) : b.table ? (
          <SrcTable key={i} t={b.table} />
        ) : null,
      )}
    </div>
  );
}

/* ---------- المنتوج: يُجمع من عموده الأصلي بترتيبه ونصّه الحرفيين ---------- */
function ProduitPanel({ f }: { f: ImportedFiche }) {
  const parts = collectProduit(f);
  if (parts.length === 0) {
    return (
      <section className="mt-4 rounded-2xl border p-4" style={{ borderColor: D.line, background: D.beigeLight }}>
        <h2 className="flex items-center gap-2 font-display text-[13px] font-extrabold" style={{ color: D.head }}>
          <ScrollText className="size-4" aria-hidden="true" />
          المنتوج
        </h2>
        <p className="mt-2 text-[11px] font-bold leading-relaxed text-ink-700">
          ورد المنتوج داخل نص الوثيقة الأصلية المعروض أعلاه كما هو (الملف المصدر PDF)، ولم يُضف إليه أو يُحذف منه شيء.
        </p>
      </section>
    );
  }
  return (
    <section className="mt-4 overflow-hidden rounded-2xl border" style={{ borderColor: D.line }}>
      <h2 className="flex flex-wrap items-center gap-2 px-4 py-2.5 font-display text-[13px] font-extrabold text-white" style={{ background: D.head }}>
        <ScrollText className="size-4" aria-hidden="true" />
        المنتوج
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9.5px] font-black">
          عمود «{parts[0].header}» في الجذاذة الأصلية · {parts.length} جزءًا
        </span>
      </h2>
      <p className="border-b px-4 py-2 text-[10px] font-bold leading-relaxed text-ink-600" style={{ borderColor: D.line, background: D.beigeLight }}>
        جُمعت أجزاء المنتوج من الجدول الأصلي بترتيبها وسياقها نفسه، ونُقلت حرفيًا دون حذف أو اختصار أو إعادة صياغة أو تغيير
        في المصطلحات أو الأرقام. (تجدونها كذلك في موضعها الأصلي داخل عمود «{parts[0].header}» أعلاه.)
      </p>
      <div className="divide-y" style={{ borderColor: D.line }}>
        {parts.map((p, i) => (
          <div key={i} className="px-4 py-3" style={{ background: i % 2 ? D.beigeLight : "#ffffff" }}>
            {p.phase && (
              <p className="mb-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-black text-white" style={{ background: D.nest }}>
                {p.phase}
              </p>
            )}
            <div className="text-[11px] font-semibold leading-relaxed text-ink-900">
              <CellContent c={p.cell} gold />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   ملف التحميل: نسخة HTML مستقلة من الوثيقة الأصلية
   ============================================================ */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const DOC_CSS = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; background: #f6f8f7; color: #12211b;
         font-family: "Readex Pro", "Cairo", "Noto Naskh Arabic", Tahoma, Arial, sans-serif; }
  .sheet { max-width: 1040px; margin: 0 auto; background: #fff; border: 1px solid ${D.line}; border-radius: 14px; overflow: hidden; }
  .masthead { background: ${D.head}; color: #fff; padding: 16px 20px; }
  .masthead h1 { margin: 0; font-size: 19px; }
  .masthead p { margin: 6px 0 0; font-size: 12px; opacity: .92; line-height: 1.9; }
  .pad { padding: 16px 18px 22px; }
  table { width: 100%; margin-top: 10px; table-layout: auto;
          border-collapse: separate; border-spacing: 0;
          border-top: 1px solid ${D.line}; border-inline-start: 1px solid ${D.line}; }
  thead { display: table-header-group; }   /* الترويسة تتكرر في كل صفحة طباعة */
  tfoot { display: table-footer-group; }
  th, td { border: 0 solid ${D.line}; border-bottom-width: 1px; border-inline-end-width: 1px;
           padding: 7px 9px; font-size: 11.5px; vertical-align: top; line-height: 1.9; text-align: start;
           overflow-wrap: break-word; word-break: normal; hyphens: none;
           box-decoration-break: clone; -webkit-box-decoration-break: clone; }
  tr { page-break-inside: avoid; break-inside: avoid; }
  td.splittable, th.splittable { page-break-inside: auto; break-inside: auto; }
  tr.head th { page-break-after: avoid; break-after: avoid; }
  tbody td { color: ${D.ink}; }
  tbody td.rowlab, tr.head th { color: #fff; }
  .boxflat { margin: 0 0 3px; font-weight: 800; color: ${D.nest}; }
  tr.head th { background: ${D.head}; color: #fff; font-size: 11px; }
  table.nested tr.head th { background: ${D.nest}; }
  /* الجداول الذكية المكتشفة تلقائيًا (نفس النظام الموحد) */
  table.auto-table { margin-top: 6px; background: ${D.beigeLight}; }
  table.auto-table caption { color: ${D.head}; font-weight: 700; text-align: start; padding: 3px 6px; caption-side: top; }
  table.auto-table thead th { background: ${D.nest}; color: #fff; font-weight: 700; }
  table.auto-table td { color: ${D.ink}; }
  table.auto-table td.num { font-weight: 700; white-space: nowrap; }
  td.prod { background: ${D.beige}; }
  td.rowlab { background: ${D.head}; color: #fff; font-weight: 800; }
  td.label2, td.nestfirst { background: ${D.beigeDark}; color: ${D.ink}; font-weight: 800; }
  td.label2val { background: ${D.beigeLight}; font-weight: 800; }
  td.nlab { background: ${D.beigeLight}; color: ${D.ink}; font-weight: 800; }
  td.nval { background: ${D.beige}; }
  td.nbody { background: ${D.beigeLight}; }
  td.stage p { color: ${D.ink}; font-weight: 800; text-decoration: underline; text-underline-offset: 4px; }
  td.merged { background: ${D.beigeDark}; font-weight: 700; }
  td.taqwim { background: ${D.head}; color: #fff; text-align: center; font-weight: 700; }
  td.taqwimbody { background: ${D.beige}; }
  p { margin: 2px 0; }
  .box { display: inline-block; background: ${D.head}; color: #fff; border-radius: 5px; padding: 1px 7px; font-size: 10px; font-weight: 700; margin-bottom: 3px; }
  .para { font-size: 12px; font-weight: 600; line-height: 1.95; margin: 6px 0; }
  .dochead { display: grid; grid-template-columns: 1fr minmax(220px, auto) 1fr; gap: 12px; align-items: start; margin-top: 4px; }
  .dochead table { margin-top: 0; }
  .dochead th { background: ${D.head}; color: #fff; width: 40%; }
  .dochead td { background: ${D.beige}; }
  .dochead td.empty { background: ${D.yellow}; }
  .titlezone { display: flex; flex-direction: column; align-items: center; gap: 5px; }
  .titlerow { display: flex; align-items: center; gap: 8px; width: 100%; }
  .num { width: 36px; height: 36px; border-radius: 50%; background: ${D.head}; color: #fff; display: grid; place-items: center; font-weight: 800; font-size: 13px; flex: none; }
  .pill { background: #6b7280; color: #fff; border-radius: 5px; padding: 1px 9px; font-size: 9.5px; font-weight: 800; }
  .titlebox { background: ${D.head}; color: #fff; border-radius: 10px; padding: 8px 12px; text-align: center; font-weight: 800; font-size: 12px; width: 100%; }
  .produit { margin-top: 16px; border: 1px solid ${D.line}; border-radius: 10px; overflow: hidden; }
  .produit h2 { margin: 0; padding: 9px 13px; background: ${D.head}; color: #fff; font-size: 13px; }
  .produit .note { padding: 7px 13px; background: ${D.beigeLight}; font-size: 10.5px; line-height: 1.8; border-bottom: 1px solid ${D.line}; }
  .produit .part { padding: 9px 13px; border-bottom: 1px solid ${D.line}; font-size: 11.5px; line-height: 1.95; }
  .produit .phase { display: inline-block; background: ${D.nest}; color: #fff; border-radius: 5px; padding: 1px 7px; font-size: 10px; font-weight: 700; margin-bottom: 4px; }
  .sign { margin-top: 16px; background: ${D.beige}; border: 1px solid ${D.line}; border-radius: 10px; padding: 11px 14px;
          font-size: 12px; font-weight: 700; display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; }
  .src { margin-top: 9px; font-size: 10.5px; color: #4c5b54; line-height: 1.8; }
  .pdfsheet { border: 1px solid ${D.line}; border-radius: 10px; overflow: hidden; margin-top: 10px; }
  .pdfnote { margin: 0; padding: 7px 11px; background: ${D.beige}; color: ${D.head}; font-size: 10.5px; font-weight: 700; }
  .pdfline { margin: 0; padding: 4px 11px; border-bottom: 1px solid ${D.beige}; font-size: 11.5px; font-weight: 600; line-height: 1.9; }
  @media print { body { background: #fff; padding: 0; } .sheet { border: none; border-radius: 0; max-width: none; } @page { size: A4; margin: 12mm; } }
`;

function cellToHtml(c: SrcCell, flat?: boolean): string {
  const parts: string[] = [];
  for (const b of c.box ?? [])
    parts.push(flat ? `<p class="boxflat">${esc(b)}</p>` : `<span class="box">${esc(b)}</span>`);
  for (const seg of detectSegments((c.lines ?? []).join("\n"))) {
    if (seg.kind === "text") for (const l of seg.text.split("\n")) parts.push(`<p>${esc(l).replace(/\n/g, "<br />")}</p>`);
    else parts.push(detectedTableToHtml(seg.table, { nested: true }));
  }
  for (const n of c.nested ?? []) parts.push(tableToHtml(n, true));
  return parts.join("");
}

function tableToHtml(t: SrcTable, nested?: boolean): string {
  const rows = t.rows;
  const headerIdx = rows.findIndex((r) => r.filter(isHeaderCell).length >= 2);
  const produitCol = headerIdx >= 0 ? rows[headerIdx].findIndex((c) => cellTexts(c).some(isProduitHeader)) : -1;
  const cols = Math.max(...rows.map((r) => r.length), 1);
  const headFirst = cleanLine(cellTexts(rows[headerIdx]?.[0])[0] ?? "");
  const stageCol = headerIdx >= 0 && /مراحل|وضعيات/.test(headFirst) ? 0 : -1;
  const twoCol = cols === 2;
  const BULLET = /^\s*[-=*•·<>=>]|^\s*\d+\s*[).\-]/;
  let head = headerIdx;
  if (head === -1 && nested && rows.length > 1) {
    const r0 = rows[0];
    if (r0.every((c) => { const t = cleanLine(cellTexts(c).join(" ")); return t.length <= 30 && !BULLET.test(t); }) && r0.some((c) => cellTexts(c).length)) head = 0;
  }
  const sums = twoCol ? [0, 1].map((ci) => rows.reduce((a, r) => a + cellTexts(r[ci]).join(" ").length, 0)) : [0, 0];
  const maxSum = Math.max(sums[0], sums[1], 1);
  const labelPair = twoCol && Math.min(sums[0], sums[1]) / maxSum <= 0.45;
  const labelCol = labelPair ? (sums[0] <= sums[1] ? 0 : 1) : -1;
  const rowHtml = (row: SrcCell[], ri: number) => {
      if (ri === 0 && row.length === 1 && cols > 1 && head !== 0) {
        return `<tr class="head"><th colspan="${cols}">${cellToHtml(row[0] ?? {})}</th></tr>`;
      }
      if (ri === head) {
        return `<tr class="head">${row.map((c) => `<th>${cellToHtml(c)}</th>`).join("")}</tr>`;
      }
      if (isTaqwimRow(row)) {
        const rest = row.slice(1).map((c) => cellToHtml(c)).join("<br />");
        return `<tr><td class="taqwim">${cellToHtml(row[0] ?? {})}</td><td class="taqwimbody" colspan="${Math.max(cols - 1, 1)}">${rest}</td></tr>`;
      }
      const merged = row.length === 1 && cols > 1;
      const lastSpan = row.length < cols ? cols - row.length + 1 : 1;
      return `<tr>${row
        .map((c, ci) => {
          const span = merged ? cols : ci === row.length - 1 ? lastSpan : 1;
          const first = ci === 0;
          const rowLabel = first && !merged && cols >= 3 && !(c.box ?? []).length && cleanLine(cellTexts(c).join(" ")).length <= 25;
          const isLabel2 = !merged && twoCol && ci === labelCol;
          const isValue2 = !merged && twoCol && labelPair && ci !== labelCol;
          const splittable = cellTexts(c).join(" ").length > 600 || (c.nested ?? []).length > 0;
          const cls = `${splittable ? "splittable " : ""}` + (merged
            ? "merged"
            : ci === produitCol
              ? "prod"
              : rowLabel
                ? "rowlab"
                : isLabel2
                  ? nested
                    ? "nlab"
                    : "label2"
                  : isValue2
                    ? nested
                      ? "nval"
                      : "label2val"
                    : nested
                      ? "nbody"
                      : ci === stageCol
                        ? "stage"
                        : "");
          return `<td class="${cls}"${span > 1 ? ` colspan="${span}"` : ""}>${cellToHtml(c, ci === produitCol)}</td>`;
        })
        .join("")}</tr>`;
  };
  const body = rows.map((row, ri) => (ri === head ? "" : rowHtml(row, ri))).join("\n");
  const thead = head >= 0 ? `<thead>\n${rowHtml(rows[head], head)}\n</thead>` : "";
  return `<table${nested ? ' class="nested" style="margin-top:6px"' : ""}>${thead}<tbody>\n${body}\n</tbody></table>`;
}

export function metaTableHtml(t?: SrcTable): string {
  if (!t) return "<span></span>";
  return `<table><tbody>${t.rows
    .map(
      (r) =>
        `<tr><th>${cellTexts(r[0]).map(esc).join("<br />")}</th><td class="${cellTexts(r[1]).length ? "" : "empty"}">${cellTexts(r[1])
          .map(esc)
          .join("<br />")}</td></tr>`,
    )
    .join("")}</tbody></table>`;
}

export function importedToHtml(f: ImportedFiche, entry: CatalogEntry): string {
  const { slot } = entry;
  const lead = docLead(f);
  const headBand =
    lead.rest > 0
      ? `<div class="dochead">${metaTableHtml(lead.metas.find((t) => cellTexts(t.rows[0]?.[0]).some((l) => l.includes("مادة"))) ?? lead.metas[0])}
         <div class="titlezone"><div class="titlerow"><span class="num">${esc(lead.number ?? slot.number)}</span>
         <span style="flex:1;display:flex;flex-direction:column;gap:4px;align-items:center">
         <span class="pill">${esc(lead.pill ?? "عنوان الدرس")}</span>
         <span class="titlebox">${esc(lead.title ?? slot.title)}</span></span></div></div>
         ${metaTableHtml(lead.metas.find((t) => t !== (lead.metas.find((x) => cellTexts(x.rows[0]?.[0]).some((l) => l.includes("مادة"))) ?? lead.metas[0])))}</div>`
      : "";
  const bodyBlocks = f.blocks.slice(lead.rest);
  const blocks =
    f.layout === "pdf"
      ? `<div class="pdfsheet"><p class="pdfnote">الوثيقة المصدر PDF — سطور النص بترتيبها الأصلي كما وردت في الملف، حرفيًا</p>${f.blocks
          .filter((b) => b.type === "para")
          .map((b) => `<p class="pdfline">${esc(b.text ?? "").replace(/\n/g, "<br />")}</p>`)
          .join("")}</div>`
      : bodyBlocks
          .map((b) => (b.type === "para" ? `<p class="para">${esc(b.text ?? "").replace(/\n/g, "<br />")}</p>` : b.table ? tableToHtml(b.table) : ""))
          .join("\n");
  const parts = collectProduit(f);
  const produit = parts.length
    ? `<div class="produit"><h2>المنتوج</h2>
       <p class="note">جُمعت أجزاء المنتوج من عمود «${esc(parts[0].header)}» في الجذاذة الأصلية بترتيبها وسياقها نفسه، ونُقلت حرفيًا دون حذف أو اختصار أو إعادة صياغة.</p>
       ${parts
         .map(
           (p) =>
             `<div class="part">${p.phase ? `<span class="phase">${esc(p.phase)}</span>` : ""}${cellToHtml(p.cell)}</div>`,
         )
         .join("")}
       </div>`
    : `<div class="produit"><h2>المنتوج</h2><p class="note">ورد المنتوج داخل نص الوثيقة الأصلية كما هو، ولم يُضف إليه أو يُحذف منه شيء.</p></div>`;

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>الجذاذة ${esc(slot.number)} — ${esc(slot.title)}</title>
<style>${DOC_CSS}</style>
</head>
<body>
<div class="sheet">
  <div class="masthead">
    <h1>${esc(SECTION_META.title)}</h1>
    <p>المادة: ${esc(SECTION_META.subject)} · المستوى: ${esc(SECTION_META.level)} · الإطار: ${esc(SECTION_META.frame)}<br />
       ${esc(SECTION_META.authorLabel)} — ${esc(TEACHER_SCHOOL)}</p>
  </div>
  <div class="pad">
    <p class="para"><strong>الجذاذة ${esc(slot.number)} — ${esc(slot.subject)}:</strong> ${esc(slot.title)}
       · ${esc(slot.cycle)} — ${esc(slot.unitTitle)} (مجزوءة ${esc(slot.module)})</p>
${headBand}
${blocks}
${produit}
    <div class="sign">
      <span>${esc(SECTION_META.authorLabel)} — ${esc(TEACHER_SCHOOL)}</span>
      <span>الجذاذة ${esc(slot.number)} · ${esc(slot.subject)} · ${esc(slot.cycle)}</span>
    </div>
    <p class="src">نُقلت هذه الجذاذة آليًا من وثيقة الأستاذ الأصلية: «${esc(f.source)}» — دون حذف أو اختصار أو إعادة صياغة أو تغيير في المصطلحات أو الأرقام أو ترتيب المراحل، مع تحقق آلي من مطابقة كل كلمة.</p>
  </div>
</div>
</body>
</html>
`;
}

function slugify(s: string) {
  return s
    .replace(/[()[\]{}«»"'.,;:!?؟،ـ]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function downloadEntry(entry: CatalogEntry) {
  if (typeof document === "undefined") return;
  const { slot, imported, fiche } = entry;
  const html = imported ? importedToHtml(imported, entry) : fiche ? ficheToHtml(fiche) : "";
  if (!html) return;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `جذاذة-${slot.number}-${slugify(imported ? slot.title : fiche!.title)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* ============================================================
   الجذاذة المبنية رقميًا (نموذج احتياطي إن لم تتوفر وثيقة أصلية)
   ============================================================ */
export function ficheToHtml(j: Jadada): string {
  const rows = j.segments
    .map(
      (s) =>
        `<tr><td class="first">${esc(s.phase)}</td><td>${s.objectives.map(esc).join("<br />")}</td><td>${s.management.map(esc).join("<br />")}</td><td class="prod">${s.supports.map(esc).join("<br />")}</td><td>${s.content.map(esc).join("<br />")}</td></tr>`,
    )
    .join("\n");
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8" /><title>${esc(j.title)}</title><style>${DOC_CSS}</style></head>
<body><div class="sheet"><div class="masthead"><h1>${esc(SECTION_META.title)}</h1><p>${esc(SECTION_META.authorLabel)} — ${esc(TEACHER_SCHOOL)}</p></div>
<div class="pad"><p class="para"><strong>${esc(j.number)} — ${esc(j.subject)}:</strong> ${esc(j.title)}</p>
<table><tbody><tr class="head"><th>مراحل إنجاز الدرس</th><th>أهداف التعلم</th><th>التدبير الديداكتيكي</th><th>الدعامات</th><th>المتنوع</th></tr>
${rows}</tbody></table>
<div class="sign"><span>${esc(SECTION_META.authorLabel)} — ${esc(TEACHER_SCHOOL)}</span><span>${esc(j.duration)} · ${esc(j.book)}</span></div>
${j.sourceNote ? `<p class="src">${esc(j.sourceNote)}</p>` : ""}
</div></div></body></html>`;
}

function FicheTables({ j }: { j: Jadada }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-brand-900/10 ring-1 ring-ink-900/10">
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: C.head }}>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white font-display text-sm font-black" style={{ color: C.head }}>
            {j.number}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-white/80">الجذاذة {j.number} · عنوان الدرس</p>
            <p className="font-display text-[13px] font-extrabold leading-snug text-white">{j.title}</p>
          </div>
        </div>
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
        <SrcTable
          t={{
            rows: [
              [
                { lines: ["مراحل إنجاز الدرس"] },
                { lines: ["أهداف التعلم المرتبطة بالنشاط"] },
                { lines: ["التدبير الديداكتيكي (أنشطة الأستاذ والمتعلم)"] },
                { lines: ["الدعامات الديداكتيكية"] },
                { lines: ["المتنوع"] },
              ],
              ...j.segments.map((s) => [
                { lines: [s.phase] },
                { lines: s.objectives },
                { lines: s.management },
                { lines: s.supports },
                { lines: s.content },
              ]),
              [{ lines: ["تقويم إجمالي"] }, { lines: j.taqwimIjmali }],
            ],
          }}
        />
        {j.references && j.references.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: C.goldLine }}>
            <p className="px-3 py-2 text-[11px] font-extrabold" style={{ background: C.gold, color: C.headDark }}>
              المراجع والصفحات المشار إليها في الكتاب المدرسي
            </p>
            <div className="p-3 text-[11px] font-semibold leading-relaxed text-ink-900" style={{ background: "#fffdf7" }}>
              {j.references.map((r) => (
                <p key={r}>{r}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   صفحة الجذاذة (مفتوحة بشكل مستقل)
   ============================================================ */
const STATUS_STYLE: Record<JadadaStatus, { icon: typeof CheckCircle2; chip: string }> = {
  original: { icon: CheckCircle2, chip: "bg-brand-600 text-white" },
  model: { icon: PenLine, chip: "bg-gold-100 text-gold-700 ring-1 ring-gold-300" },
  pending: { icon: Hourglass, chip: "bg-paper-warm text-ink-700 ring-1 ring-ink-900/10" },
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

function FichePage({ entry, onBack, go }: { entry: CatalogEntry; onBack: () => void; go: (r: Route) => void }) {
  const { slot, imported, fiche } = entry;
  const btn =
    "inline-flex items-center gap-1.5 rounded-xl border border-ink-900/10 bg-white px-3.5 py-2 text-[11px] font-extrabold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700";
  const ready = Boolean(imported || fiche);

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
          {ready && (
            <button type="button" onClick={() => downloadEntry(entry)} className={btn}>
              <Download className="size-3.5" />
              تحميل الجذاذة
            </button>
          )}
          {ready && (
            <button type="button" onClick={() => window.print()} className={btn}>
              <Printer className="size-3.5" />
              طباعة الجذاذة
            </button>
          )}
        </div>
      </div>

      <p className="mb-3 text-[10.5px] font-extrabold text-ink-500" data-no-print>
        {SECTION_META.title} › {slot.subject} › {slot.cycle} — {slot.unitTitle} › الجذاذة {slot.number}
      </p>

      <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-brand-900/10 ring-1 ring-ink-900/10">
        {/* ترويسة الطباعة (تظهر في الورق فقط) */}
        <div className="jadada-print-only px-5 py-3" style={{ background: D.head }}>
          <p className="text-[13px] font-black text-white">{SECTION_META.title}</p>
          <p className="mt-1 text-[10px] font-bold text-white/85">
            المادة: {SECTION_META.subject} · المستوى: {SECTION_META.level} · الإطار: {SECTION_META.frame} · {SECTION_META.authorLabel} — {TEACHER_SCHOOL}
          </p>
        </div>

        {/* تعريف الجذاذة داخل الموقع */}
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3" style={{ borderColor: C.line, background: C.beige }}>
          <span className="grid size-10 shrink-0 place-items-center rounded-full font-display text-sm font-black text-white" style={{ background: C.head }}>
            {slot.number}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold text-ink-500">
              الجذاذة {slot.number} · {slot.subject} · {slot.cycle} — {slot.unitTitle} (مجزوءة {slot.module})
            </p>
            <h1 className="font-display text-[15px] font-black leading-snug text-ink-900">{slot.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-1.5" data-no-print>
            <StatusBadge status={entry.status} />
          </div>
        </div>

        {imported ? (
          <>
            <Blocks f={imported} slot={slot} />
            <div className="px-3 pb-4 sm:px-4">
              <ProduitPanel f={imported} />
              <div
                className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3"
                style={{ background: D.beige, border: `1px solid ${D.line}` }}
              >
                <p className="text-[11px] font-extrabold text-ink-900">
                  {SECTION_META.authorLabel} — {TEACHER_SCHOOL}
                </p>
                <p className="inline-flex items-center gap-1.5 text-[10px] font-bold text-ink-600">
                  <FileText className="size-3" aria-hidden="true" />
                  الوثيقة الأصلية: {imported.source}
                </p>
              </div>
              <p className="mt-2 text-[10.5px] font-bold leading-relaxed text-ink-500">
                نُقلت هذه الجذاذة آليًا من وثيقة الأستاذ الأصلية دون حذف أو اختصار أو إعادة صياغة أو تغيير في المصطلحات أو
                الأرقام أو ترتيب المراحل، مع تحقق آلي من مطابقة كل كلمة بين المصدر والمعروض. بنية الجدول المعروضة هي بنية
                الوثيقة نفسها{imported.layout === "doc" ? " (ملف Word قديم: أُعيد بناء الجدول من فواصل الخلايا الأصلية)" : imported.layout === "pdf" ? " (ملف PDF: النص كما ورد سطرًا سطرًا)" : ""}.
              </p>
            </div>
          </>
        ) : fiche ? (
          <>
            <FicheTables j={fiche} />
            <div className="px-4 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3" style={{ background: C.gold, border: `1px solid ${C.goldLine}` }}>
                <p className="text-[11px] font-extrabold text-ink-900">
                  {SECTION_META.authorLabel} — {TEACHER_SCHOOL}
                </p>
                <p className="inline-flex items-center gap-1.5 text-[10px] font-bold text-ink-600">
                  <Clock3 className="size-3" aria-hidden="true" />
                  {fiche.duration} · المرجع: {fiche.book}
                </p>
              </div>
              {fiche.sourceNote && <p className="mt-2 text-[10.5px] font-bold leading-relaxed text-ink-500">{fiche.sourceNote}</p>}
            </div>
          </>
        ) : (
          <div className="px-4 pb-5 pt-4 sm:px-5">
            <div className="rounded-2xl border border-dashed p-6 text-center" style={{ borderColor: C.line, background: C.beige }}>
              <Hourglass className="mx-auto size-7" style={{ color: C.olive }} aria-hidden="true" />
              <p className="mt-3 font-display text-sm font-extrabold text-ink-900">محتوى هذه الجذاذة في انتظار إدراج الوثيقة الأصلية</p>
              <p className="mx-auto mt-2 max-w-2xl text-[11.5px] font-bold leading-relaxed text-ink-700">
                خانة الدرس مسجّلة هنا في ترتيبها الرسمي داخل المقرر (الجذاذة {slot.number} — {slot.title})، ولم يُؤلَّف أي
                محتوى بديل احترامًا لمبدأ المطابقة الحرفية مع جذاذات الأستاذ.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <StatusBadge status="pending" />
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-extrabold text-ink-700 ring-1 ring-ink-900/10">
                  {SECTION_META.authorLabel}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" data-no-print>
        {ready && (
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
              onClick={() => downloadEntry(entry)}
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

const normalize = (s: string) =>
  s
    .replace(/[\u064B-\u0652\u0640\u200f\u200e]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .toLowerCase();

export default function Jadadat({ level, open, go }: JadadatProps) {
  const [activeLevel, setActiveLevel] = useState<string>(level && JADADA_LEVELS.some((l) => l.id === level) ? level : "tc");
  const [subject, setSubject] = useState<SubjectFilter>("الكل");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const entry = useMemo(() => (open ? getCatalogEntry(open) : undefined), [open]);

  const stats = useMemo(() => {
    const total = TC_SCI_CATALOG.length;
    const ready = TC_SCI_CATALOG.filter((e) => e.imported || e.fiche).length;
    const original = TC_SCI_CATALOG.filter((e) => e.status === "original").length;
    const perSubject = SUBJECTS.map((s) => ({
      subject: s,
      total: TC_SCI_CATALOG.filter((e) => e.slot.subject === s).length,
      ready: TC_SCI_CATALOG.filter((e) => e.slot.subject === s && (e.imported || e.fiche)).length,
    }));
    return { total, ready, original, pending: total - ready, perSubject };
  }, []);

  const q = normalize(query.trim());
  const visible = useMemo(() => {
    if (activeLevel !== "tc") return [];
    return TC_SCI_CATALOG.filter((e) => {
      if (subject !== "الكل" && e.slot.subject !== subject) return false;
      const isReady = Boolean(e.imported || e.fiche);
      if (statusFilter === "ready" && !isReady) return false;
      if (statusFilter === "pending" && isReady) return false;
      if (!q) return true;
      const hay = normalize(
        [
          e.slot.title,
          e.slot.unitTitle,
          e.slot.cycle,
          e.slot.subject,
          `الجذاذة ${e.slot.number}`,
          e.slot.tag ?? "",
          e.sourceFile ?? "",
          e.imported ? e.imported.source : "",
          e.fiche?.title ?? "",
          catalogText(e),
        ].join(" "),
      );
      return hay.includes(q);
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

  const grouped = SUBJECTS.map((s) => ({
    subject: s,
    units: TC_SCI_UNITS.filter((u) => u.subject === s).map((u) => ({
      unit: u,
      items: visible.filter((e) => e.slot.unitId === u.id),
    })),
  })).filter((g) => g.units.some((u) => u.items.length > 0));

  const chipBase = "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-extrabold transition-colors";

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
                <dd className="font-extrabold text-ink-900">{v}</dd>
              </div>
            ))}
          </dl>

          <p
            className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black"
            style={{ background: C.gold, border: `1px solid ${C.goldLine}`, color: C.headDark }}
          >
            <PenLine className="size-4" aria-hidden="true" />
            {SECTION_META.authorLabel}
            <span className="font-bold text-ink-700">— {TEACHER_SCHOOL}</span>
          </p>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-500">
            جذاذات المستوى كاملة حسب المقرر المغربي: <span className="font-extrabold text-ink-900">13 جذاذة في التاريخ</span>{" "}
            و<span className="font-extrabold text-ink-900">12 جذاذة في الجغرافيا</span>، مصنّفة حسب المادة والدورة والوحدة
            وحسب ترتيب الدروس. كل جذاذة هي وثيقتك الأصلية نفسها: نُقلت آليًا دون حذف أو اختصار أو إعادة صياغة، وتُفتح في صفحة
            مستقلة وتُطبع أو تُحمَّل.
          </p>
        </div>

        <div className="grid gap-px border-t sm:grid-cols-4" style={{ borderColor: C.line, background: C.line }}>
          {[
            { k: "خانات الجذاذات", v: `${stats.total}`, s: "حسب المقرر الرسمي" },
            { k: "جذاذات مُدرجة", v: `${stats.ready}`, s: `${stats.perSubject[0].ready} تاريخ · ${stats.perSubject[1].ready} جغرافيا` },
            { k: "مطابقة للوثيقة الأصلية", v: `${stats.original}`, s: "تفريغ آلي مُتحقَّق منه" },
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

      {/* ===== قاعدة المنتوج ===== */}
      <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: C.goldLine, background: C.gold }}>
        <h2 className="flex items-center gap-2 font-display text-sm font-extrabold" style={{ color: C.headDark }}>
          <ScrollText className="size-4" aria-hidden="true" />
          قاعدة المنتوج داخل الجذاذات
        </h2>
        <p className="mt-2 text-[11.5px] font-bold leading-relaxed text-ink-700">
          يُحافظ على المنتوج (المنتوج النهائي للدرس، الخلاصة، الاستنتاج، التركيب، الخطاطة، الجدول التركيبي، الفقرة
          التركيبية، والعناصر التي يُطلب من المتعلم إنتاجها) كما ورد في الجذاذة الأصلية تمامًا: لا تأليف ولا تلخيص ولا إعادة
          صياغة ولا تغيير في المصطلحات أو الأرقام أو التواريخ أو ترتيب العناصر. وإن كان المنتوج موزعًا بين عدة مراحل، تُجمع
          أجزاؤه كما وردت في المصدر وبترتيبها وسياقها، وتُعرض في موضع واضح بعنوان «المنتوج» مع بقائها في مكانها الأصلي داخل
          الجدول. وإذا لم يرد منتوج صريح في الوثيقة، لا يُنشأ منتوج بديل.
        </p>
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
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${active ? "bg-white/20 text-white" : "bg-brand-50 text-brand-700"}`}>
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
          <p className="font-display text-sm font-extrabold text-ink-900">جذاذات هذا المستوى في الإعداد</p>
          <p className="mt-2 text-xs text-ink-500">
            القسم المتكامل المتوفر حاليًا: {SECTION_META.title} (التاريخ والجغرافيا) — {SECTION_META.authorLabel}.
          </p>
        </div>
      ) : (
        <>
          {/* ===== أدوات البحث والتصنيف ===== */}
          <div
            className="sticky top-2 z-20 mt-6 rounded-2xl border border-ink-900/10 bg-white/95 p-3 shadow-lg shadow-brand-900/5 backdrop-blur"
            data-no-print
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-ink-400" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث في الجذاذات: عنوان الدرس، الوحدة، المنتوج، التدبير، الدعامات، الصفحات…"
                  className="w-full rounded-xl border border-ink-900/10 bg-white py-2.5 pe-9 ps-9 text-xs font-bold text-ink-900 outline-none transition-colors placeholder:font-semibold placeholder:text-ink-400 focus:border-brand-400"
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
                      <span className={`rounded-full px-1.5 text-[9.5px] font-black ${on ? "bg-white/25" : "bg-brand-50 text-brand-700"}`}>{n}</span>
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
          </div>

          {/* ===== اللائحة ===== */}
          {grouped.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-ink-900/15 bg-white p-8 text-center">
              <p className="font-display text-sm font-extrabold text-ink-900">لا توجد جذاذة مطابقة لبحثك</p>
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
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-2xl px-4 py-2.5" style={{ background: C.head }}>
                        <h3 className="font-display text-[13px] font-extrabold text-white">
                          {unit.cycle} — {unit.title}
                        </h3>
                        <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-black text-white/90">
                          مجزوءة {unit.module} · {items.length} جذاذة
                        </span>
                      </div>

                      <div className="grid gap-3 rounded-b-2xl border border-t-0 border-ink-900/10 bg-white/60 p-3 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((e) => {
                          const { slot } = e;
                          const ready = Boolean(e.imported || e.fiche);
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => pickFiche(slot.id)}
                              aria-label={`الجذاذة ${slot.number}: ${slot.title}`}
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
                                    {slot.title}
                                  </h4>
                                </div>
                              </div>

                              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                <StatusBadge status={e.status} compact />
                                {e.imported && (
                                  <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-ink-500">
                                    <FileText className="size-3" aria-hidden="true" />
                                    {e.imported.layout === "pdf" ? "PDF" : e.imported.layout === "doc" ? "Word 97" : "Word"}
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

          {/* ===== ملاحظة الأمانة والإدراج ===== */}
          <section className="mt-9 rounded-2xl border border-ink-900/10 bg-white p-5">
            <h2 className="font-display text-sm font-extrabold text-ink-900">كيف أُدرجت هذه الجذاذات؟</h2>
            <p className="mt-2 text-[11.5px] font-bold leading-relaxed text-ink-700">
              فُرّغت الجذاذات آليًا من وثائق الأستاذ الأصلية (مجلد «منار في التاريخ والجغرافيا») ببرنامج{" "}
              <code className="rounded bg-brand-50 px-1.5 py-0.5 text-[10.5px] font-black text-brand-700">scripts/import-jadadat.py</code>{" "}
              الذي ينقل كل فقرة وخلية وجدول متداخل وصندوق نص كما هو، ثم يتحقق آليًا من ألا تضيع كلمة وألا تُضاف كلمة غير
              موجودة في الأصل قبل النشر. لإدراج جذاذة جديدة: توضع وثيقتها في المجلد، ويضاف سطر في{" "}
              <code className="rounded bg-brand-50 px-1.5 py-0.5 text-[10.5px] font-black text-brand-700">scripts/jadadat-sources-tc-sci.py</code>{" "}
              يربطها برقمها في اللائحة الرسمية، ثم يُعاد التوليد.
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

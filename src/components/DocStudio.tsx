/* ============================================================
   محرر الوثائق (لوحة الإدارة)
   ------------------------------------------------------------
   - الصق/اكتب محتوى وثيقة (درس، تمرين، معطيات منسوخة من PDF…)
   - «تحليل تلقائي»: النظام الموحد يميّز النص العادي من البيانات
     المنظمة ويحوّل الواضحة منها إلى جداول حقيقية قابلة للتعديل.
   - حدّد نصًا ثم «تحويل إلى جدول»: تحليل قسري للتحديد إلى جدول
     قابل للتعديل.
   - إنشاء جدول يدويًا: إضافة صف/عمود، حذف صف/عمود، تعديل الخلايا
     والعناوين، إعادة ترتيب الأعمدة، وتحويل الصف الأول إلى ترويسة.
   - المسودة تُحفظ تلقائيًا في المتصفح، مع تصدير HTML ونسخه.
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Download,
  Eraser,
  Grid3X3,
  Plus,
  Rows3,
  ScanSearch,
  Table2,
  Trash2,
} from "lucide-react";
import {
  detectSegments,
  detectedTableToHtml,
  parseSelectionToTable,
  seriesFromTable,
  type DetectedTable,
} from "../lib/tableDetect";
import { AutoTableView } from "./SmartText";
import SectionHeader from "./SectionHeader";

type Item = { kind: "text"; text: string } | { kind: "table"; table: DetectedTable };

const LS_KEY = "talil_docstudio_v1";

const emptyTable = (): DetectedTable => ({
  head: ["العمود 1", "العمود 2"],
  rows: [
    ["", ""],
    ["", ""],
  ],
  timeSeries: false,
});

/* أدوات تعديل الجدول (لا تغيّر أي خلية أخرى ولا تختصر بيانات) */
const clone = (t: DetectedTable): DetectedTable => ({ ...t, head: [...t.head], rows: t.rows.map((r) => [...r]) });
function addRow(t: DetectedTable): DetectedTable {
  const n = clone(t);
  n.rows.push(n.head.map(() => ""));
  return n;
}
function delRow(t: DetectedTable, ri: number): DetectedTable {
  const n = clone(t);
  n.rows.splice(ri, 1);
  return n;
}
function addCol(t: DetectedTable): DetectedTable {
  const n = clone(t);
  n.head.push(`العمود ${n.head.length + 1}`);
  n.rows.forEach((r) => r.push(""));
  return n;
}
function delCol(t: DetectedTable, ci: number): DetectedTable {
  const n = clone(t);
  n.head.splice(ci, 1);
  n.rows.forEach((r) => r.splice(ci, 1));
  return n;
}
function moveCol(t: DetectedTable, ci: number, dir: -1 | 1): DetectedTable {
  const n = clone(t);
  const j = ci + dir;
  if (j < 0 || j >= n.head.length) return n;
  const sw = <T,>(a: T[]) => {
    const tmp = a[ci];
    a[ci] = a[j];
    a[j] = tmp;
  };
  sw(n.head);
  n.rows.forEach(sw);
  return n;
}
function setCell(t: DetectedTable, ri: number, ci: number, v: string): DetectedTable {
  const n = clone(t);
  if (ri === -1) n.head[ci] = v;
  else n.rows[ri][ci] = v;
  return n;
}
/** إعادة حساب علم البيانات الزمنية بعد التحرير (تُستعمل لاحقًا لتوليد مبيان) */
function refreshFlags(t: DetectedTable): DetectedTable {
  const n = clone(t);
  n.timeSeries = n.rows.length > 0 && n.rows.every((r) => /^(?:القرن\s*)?(?:\d{3,4}|[٠-٩]{3,4})/.test((r[0] ?? "").trim()));
  return n;
}
function tableToText(t: DetectedTable): string {
  return [t.head.join(" | "), ...t.rows.map((r) => r.join(" | "))].join("\n");
}

export default function DocStudio() {
  const [raw, setRaw] = useState("");
  const [items, setItems] = useState<Item[] | null>(null);
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const textRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});

  /* حفظ المسودة تلقائيًا */
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ raw, items }));
      setSaved(true);
      const id = setTimeout(() => setSaved(false), 1200);
      return () => clearTimeout(id);
    } catch {
      /* التخزين غير متاح */
    }
  }, [raw, items]);

  /* استرجاع المسودة مرة واحدة */
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(LS_KEY) ?? "null");
      if (d && typeof d.raw === "string" && d.raw.trim()) {
        setRaw(d.raw);
        if (Array.isArray(d.items)) setItems(d.items);
      }
    } catch {
      /* لا مسودة */
    }
  }, []);

  const updateTable = (idx: number, t: DetectedTable) =>
    setItems((prev) => (prev ? prev.map((it, i) => (i === idx ? { kind: "table", table: t } : it)) : prev));

  /* تحليل تلقائي للنص الكامل */
  const analyze = () => {
    const segs = detectSegments(raw);
    setItems(segs.map((s) => (s.kind === "text" ? { kind: "text", text: s.text } : { kind: "table", table: s.table })));
  };

  /* تحويل التحديد داخل محرر نص إلى جدول (تحليل قسري) */
  const convertSelection = (idx: number) => {
    const ta = textRefs.current[idx];
    const it = items?.[idx];
    if (!ta || !it || it.kind !== "text") return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = (end > start ? it.text.slice(start, end) : it.text).trim();
    if (!sel) return;
    const table = parseSelectionToTable(sel);
    const before = end > start ? it.text.slice(0, start) : "";
    const after = end > start ? it.text.slice(end) : "";
    const next: Item[] = [];
    if (before.trim()) next.push({ kind: "text", text: before.replace(/\n+$/, "") });
    next.push({ kind: "table", table });
    if (after.trim()) next.push({ kind: "text", text: after.replace(/^\n+/, "") });
    setItems((prev) => (prev ? [...prev.slice(0, idx), ...next, ...prev.slice(idx + 1)] : next));
  };

  /* تصدير HTML كامل بنفس تنسيق الموقع */
  const exportHtml = useMemo(() => {
    const body = (items ?? [])
      .map((it) =>
        it.kind === "text"
          ? it.text.split("\n").map((l) => `<p>${l.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`).join("")
          : detectedTableToHtml(it.table),
      )
      .join("\n");
    return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>وثيقة — إعداد وإنجاز: الأستاذ عماد طليل</title>
<style>
  body { font-family: "Noto Kufi Arabic", "Segoe UI", Tahoma, sans-serif; background: #f7f5ef; color: #0b1d17; padding: 24px; line-height: 1.9; }
  .doc { max-width: 860px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 28px; box-shadow: 0 8px 30px rgba(0,0,0,.08); }
  h1 { font-size: 18px; color: #0c6147; }
  .sig { margin-top: 18px; font-size: 12px; font-weight: 800; color: #8f5f1c; }
  .auto-table { border-collapse: separate; border-spacing: 0; width: 100%; margin: 10px 0; border-top: 1px solid #a9dcc4; border-inline-start: 1px solid #a9dcc4; font-size: 13px; }
  .auto-table caption { color: #0c6147; font-weight: 800; text-align: start; padding: 4px 8px; }
  .auto-table th, .auto-table td { border-bottom: 1px solid #a9dcc4; border-inline-end: 1px solid #a9dcc4; padding: 6px 10px; text-align: start; overflow-wrap: break-word; }
  .auto-table thead th { background: #0f7c5b; color: #fff; }
  .auto-table td.num { font-weight: 700; white-space: nowrap; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
</style>
</head>
<body>
<div class="doc">
<h1>وثيقة</h1>
${body}
<p class="sig">إعداد وإنجاز: الأستاذ عماد طليل — ثانوية القدس، القنيطرة</p>
</div>
</body>
</html>`;
  }, [items]);

  const download = () => {
    const blob = new Blob([exportHtml], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "وثيقة-جداول.html";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const seriesCount = (items ?? []).filter((it) => it.kind === "table" && seriesFromTable(it.table)).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <SectionHeader
        eyebrow="لوحة الإدارة"
        title="محرر الوثائق"
        align="start"
        description="الصق محتوى وثيقة (من كتاب مدرسي، PDF أو معالجة نصوص): البيانات المنظمة الواضحة تتحول تلقائيًا إلى جداول HTML حقيقية قابلة للتعديل، والنص العادي يبقى نصًا — بلا أي تغيير في الأرقام أو الرموز."
      />

      {/* ===== شريط الأدوات ===== */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button type="button" onClick={analyze} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-brand-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition-transform hover:-translate-y-0.5">
          <ScanSearch className="size-4" aria-hidden="true" /> تحليل تلقائي
        </button>
        <button
          type="button"
          onClick={() => setItems((prev) => [...(prev ?? detectSegments(raw).map((s) => (s.kind === "text" ? ({ kind: "text", text: s.text } as Item) : ({ kind: "table", table: s.table } as Item)))), { kind: "table", table: emptyTable() }])}
          className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-white px-4 py-2.5 text-xs font-extrabold text-brand-700 transition-colors hover:border-brand-500"
        >
          <Grid3X3 className="size-4" aria-hidden="true" /> إضافة جدول يدويًا
        </button>
        {items && (
          <button type="button" onClick={() => setPreview((v) => !v)} className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-white px-4 py-2.5 text-xs font-extrabold text-brand-700 transition-colors hover:border-brand-500">
            <Table2 className="size-4" aria-hidden="true" /> {preview ? "العودة إلى التحرير" : "معاينة كما في الموقع"}
          </button>
        )}
        {items && (
          <>
            <button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-xl border border-gold-400 bg-gold-50 px-4 py-2.5 text-xs font-extrabold text-gold-700 transition-colors hover:bg-gold-100">
              <Download className="size-4" aria-hidden="true" /> تحميل HTML
            </button>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(exportHtml)}
              className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-white px-4 py-2.5 text-xs font-extrabold text-ink-700 transition-colors hover:border-ink-900/25"
            >
              <Copy className="size-4" aria-hidden="true" /> نسخ HTML
            </button>
            <button
              type="button"
              onClick={() => { setItems(null); setRaw(""); try { localStorage.removeItem(LS_KEY); } catch { /* */ } }}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-extrabold text-red-600 transition-colors hover:bg-red-50"
            >
              <Eraser className="size-4" aria-hidden="true" /> مسح الكل
            </button>
          </>
        )}
        <span className="ms-auto text-[11px] font-bold text-ink-500">
          {saved ? "✓ حُفظت المسودة تلقائيًا" : "المسودة تُحفظ تلقائيًا في متصفحك"}
        </span>
      </div>

      {seriesCount > 0 && (
        <p className="mt-3 rounded-xl bg-brand-50 px-4 py-2.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200">
          📈 في الوثيقة {seriesCount} مجموعة بيانات زمنية (سنة/قيمة) جاهزة لتوليد مبيان لاحقًا.
        </p>
      )}

      {/* ===== المدخل ===== */}
      {!items && (
        <div className="mt-6 rounded-2xl border border-ink-900/8 bg-white p-5">
          <label htmlFor="doc-raw" className="text-sm font-extrabold text-ink-900">محتوى الوثيقة</label>
          <textarea
            id="doc-raw"
            dir="rtl"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={14}
            placeholder={"مثال:\nنسبة سكان الحواضر من مجموع سكان المغرب:\n1982: 40٪ | 1994: 48٪ | 2004: 55٪ | 2014: 60٪ | 2024: 65٪\n\nعرف المغرب تطوراً مهماً في نسبة التمدن خلال العقود الأخيرة."}
            className="mt-3 w-full resize-y rounded-xl border border-ink-900/12 bg-paper-warm/40 p-4 text-sm leading-loose text-ink-900 outline-none transition-colors focus:border-brand-400 focus:bg-white"
          />
          <p className="mt-2 text-[11px] font-bold text-ink-500">
            يفهم المحرر: الفاصل <span dir="ltr" className="font-black">|</span>، النمط «السنة: القيمة»، علامات التبويب، والأسطر متعددة الأعمدة. الفقرة العادية تبقى نصًا.
          </p>
        </div>
      )}

      {/* ===== التحرير / المعاينة ===== */}
      {items && preview && (
        <div className="mt-6 space-y-3 rounded-2xl border border-ink-900/8 bg-white p-6">
          {items.map((it, i) =>
            it.kind === "text" ? (
              <p key={i} className="whitespace-pre-line text-sm leading-loose text-ink-700">{it.text}</p>
            ) : (
              <AutoTableView key={i} t={it.table} />
            ),
          )}
          <p className="border-t border-ink-900/8 pt-3 text-[11px] font-extrabold text-gold-700">إعداد وإنجاز: الأستاذ عماد طليل — ثانوية القدس، القنيطرة</p>
        </div>
      )}

      {items && !preview && (
        <div className="mt-6 space-y-5">
          {items.map((it, idx) =>
            it.kind === "text" ? (
              <div key={idx} className="rounded-2xl border border-ink-900/8 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-ink-900/5 px-3 py-1 text-[11px] font-extrabold text-ink-700">نص عادي</span>
                  <button type="button" onClick={() => convertSelection(idx)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-[11px] font-extrabold text-white transition-colors hover:bg-brand-700">
                    <Table2 className="size-3.5" aria-hidden="true" /> تحويل إلى جدول (التحديد أو كل النص)
                  </button>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => (prev ? prev.filter((_, i) => i !== idx) : prev))}
                    className="ms-auto inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-extrabold text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" /> حذف
                  </button>
                </div>
                <textarea
                  ref={(el) => { textRefs.current[idx] = el; }}
                  dir="rtl"
                  value={it.text}
                  onChange={(e) => setItems((prev) => (prev ? prev.map((x, i) => (i === idx ? { kind: "text", text: e.target.value } : x)) : prev))}
                  rows={Math.max(2, it.text.split("\n").length + 1)}
                  className="mt-3 w-full resize-y rounded-xl border border-ink-900/12 bg-paper-warm/40 p-3 text-sm leading-loose text-ink-900 outline-none focus:border-brand-400 focus:bg-white"
                />
              </div>
            ) : (
              <div key={idx} className="rounded-2xl border border-brand-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-extrabold text-brand-700 ring-1 ring-brand-200">
                    جدول حقيقي {it.table.timeSeries ? "• بيانات زمنية 📈" : ""}
                  </span>
                  <button type="button" onClick={() => updateTable(idx, addRow(it.table))} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 px-3 py-1.5 text-[11px] font-extrabold text-brand-700 hover:bg-brand-50">
                    <Plus className="size-3.5" aria-hidden="true" /> صف
                  </button>
                  <button type="button" onClick={() => updateTable(idx, addCol(it.table))} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 px-3 py-1.5 text-[11px] font-extrabold text-brand-700 hover:bg-brand-50">
                    <Plus className="size-3.5" aria-hidden="true" /> عمود
                  </button>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => (prev ? prev.map((x, i) => (i === idx ? { kind: "text", text: tableToText(it.table) } : x)) : prev))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink-900/10 px-3 py-1.5 text-[11px] font-extrabold text-ink-700 hover:bg-ink-900/5"
                  >
                    <Rows3 className="size-3.5" aria-hidden="true" /> إرجاعه نصًا
                  </button>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => (prev ? prev.filter((_, i) => i !== idx) : prev))}
                    className="ms-auto inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-extrabold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" /> حذف الجدول
                  </button>
                </div>

                <div className="mt-3 overflow-x-auto rounded-lg ring-1 ring-brand-200">
                  <table className="w-full min-w-[520px] border-collapse text-sm">
                    <thead>
                      <tr className="bg-brand-600 text-white">
                        {it.table.head.map((h, ci) => (
                          <th key={ci} className="border border-brand-700 p-1 align-middle">
                            <div className="flex items-center justify-center gap-1">
                              <button type="button" title="تحريك العمود يمينًا" onClick={() => updateTable(idx, moveCol(it.table, ci, 1))} className="rounded p-0.5 hover:bg-white/20">
                                <ArrowRight className="size-3.5" aria-hidden="true" />
                              </button>
                              <input
                                dir="rtl"
                                value={h}
                                onChange={(e) => updateTable(idx, setCell(it.table, -1, ci, e.target.value))}
                                className="w-24 rounded bg-white/15 px-1.5 py-1 text-center text-[12px] font-extrabold text-white outline-none placeholder:text-white/60 focus:bg-white/25"
                                placeholder="عنوان العمود"
                              />
                              <button type="button" title="تحريك العمود يسارًا" onClick={() => updateTable(idx, moveCol(it.table, ci, -1))} className="rounded p-0.5 hover:bg-white/20">
                                <ArrowLeft className="size-3.5" aria-hidden="true" />
                              </button>
                              <button type="button" title="حذف العمود" onClick={() => it.table.head.length > 1 && updateTable(idx, delCol(it.table, ci))} className="rounded p-0.5 hover:bg-red-500/70">
                                <Trash2 className="size-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </th>
                        ))}
                        <th className="w-10 border border-brand-700" />
                      </tr>
                    </thead>
                    <tbody>
                      {it.table.rows.map((r, ri) => (
                        <tr key={ri} className={ri % 2 ? "bg-brand-50/50" : "bg-white"}>
                          {r.map((cell, ci) => (
                            <td key={ci} className="border border-ink-900/8 p-1">
                              <input
                                dir="rtl"
                                value={cell}
                                onChange={(e) => updateTable(idx, refreshFlags(setCell(it.table, ri, ci, e.target.value)))}
                                className="w-full rounded px-2 py-1 text-[13px] text-ink-900 outline-none focus:bg-brand-50 focus:ring-1 focus:ring-brand-300"
                              />
                            </td>
                          ))}
                          <td className="border border-ink-900/8 p-1 text-center">
                            <button type="button" title="حذف الصف" onClick={() => updateTable(idx, delRow(it.table, ri))} className="rounded p-1 text-red-500 hover:bg-red-50">
                              <Trash2 className="size-3.5" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-[11px] font-bold text-ink-500">
                  العناوين في صف مستقل (thead)، والخانات تُعدَّل مباشرة، والأعمدة تُرتَّب بالأسهم. الأرقام والرموز (٪، مليون، كم²…) تُحفظ كما هي.
                </p>
              </div>
            ),
          )}
        </div>
      )}
    </main>
  );
}

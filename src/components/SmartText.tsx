/* ============================================================
   SmartText — النظام الموحد لعرض الوثائق
   ------------------------------------------------------------
   يمرّ النص على محرك الاكتشاف (src/lib/tableDetect.ts):
   - النص العادي → فقرة <p> كما هو.
   - البيانات المنظمة الواضحة → جدول HTML حقيقي
     <table><thead><tbody><tr><th><td> متجاوب RTL بحدود واضحة،
     عناوين في صف مستقل، أرقام بمحاذاة واضحة (tabular-nums)،
     وتمرير أفقي على الهاتف عند الحاجة.
   نمطان: "brand" (أخضر الموقع للدروس والتقويمات) و
   "doc" (بني/بيج وثائق الجذاذات الأصلية).
   ============================================================ */
import { detectSegments, numericish, type DetectedTable } from "../lib/tableDetect";

export function AutoTableView({ t, variant = "brand" }: { t: DetectedTable; variant?: "brand" | "doc" }) {
  const wide = t.head.length >= 4;
  return (
    <div className={`my-2 overflow-x-auto rounded-lg ${variant === "brand" ? "ring-1 ring-brand-200" : "ring-1 ring-[#d9c39b]"}`}>
      <table
        className={`auto-table w-full text-sm ${variant === "doc" ? "doc" : ""}`}
        style={{ minWidth: wide ? 480 : undefined }}
        {...(t.timeSeries ? { "data-time-series": "1" } : {})}
      >
        {t.title ? <caption className="px-2 pb-1 text-start text-xs font-extrabold">{t.title}</caption> : null}
        <thead>
          <tr>
            {t.head.map((h, i) => (
              <th key={i} scope="col">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci} className={numericish(c) ? "num" : undefined}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SmartText({
  text,
  className,
  variant = "brand",
}: {
  text: string;
  className?: string;
  variant?: "brand" | "doc";
}) {
  const segments = detectSegments(text);
  return (
    <>
      {segments.map((s, i) =>
        s.kind === "text" ? (
          <p key={i} className={`whitespace-pre-line ${className ?? ""}`}>
            {s.text}
          </p>
        ) : (
          <AutoTableView key={i} t={s.table} variant={variant} />
        ),
      )}
    </>
  );
}

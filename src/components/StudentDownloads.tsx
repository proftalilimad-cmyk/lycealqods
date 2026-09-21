/* ============================================================
   أزرار تحميل ملف التلميذ(ة) — التقويم التشخيصي
   ------------------------------------------------------------
   مكوّن مشترك يستعمله مكانان:
     • صفحة نتيجة التلميذ(ة) بعد إنهاء التقويم (نمط «card»).
     • جدول نتائج لوحة الأستاذ، سطر لكل تلميذ(ة) (نمط «row»).

   الأزرار الخمسة المطلوبة:
     1) أجوبة التلميذ PDF      → نافذة طباعة باسم الملف المطلوب
     2) تقرير النتائج PDF      → التحليل التربوي والتوصيات
     3) طباعة الملف الفردي     → الغلاف + الأجوبة + التقرير
     4) Word (.doc)            → يُفتح في Word / LibreOffice
     5) Excel (.xlsx)          → الأجوبة سؤالًا بسؤال + ملخص

   اسم الملف تلقائي ومنظّم:
     اسم_التلميذ_رقم_التلميذ_التقويم_التشخيصي.pdf
   ============================================================ */
import { useState } from "react";
import { FileDown, FileSpreadsheet, FileText, FileType2, Printer } from "lucide-react";
import type { Submission } from "../types";
import { studentFileName } from "../lib/reportDoc";
import {
  studentAnswersPdf,
  studentExcelFile,
  studentHtmlFile,
  studentPrint,
  studentReportPdf,
  studentWordFile,
} from "../lib/reportExport";

interface StudentDownloadsProps {
  sub: Submission;
  /** card = أزرار موسّعة بالتسميات · row = أزرار مدمجة داخل جدول */
  variant?: "card" | "row";
  /** رسالة تظهر للأستاذ بعد كل عملية (اختياري) */
  onNotice?: (message: string) => void;
}

interface ActionDef {
  id: string;
  icon: typeof Printer;
  label: string;
  hint: string;
  run: () => void | Promise<void>;
  done: string;
}

export default function StudentDownloads({ sub, variant = "card", onNotice }: StudentDownloadsProps) {
  const [busy, setBusy] = useState<string | null>(null);

  const pdfName = studentFileName(sub, "pdf");

  const actions: ActionDef[] = [
    {
      id: "answers-pdf",
      icon: FileDown,
      label: "أجوبة PDF (صفحتان)",
      hint: `تحميل أجوبة التلميذ(ة) في PDF مختصر من صفحتين — الاسم المقترح: ${pdfName}`,
      run: () => studentAnswersPdf(sub),
      done: `فتحت نافذة طباعة أجوبة مختصرة من صفحتين — اختر «حفظ بصيغة PDF» وسيُقترح الاسم: ${pdfName}`,
    },
    {
      id: "report-pdf",
      icon: FileText,
      label: "تقرير PDF",
      hint: "تحميل تقرير النتائج PDF: النتيجة النهائية، تحليل القوة والضعف، توصيات الدعم",
      run: () => studentReportPdf(sub),
      done: `فتحت نافذة الطباعة لتقرير النتائج — الاسم المقترح: تقرير_${pdfName}`,
    },
    {
      id: "print",
      icon: Printer,
      label: "طباعة الملف",
      hint: "طباعة الملف الفردي الكامل: الغلاف + كل الأسئلة والإجابات + التقرير التربوي",
      run: () => studentPrint(sub),
      done: "فتحت نافذة طباعة الملف الفردي الكامل.",
    },
    {
      id: "word",
      icon: FileType2,
      label: "Word",
      hint: "تحميل الملف الفردي بصيغة Word (‎.doc) قابلة للتعديل",
      run: () => studentWordFile(sub),
      done: `نزّل الملف: ${studentFileName(sub, "doc")}`,
    },
    {
      id: "excel",
      icon: FileSpreadsheet,
      label: "Excel",
      hint: "تحميل الإجابات بصيغة Excel (‎.xlsx): الأجوبة سؤالًا بسؤال + ملخص النتيجة",
      run: () => studentExcelFile(sub),
      done: `نزّل الملف: ${studentFileName(sub, "xlsx")}`,
    },
  ];

  const run = async (a: ActionDef) => {
    setBusy(a.id);
    try {
      await a.run();
      onNotice?.(a.done);
    } catch {
      onNotice?.("تعذّر إنشاء الملف في هذا المتصفح — حاول مرة أخرى أو استعمل زر الطباعة.");
    } finally {
      setBusy(null);
    }
  };

  /* ---------- نمط السطر (داخل الجدول) ---------- */
  if (variant === "row") {
    return (
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            title={a.hint}
            aria-label={a.hint}
            disabled={busy !== null}
            onClick={() => run(a)}
            className="inline-grid size-8 place-items-center rounded-lg border border-ink-900/10 bg-white text-brand-700 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 disabled:opacity-40"
          >
            <a.icon className="size-4" aria-hidden="true" />
            {busy === a.id && <span className="sr-only">جارٍ التحضير…</span>}
          </button>
        ))}
      </div>
    );
  }

  /* ---------- نمط البطاقة (صفحة النتيجة) ---------- */
  return (
    <div className="rounded-3xl border border-brand-200 bg-brand-50/60 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-base font-extrabold text-brand-900">تحميل ملفّي</p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
            اسم الملف يُبنى تلقائيًا: <b dir="rtl" className="font-extrabold text-brand-700">{pdfName}</b>
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            studentHtmlFile(sub);
            onNotice?.(`نزّل الملف: ${studentFileName(sub, "html")} — يفتح في أي متصفح ويُطبع`);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-white px-3.5 py-2 text-[11px] font-extrabold text-ink-700 transition-all hover:-translate-y-0.5 hover:border-brand-300"
          title="نسخة HTML من الملف الفردي الكامل، تُفتح وتُطبع في أي وقت"
        >
          <FileDown className="size-3.5" aria-hidden="true" />
          نسخة HTML
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            title={a.hint}
            disabled={busy !== null}
            onClick={() => run(a)}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-xs font-extrabold text-brand-800 transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-[0_14px_30px_-18px_rgba(12,124,91,0.7)] disabled:opacity-40"
          >
            <a.icon className="size-4 text-brand-600" aria-hidden="true" />
            {a.label}
            {busy === a.id && <span className="text-[10px] font-bold text-ink-400">…</span>}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[10.5px] leading-relaxed text-ink-500">
        أزرار PDF تفتح نافذة الطباعة باسم الملف جاهزًا: اختر الوجهة «حفظ بصيغة PDF» ثم «حفظ». هذه أدقّ طريقة للعربية
        لأن المتصفح يستعمل خطوطه ومشكّل الكتابة العربي المدمج.
      </p>
    </div>
  );
}

/* ============================================================
   تصدير ملفات التلاميذ — التقويم التشخيصي
   ------------------------------------------------------------
   أزرار التحميل الفردية والجماعية. الموقع ثابت (بلا خادم)، لذلك
   يُبنى كل شيء داخل المتصفح:

   • PDF: تُفتح نافذة طباعة مخصّصة (iframe) بعنوان الوثيقة نفسه،
     فيقترح المتصفح الاسم المطلوب تلقائيًا عند اختيار
     «حفظ بصيغة PDF» — مثال: محمد_العربي_001_التقويم_التشخيصي.pdf
     (توليد PDF حقيقي داخل المتصفح يتطلّب تضمين خط عربي ومشكّل
     كتابة، لذا نعتمد محرك الطباعة المدمج وهو الأجود للعربية).
   • Word: ملف ‎.doc بمحتوى HTML منسّق يفتحه Word وLibreOffice.
   • Excel: ملف ‎.xlsx حقيقي (أوراق RTL) عبر الكاتب الذاتي.
   • ZIP: أرشيف بأسماء عربية (UTF-8) مرتّب حسب المستوى ثم القسم.
   ============================================================ */
import type { Submission } from "../types";
import {
  SCHOOL_NAME,
  SCHOOL_SHORT,
  SUBJECT_NAME,
  TEACHER_NAME,
  TEST_FILE_TAG,
  TEST_TITLE,
  analyse,
  bankLevelOf,
  branchOf,
  fileNamePart,
  formatDate,
  formatDuration,
  groupZipName,
  kindLabel,
  questionRows,
  recommendationsFor,
  round1,
  round2,
  studentBaseName,
  studentFileName,
  subjectLabel,
  zipEntryPath,
  zipFolders,
} from "./reportDoc";
import { classReportHtml, studentDocHtml, wordDocument, type ClassScope } from "./reportHtml";
import { buildXlsx, type Cell, type Sheet } from "./xlsx";
import { createZip, zipText, type ZipEntry } from "./zip";

/* ===================== أدوات التحميل ===================== */
function triggerDownload(blob: Blob, filename: string): void {
  if (typeof document === "undefined") return; // بيئة بلا متصفح (اختبارات/بناء)
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** تحميل نص كملف */
export function downloadText(text: string, filename: string, mime: string): void {
  triggerDownload(new Blob(["\ufeff", text], { type: mime }), filename);
}

/** تحميل بايتات كملف */
export function downloadBytes(bytes: Uint8Array, filename: string, mime: string): void {
  triggerDownload(new Blob([bytes.slice().buffer as ArrayBuffer], { type: mime }), filename);
}

/**
 * فتح وثيقة في إطار طباعة مخفي واستدعاء نافذة الطباعة.
 * عنوان الوثيقة = اسم الملف المقترح عند «حفظ بصيغة PDF».
 */
export function printDocument(html: string, fileTitle: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve();
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.setAttribute("tabindex", "-1");
    iframe.style.cssText =
      "position:fixed;inset-block-start:0;inset-inline-end:-20000px;width:210mm;height:297mm;border:0;opacity:0;pointer-events:none;";
    document.body.appendChild(iframe);

    let settled = false;
    const cleanup = () => {
      if (settled) return;
      settled = true;
      window.setTimeout(() => iframe.remove(), 1500);
      resolve();
    };

    const doc = iframe.contentDocument;
    if (!doc) {
      iframe.remove();
      return resolve();
    }
    doc.open();
    doc.write(html);
    doc.close();
    try {
      doc.title = fileTitle; // الاسم المقترح في نافذة «حفظ بصيغة PDF»
    } catch {
      /* بعض المتصفحات تمنع التعديل — العنوان داخل HTML يكفي */
    }

    const doPrint = () => {
      try {
        iframe.contentWindow?.addEventListener("afterprint", cleanup, { once: true });
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        cleanup();
        return;
      }
      window.setTimeout(cleanup, 120000); // أمان: إن لم يُغلق الحوار
    };

    const waitFonts = () => {
      const fonts = (doc as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
      if (fonts?.ready) fonts.ready.then(() => window.setTimeout(doPrint, 120)).catch(doPrint);
      else window.setTimeout(doPrint, 300);
    };

    window.setTimeout(waitFonts, 80);
  });
}

/* ===================== نطاق المجموعة ===================== */
/** تحديد نطاق التصدير (قسم واحد أم عدة أقسام) لتسمية الملفات والمجلدات */
export function scopeOf(subs: Submission[], className?: string): ClassScope {
  const list = className ? subs.filter((s) => s.className === className) : subs;
  const classes = Array.from(new Set(list.map((s) => s.className)));
  const branches = Array.from(new Set(list.map((s) => branchOf(s))));
  const levels = Array.from(new Set(list.map((s) => bankLevelOf(s))));
  const oneClass = classes.length === 1 ? classes[0] : undefined;
  const fileLabel = oneClass ?? (branches.length === 1 ? branches[0] : `${classes.length}_أقسام`);
  return {
    label: oneClass
      ? `${TEST_TITLE} — ${oneClass}`
      : classes.length > 1
        ? `${TEST_TITLE} — ${classes.length} أقسام (${branches.join("، ")})`
        : `${TEST_TITLE} — ${branches[0] ?? SCHOOL_SHORT}`,
    level: levels.length === 1 ? levels[0] : levels.join("، "),
    branch: branches.length === 1 ? branches[0] : branches.join("، "),
    className: oneClass ?? (classes.length > 1 ? classes.join("، ") : undefined),
    fileLabel,
    classCount: classes.length,
  };
}

/* ===================== تصدير فردي ===================== */
/** 1) أجوبة التلميذ — PDF (نافذة طباعة باسم الملف المطلوب) */
export function studentAnswersPdf(sub: Submission): Promise<void> {
  return printDocument(studentDocHtml(sub, "answers"), studentFileName(sub, "pdf"));
}

/** 2) تقرير النتائج — PDF */
export function studentReportPdf(sub: Submission): Promise<void> {
  return printDocument(studentDocHtml(sub, "report"), `تقرير_${studentFileName(sub, "pdf")}`);
}

/** 3) طباعة الملف الفردي الكامل */
export function studentPrint(sub: Submission): Promise<void> {
  return printDocument(studentDocHtml(sub, "full"), studentFileName(sub, "pdf"));
}

/** 4) الملف الفردي بصيغة HTML (يُفتح ويُطبع في أي وقت) */
export function studentHtmlFile(sub: Submission): void {
  downloadText(studentDocHtml(sub, "full"), studentFileName(sub, "html"), "text/html;charset=utf-8");
}

/** 5) الملف الفردي بصيغة Word (.doc) */
export function studentWordFile(sub: Submission): void {
  const title = studentBaseName(sub);
  const body = studentDocHtml(sub, "full").replace(/^[\s\S]*?<body>/, "").replace(/<\/body>[\s\S]*$/, "");
  downloadText(wordDocument(title, body), studentFileName(sub, "doc"), "application/msword;charset=utf-8");
}

/** 6) أجوبة التلميذ بصيغة Excel (سؤال بسؤال) */
export async function studentExcelFile(sub: Submission): Promise<void> {
  const bytes = await buildXlsx([answersSheet([sub]), summarySheet([sub])]);
  downloadBytes(bytes, studentFileName(sub, "xlsx"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

/* ===================== تصدير جماعي ===================== */
/** جدول النتائج — Excel (كل الأقسام أو قسم محدّد) */
export async function resultsXlsx(subs: Submission[], scope: ClassScope): Promise<void> {
  const bytes = await buildXlsx([summarySheet(subs), skillsSheet(subs), answersSheet(subs)]);
  downloadBytes(
    bytes,
    `جدول_النتائج_${fileNamePart(scope.fileLabel)}.xlsx`,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}

/** التقرير الشامل للقسم — PDF */
export function classReportPdf(subs: Submission[], scope: ClassScope): Promise<void> {
  return printDocument(classReportHtml(subs, scope), `تقرير_شامل_${fileNamePart(scope.fileLabel)}`);
}

/** التقرير الشامل للقسم — HTML قابل للتحميل */
export function classReportFile(subs: Submission[], scope: ClassScope): void {
  downloadText(classReportHtml(subs, scope), `تقرير_شامل_${fileNamePart(scope.fileLabel)}.html`, "text/html;charset=utf-8");
}

/**
 * أرشيف ZIP لعدة تلاميذ:
 *   <المستوى>/<القسم>/001_الاسم.html   (ملف الطباعة → PDF)
 *   <المستوى>/<القسم>/001_الاسم.doc    (نسخة Word)
 *   جدول_النتائج.xlsx  ·  تقرير_شامل.html  ·  اقرأني.txt
 */
export async function selectionZip(subs: Submission[], scope: ClassScope): Promise<{ name: string; size: number; count: number }> {
  const entries: ZipEntry[] = [];

  for (const sub of subs) {
    const full = studentDocHtml(sub, "full");
    entries.push({ path: zipEntryPath(sub, "html"), data: zipText(full) });
    const body = full.replace(/^[\s\S]*?<body>/, "").replace(/<\/body>[\s\S]*$/, "");
    entries.push({ path: zipEntryPath(sub, "doc"), data: zipText(wordDocument(studentBaseName(sub), body)) });
  }

  const xlsx = await buildXlsx([summarySheet(subs), skillsSheet(subs), answersSheet(subs)]);
  entries.push({ path: `جدول_النتائج_${fileNamePart(scope.fileLabel)}.xlsx`, data: xlsx });
  entries.push({ path: `تقرير_شامل_${fileNamePart(scope.fileLabel)}.html`, data: zipText(classReportHtml(subs, scope)) });
  entries.push({ path: "اقرأني.txt", data: zipText(readmeTxt(subs, scope)) });

  const bytes = await createZip(entries);
  const name = groupZipName(subs, scope.fileLabel);
  downloadBytes(bytes, name, "application/zip");
  return { name, size: bytes.length, count: subs.length };
}

function readmeTxt(subs: Submission[], scope: ClassScope): string {
  const byFolder = new Map<string, number>();
  for (const s of subs) byFolder.set(zipFolders(s), (byFolder.get(zipFolders(s)) ?? 0) + 1);
  return `${SCHOOL_NAME}
${TEST_TITLE} في مادة ${SUBJECT_NAME} — ${scope.label}
إعداد: ${TEACHER_NAME} · تاريخ التصدير: ${formatDate(new Date().toISOString())}

محتوى الأرشيف (${subs.length} تلميذ(ة)):
${Array.from(byFolder.entries())
  .map(([folder, n]) => `  • ${folder}/ — ${n} ملفًّا (لكل تلميذ نسخة HTML ونسخة Word)`)
  .join("\n")}
  • جدول_النتائج_*.xlsx — النتائج + تحليل المهارات + الأجوبة سؤالًا بسؤال
  • تقرير_شامل_*.html — التقرير الشامل للقسم (يُطبع أو يُحفظ PDF)
  • اقرأني.txt — هذه الرسالة

كيف أحصل على PDF لكل تلميذ؟
افتح ملف التلميذ (‎.html) في المتصفح ثم اضغط Ctrl+P (أو Cmd+P) واختر
«حفظ بصيغة PDF»: الاسم المقترح يكون جاهزًا بالصيغة المطلوبة:
  اسم_التلميذ_رقم_التلميذ_${TEST_FILE_TAG}.pdf
مثال: محمد_العربي_001_${TEST_FILE_TAG}.pdf

ملاحظة تقنية: الموقع يعمل بلا خادم، وتوليد PDF عربي سليم يتطلب محرك
طباعة وخطوطًا عربية؛ لذلك تعتمد المنصة محرك الطباعة المدمج في المتصفح
(وهو الأدقّ للعربية)، وتوفّر داخل الأرشيف ملفات جاهزة للطباعة بنقرة واحدة.
من داخل لوحة الأستاذ يمكن الحصول على PDF فردي مباشرة بزر «أجوبة PDF».

لتحويل كل ملفات هذا الأرشيف إلى PDF دفعة واحدة على حاسوبك (اختياري):
  npm i -D playwright && npx playwright install chromium      ← مرة واحدة
  node scripts/html-to-pdf.mjs <اسم_هذا_الأرشيف.zip> --zip
ستنشأ ملفات PDF بالأسماء نفسها داخل المجلدات نفسها (001_الاسم.pdf) مع
أرشيف نهائي جاهز للتوزيع. التفاصيل الكاملة في: docs/export-pdf.md
`;
}

/* ===================== أوراق Excel ===================== */
function summarySheet(subs: Submission[]): Sheet {
  const list = [...subs].sort((a, b) => b.total - a.total);
  const header: Cell[] = [
    "الرتبة",
    "ر.ت",
    "التلميذ(ة)",
    "رقم مسار",
    "القسم",
    "المستوى",
    "الشعبة / المسلك",
    "التاريخ /10",
    "الجغرافيا /10",
    "المجموع /20",
    "النسبة ٪",
    "مستوى التحكّم",
    "تاريخ الإنجاز",
    "المدة",
    "الأسئلة المجاب عنها",
    "اسم ملف التلميذ",
  ];
  const rows: Cell[][] = list.map((s, i) => {
    const r = questionRows(s);
    return [
      i + 1,
      s.studentNo ?? "—",
      s.name,
      s.massar ?? "—",
      s.className,
      bankLevelOf(s),
      branchOf(s),
      round2(s.history),
      round2(s.geography),
      round2(s.total),
      round1(s.percent),
      s.level,
      formatDate(s.date),
      formatDuration(s.timeUsedSeconds),
      r.hasAnswers ? `${r.answeredCount}/${r.rows.length}` : "غير محفوظة",
      studentFileName(s, "pdf"),
    ];
  });
  const n = list.length;
  const avg = (f: (x: Submission) => number) => (n ? round1(list.reduce((a, s) => a + f(s), 0) / n) : 0);
  rows.push([]);
  rows.push(["", "", "متوسط القسم", "", "", "", "", avg((s) => s.history), avg((s) => s.geography), avg((s) => s.total), avg((s) => s.percent), "", "", "", `${n} مشاركًا`, ""]);
  return {
    name: "النتائج",
    title: `${TEST_TITLE} — ${SCHOOL_NAME} — ${TEACHER_NAME}`,
    rows: [header, ...rows],
    widths: [7, 7, 26, 14, 22, 16, 26, 12, 14, 12, 10, 16, 26, 16, 18, 44],
  };
}

function skillsSheet(subs: Submission[]): Sheet {
  const header: Cell[] = ["التلميذ(ة)", "ر.ت", "القسم", "المهارة", "المحصَّل", "الأقصى", "النسبة ٪", "الحالة", "التوصية"];
  const rows: Cell[][] = [];
  for (const s of subs) {
    const a = analyse(s);
    const recos = recommendationsFor(s, a);
    a.skills.forEach((sk, i) => {
      rows.push([s.name, s.studentNo ?? "—", s.className, sk.skill, round2(sk.got), round2(sk.max), sk.pct, sk.state, i === 0 ? (recos[0] ?? "") : ""]);
    });
  }
  return { name: "تحليل المهارات", title: "تحليل المهارات وتوصيات الدعم", rows: [header, ...rows], widths: [26, 7, 22, 30, 10, 10, 10, 16, 70] };
}

function answersSheet(subs: Submission[]): Sheet {
  const header: Cell[] = [
    "التلميذ(ة)",
    "ر.ت",
    "القسم",
    "رقم السؤال",
    "المادة",
    "نوع السؤال",
    "المهارة",
    "السؤال",
    "إجابة التلميذ(ة)",
    "الجواب الصحيح",
    "النقطة المحصَّلة",
    "النقطة الكاملة",
    "صحة الجواب",
  ];
  const rows: Cell[][] = [];
  for (const s of subs) {
    const r = questionRows(s);
    for (const q of r.rows) {
      rows.push([
        s.name,
        s.studentNo ?? "—",
        s.className,
        q.index,
        subjectLabel(q.question.subject),
        kindLabel(q.question),
        q.question.skill,
        q.question.title,
        q.studentAnswer,
        q.correct,
        r.hasAnswers ? round2(q.got) : "—",
        q.points,
        r.hasAnswers ? (q.isCorrect ? "صحيح" : q.answered ? "خاطئ" : "بدون إجابة") : "غير محفوظ",
      ]);
    }
  }
  return { name: "الأجوبة سؤال بسؤال", title: "إجابات التلاميذ والجواب الصحيح ونقطة كل سؤال", rows: [header, ...rows], widths: [24, 7, 20, 10, 12, 16, 24, 60, 55, 55, 12, 12, 14] };
}

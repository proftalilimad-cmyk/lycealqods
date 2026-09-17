import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  ExternalLink,
  FileText,
  FolderOpen,
  Hash,
  Info,
  Layers,
  LayoutDashboard,
  Library,
  Maximize2,
  Minimize2,
  NotebookPen,
  RotateCcw,
  Search,
  Sparkles,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  FICHES_GENERAL_DOCS,
  FICHES_PDF_COUNT,
  FICHES_PEDAGOGIQUES,
  FICHES_TOTAL_FILES,
  FICHES_WITH_FILE,
  FICHES_WITH_PDF,
  FICHES_WORD_COUNT,
  getFicheById,
  type FicheFile,
  type FichePedagogique,
  type GeneralDoc,
} from "../data/jadadatFiles";
import { normalizeArabic } from "../lib/arabic";
import type { Route } from "../routes";
import CopyLinkButton from "./CopyLinkButton";
import Reveal from "./Reveal";

/* ============================================================
   جذاذات الجذع المشترك العلمي — مكتبة الملفات الأصلية (PDF / Word)
   ============================================================
   قسم مستقل داخل الموقع، مبنيّ حصريًا على ملفات الأستاذ الحقيقية
   (82 ملفًا: 32 PDF + 50 Word) المرتبطة بخانات الجذاذات الرسمية
   الخمس والعشرين. لا ملف وهميًا ولا معلومة مُؤلَّفة:

     • عدد الحصص والمكوّنات مستخرجة من نص الوثيقة الأصلية.
     • الجذاذتان اللتان لا يتوفر لهما ملف أصلي مستقل (الكوارث
       الطبيعية: تعريفها وأنواعها / ملف دور الجمعيات) تُعرضان بلا
       ملفات مع إحالة على الجذاذة الرقمية المأخوذة من وثيقة الأستاذ.
     • المعاينة داخل الموقع (عارض PDF مدمج: تكبير/تصغير/تنقّل بين
       الصفحات/ملء الشاشة/تحميل) ولا تُفتح صفحة خارجية إلا بطلب.
   ============================================================ */

const SUBJECTS = ["التاريخ", "الجغرافيا"] as const;
const SEMESTERS = ["الدورة الأولى", "الدورة الثانية"] as const;

type SortKey = "order" | "title" | "subject" | "semester" | "newest" | "oldest";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "order", label: "الترتيب الدراسي (حسب المقرر)" },
  { id: "title", label: "اسم الدرس" },
  { id: "subject", label: "المادة" },
  { id: "semester", label: "الدورة" },
  { id: "newest", label: "الأحدث" },
  { id: "oldest", label: "الأقدم" },
];

const KINDS = [
  { id: "all", label: "كل الموارد" },
  { id: "pdf", label: "جذاذة PDF" },
  { id: "word", label: "ملف Word" },
  { id: "collection", label: "مجموعات ووثائق عامة" },
] as const;
type KindKey = (typeof KINDS)[number]["id"];

/** رابط الملف: ترميز كل مقطع على حدة (أسماء الملفات عربية) */
export function fileUrl(url: string): string {
  return url
    .split("/")
    .map((seg, i) => (i === 0 && seg === "" ? "" : encodeURIComponent(seg)))
    .join("/");
}

const kb = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} م.ب` : `${Math.round(bytes / 1024)} ك.ب`);

const dateLabel = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("fr-MA", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return iso;
  }
};

const arabicCompare = (a: string, b: string) => a.localeCompare(b, "ar");

/**
 * المجلد(ات) التي جاءت منها ملفات الجذاذة فعلًا داخل وثائق الأستاذ
 * («منار في التاريخ والجغرافيا» و/أو «مسار التاريخ والجغرافيا»).
 * تُستنتج من الملفات نفسها — لا تُكتب قيمة افتراضية مُؤلَّفة.
 */
const sourceFolders = (files: FicheFile[]): string => {
  const uniq = Array.from(new Set(files.map((f) => f.folder)));
  if (uniq.length === 0) return "لا ملف أصلي مستقل — الجذاذة الرقمية منقولة من وثيقة الأستاذ";
  return uniq.join(" + ");
};

/* ============================================================
   عارض PDF المدمج (Modal)
   ============================================================ */
interface PdfModalProps {
  file: FicheFile;
  title: string;
  onClose: () => void;
}

function PdfModal({ file, title, onClose }: PdfModalProps) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [rev, setRev] = useState(0);
  const [full, setFull] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const isPdf = file.kind === "pdf";
  const total = file.pages;

  /* إعادة تحميل العارض عند كل تغيير في الصفحة أو التكبير */
  const apply = (nextPage = page, nextZoom = zoom) => {
    setPage(nextPage);
    setZoom(nextZoom);
    setRev((r) => r + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (!isPdf) return;
      if (e.key === "ArrowLeft" && total && page < total) apply(page + 1);
      if (e.key === "ArrowRight" && page > 1) apply(page - 1);
      if (e.key === "+" || e.key === "=") apply(page, Math.min(300, zoom + 25));
      if (e.key === "-") apply(page, Math.max(50, zoom - 25));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  });

  useEffect(() => {
    const onFs = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void boxRef.current?.requestFullscreen();
  };

  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold text-white transition-colors hover:bg-white/20 disabled:opacity-35";

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-2 sm:p-4" role="dialog" aria-modal="true" aria-label={`معاينة ${title}`}>
      <button type="button" aria-label="إغلاق المعاينة" onClick={onClose} className="animate-fade-in absolute inset-0 bg-brand-950/80 backdrop-blur-sm" />
      <div
        ref={boxRef}
        className="animate-modal-in relative flex h-full max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-brand-950 shadow-2xl"
      >
        {/* شريط العارض */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="size-4 shrink-0 text-gold-300" aria-hidden="true" />
            <p className="truncate text-[12px] font-extrabold text-white" dir="rtl">
              {title}
            </p>
            <span className="hidden shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/70 sm:inline" dir="ltr">
              {file.name}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5" data-no-print>
            {isPdf && (
              <>
                <button type="button" className={btn} onClick={() => apply(page, Math.max(50, zoom - 25))} disabled={zoom <= 50} title="تصغير (-)">
                  <ZoomOut className="size-3.5" aria-hidden="true" />
                  تصغير
                </button>
                <span className="min-w-12 rounded-lg bg-white/10 px-2 py-1.5 text-center text-[11px] font-black text-white" dir="ltr">
                  {zoom}٪
                </span>
                <button type="button" className={btn} onClick={() => apply(page, Math.min(300, zoom + 25))} disabled={zoom >= 300} title="تكبير (+)">
                  <ZoomIn className="size-3.5" aria-hidden="true" />
                  تكبير
                </button>
                <span className="mx-1 h-5 w-px bg-white/15" aria-hidden="true" />
                <button type="button" className={btn} onClick={() => apply(Math.max(1, page - 1))} disabled={page <= 1} title="الصفحة السابقة">
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </button>
                <span className="min-w-20 rounded-lg bg-white/10 px-2 py-1.5 text-center text-[11px] font-black text-white" dir="ltr">
                  {page} / {total ?? "؟"}
                </span>
                <button
                  type="button"
                  className={btn}
                  onClick={() => apply(Math.min(total ?? page + 1, page + 1))}
                  disabled={Boolean(total && page >= total)}
                  title="الصفحة التالية"
                >
                  <ChevronLeft className="size-3.5" aria-hidden="true" />
                </button>
                <button type="button" className={btn} onClick={() => apply(1, 100)} title="إعادة الضبط">
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                </button>
                <span className="mx-1 h-5 w-px bg-white/15" aria-hidden="true" />
              </>
            )}
            <button type="button" className={btn} onClick={toggleFull} title="ملء الشاشة">
              {full ? <Minimize2 className="size-3.5" aria-hidden="true" /> : <Maximize2 className="size-3.5" aria-hidden="true" />}
              {full ? "خروج" : "ملء الشاشة"}
            </button>
            <a className={btn} href={fileUrl(file.url)} download={file.name} title="تحميل الملف الأصلي">
              <Download className="size-3.5" aria-hidden="true" />
              تحميل
            </a>
            <a className={btn} href={fileUrl(file.url)} target="_blank" rel="noreferrer" title="فتح في نافذة مستقلة">
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/90 px-2.5 py-1.5 text-[11px] font-extrabold text-white transition-colors hover:bg-rose-500"
            >
              <X className="size-3.5" aria-hidden="true" />
              إغلاق
            </button>
          </div>
        </div>

        {/* جسم العارض */}
        <div className="min-h-0 flex-1 bg-[#3b4348]">
          {isPdf ? (
            <iframe
              key={rev}
              title={`عارض ${file.name}`}
              src={`${fileUrl(file.url)}#page=${page}&zoom=${zoom}`}
              className="size-full border-0"
            />
          ) : (
            <div className="grid h-full place-items-center p-8 text-center">
              <div>
                <FileText className="mx-auto size-12 text-white/50" aria-hidden="true" />
                <p className="mt-4 font-display text-lg font-black text-white">ملف Word — لا تتوفر معاينة مدمجة</p>
                <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-white/65">
                  هذا الملف بصيغة {file.kind === "doc" ? "Word 97 (doc)" : "Word (docx)"}؛ حمّله وافتحه في برنامجك، أو استعمل
                  الجذاذة المعروضة داخل الموقع (نسخة قابلة للطباعة PDF).
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <a
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-brand-400"
                    href={fileUrl(file.url)}
                    download={file.name}
                  >
                    <Download className="size-4" aria-hidden="true" />
                    تحميل {file.name}
                  </a>
                  <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-xs font-extrabold text-white/85 hover:bg-white/10">
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="border-t border-white/10 px-3 py-2 text-[10px] font-semibold text-white/55" dir="rtl">
          {isPdf
            ? `الملف الأصلي كما هو: ${kb(file.bytes)}${total ? ` · ${total} صفحة` : ""} · اختصارات: ← → للتنقل بين الصفحات، + و − للتكبير، Esc للإغلاق`
            : `${kb(file.bytes)} · ${file.folder}`}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   بطاقة جذاذة
   ============================================================ */
interface CardProps {
  f: FichePedagogique;
  onPreview: (file: FicheFile, title: string) => void;
  go: (r: Route) => void;
}

function FicheCard({ f, onPreview, go }: CardProps) {
  const pdf = f.files.find((x) => x.kind === "pdf") ?? null;
  const word = f.files.find((x) => x.kind !== "pdf") ?? null;
  const btn =
    "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-extrabold transition-all sm:flex-none";

  return (
    <article className="flex h-full flex-col rounded-2xl border border-ink-900/8 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-[0_20px_45px_-24px_rgba(12,124,91,0.45)]">
      {/* الرأس */}
      <div className="flex items-start gap-3">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-xl ${
            pdf ? "bg-rose-50 text-rose-600" : word ? "bg-sky-50 text-sky-600" : "bg-paper-warm text-ink-400"
          }`}
        >
          {pdf ? <FileText className="size-5" aria-hidden="true" /> : word ? <NotebookPen className="size-5" aria-hidden="true" /> : <Info className="size-5" aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold text-ink-500">
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-700">{f.subject}</span>
            <span className="rounded-full bg-gold-100 px-2 py-0.5 text-gold-700">{f.semester}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-paper-warm px-2 py-0.5 text-ink-600">
              <Hash className="size-2.5" aria-hidden="true" />
              الدرس {f.lessonNumber}
            </span>
            {pdf && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-rose-600">
                <FileText className="size-2.5" aria-hidden="true" />
                PDF {pdf.pages ? `· ${pdf.pages} صفحة` : ""}
              </span>
            )}
          </p>
          <h3 className="mt-1.5 font-display text-[13.5px] font-black leading-snug text-ink-900">{f.title}</h3>
        </div>
      </div>

      {/* المعلومات */}
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10.5px]">
        <div className="flex items-center gap-1.5">
          <dt className="font-extrabold text-ink-500">عدد الحصص:</dt>
          <dd className="font-black text-ink-900">{f.sessionsCount ? `${f.sessionsCount} حصص` : "غير محدّد في الوثيقة"}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="font-extrabold text-ink-500">نوع المورد:</dt>
          <dd className="font-black text-ink-900">{pdf ? "جذاذة PDF" : word ? "ملف Word" : "جذاذة رقمية"}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="font-extrabold text-ink-500">الملفات:</dt>
          <dd className="font-black text-ink-900">
            {f.files.length ? `${f.files.length} (${f.files.filter((x) => x.kind === "pdf").length} PDF · ${f.files.filter((x) => x.kind !== "pdf").length} Word)` : "لا ملف أصلي مستقل"}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="font-extrabold text-ink-500">أُضيف في:</dt>
          <dd className="font-black text-ink-900" dir="ltr">
            {dateLabel(f.createdAt)}
          </dd>
        </div>
      </dl>

      <p className="mt-3 line-clamp-3 text-[11px] leading-relaxed text-ink-500">{f.description}</p>

      {/* اسم الملف الأصلي الذي سيُحمَّل */}
      {f.files.length > 0 && (
        <p
          className="mt-2.5 truncate rounded-lg bg-paper-warm/60 px-2.5 py-1.5 text-[10px] font-bold text-ink-600"
          dir="rtl"
          title={f.files.map((x) => x.name).join(" · ")}
        >
          <span className="font-extrabold text-ink-500">الملف: </span>
          {(pdf ?? word)?.name}
          {f.files.length > 1 && <span className="font-semibold text-ink-400"> +{f.files.length - 1} ملفًا آخر في صفحة التفاصيل</span>}
        </p>
      )}

      {/* الأزرار */}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-900/6 pt-3.5" data-no-print>
        {pdf ? (
          <button type="button" onClick={() => onPreview(pdf, f.title)} className={`${btn} border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-400 hover:bg-brand-100`}>
            <Eye className="size-3.5" aria-hidden="true" />
            معاينة
          </button>
        ) : (
          <button type="button" onClick={() => go({ view: "jadadat", level: "tc", open: f.id })} className={`${btn} border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-400 hover:bg-brand-100`}>
            <Eye className="size-3.5" aria-hidden="true" />
            معاينة الجذاذة
          </button>
        )}
        {pdf ? (
          <a href={fileUrl(pdf.url)} download={pdf.name} className={`${btn} border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:bg-rose-100`}>
            <Download className="size-3.5" aria-hidden="true" />
            تحميل PDF
          </a>
        ) : word ? (
          <a href={fileUrl(word.url)} download={word.name} className={`${btn} border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100`}>
            <Download className="size-3.5" aria-hidden="true" />
            تحميل Word
          </a>
        ) : (
          <button type="button" onClick={() => go({ view: "jadadat", level: "tc", open: f.id })} className={`${btn} border-ink-900/10 bg-paper-warm text-ink-700 hover:border-brand-300`}>
            <Download className="size-3.5" aria-hidden="true" />
            تحميل / طباعة
          </button>
        )}
        <button
          type="button"
          onClick={() => go({ view: "jadadatLib", open: f.id })}
          className={`${btn} border-ink-900/10 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-700`}
        >
          <ExternalLink className="size-3.5" aria-hidden="true" />
          فتح
        </button>
      </div>
    </article>
  );
}

/* ============================================================
   بطاقة وثيقة عامة / مجموعة جذاذات
   ============================================================ */
function GeneralCard({ g, onPreview }: { g: GeneralDoc; onPreview: (file: FicheFile, title: string) => void }) {
  const pdf = g.files.find((x) => x.kind === "pdf") ?? null;
  const btn =
    "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-extrabold transition-all sm:flex-none";
  return (
    <article className="flex h-full flex-col rounded-2xl border border-dashed border-ink-900/12 bg-paper-warm/40 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-700">
          <FolderOpen className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold text-ink-500">
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-700">{g.subject}</span>
            <span className="rounded-full bg-gold-100 px-2 py-0.5 text-gold-700">{g.semester}</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-ink-600 ring-1 ring-ink-900/8">{g.files.length} ملفًا</span>
          </p>
          <h3 className="mt-1.5 font-display text-[13.5px] font-black leading-snug text-ink-900">{g.title}</h3>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-500">{g.description}</p>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-900/6 pt-3.5" data-no-print>
        {pdf && (
          <button type="button" onClick={() => onPreview(pdf, g.title)} className={`${btn} border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-400 hover:bg-brand-100`}>
            <Eye className="size-3.5" aria-hidden="true" />
            معاينة
          </button>
        )}
        {pdf && (
          <a href={fileUrl(pdf.url)} download={pdf.name} className={`${btn} border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:bg-rose-100`}>
            <Download className="size-3.5" aria-hidden="true" />
            تحميل PDF
          </a>
        )}
      </div>
    </article>
  );
}

/* ============================================================
   صفحة تفاصيل الجذاذة
   ============================================================ */
interface DetailsProps {
  fiche?: FichePedagogique;
  doc?: GeneralDoc;
  onPreview: (file: FicheFile, title: string) => void;
  onBack: () => void;
  go: (r: Route) => void;
}

function FicheDetails({ fiche, doc, onPreview, onBack, go }: DetailsProps) {
  const title = fiche?.title ?? doc?.title ?? "";
  const files = fiche?.files ?? doc?.files ?? [];
  const btn =
    "inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-white px-3.5 py-2 text-[11px] font-extrabold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700";

  const info: [string, string][] = fiche
    ? [
        ["عنوان الدرس", fiche.title],
        ["المستوى", fiche.level],
        ["المادة", fiche.subject],
        ["الدورة", fiche.semester],
        ["الوحدة / المجزوءة", `${fiche.unitTitle} (مجزوءة ${fiche.module})`],
        ["رقم الدرس / الجذاذة", fiche.lessonNumber],
        ["عدد الحصص", fiche.sessionsCount ? `${fiche.sessionsCount} حصص` : "غير وارد في الوثيقة الأصلية"],
        ["نوع المورد", fiche.files.some((f) => f.kind === "pdf") ? "جذاذة PDF" : fiche.files.length ? "ملف Word" : "جذاذة رقمية من وثيقة الأستاذ"],
        ["المصدر في وثائق الأستاذ", sourceFolders(fiche.files)],
        ["تاريخ الإضافة", dateLabel(fiche.createdAt)],
      ]
    : [
        ["العنوان", doc?.title ?? ""],
        ["المستوى", doc?.level ?? ""],
        ["المادة", doc?.subject ?? ""],
        ["الدورة", doc?.semester ?? ""],
        ["نوع المورد", files.some((f) => f.kind === "pdf") ? "ملف PDF" : "ملف Word"],
        ["المصدر في وثائق الأستاذ", sourceFolders(files)],
        ["تاريخ الإضافة", dateLabel(doc?.createdAt ?? "")],
      ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-8 sm:px-6">
      {/* شريط الأدوات */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2" data-no-print>
        <button type="button" onClick={onBack} className={btn}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          رجوع إلى لائحة الجذاذات
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {fiche && (
            <button type="button" onClick={() => go({ view: "jadadat", level: "tc", open: fiche.id })} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3.5 py-2 text-[11px] font-extrabold text-white transition-colors hover:bg-brand-700">
              <BookOpenCheck className="size-3.5" aria-hidden="true" />
              فتح الجذاذة كاملة (الوثيقة الأصلية)
            </button>
          )}
          {fiche && (
            <button type="button" onClick={() => go({ view: "dashboard", tab: "jadadat" })} className={btn}>
              <LayoutDashboard className="size-3.5" aria-hidden="true" />
              تتبّع إنجازها في لوحة الأستاذ
            </button>
          )}
          <CopyLinkButton
            route={{ view: "jadadatLib", open: fiche?.id ?? doc?.id ?? "" }}
            label="نسخ رابط الجذاذة"
            ariaLabel={`نسخ رابط ${title}`}
            className="px-3.5 py-2 text-[11px]"
          />
        </div>
      </div>

      <p className="mb-3 text-[10.5px] font-extrabold text-ink-500" data-no-print>
        جذاذات الجذع المشترك العلمي › {fiche ? `${fiche.subject} › ${fiche.semester} — ${fiche.unitTitle} › الجذاذة ${fiche.lessonNumber}` : "وثائق عامة ومجموعات"}
      </p>

      {/* معلومات الجذاذة */}
      <section className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-brand-900/10 ring-1 ring-ink-900/10">
        <div className="border-b border-ink-900/6 bg-brand-50/60 px-5 py-4">
          <h1 className="font-display text-xl font-black text-ink-900 sm:text-2xl">{title}</h1>
          <p className="mt-1.5 text-[11.5px] font-semibold leading-relaxed text-ink-500">
            {fiche?.description ?? doc?.description}
          </p>
        </div>
        <dl className="grid gap-x-6 gap-y-2.5 px-5 py-4 sm:grid-cols-2">
          {info.map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-2 text-xs">
              <dt className="shrink-0 font-extrabold text-ink-500">{k}:</dt>
              <dd className="font-extrabold text-ink-900">{v}</dd>
            </div>
          ))}
          {fiche?.sessionsSource && (
            <div className="flex items-baseline gap-2 text-xs sm:col-span-2">
              <dt className="shrink-0 font-extrabold text-ink-500">مصدر عدد الحصص:</dt>
              <dd className="font-semibold text-ink-600">{fiche.sessionsSource}</dd>
            </div>
          )}
          {fiche?.source && (
            <div className="flex items-baseline gap-2 text-xs sm:col-span-2">
              <dt className="shrink-0 font-extrabold text-ink-500">وثيقة الأستاذ المُفرَّغة:</dt>
              <dd className="font-semibold text-ink-600" dir="rtl">
                {fiche.source} ({fiche.sourceLayout === "pdf" ? "PDF" : fiche.sourceLayout === "doc" ? "Word 97" : "Word"})
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* مكوّنات الجذاذة */}
      {fiche && (
        <section className="mt-5 rounded-2xl border border-ink-900/8 bg-white p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-ink-900">
            <Layers className="size-4 text-brand-600" aria-hidden="true" />
            مكوّنات الجذاذة (كما وردت في الوثيقة الأصلية)
          </h2>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-500">
            القائمة أدناه كاشفة فقط: تُبيّن أي المكوّنات وارد فعلًا في وثيقة الأستاذ وأيها غير وارد فيها. لم تُضف أي معلومة
            غير موجودة في الأصل — لعرض النص الكامل (الأهداف، التدبير، الدعامات، المتن، التقويم، المنتوج) كما ورد حرفيًا
            افتح الجذاذة الكاملة.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-black text-emerald-700">واردة في الوثيقة ({fiche.components.length})</p>
              <ul className="mt-2 space-y-1.5">
                {fiche.components.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-[11.5px] font-bold text-ink-700">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                    {c}
                  </li>
                ))}
                {fiche.components.length === 0 && <li className="text-[11.5px] font-semibold text-ink-500">لا مكوّن مُعنوَن صراحة في هذه الوثيقة.</li>}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-black text-ink-500">غير واردة ({fiche.componentsMissing.length})</p>
              <ul className="mt-2 space-y-1.5">
                {fiche.componentsMissing.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-[11.5px] font-semibold text-ink-400">
                    <XCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* الملفات الأصلية */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-ink-900/8 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-900/6 px-5 py-3.5">
          <h2 className="font-display text-sm font-extrabold text-ink-900">الملفات الأصلية ({files.length})</h2>
          <span className="text-[10.5px] font-semibold text-ink-500">
            {files.filter((f) => f.kind === "pdf").length} PDF · {files.filter((f) => f.kind !== "pdf").length} Word — الأسماء
            الأصلية محفوظة عند التحميل
          </span>
        </div>
        {files.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs font-semibold leading-relaxed text-ink-500">
            لا يتوفر ملف أصلي مستقل لهذا الدرس في وثائق الأستاذ. الجذاذة الرقمية المأخوذة من وثيقته متاحة للعرض والطباعة
            والتحميل من قسم الجذاذات.
          </p>
        ) : (
          <ul className="divide-y divide-ink-900/6">
            {files.map((f) => (
              <li key={f.url} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${f.kind === "pdf" ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-sky-600"}`}>
                  <FileText className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-extrabold text-ink-900" dir="rtl">
                    {f.name}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-ink-500">
                    <span>{f.kind === "pdf" ? "PDF" : f.kind === "doc" ? "Word 97" : "Word"}</span>
                    <span aria-hidden="true">·</span>
                    <span>{kb(f.bytes)}</span>
                    {f.pages && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-2.5" aria-hidden="true" />
                          {f.pages} صفحة
                        </span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{f.folder}</span>
                    {fiche && f.relation === "related" && (
                      <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[9px] font-extrabold text-gold-700">وثيقة مرتبطة بالدرس</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2" data-no-print>
                  {f.kind === "pdf" && (
                    <button type="button" onClick={() => onPreview(f, title)} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-[10.5px] font-extrabold text-brand-700 hover:border-brand-400 hover:bg-brand-100">
                      <Eye className="size-3.5" aria-hidden="true" />
                      معاينة
                    </button>
                  )}
                  <a href={fileUrl(f.url)} download={f.name} className="inline-flex items-center gap-1.5 rounded-lg border border-ink-900/10 bg-white px-3 py-1.5 text-[10.5px] font-extrabold text-ink-700 hover:border-brand-300 hover:text-brand-700">
                    <Download className="size-3.5" aria-hidden="true" />
                    تحميل
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-4 rounded-xl bg-paper-warm/70 px-4 py-3 text-[10.5px] leading-relaxed text-ink-500" data-no-print>
        المسار داخل الموقع: <span dir="ltr" className="font-bold text-ink-700">{files[0]?.url.split("/").slice(0, 5).join("/")}/…</span> —
        الملفات هي ملفات الأستاذ الأصلية نفسها (بأسمائها وأحجامها وجودتها)، منظّمة حسب المادة والدورة.
      </p>
    </div>
  );
}

/* ============================================================
   الصفحة الرئيسية للقسم
   ============================================================ */
interface JadadatLibraryProps {
  open?: string;
  go: (r: Route) => void;
}

export default function JadadatLibrary({ open, go }: JadadatLibraryProps) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<"all" | (typeof SUBJECTS)[number]>("all");
  const [semester, setSemester] = useState<"all" | (typeof SEMESTERS)[number]>("all");
  const [kind, setKind] = useState<KindKey>("all");
  const [sessions, setSessions] = useState<"all" | "unknown" | string>("all");
  const [sort, setSort] = useState<SortKey>("order");
  const [preview, setPreview] = useState<{ file: FicheFile; title: string } | null>(null);

  const showPreview = (file: FicheFile, title: string) => setPreview({ file, title });

  /* صفحة التفاصيل */
  const detailFiche = open ? getFicheById(open) : undefined;
  const detailDoc = open && !detailFiche ? FICHES_GENERAL_DOCS.find((g) => g.id === open) : undefined;

  const sessionOptions = useMemo(() => {
    const vals = Array.from(new Set(FICHES_PEDAGOGIQUES.map((f) => f.sessionsCount).filter((v): v is number => v !== null))).sort((a, b) => a - b);
    return vals;
  }, []);

  const matches = (f: FichePedagogique | GeneralDoc, isFiche: boolean) => {
    if (subject !== "all" && f.subject !== subject) return false;
    if (semester !== "all" && f.semester !== semester) return false;
    if (kind === "pdf" && !f.files.some((x) => x.kind === "pdf")) return false;
    if (kind === "word" && !f.files.some((x) => x.kind !== "pdf")) return false;
    if (kind === "collection" && isFiche) return false;
    if (sessions !== "all" && isFiche) {
      const ff = f as FichePedagogique;
      if (sessions === "unknown" ? ff.sessionsCount !== null : String(ff.sessionsCount) !== sessions) return false;
    }
    if (sessions !== "all" && !isFiche) return false;
    const q = normalizeArabic(query);
    if (q.length >= 2) {
      const ff = f as FichePedagogique;
      const hay = normalizeArabic(
        [
          f.title,
          f.subject,
          f.semester,
          f.description,
          f.level,
          f.keywords.join(" "),
          f.files.map((x) => x.name).join(" "),
          isFiche
            ? `الجذاذة ${ff.lessonNumber} الدرس ${ff.lessonNumber} الجذاذة ${Number(ff.lessonNumber)} الدرس ${Number(ff.lessonNumber)} ${ff.unitTitle} مجزوءة ${ff.module} ${ff.source ?? ""}`
            : "",
          isFiche && ff.sessionsCount ? `عدد الحصص ${ff.sessionsCount} ${ff.sessionsCount} حصص حصة ${ff.sessionsCount} حصص` : "",
        ].join(" ")
      );
      if (!hay.includes(q)) return false;
    }
    return true;
  };

  const fiches = useMemo(() => {
    const list = FICHES_PEDAGOGIQUES.filter((f) => matches(f, true));
    const idx = new Map(FICHES_PEDAGOGIQUES.map((f, i) => [f.id, i]));
    const sorted = [...list];
    switch (sort) {
      case "title":
        sorted.sort((a, b) => arabicCompare(a.title, b.title));
        break;
      case "subject":
        sorted.sort((a, b) => (a.subject === b.subject ? idx.get(a.id)! - idx.get(b.id)! : a.subject === "التاريخ" ? -1 : 1));
        break;
      case "semester":
        sorted.sort((a, b) => (a.semester === b.semester ? idx.get(a.id)! - idx.get(b.id)! : a.semester === "الدورة الأولى" ? -1 : 1));
        break;
      case "newest":
        sorted.sort((a, b) => (a.createdAt === b.createdAt ? idx.get(a.id)! - idx.get(b.id)! : b.createdAt.localeCompare(a.createdAt)));
        break;
      case "oldest":
        sorted.sort((a, b) => (a.createdAt === b.createdAt ? idx.get(a.id)! - idx.get(b.id)! : a.createdAt.localeCompare(b.createdAt)));
        break;
      default:
        sorted.sort((a, b) => idx.get(a.id)! - idx.get(b.id)!);
    }
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, subject, semester, kind, sessions, sort]);

  const docs = useMemo(() => FICHES_GENERAL_DOCS.filter((g) => matches(g, false)), [query, subject, semester, kind]);

  const groups = SUBJECTS.flatMap((s) =>
    SEMESTERS.map((c) => ({ subject: s, semester: c, items: fiches.filter((f) => f.subject === s && f.semester === c) })).filter(
      (g) => g.items.length > 0
    )
  );

  const filtered = fiches.length + docs.length;
  const sel =
    "rounded-xl border border-ink-900/10 bg-white px-3 py-2.5 text-xs font-bold text-ink-700 outline-none transition-colors focus:border-brand-400";

  /* ------------------------- عرض التفاصيل ------------------------- */
  if (open && (detailFiche || detailDoc)) {
    return (
      <section className="relative overflow-hidden pt-32 md:pt-36">
        <div className="pointer-events-none absolute inset-0 pattern-zellige-dark opacity-30" aria-hidden="true" />
        <div className="relative">
          <FicheDetails
            fiche={detailFiche}
            doc={detailDoc}
            onPreview={showPreview}
            onBack={() => go({ view: "jadadatLib" })}
            go={go}
          />
        </div>
        {preview && <PdfModal file={preview.file} title={preview.title} onClose={() => setPreview(null)} />}
      </section>
    );
  }

  /* --------------------------- اللائحة --------------------------- */
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-36">
      <div className="pointer-events-none absolute inset-0 pattern-zellige-dark opacity-30" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* ===== بطاقة تعريف القسم ===== */}
        <Reveal>
          <section className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-brand-900/10 ring-1 ring-ink-900/10">
            <div className="p-5 sm:p-7" style={{ background: "linear-gradient(135deg, #f6e7c6 0%, #ffffff 65%)" }}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-extrabold text-white">
                <Library className="size-3.5" aria-hidden="true" />
                وثائق الأستاذ — ملفات أصلية PDF و Word
              </span>
              <h1 className="mt-3 font-display text-2xl font-black text-ink-900 sm:text-[32px]">جذاذات الجذع المشترك العلمي</h1>
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-ink-600">
                جميع الجذاذات التربوية لمادة الاجتماعيات الخاصة بمستوى الجذع المشترك العلمي، منظمة حسب المادة والدورة
                والدرس، مع إمكانية البحث والمعاينة والتحميل بصيغة PDF.
              </p>
              <p className="mt-2 text-[11.5px] font-bold text-ink-500">
                المادة: الاجتماعيات – الثانوي التأهيلي بالمغرب · المستوى: الجذع المشترك العلمي · إعداد وإنجاز: الأستاذ عماد
                طليل — ثانوية القدس، القنيطرة
              </p>
            </div>

            <div className="grid gap-px border-t sm:grid-cols-2 lg:grid-cols-5" style={{ borderColor: "#e6d6b3", background: "#e6d6b3" }}>
              {[
                { k: "خانات الجذاذات", v: `${FICHES_PEDAGOGIQUES.length}`, s: "حسب المقرر الرسمي" },
                { k: "ملفات PDF", v: `${FICHES_PDF_COUNT}`, s: "قابلة للمعاينة والتحميل" },
                { k: "ملفات Word", v: `${FICHES_WORD_COUNT}`, s: "تحميل مباشر" },
                { k: "جذاذات لها ملف أصلي", v: `${FICHES_WITH_FILE}/${FICHES_PEDAGOGIQUES.length}`, s: `${FICHES_WITH_PDF} منها بنسخة PDF` },
                { k: "مجموع الملفات", v: `${FICHES_TOTAL_FILES}`, s: "من وثائق الأستاذ" },
              ].map((b) => (
                <div key={b.k} className="bg-white px-4 py-3">
                  <p className="text-[10px] font-extrabold text-ink-500">{b.k}</p>
                  <p className="mt-1 font-display text-xl font-black text-brand-700">{b.v}</p>
                  <p className="mt-0.5 text-[10px] font-bold text-ink-400">{b.s}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ===== البحث والتصفية ===== */}
        <Reveal delay={80}>
          <div className="sticky top-2 z-20 mt-5 rounded-2xl border border-ink-900/10 bg-white/95 p-3.5 shadow-lg shadow-brand-900/5 backdrop-blur" data-no-print>
            <label className="relative block">
              <Search className="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-4 text-ink-400" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="🔎 ابحث عن جذاذة..."
                aria-label="ابحث عن جذاذة"
                className="w-full rounded-xl border border-ink-900/10 bg-paper-warm/40 py-3 ps-10 pe-9 text-sm font-bold text-ink-900 outline-none transition-colors placeholder:font-semibold placeholder:text-ink-400 focus:border-brand-400 focus:bg-white"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="مسح البحث"
                  className="absolute inset-y-0 end-2 my-auto grid size-6 place-items-center rounded-full text-ink-400 transition-colors hover:bg-brand-50 hover:text-ink-700"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </label>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select value={subject} onChange={(e) => setSubject(e.target.value as typeof subject)} aria-label="المادة" className={sel}>
                <option value="all">المادة: الكل</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select value={semester} onChange={(e) => setSemester(e.target.value as typeof semester)} aria-label="الدورة" className={sel}>
                <option value="all">الدورة: الكل</option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select value={kind} onChange={(e) => setKind(e.target.value as KindKey)} aria-label="نوع المورد" className={sel}>
                {KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.id === "all" ? "نوع المورد: " : ""}
                    {k.label}
                  </option>
                ))}
              </select>

              <select value={sessions} onChange={(e) => setSessions(e.target.value)} aria-label="عدد الحصص" className={sel}>
                <option value="all">عدد الحصص: الكل</option>
                {sessionOptions.map((n) => (
                  <option key={n} value={String(n)}>
                    {n} حصص
                  </option>
                ))}
                <option value="unknown">غير محدّد في الوثيقة</option>
              </select>

              <label className="inline-flex items-center gap-2 text-[11px] font-extrabold text-ink-500">
                ترتيب حسب:
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="ترتيب حسب" className={sel}>
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSubject("all");
                  setSemester("all");
                  setKind("all");
                  setSessions("all");
                  setSort("order");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-ink-900/10 bg-paper-warm/60 px-3 py-2.5 text-[11px] font-extrabold text-ink-600 transition-colors hover:bg-paper-warm"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                إعادة الضبط
              </button>

              <span className="ms-auto rounded-full bg-brand-50 px-3 py-1.5 text-[11px] font-black text-brand-700">
                {filtered} نتيجة
              </span>
            </div>

            <p className="mt-2.5 text-[10.5px] font-semibold leading-relaxed text-ink-500">
              البحث فوري ويشمل: عنوان الدرس، المادة، الدورة، رقم الدرس، الوحدة، الكلمات المفتاحية وأسماء الملفات — ويعمل مع
              التصفية والترتيب في الوقت نفسه (مثال: الجغرافيا + الدورة الأولى + «السكان»).
            </p>
          </div>
        </Reveal>

        {/* ===== البطاقات ===== */}
        {filtered === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-brand-300 bg-white p-12 text-center">
            <Search className="mx-auto size-10 text-brand-300" aria-hidden="true" />
            <p className="mt-4 font-display text-lg font-extrabold text-ink-900">لا نتيجة مطابقة</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
              جرّب كلمة أعمّ (مثل «المغرب» أو «الثورة» أو «المناخ») أو أعد ضبط التصفية.
            </p>
          </div>
        ) : (
          <>
            {groups.map((g) => (
              <div key={`${g.subject}-${g.semester}`} className="mt-8">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 font-display text-lg font-black text-ink-900">
                    <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white">
                      {g.subject === "التاريخ" ? <CalendarDays className="size-4" aria-hidden="true" /> : <Layers className="size-4" aria-hidden="true" />}
                    </span>
                    {g.subject} — {g.semester}
                  </h2>
                  <span className="text-[11px] font-bold text-ink-500">{g.items.length} جذاذة</span>
                </div>
                <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                  {g.items.map((f) => (
                    <FicheCard key={f.id} f={f} onPreview={showPreview} go={go} />
                  ))}
                </div>
              </div>
            ))}

            {docs.length > 0 && (
              <div className="mt-8">
                <h2 className="flex items-center gap-2 font-display text-lg font-black text-ink-900">
                  <span className="grid size-8 place-items-center rounded-lg bg-gold-500 text-white">
                    <FolderOpen className="size-4" aria-hidden="true" />
                  </span>
                  وثائق عامة ومجموعات جذاذات
                </h2>
                <p className="mt-1.5 text-[11px] font-semibold text-ink-500">
                  ملفات لا ترتبط بدرس واحد: تقديم عام، تقويم تشخيصي، ومجموعات تضم عدة جذاذات في ملف واحد.
                </p>
                <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                  {docs.map((g) => (
                    <GeneralCard key={g.id} g={g} onPreview={showPreview} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== روابط مفيدة ===== */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-no-print>
          <button
            type="button"
            onClick={() => go({ view: "jadadat", level: "tc" })}
            className="rounded-2xl border border-ink-900/8 bg-white p-4 text-start transition-all hover:-translate-y-0.5 hover:border-brand-300"
          >
            <BookOpenCheck className="size-5 text-brand-600" aria-hidden="true" />
            <p className="mt-2 font-display text-[13px] font-black text-ink-900">قسم الجذاذات المعروضة</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
              الجذاذات الـ25 كما وردت حرفيًا في وثائق الأستاذ، للطباعة والتحميل.
            </p>
          </button>
          <button
            type="button"
            onClick={() => go({ view: "dashboard", tab: "jadadat" })}
            className="rounded-2xl border border-ink-900/8 bg-white p-4 text-start transition-all hover:-translate-y-0.5 hover:border-brand-300"
          >
            <LayoutDashboard className="size-5 text-brand-600" aria-hidden="true" />
            <p className="mt-2 font-display text-[13px] font-black text-ink-900">تتبّع الإنجاز (لوحة الأستاذ)</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
              حالة إنجاز كل جذاذة بالتاريخ والقسم — دخول محمي باسم مستعمل وكلمة مرور.
            </p>
          </button>
          <button
            type="button"
            onClick={() => go({ view: "jadadatPrepared" })}
            className="rounded-2xl border border-ink-900/8 bg-white p-4 text-start transition-all hover:-translate-y-0.5 hover:border-brand-300"
          >
            <Sparkles className="size-5 text-brand-600" aria-hidden="true" />
            <p className="mt-2 font-display text-[13px] font-black text-ink-900">جذاذات مُعدَّة لكل الدروس</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
              25 جذاذة بُنيت من دروس الموقع وفق التوجيهات التربوية وديداكتيك المادة: كفايات، مقاطع، تدبير، تقويم — للطباعة والتحميل.
            </p>
          </button>
          <div className="rounded-2xl border border-gold-300/70 bg-gold-50 p-4">
            <Info className="size-5 text-gold-600" aria-hidden="true" />
            <p className="mt-2 font-display text-[13px] font-black text-gold-800">ملفات أصلية، لا نسخ مُعادة</p>
            <p className="mt-1 text-[11px] leading-relaxed text-gold-800/85">
              كل ما يُحمَّل هنا هو ملف الأستاذ نفسه: اسمه الأصلي وحجمه وجودته ولغته العربية محفوظة.
            </p>
          </div>
        </div>
      </div>

      {preview && <PdfModal file={preview.file} title={preview.title} onClose={() => setPreview(null)} />}
    </section>
  );
}

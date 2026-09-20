import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  ArrowLeft,
  BookOpenCheck,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  GraduationCap,
  Info,
  Printer,
  QrCode,
  ScanLine,
  Share2,
  Sparkles,
} from "lucide-react";
import type { DiagnosticLevel, Route } from "../routes";
import Reveal from "./Reveal";
import TestFlow from "./test/TestFlow";

export const DIAGNOSTIC_LEVELS = [
  {
    id: "jad3-moshtarak",
    label: "الجذع المشترك",
    bankLevel: "الجذع المشترك",
    description: "تقويم تأسيسي لمكتسبات التلاميذ في التاريخ والجغرافيا قبل متابعة مسار الثانوي التأهيلي.",
    accent: "from-brand-700 to-brand-950",
  },
  {
    id: "1bac",
    label: "الأولى بكالوريا",
    bankLevel: "الأولى باكالوريا",
    description: "تقويم تشخيصي يحدد المكتسبات والمهارات التي يحتاجها المتعلم في بداية الأولى بكالوريا.",
    accent: "from-ink-700 to-ink-950",
  },
  {
    id: "2bac",
    label: "الثانية بكالوريا",
    bankLevel: "الثانية باكالوريا",
    description: "تقويم قبلي يساعد على رصد المكتسبات وتحديد أولويات الدعم في السنة النهائية.",
    accent: "from-brand-600 to-brand-900",
  },
] as const;

type DiagnosticLevelInfo = (typeof DIAGNOSTIC_LEVELS)[number];

interface DiagnosticProps {
  level?: DiagnosticLevel;
  go: (route: Route) => void;
}

const getLevelInfo = (id?: DiagnosticLevel): DiagnosticLevelInfo | undefined => DIAGNOSTIC_LEVELS.find((item) => item.id === id);

function actualDiagnosticUrl(level: DiagnosticLevel): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/diagnostic/${level}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
    return entities[character] ?? character;
  });
}

function printWindow(title: string, html: string): void {
  const popup = window.open("", "_blank", "width=850,height=900");
  if (!popup) return;
  popup.document.open();
  popup.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Tahoma, sans-serif; color: #10241c; background: #fff; }
    .sheet { min-height: 250mm; display: grid; place-items: center; text-align: center; padding: 12mm; }
    .card { width: 100%; max-width: 680px; border: 2px solid #0c7c5b; border-radius: 24px; padding: 34px 30px; }
    h1 { margin: 0 0 8px; color: #064c36; font-size: 28px; }
    h2 { margin: 8px 0 18px; color: #ba7b18; font-size: 23px; }
    p { line-height: 1.8; margin: 8px 0; font-size: 16px; }
    img { display: block; width: 300px; height: 300px; margin: 22px auto; image-rendering: pixelated; }
    .small { color: #53665e; font-size: 12px; direction: ltr; word-break: break-all; }
    .teacher { margin-top: 22px; color: #064c36; font-weight: 700; }
    .instruction { margin-top: 22px; padding: 14px; background: #f7f3e8; border-radius: 14px; }
    @media print { .no-print { display: none; } }
  </style></head><body><main class="sheet">${html}</main><script>window.onload=function(){window.focus();setTimeout(function(){window.print()},250)};window.onafterprint=function(){window.close()};</script></body></html>`);
  popup.document.close();
}

interface QRPanelProps {
  level: DiagnosticLevelInfo;
  url: string;
  onView: () => void;
}

function QRPanel({ level, url, onView }: QRPanelProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let alive = true;
    setQrDataUrl("");
    QRCode.toDataURL(url, {
      width: 1200,
      margin: 3,
      errorCorrectionLevel: "H",
      color: { dark: "#063828", light: "#ffffff" },
    }).then((dataUrl) => {
      if (alive) setQrDataUrl(dataUrl);
    }).catch(() => {
      if (alive) setNotice("تعذر إنشاء الرمز الآن. أعد تحميل الصفحة من فضلك.");
    });
    return () => {
      alive = false;
    };
  }, [url]);

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qr-${level.id}-diagnostic.png`;
    link.click();
    notify("تم تحميل رمز QR بصيغة PNG عالية الجودة.");
  };

  const printQR = () => {
    if (!qrDataUrl) return;
    printWindow(
      `QR Code — ${level.label}`,
      `<div class="card"><h1>الدخول إلى التقويم التشخيصي</h1><h2>${escapeHtml(level.label)}</h2><img src="${qrDataUrl}" alt="QR Code"><p>امسح الرمز للدخول إلى التقويم التشخيصي</p><p class="small">${escapeHtml(url)}</p><p class="teacher">إعداد وإنجاز: الأستاذ عماد طليل — ثانوية القدس، القنيطرة</p></div>`,
    );
  };

  const printCard = () => {
    if (!qrDataUrl) return;
    printWindow(
      `بطاقة التقويم التشخيصي — ${level.label}`,
      `<div class="card"><h1>الثانوية التأهيلية القدس</h1><p>مادة الاجتماعيات</p><h2>التقويم التشخيصي — ${escapeHtml(level.label)}</h2><img src="${qrDataUrl}" alt="QR Code"><p><strong>امسح الرمز للدخول إلى التقويم</strong></p><div class="instruction"><p>افتح كاميرا هاتفك، امسح رمز QR، اضغط على الرابط الظاهر، ثم ابدأ التقويم التشخيصي.</p></div><p class="teacher">الأستاذ عماد طليل</p></div>`,
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      notify("تم نسخ رابط التقويم.");
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      input.setAttribute("readonly", "true");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      notify("تم نسخ رابط التقويم.");
    }
  };

  return (
    <Reveal>
      <section className="overflow-hidden rounded-3xl border border-brand-200/70 bg-white shadow-[0_30px_80px_-38px_rgba(4,36,26,0.45)]" aria-labelledby="qr-title">
        <div className="border-b border-brand-100 bg-gradient-to-l from-brand-900 to-brand-700 px-6 py-6 text-white sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-gold-200">
                <QrCode className="size-3.5" aria-hidden="true" />
                دخول سريع بالهاتف
              </span>
              <h2 id="qr-title" className="mt-3 font-display text-2xl font-black sm:text-3xl">الدخول إلى التقويم التشخيصي</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">امسح رمز QR باستعمال كاميرا الهاتف للولوج مباشرة إلى التقويم.</p>
            </div>
            <div className="grid size-14 place-items-center rounded-2xl bg-gold-400/15 text-gold-200">
              <ScanLine className="size-8" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-6 md:grid-cols-[minmax(230px,320px)_1fr] md:p-8">
          <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-ink-900/8 bg-paper-warm/50 p-5">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`رمز QR للدخول إلى تقويم ${level.label}`} className="h-auto w-full max-w-[290px] rounded-xl bg-white p-3 shadow-sm" />
            ) : (
              <div className="grid size-[250px] place-items-center rounded-xl bg-white text-center text-xs font-bold text-ink-400">جارٍ إنشاء رمز QR…</div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-brand-50 p-4">
                <p className="text-[11px] font-bold text-ink-500">المستوى</p>
                <p className="mt-1 font-display text-base font-black text-brand-800">{level.label}</p>
              </div>
              <div className="rounded-2xl bg-gold-50 p-4">
                <p className="text-[11px] font-bold text-ink-500">المادة</p>
                <p className="mt-1 font-display text-base font-black text-gold-800">الاجتماعيات</p>
              </div>
              <div className="rounded-2xl bg-paper-warm p-4">
                <p className="text-[11px] font-bold text-ink-500">نوع التقويم</p>
                <p className="mt-1 font-display text-base font-black text-ink-800">تشخيصي</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
              <p className="flex items-center gap-2 font-display text-sm font-extrabold text-brand-900"><Info className="size-4 text-brand-600" aria-hidden="true" /> طريقة الولوج</p>
              <ol className="mt-3 grid gap-2 text-sm leading-relaxed text-ink-700">
                <li><b className="text-brand-700">1.</b> افتح كاميرا هاتفك.</li>
                <li><b className="text-brand-700">2.</b> امسح رمز QR.</li>
                <li><b className="text-brand-700">3.</b> اضغط على الرابط الظاهر.</li>
                <li><b className="text-brand-700">4.</b> ابدأ التقويم التشخيصي.</li>
              </ol>
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <button type="button" onClick={downloadQR} disabled={!qrDataUrl} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-brand-700/20 transition enabled:hover:-translate-y-0.5 disabled:opacity-40">
                <Download className="size-4" aria-hidden="true" /> تحميل QR Code
              </button>
              <button type="button" onClick={printQR} disabled={!qrDataUrl} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-xs font-extrabold text-brand-700 transition enabled:hover:-translate-y-0.5 disabled:opacity-40">
                <Printer className="size-4" aria-hidden="true" /> طباعة QR Code
              </button>
              <button type="button" onClick={copyLink} className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-white px-4 py-2.5 text-xs font-extrabold text-ink-700 transition hover:-translate-y-0.5 hover:border-brand-300">
                <Copy className="size-4 text-brand-600" aria-hidden="true" /> نسخ رابط التقويم
              </button>
              <button type="button" onClick={onView} className="inline-flex items-center gap-2 rounded-xl border border-gold-300 bg-gold-50 px-4 py-2.5 text-xs font-extrabold text-gold-800 transition hover:-translate-y-0.5">
                <ExternalLink className="size-4" aria-hidden="true" /> عرض التقويم
              </button>
              <button type="button" onClick={printCard} disabled={!qrDataUrl} className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-white px-4 py-2.5 text-xs font-extrabold text-ink-700 transition enabled:hover:-translate-y-0.5 disabled:opacity-40">
                <Share2 className="size-4 text-brand-600" aria-hidden="true" /> طباعة بطاقة التقويم
              </button>
            </div>
            {notice && <p role="status" className="mt-3 text-xs font-bold text-brand-700">{notice}</p>}
            <p className="mt-4 break-all rounded-xl bg-paper-warm/60 px-3 py-2 text-[10px] text-ink-500" dir="ltr">{url}</p>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function LevelSelector({ go }: { go: (route: Route) => void }) {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40">
      <div className="pointer-events-none absolute inset-0 pattern-zellige-dark opacity-45" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
              <ClipboardList className="size-3.5" aria-hidden="true" />
              التقويم التشخيصي في الاجتماعيات
            </span>
            <h1 className="mt-5 font-display text-3xl font-black leading-[1.3] text-ink-900 sm:text-4xl lg:text-5xl">اختر المستوى الدراسي</h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-loose text-ink-500 sm:text-base">
              اختر المستوى لفتح صفحة التقويم الخاصة به، ومسح رمز QR أو مشاركة الرابط المباشر مع التلاميذ.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {DIAGNOSTIC_LEVELS.map((level, index) => (
            <Reveal key={level.id} delay={index * 100}>
              <button
                type="button"
                onClick={() => go({ view: "diagnostic", level: level.id })}
                className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-ink-900/8 bg-white p-7 text-start shadow-[0_25px_60px_-35px_rgba(4,36,26,0.4)] transition-all duration-300 hover:-translate-y-2 hover:border-brand-300 hover:shadow-[0_30px_65px_-28px_rgba(12,124,91,0.35)]"
              >
                <div className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-l ${level.accent}`} aria-hidden="true" />
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white">
                  <GraduationCap className="size-6" aria-hidden="true" />
                </span>
                <h2 className="mt-6 font-display text-xl font-black text-ink-900">{level.label}</h2>
                <p className="mt-3 flex-1 text-sm leading-loose text-ink-500">{level.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-brand-700 transition-transform group-hover:-translate-x-1">فتح صفحة المستوى <ArrowLeft className="size-4" aria-hidden="true" /></span>
              </button>
            </Reveal>
          ))}
        </div>

        <Reveal delay={350}>
          <div className="mx-auto mt-10 flex max-w-3xl items-start gap-3 rounded-2xl border border-gold-300/60 bg-gold-50 p-5 text-sm leading-loose text-gold-800">
            <Sparkles className="mt-1 size-5 shrink-0" aria-hidden="true" />
            <p>لكل مستوى رابط وQR Code مستقل؛ النتيجة التي يرسلها التلميذ تبقى مرتبطة بالمستوى والقسم الذي اختاره داخل التقويم.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function LevelPage({ level, go }: { level: DiagnosticLevelInfo; go: (route: Route) => void }) {
  const url = useMemo(() => actualDiagnosticUrl(level.id), [level.id]);

  const scrollToTest = () => {
    document.getElementById("diagnostic-test")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-36">
      <div className="pointer-events-none absolute inset-0 pattern-zellige-dark opacity-35" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => go({ view: "diagnostic" })} className="inline-flex items-center gap-2 text-sm font-extrabold text-brand-700 transition hover:text-brand-900">
              <ArrowLeft className="size-4" aria-hidden="true" /> اختيار مستوى آخر
            </button>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-bold text-brand-700">
              <BookOpenCheck className="size-3.5" aria-hidden="true" /> مادة الاجتماعيات
            </span>
          </div>
          <div className="mt-8 max-w-3xl">
            <p className="text-sm font-bold text-brand-700">التقويم التشخيصي · {level.label}</p>
            <h1 className="mt-3 font-display text-3xl font-black leading-[1.3] text-ink-900 sm:text-4xl lg:text-5xl">صفحة تقويم {level.label}</h1>
            <p className="mt-4 text-sm leading-loose text-ink-500 sm:text-base">{level.description} اختر المسلك المناسب أسفل بطاقة الدخول ثم ابدأ التقويم، وستُحفظ النتيجة مع المستوى والقسم ورقم التلميذ.</p>
          </div>
        </Reveal>

        <div className="mt-10">
          <QRPanel level={level} url={url} onView={scrollToTest} />
        </div>

        <div id="diagnostic-test" className="mt-12 scroll-mt-24">
          <TestFlow
            key={level.id}
            diagnosticLevel={level.bankLevel}
            onBackToLevels={() => go({ view: "diagnostic" })}
            onHome={() => go({ view: "home" })}
          />
        </div>
      </div>
    </section>
  );
}

export default function Diagnostic({ level, go }: DiagnosticProps) {
  const info = getLevelInfo(level);
  return info ? <LevelPage level={info} go={go} /> : <LevelSelector go={go} />;
}

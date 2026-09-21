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
import { scheduleForClass, sessionTimeLabel } from "../data/diagnosticSchedule";
import Reveal from "./Reveal";
import TestFlow from "./test/TestFlow";

export const DIAGNOSTIC_LEVELS = [
  {
    id: "jad3-moshtarak",
    label: "الجذع المشترك",
    bankLevel: "الجذع المشترك",
    defaultBank: "tc-sci",
    description: "تقويم تأسيسي لمكتسبات التلاميذ في التاريخ والجغرافيا قبل متابعة مسار الثانوي التأهيلي.",
    accent: "from-brand-700 to-brand-950",
  },
  {
    id: "1bac",
    label: "الأولى بكالوريا",
    bankLevel: "الأولى باكالوريا",
    defaultBank: "bac1-sci",
    description: "تقويم تشخيصي يحدد المكتسبات والمهارات التي يحتاجها المتعلم في بداية الأولى بكالوريا.",
    accent: "from-ink-700 to-ink-950",
  },
  {
    id: "2bac",
    label: "الثانية بكالوريا",
    bankLevel: "الثانية باكالوريا",
    defaultBank: "bac2-hum",
    description: "تقويم قبلي يساعد على رصد المكتسبات وتحديد أولويات الدعم في السنة النهائية.",
    accent: "from-brand-600 to-brand-900",
  },
] as const;

type DiagnosticLevelInfo = (typeof DIAGNOSTIC_LEVELS)[number];

interface DiagnosticProps {
  level?: DiagnosticLevel;
  className?: string;
  go: (route: Route) => void;
}

const getLevelInfo = (id?: DiagnosticLevel): DiagnosticLevelInfo | undefined => DIAGNOSTIC_LEVELS.find((item) => item.id === id);

function actualDiagnosticUrl(level: DiagnosticLevel, className?: string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  const query = className ? `?class=${encodeURIComponent(className)}` : "";
  return `${base}#/diagnostic/${level}${query}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
    return entities[character] ?? character;
  });
}

function printWindow(title: string, html: string): void {
  /* نطبع من الصفحة الحالية مباشرة حتى لا تمنع المتصفحات النافذة المنبثقة أو فقدان صلاحية الطباعة. */
  const root = document.createElement("div");
  root.id = "qr-print-root";
  root.innerHTML = `<main class="sheet">${html}</main>`;

  const style = document.createElement("style");
  style.id = "qr-print-style";
  style.textContent = `
    #qr-print-root { display: none; }
    @media print {
      @page { size: A4; margin: 14mm; }
      html, body { background: #fff !important; }
      body > *:not(#qr-print-root):not(#qr-print-style) { display: none !important; }
      #qr-print-root { display: grid !important; min-height: 250mm; place-items: center; text-align: center; padding: 12mm; color: #10241c; font-family: Arial, Tahoma, sans-serif; }
      #qr-print-root .card { width: 100%; max-width: 680px; border: 2px solid #0c7c5b; border-radius: 24px; padding: 34px 30px; }
      #qr-print-root h1 { margin: 0 0 8px; color: #064c36; font-size: 28px; }
      #qr-print-root h2 { margin: 8px 0 18px; color: #ba7b18; font-size: 23px; }
      #qr-print-root p { line-height: 1.8; margin: 8px 0; font-size: 16px; }
      #qr-print-root img { display: block; width: 300px; height: 300px; margin: 22px auto; image-rendering: pixelated; }
      #qr-print-root .small { color: #53665e; font-size: 12px; direction: ltr; word-break: break-all; }
      #qr-print-root .teacher { margin-top: 22px; color: #064c36; font-weight: 700; }
      #qr-print-root .instruction { margin-top: 22px; padding: 14px; background: #f7f3e8; border-radius: 14px; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(root);

  const previousTitle = document.title;
  const cleanup = () => {
    window.removeEventListener("afterprint", cleanup);
    window.clearTimeout(fallback);
    document.title = previousTitle;
    style.remove();
    root.remove();
  };
  window.addEventListener("afterprint", cleanup, { once: true });
  const fallback = window.setTimeout(cleanup, 60000);
  document.title = title;
  window.print();
}


interface QRPanelProps {
  level: DiagnosticLevelInfo;
  onView: () => void;
  className?: string;
  compact?: boolean;
}

function QRPanel({ level, onView, className, compact = false }: QRPanelProps) {
  const session = scheduleForClass(className, level.defaultBank);
  const qrLabel = session?.displayClass ?? level.label;
  const url = useMemo(() => actualDiagnosticUrl(level.id, className), [level.id, className]);
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
    link.download = `qr-${level.id}-${className ? className.replace(/\s+/g, "-") : "level"}-diagnostic.png`;
    link.click();
    notify("تم تحميل رمز QR بصيغة PNG عالية الجودة.");
  };

  const printQR = () => {
    if (!qrDataUrl) return;
    printWindow(
      `QR Code — ${qrLabel}`,
      `<div class="card"><h1>الدخول إلى التقويم التشخيصي</h1><h2>${escapeHtml(qrLabel)}</h2><img src="${qrDataUrl}" alt="QR Code"><p>امسح الرمز للدخول إلى التقويم التشخيصي</p><p class="small">${escapeHtml(url)}</p><p class="teacher">إعداد وإنجاز: الأستاذ عماد طليل — ثانوية القدس، القنيطرة</p></div>`,
    );
  };

  const printCard = () => {
    if (!qrDataUrl) return;
    printWindow(
      `بطاقة التقويم التشخيصي — ${qrLabel}`,
      `<div class="card"><h1>الثانوية التأهيلية القدس</h1><p>مادة الاجتماعيات</p><h2>التقويم التشخيصي — ${escapeHtml(qrLabel)}</h2><img src="${qrDataUrl}" alt="QR Code"><p><strong>امسح الرمز للدخول إلى التقويم</strong></p><div class="instruction"><p>افتح كاميرا هاتفك، امسح رمز QR، اضغط على الرابط الظاهر، ثم ابدأ التقويم التشخيصي.</p></div><p class="teacher">الأستاذ عماد طليل</p></div>`,
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
      <section className={`${compact ? "rounded-2xl shadow-[0_18px_45px_-28px_rgba(4,36,26,0.45)]" : "rounded-3xl shadow-[0_30px_80px_-38px_rgba(4,36,26,0.45)]"} overflow-hidden border border-brand-200/70 bg-white`} aria-labelledby="qr-title">
        <div className={`${compact ? "px-4 py-4" : "px-6 py-6 sm:px-8"} border-b border-brand-100 bg-gradient-to-l from-brand-900 to-brand-700 text-white`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-gold-200">
                <QrCode className="size-3.5" aria-hidden="true" />
                دخول سريع بالهاتف
              </span>
              <h2 id="qr-title" className={`${compact ? "mt-2 text-lg" : "mt-3 text-2xl sm:text-3xl"} font-display font-black`}>الدخول إلى التقويم التشخيصي</h2>
              <p className={`${compact ? "mt-1 text-[11px]" : "mt-2 text-sm"} max-w-xl leading-relaxed text-white/70`}>امسح رمز QR باستعمال كاميرا الهاتف للولوج مباشرة إلى التقويم.</p>
            </div>
            <div className={`${compact ? "size-10 rounded-xl" : "size-14 rounded-2xl"} grid place-items-center bg-gold-400/15 text-gold-200`}>
              <ScanLine className={compact ? "size-5" : "size-8"} aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className={`${compact ? "gap-4 p-4" : "gap-8 p-6 md:p-8"} grid md:grid-cols-[minmax(170px,230px)_1fr]`}>
          <div className={`${compact ? "min-h-[180px] rounded-2xl p-3" : "min-h-[300px] rounded-3xl p-5"} flex items-center justify-center border border-ink-900/8 bg-paper-warm/50`}>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`رمز QR للدخول إلى تقويم ${qrLabel}`}
                width={290}
                height={290}
                decoding="async"
                className={`${compact ? "max-w-[170px] p-2" : "max-w-[290px] p-3"} h-auto w-full rounded-xl bg-white shadow-sm`}
              />
            ) : (
              <div className={`${compact ? "size-[150px]" : "size-[250px]"} grid place-items-center rounded-xl bg-white text-center text-xs font-bold text-ink-400`}>جارٍ إنشاء رمز QR…</div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <div className={`${compact ? "gap-2" : "gap-3"} grid sm:grid-cols-3`}>
              <div className={`${compact ? "rounded-xl p-3" : "rounded-2xl p-4"} bg-brand-50`}>
                <p className="text-[10px] font-bold text-ink-500">المستوى</p>
                <p className={`${compact ? "text-sm" : "text-base"} mt-1 font-display font-black text-brand-800`}>{qrLabel}</p>
              </div>
              <div className={`${compact ? "rounded-xl p-3" : "rounded-2xl p-4"} bg-gold-50`}>
                <p className="text-[10px] font-bold text-ink-500">المادة</p>
                <p className={`${compact ? "text-sm" : "text-base"} mt-1 font-display font-black text-gold-800`}>الاجتماعيات</p>
              </div>
              <div className={`${compact ? "rounded-xl p-3" : "rounded-2xl p-4"} bg-paper-warm`}>
                <p className="text-[10px] font-bold text-ink-500">نوع التقويم</p>
                <p className={`${compact ? "text-sm" : "text-base"} mt-1 font-display font-black text-ink-800`}>تشخيصي</p>
              </div>
            </div>

            <div className={`${compact ? "mt-3 rounded-xl p-3" : "mt-5 rounded-2xl p-5"} border border-brand-100 bg-brand-50/50`}>
              <p className="flex items-center gap-2 font-display text-sm font-extrabold text-brand-900"><Info className="size-4 text-brand-600" aria-hidden="true" /> طريقة الولوج</p>
              <ol className={`${compact ? "mt-2 grid-cols-2 gap-x-3 gap-y-1 text-[11px]" : "mt-3 gap-2 text-sm"} grid leading-relaxed text-ink-700`}>
                <li><b className="text-brand-700">1.</b> افتح كاميرا هاتفك.</li>
                <li><b className="text-brand-700">2.</b> امسح رمز QR.</li>
                <li><b className="text-brand-700">3.</b> اضغط على الرابط الظاهر.</li>
                <li><b className="text-brand-700">4.</b> ابدأ التقويم التشخيصي.</li>
              </ol>
            </div>

            <div className={`${compact ? "mt-3 gap-1.5" : "mt-5 gap-2.5"} flex flex-wrap`}>
              <button type="button" onClick={downloadQR} disabled={!qrDataUrl} className={`${compact ? "px-2.5 py-2 text-[10px]" : "px-4 py-2.5 text-xs"} inline-flex items-center gap-1.5 rounded-xl bg-brand-700 font-extrabold text-white shadow-lg shadow-brand-700/20 transition enabled:hover:-translate-y-0.5 disabled:opacity-40`}>
                <Download className="size-3.5" aria-hidden="true" /> تحميل QR
              </button>
              <button type="button" onClick={printQR} disabled={!qrDataUrl} className={`${compact ? "px-2.5 py-2 text-[10px]" : "px-4 py-2.5 text-xs"} inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 font-extrabold text-brand-700 transition enabled:hover:-translate-y-0.5 disabled:opacity-40`}>
                <Printer className="size-3.5" aria-hidden="true" /> طباعة
              </button>
              <button type="button" onClick={copyLink} className={`${compact ? "px-2.5 py-2 text-[10px]" : "px-4 py-2.5 text-xs"} inline-flex items-center gap-1.5 rounded-xl border border-ink-900/10 bg-white font-extrabold text-ink-700 transition hover:-translate-y-0.5 hover:border-brand-300`}>
                <Copy className="size-3.5 text-brand-600" aria-hidden="true" /> نسخ الرابط
              </button>
              <button type="button" onClick={onView} className={`${compact ? "px-2.5 py-2 text-[10px]" : "px-4 py-2.5 text-xs"} inline-flex items-center gap-1.5 rounded-xl border border-gold-300 bg-gold-50 font-extrabold text-gold-800 transition hover:-translate-y-0.5`}>
                <ExternalLink className="size-3.5" aria-hidden="true" /> عرض التقويم
              </button>
              <button type="button" onClick={printCard} disabled={!qrDataUrl} className={`${compact ? "px-2.5 py-2 text-[10px]" : "px-4 py-2.5 text-xs"} inline-flex items-center gap-1.5 rounded-xl border border-ink-900/10 bg-white font-extrabold text-ink-700 transition enabled:hover:-translate-y-0.5 disabled:opacity-40`}>
                <Share2 className="size-3.5 text-brand-600" aria-hidden="true" /> طباعة البطاقة
              </button>
            </div>
            {notice && <p role="status" className="mt-3 text-xs font-bold text-brand-700">{notice}</p>}
            <p className={`${compact ? "mt-2" : "mt-4"} break-all rounded-xl bg-paper-warm/60 px-3 py-2 text-[10px] text-ink-500`} dir="ltr">{url}</p>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

/** بطاقة QR تُستعمل داخل لوحة الأستاذ فقط لتوزيع رابط المستوى على التلاميذ. */
export function DiagnosticQRPanel({ level, onView, className, compact }: QRPanelProps) {
  return <QRPanel level={level} onView={onView} className={className} compact={compact} />;
}

/** QR صغير خاص بقسم واحد؛ الرابط يحمل المستوى والقسم معًا. */
export function DiagnosticQRButton({ level, className, onView }: { level: DiagnosticLevelInfo; className: string; onView: () => void }) {
  const session = scheduleForClass(className, level.defaultBank);
  const url = useMemo(() => actualDiagnosticUrl(level.id, className), [level.id, className]);
  const [qrDataUrl, setQrDataUrl] = useState("");
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(url, { width: 320, margin: 2, errorCorrectionLevel: "H", color: { dark: "#063828", light: "#ffffff" } })
      .then((dataUrl) => alive && setQrDataUrl(dataUrl))
      .catch(() => alive && setQrDataUrl(""));
    return () => {
      alive = false;
    };
  }, [url]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
  };
  const download = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qr-${className.replace(/\s+/g, "-")}.png`;
    link.click();
  };
  return (
    <div className="flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/60 p-2" title={url}>
      {qrDataUrl ? <img src={qrDataUrl} alt={`QR ${session?.displayClass ?? className}`} className="size-16 rounded-lg bg-white p-1" /> : <span className="grid size-16 place-items-center rounded-lg bg-white text-[9px] text-ink-400">QR…</span>}
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold text-brand-800">QR القسم</p>
        <p className="mt-0.5 max-w-[150px] truncate text-[9px] text-ink-500">{session?.displayClass ?? className}</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <button type="button" onClick={onView} className="rounded-md bg-brand-700 px-2 py-1 text-[9px] font-extrabold text-white">عرض</button>
          <button type="button" onClick={copy} className="rounded-md border border-brand-200 bg-white px-2 py-1 text-[9px] font-extrabold text-brand-700">نسخ</button>
          <button type="button" onClick={download} disabled={!qrDataUrl} className="rounded-md border border-brand-200 bg-white px-2 py-1 text-[9px] font-extrabold text-brand-700 disabled:opacity-40">تحميل</button>
        </div>
      </div>
    </div>
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

function LevelPage({ level, className, go }: { level: DiagnosticLevelInfo; className?: string; go: (route: Route) => void }) {
  const lockedSession = scheduleForClass(className, level.defaultBank);

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
            <p className="text-sm font-bold text-brand-700">التقويم التشخيصي · {lockedSession?.displayClass ?? level.label}</p>
            <h1 className="mt-3 font-display text-3xl font-black leading-[1.3] text-ink-900 sm:text-4xl lg:text-5xl">صفحة تقويم {lockedSession?.displayClass ?? level.label}</h1>
            <p className="mt-4 text-sm leading-loose text-ink-500 sm:text-base">{level.description} {lockedSession ? `الموعد: ${sessionTimeLabel(lockedSession)}.` : "اختر المسلك المناسب أسفل بطاقة الدخول ثم ابدأ التقويم."} وستُحفظ النتيجة مع المستوى والقسم ورقم التلميذ.</p>
          </div>
        </Reveal>

        <div id="diagnostic-test" className="mt-12 scroll-mt-24">
          <TestFlow
            key={`${level.id}-${className ?? "all"}`}
            initialBank={level.defaultBank}
            diagnosticLevel={level.bankLevel}
            diagnosticLevelId={level.id}
            diagnosticClassName={className}
            onHome={() => go({ view: "home" })}
          />
        </div>
      </div>
    </section>
  );
}

export default function Diagnostic({ level, className, go }: DiagnosticProps) {
  const info = getLevelInfo(level);
  return info ? <LevelPage level={info} className={className} go={go} /> : <LevelSelector go={go} />;
}

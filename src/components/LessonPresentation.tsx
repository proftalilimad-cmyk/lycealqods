import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clipboard,
  Copy,
  Download,
  FileText,
  Image as ImageIcon,
  Lightbulb,
  ListChecks,
  MonitorPlay,
  Network,
  Printer,
  Quote,
  Table2,
  Target,
  X,
} from "lucide-react";
import type { LessonBlock, LessonContent } from "../types";
import type { ResolvedLesson } from "../data/lessonContent";
import { buildPresentationPrompt } from "../data/presentationPrompt";
import { getDeckForLesson, pageUrl } from "../data/decks";
import { routeToPath, type Route } from "../routes";
import Reveal from "./Reveal";

interface LessonPresentationProps {
  lesson: ResolvedLesson;
  go: (route: Route) => void;
}

type SlideKind = "title" | "objectives" | "context" | "concepts" | "section" | "paragraph" | "list" | "table" | "callout" | "document" | "schema" | "image" | "timeline" | "summary" | "assessment";

interface PresentationSlide {
  kind: SlideKind;
  title: string;
  eyebrow?: string;
  paragraphs?: string[];
  items?: string[];
  table?: { head: string[]; rows: string[][] };
  callout?: { label: string; text: string; tone: "def" | "info" | "warn" };
  doc?: { label: string; text: string; questions: { q: string; pts: number; answer: string }[] };
  schema?: { title?: string; rows: { label: string; value: string }[] };
  image?: { src: string; caption?: string };
  images?: { src: string; caption?: string }[];
  timeline?: { date: string; event: string }[];
}

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

function blocksToSlides(sectionTitle: string, blocks: LessonBlock[], slides: PresentationSlide[]): void {
  const paragraphs: string[] = [];
  const flushParagraphs = () => {
    if (paragraphs.length === 0) return;
    slides.push({ kind: "paragraph", title: sectionTitle, eyebrow: "شرح المحور", paragraphs: paragraphs.splice(0, paragraphs.length) });
  };
  blocks.forEach((block) => {
    if (block.type === "p") {
      paragraphs.push(block.text);
      return;
    }
    flushParagraphs();
    if (block.type === "ul") {
      slides.push({ kind: "list", title: block.title ?? sectionTitle, eyebrow: "أفكار أساسية", items: block.items });
    } else if (block.type === "table") {
      slides.push({ kind: "table", title: sectionTitle, eyebrow: "تنظيم المعطيات", table: { head: block.head, rows: block.rows } });
    } else {
      slides.push({ kind: "callout", title: block.label, eyebrow: sectionTitle, callout: block });
    }
  });
  flushParagraphs();
}

/** يبني شرائح من حقول الدرس نفسها، دون إضافة مصدر أو معلومة خارجية. */
export function buildLessonPresentation(lesson: LessonContent): PresentationSlide[] {
  const slides: PresentationSlide[] = [
    { kind: "title", title: lesson.title, eyebrow: "عرض تدريسي من محتوى الدرس" },
    { kind: "objectives", title: "أهداف التعلم", eyebrow: "في نهاية الدرس، ينبغي أن يكون المتعلم قادرًا على", items: lesson.objectives },
    { kind: "context", title: "تمهيد وإشكالية", eyebrow: "انطلق من السياق المتاح في الدرس", paragraphs: [lesson.intro, lesson.coreQuestion] },
  ];

  chunks(lesson.glossary, 6).forEach((group, index) => {
    slides.push({
      kind: "concepts",
      title: index === 0 ? "المفاهيم الأساسية" : "المفاهيم الأساسية — تابع",
      eyebrow: "معجم الدرس",
      items: group.map((item) => `${item.term}: ${item.def}`),
    });
  });

  lesson.sections.forEach((section) => {
    // يظهر عنوان المحور داخل كل شريحة من شرائحه لتبقى البنية الأصلية واضحة
    // من دون إضافة فواصل فارغة أو تجاوز المدى المناسب للعرض.
    blocksToSlides(section.title, section.blocks, slides);
  });

  (lesson.docs ?? []).forEach((doc, index) => {
    slides.push({ kind: "document", title: `تحليل الوثيقة ${index + 1}`, eyebrow: "وثيقة مرتبطة بالدرس", doc });
  });
  if (lesson.schema?.rows.length) slides.push({ kind: "schema", title: lesson.schema.title ?? "الخطاطة التركيبية", eyebrow: "تنظيم وتركيب المعرفة", schema: lesson.schema });
  const deck = getDeckForLesson(lesson.id);
  const visualMaterials: { src: string; caption?: string }[] = [];
  if (lesson.bookPage?.src) visualMaterials.push({ src: lesson.bookPage.src, caption: lesson.bookPage.caption ?? `صفحة ${lesson.bookPage.page}` });
  deck?.slides.slice(0, 3).forEach((deckSlide) => {
    const src = pageUrl(deckSlide.page, deck.pageBase);
    if (!visualMaterials.some((item) => item.src === src)) visualMaterials.push({ src, caption: `${deck.title} — ص ${deckSlide.page}` });
  });
  if (visualMaterials.length) slides.push({ kind: "image", title: "الموارد البصرية للدرس", eyebrow: "صور مرتبطة بالكتاب والدرس فقط", image: visualMaterials[0], images: visualMaterials.slice(0, 4) });
  chunks(lesson.timeline, 6).forEach((group, index) => slides.push({ kind: "timeline", title: index === 0 ? "الخط الزمني" : "الخط الزمني — تابع", eyebrow: "تواريخ وأحداث وردت في الدرس", timeline: group }));
  chunks(lesson.summary, 4).forEach((group, index) => slides.push({ kind: "summary", title: index === 0 ? "الخلاصة المركزة" : "الخلاصة — تابع", eyebrow: "أثر كتابي قابل للنسخ", items: group }));
  if (lesson.quiz.length) slides.push({ kind: "assessment", title: "التقويم الختامي", eyebrow: "أسئلة مأخوذة من تقويم الدرس", items: lesson.quiz.map((item, index) => `${index + 1}. ${item.q}`) });
  return slides;
}

function pptParagraphs(slide: PresentationSlide): string {
  if (slide.paragraphs?.length) return slide.paragraphs.join("\\n\\n");
  if (slide.items?.length) return slide.items.map((item) => `• ${item}`).join("\\n");
  if (slide.callout) return `${slide.callout.label}\\n\\n${slide.callout.text}`;
  if (slide.schema?.rows.length) return slide.schema.rows.map((row) => `${row.label}: ${row.value}`).join("\\n");
  if (slide.timeline?.length) return slide.timeline.map((item) => `${item.date} — ${item.event}`).join("\\n");
  if (slide.doc) return `${slide.doc.label}\\n\\n${slide.doc.text}\\n\\n${slide.doc.questions.map((item, index) => `${index + 1}. ${item.q}`).join("\\n")}`;
  if (slide.image) return slide.image.caption ?? "مورد بصري من الدرس";
  return "";
}

async function imageDataUrl(src: string): Promise<string | undefined> {
  if (typeof window === "undefined") return undefined;
  try {
    const response = await fetch(new URL(src, window.location.origin));
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return await new Promise<string | undefined>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

/** ينشئ ملف PowerPoint حقيقيًا من الشرائح نفسها، مع إبقاء مصدر المعرفة هو محتوى الدرس. */
export async function downloadLessonPowerPoint(lesson: LessonContent, meta: PresentationMeta): Promise<void> {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.rtlMode = true;
  pptx.author = "الأستاذ عماد طليل";
  pptx.company = "ثانوية القدس، القنيطرة";
  pptx.subject = `${meta.subjectLabel} — ${lesson.title}`;
  pptx.title = lesson.title;
  const slides = buildLessonPresentation(lesson);

  for (const [index, item] of slides.entries()) {
    const output = pptx.addSlide();
    output.background = { color: item.kind === "title" ? "063828" : "FFFFFF" };
    if (item.kind === "title") {
      output.addText(item.title, { x: 0.7, y: 1.65, w: 12, h: 1.2, fontFace: "Arial", fontSize: 30, bold: true, color: "FFFFFF", align: "center", valign: "middle", rtlMode: true, margin: 0.1 });
      output.addText(`${meta.subjectLabel} · ${meta.levelLabel} · ${meta.branchLabel}\\n${lesson.duration}`, { x: 1.1, y: 3.25, w: 11.2, h: 0.75, fontFace: "Arial", fontSize: 16, color: "F6D98B", align: "center", valign: "middle", rtlMode: true });
    } else {
      output.addText(item.title, { x: 0.55, y: 0.35, w: 12.25, h: 0.55, fontFace: "Arial", fontSize: 23, bold: true, color: "07553E", align: "right", rtlMode: true, margin: 0.03 });
      if (item.eyebrow) output.addText(item.eyebrow, { x: 0.6, y: 0.98, w: 12.1, h: 0.3, fontFace: "Arial", fontSize: 10, color: "B17617", align: "right", rtlMode: true, margin: 0.02 });
      if (item.kind === "table" && item.table) {
        const rows = [item.table.head, ...item.table.rows].map((row) => row.map((cell) => ({ text: cell })));
        output.addTable(rows, { x: 0.45, y: 1.35, w: 12.4, h: 5.55, fontFace: "Arial", fontSize: 10, color: "24332D", border: { type: "solid", color: "C9DDD3", pt: 0.6 }, fill: { color: "FFFFFF" }, margin: 0.06, valign: "middle" });
      } else if (item.kind === "image" && item.image) {
        const visuals = item.images ?? [item.image];
        const loaded = (await Promise.all(visuals.map(async (visual) => ({ visual, data: await imageDataUrl(visual.src) })))).filter((entry): entry is { visual: { src: string; caption?: string }; data: string } => Boolean(entry.data));
        if (loaded.length) {
          loaded.forEach((entry, visualIndex) => {
            const column = visualIndex % 2;
            const row = Math.floor(visualIndex / 2);
            const x = column === 0 ? 0.55 : 6.8;
            const y = 1.4 + row * 2.85;
            output.addImage({ data: entry.data, x, y, w: 5.95, h: 2.35 });
            output.addText(entry.visual.caption ?? "مورد بصري من الدرس", { x, y: y + 2.38, w: 5.95, h: 0.25, fontFace: "Arial", fontSize: 8, color: "5B6C64", align: "center", rtlMode: true, margin: 0 });
          });
        } else {
          output.addText(`مورد بصري مرتبط بالدرس\\n\\n${item.image.caption ?? ""}`, { x: 1.1, y: 2.15, w: 11.2, h: 2.2, fontFace: "Arial", fontSize: 22, bold: true, color: "07553E", align: "center", valign: "middle", rtlMode: true });
        }
      } else {
        output.addText(pptParagraphs(item), { x: 0.75, y: 1.45, w: 11.85, h: 5.45, fontFace: "Arial", fontSize: item.kind === "document" ? 14 : 17, color: "24332D", align: "right", valign: "top", breakLine: false, rtlMode: true, margin: 0.12, bullet: undefined });
      }
    }
    output.addText(`${index + 1} / ${slides.length}`, { x: 11.75, y: 7.08, w: 1, h: 0.2, fontFace: "Arial", fontSize: 8, color: item.kind === "title" ? "CFE7DC" : "7A8C83", align: "right", rtlMode: true, margin: 0 });
    output.addNotes(`هذا العرض مبني فقط على محتوى الدرس «${lesson.title}» والوثائق المرتبطة به داخل الموقع.`);
  }

  const filePart = lesson.id.replace(/[^a-zA-Z0-9.-]+/g, "-").replace(/^-|-$/g, "") || "lesson";
  await pptx.writeFile({ fileName: `presentation-${filePart}.pptx`, compression: true });
}

function SlideIcon({ kind }: { kind: SlideKind }) {
  if (kind === "objectives") return <Target className="size-6" aria-hidden="true" />;
  if (kind === "concepts") return <Lightbulb className="size-6" aria-hidden="true" />;
  if (kind === "document") return <FileText className="size-6" aria-hidden="true" />;
  if (kind === "schema") return <Network className="size-6" aria-hidden="true" />;
  if (kind === "table") return <Table2 className="size-6" aria-hidden="true" />;
  if (kind === "assessment") return <ListChecks className="size-6" aria-hidden="true" />;
  if (kind === "image") return <ImageIcon className="size-6" aria-hidden="true" />;
  return <BookOpenCheck className="size-6" aria-hidden="true" />;
}

function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const input = document.createElement("textarea");
  input.value = value;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
  return Promise.resolve();
}

interface PresentationMeta {
  subjectLabel: string;
  levelLabel: string;
  branchLabel: string;
}

function SlideBody({ slide, lesson, meta, showAnswers }: { slide: PresentationSlide; lesson: LessonContent; meta: PresentationMeta; showAnswers: boolean }) {
  if (slide.kind === "title") {
    return <div className="flex min-h-[420px] flex-col items-center justify-center text-center"><div className="grid size-20 place-items-center rounded-3xl bg-gold-400/15 text-gold-200"><MonitorPlay className="size-10" /></div><h2 className="mt-8 max-w-4xl font-display text-3xl font-black leading-[1.45] text-white sm:text-5xl">{slide.title}</h2><p className="mt-5 text-base font-bold text-white/70">{meta.subjectLabel} · {meta.levelLabel} · {meta.branchLabel}</p><p className="mt-2 text-sm text-gold-200">{lesson.duration}</p></div>;
  }
  if (slide.kind === "section") return <div className="flex min-h-[420px] flex-col items-center justify-center text-center"><span className="grid size-16 place-items-center rounded-2xl bg-brand-100 text-brand-700"><SlideIcon kind={slide.kind} /></span><h2 className="mt-7 max-w-4xl font-display text-3xl font-black leading-relaxed text-ink-900 sm:text-4xl">{slide.title}</h2><div className="mt-6 h-1 w-24 rounded-full bg-gold-400" /></div>;
  if (slide.kind === "objectives" || slide.kind === "concepts" || slide.kind === "list" || slide.kind === "summary" || slide.kind === "assessment") {
    return <div className="space-y-4">{slide.items?.map((item, index) => <div key={`${index}-${item}`} className={`flex items-start gap-4 rounded-2xl p-4 ${slide.kind === "summary" ? "border border-brand-100 bg-brand-50/70" : "bg-paper-warm/70"}`}><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-700 text-xs font-black text-white">{index + 1}</span><p className="text-base leading-loose text-ink-800">{item}</p></div>)}{slide.kind === "assessment" && <p className="rounded-2xl border border-gold-200 bg-gold-50 p-4 text-sm font-bold leading-relaxed text-gold-900">يناقش المتعلمون الإجابات اعتمادًا على وثائق ومعارف الدرس، ثم يبنون الخلاصة.</p>}</div>;
  }
  if (slide.kind === "context" || slide.kind === "paragraph") {
    return <div className="space-y-5">{slide.paragraphs?.map((paragraph, index) => <div key={`${index}-${paragraph}`} className={index === (slide.paragraphs?.length ?? 0) - 1 && slide.kind === "context" ? "rounded-2xl border-s-4 border-gold-400 bg-gold-50 p-5" : "rounded-2xl bg-paper-warm/70 p-5"}><p className="text-base leading-[2] text-ink-800">{paragraph}</p></div>)}</div>;
  }
  if (slide.kind === "callout" && slide.callout) {
    const tone = slide.callout.tone === "def" ? "border-brand-200 bg-brand-50" : slide.callout.tone === "warn" ? "border-gold-200 bg-gold-50" : "border-sky-200 bg-sky-50";
    return <div className={`rounded-3xl border p-7 ${tone}`}><Quote className="size-8 text-brand-600" /><p className="mt-5 font-display text-lg font-black text-ink-900">{slide.callout.label}</p><p className="mt-3 text-base leading-[2] text-ink-700">{slide.callout.text}</p></div>;
  }
  if (slide.kind === "table" && slide.table) return <div className="overflow-x-auto rounded-2xl border border-ink-900/10"><table className="w-full min-w-[650px] border-collapse text-sm"><thead className="bg-brand-700 text-white"><tr>{slide.table.head.map((head) => <th key={head} className="border border-white/20 px-4 py-3 text-start font-extrabold">{head}</th>)}</tr></thead><tbody>{slide.table.rows.map((row, rowIndex) => <tr key={rowIndex} className={rowIndex % 2 ? "bg-paper-warm/60" : "bg-white"}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`} className="border border-ink-900/8 px-4 py-3 align-top leading-relaxed text-ink-700">{cell}</td>)}</tr>)}</tbody></table></div>;
  if (slide.kind === "document" && slide.doc) return <div className="space-y-5"><div className="rounded-2xl border border-brand-200 bg-brand-50 p-5"><p className="font-display font-black text-brand-900">{slide.doc.label}</p><p className="mt-3 text-base leading-[2] text-ink-800">{slide.doc.text}</p><p className="mt-3 text-xs font-bold text-ink-500">طبيعة الوثيقة ومصدرها وتاريخها: لا تُحدد إلا بالقدر الوارد في بطاقة الوثيقة أعلاه.</p></div>{slide.doc.questions.length > 0 && <div className="grid gap-3 sm:grid-cols-2">{slide.doc.questions.map((question, index) => <div key={`${index}-${question.q}`} className="rounded-2xl bg-paper-warm p-4"><p className="text-sm font-extrabold text-ink-900">{index + 1}. {question.q}</p>{showAnswers && <p className="mt-3 border-t border-ink-900/10 pt-3 text-xs leading-relaxed text-emerald-800"><strong>الإجابة المتوقعة:</strong> {question.answer}</p>}</div>)}</div>}</div>;
  if (slide.kind === "schema" && slide.schema) return <div className="grid gap-3 sm:grid-cols-2">{slide.schema.rows.map((row) => <div key={`${row.label}-${row.value}`} className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5"><p className="text-xs font-extrabold text-brand-700">{row.label}</p><p className="mt-2 text-base font-bold leading-relaxed text-ink-800">{row.value}</p></div>)}</div>;
  if (slide.kind === "image" && slide.image) {
    const visuals = slide.images ?? [slide.image];
    return <div className="grid gap-3 sm:grid-cols-2">{visuals.map((visual) => <figure key={visual.src} className="overflow-hidden rounded-3xl border border-ink-900/10 bg-paper-warm"><img src={visual.src} alt={visual.caption ?? "مورد بصري من الدرس"} className="mx-auto max-h-[360px] w-full object-contain" /><figcaption className="p-3 text-center text-xs font-bold text-ink-500">{visual.caption}</figcaption></figure>)}</div>;
  }
  if (slide.kind === "timeline" && slide.timeline) return <div className="relative space-y-4 before:absolute before:bottom-3 before:start-[19px] before:top-3 before:w-0.5 before:bg-brand-200">{slide.timeline.map((item) => <div key={`${item.date}-${item.event}`} className="relative flex gap-4"><span className="mt-1.5 grid size-4 shrink-0 place-items-center rounded-full bg-gold-500 ring-4 ring-gold-100" /><div className="flex-1 rounded-2xl bg-paper-warm p-4"><p className="font-display font-black text-brand-800">{item.date}</p><p className="mt-1 text-sm leading-relaxed text-ink-700">{item.event}</p></div></div>)}</div>;
  return null;
}

export default function LessonPresentation({ lesson: resolved, go }: LessonPresentationProps) {
  const { content, level, branch, subjectLabel, unit } = resolved;
  const slides = useMemo(() => buildLessonPresentation(content), [content]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState("");
  const slide = slides[slideIndex] ?? slides[0];
  const lessonUrl = typeof window === "undefined" ? "[ضع رابط موقعك هنا]" : `${window.location.origin}${window.location.pathname}#${routeToPath({ view: "lesson", id: content.id })}`;
  const prompt = useMemo(() => buildPresentationPrompt(content, lessonUrl), [content, lessonUrl]);

  const announce = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };
  const copyPrompt = () => void copyText(prompt).then(() => announce("تم نسخ تعليمات إنشاء العرض."));
  const exportPowerPoint = async () => {
    setExporting(true);
    try {
      await downloadLessonPowerPoint(content, { subjectLabel, levelLabel: level.label, branchLabel: branch.label });
      announce("تم تحميل ملف PowerPoint بنجاح.");
    } catch {
      announce("تعذر إنشاء ملف PowerPoint الآن. أعد المحاولة.");
    } finally {
      setExporting(false);
    }
  };
  const next = () => setSlideIndex((current) => Math.min(slides.length - 1, current + 1));
  const previous = () => setSlideIndex((current) => Math.max(0, current - 1));

  return <section className="relative overflow-hidden bg-paper-warm/50 pt-28 pb-16 md:pt-32" dir="rtl"><style>{`@media print { [data-presentation-no-print] { display:none !important; } .presentation-slide { box-shadow:none !important; min-height:230mm !important; } }`}</style><div className="mx-auto max-w-7xl px-4 sm:px-8"><Reveal><header className="flex flex-wrap items-center justify-between gap-4" data-presentation-no-print><button type="button" onClick={() => go({ view: "lessons", level: level.id })} className="inline-flex items-center gap-2 text-sm font-extrabold text-brand-700"><ArrowRight className="size-4" /> العودة إلى الدروس</button><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setShowPrompt(true)} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-xs font-extrabold text-brand-700"><Clipboard className="size-4" /> تعليمات إنشاء العرض</button><button type="button" onClick={exportPowerPoint} disabled={exporting} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-3 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"><Download className="size-4" /> {exporting ? "جارٍ إنشاء PowerPoint…" : "تحميل PowerPoint"}</button><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-xs font-extrabold text-brand-700"><Printer className="size-4" /> طباعة العرض</button></div></header></Reveal><Reveal delay={80}><div className="mt-5 rounded-3xl border border-brand-200/70 bg-white p-5 shadow-[0_22px_55px_-34px_rgba(4,36,26,0.5)] sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[10px] font-extrabold text-brand-700"><MonitorPlay className="size-3.5" /> عرض تدريسي · {subjectLabel}</p><h1 className="mt-3 font-display text-2xl font-black text-ink-900 sm:text-3xl">{content.title}</h1><p className="mt-2 text-xs font-semibold text-ink-500">{level.label} · {branch.label} · {unit.title} · {content.duration}</p></div><div className="flex items-center gap-2" data-presentation-no-print><button type="button" onClick={() => setShowAnswers((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-gold-200 bg-gold-50 px-3 py-2.5 text-xs font-extrabold text-gold-800">{showAnswers ? <X className="size-4" /> : <CheckCircle2 className="size-4" />} {showAnswers ? "إخفاء الأجوبة" : "إظهار الأجوبة"}</button><span className="rounded-xl bg-brand-900 px-3 py-2.5 text-xs font-black text-white">{slideIndex + 1} / {slides.length}</span></div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-brand-50"><div className="h-full rounded-full bg-gradient-to-l from-gold-400 to-brand-600 transition-all" style={{ width: `${((slideIndex + 1) / slides.length) * 100}%` }} /></div></div></Reveal><Reveal delay={140}><article className={`presentation-slide mt-5 overflow-hidden rounded-[2rem] border border-brand-200/70 bg-white shadow-[0_30px_80px_-42px_rgba(4,36,26,0.55)] ${slide.kind === "title" ? "bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950" : ""}`}><div className="p-6 sm:p-10"><div className={`flex items-center gap-3 ${slide.kind === "title" ? "text-gold-200" : "text-brand-700"}`}><span className={`grid size-12 place-items-center rounded-2xl ${slide.kind === "title" ? "bg-white/10" : "bg-brand-50"}`}><SlideIcon kind={slide.kind} /></span><div><p className="text-[10px] font-extrabold uppercase tracking-wide opacity-75">{slide.eyebrow}</p>{slide.kind !== "title" && <h2 className="font-display text-xl font-black text-ink-900">{slide.title}</h2>}</div></div><div className="mt-7"><SlideBody slide={slide} lesson={content} meta={{ subjectLabel, levelLabel: level.label, branchLabel: branch.label }} showAnswers={showAnswers} /></div></div></article></Reveal><div className="mt-5 flex flex-wrap items-center justify-between gap-3" data-presentation-no-print><button type="button" onClick={previous} disabled={slideIndex === 0} className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-white px-4 py-2.5 text-xs font-extrabold text-ink-700 disabled:opacity-40">السابق</button><div className="flex max-w-[70%] gap-1.5 overflow-x-auto py-1">{slides.map((item, index) => <button type="button" key={`${item.title}-${index}`} onClick={() => setSlideIndex(index)} aria-label={`الشريحة ${index + 1}: ${item.title}`} className={`size-2.5 shrink-0 rounded-full transition-all ${index === slideIndex ? "w-7 bg-brand-700" : "bg-brand-200 hover:bg-brand-400"}`} />)}</div><button type="button" onClick={next} disabled={slideIndex === slides.length - 1} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-40">التالي</button></div>{notice && <p className="fixed bottom-5 start-1/2 z-50 -translate-x-1/2 rounded-xl bg-brand-900 px-4 py-3 text-xs font-extrabold text-white shadow-xl" role="status">{notice}</p>}{showPrompt && <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="dialog" aria-modal="true"><button type="button" aria-label="إغلاق" onClick={() => setShowPrompt(false)} className="absolute inset-0 bg-brand-950/60 backdrop-blur-sm" /><div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-ink-900/8 p-5"><div><h2 className="font-display text-lg font-black text-ink-900">تعليمات إنشاء العرض</h2><p className="mt-1 text-xs text-ink-500">التعليمات تستعمل محتوى هذا الدرس فقط ولا تُضيف مصادر خارجية.</p></div><button type="button" onClick={() => setShowPrompt(false)} className="grid size-9 place-items-center rounded-xl border border-ink-900/10 text-ink-500" aria-label="إغلاق"><X className="size-4" /></button></div><div className="p-5"><textarea readOnly value={prompt} className="h-[50vh] w-full resize-none rounded-2xl border border-ink-900/10 bg-paper-warm p-4 text-xs leading-relaxed text-ink-700 outline-none" /><div className="mt-3 flex flex-wrap justify-end gap-2"><button type="button" onClick={copyPrompt} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-xs font-extrabold text-white"><Copy className="size-4" /> نسخ التعليمات</button><button type="button" onClick={() => setShowPrompt(false)} className="rounded-xl border border-ink-900/10 px-4 py-2.5 text-xs font-bold text-ink-700">إغلاق</button></div></div></div></div>}</div></section>;
}

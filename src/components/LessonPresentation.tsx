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
import type { LessonBlock, LessonContent, LessonDoc } from "../types";
import type { ResolvedLesson } from "../data/lessonContent";
import { buildPresentationPrompt } from "../data/presentationPrompt";
import { getDeckForLesson, pageUrl } from "../data/decks";
import type { Deck, DeckSlide } from "../data/decks";
import { routeToPath, type Route } from "../routes";
import { isUnlocked } from "../lib/teacherAuth";
import Reveal from "./Reveal";

interface LessonPresentationProps {
  lesson: ResolvedLesson;
  go: (route: Route) => void;
}

type SlideKind =
  | "title"
  | "objectives"
  | "context"
  | "problem"
  | "concepts"
  | "section"
  | "paragraph"
  | "list"
  | "table"
  | "callout"
  | "document"
  | "activity"
  | "schema"
  | "image"
  | "timeline"
  | "summary"
  | "assessment"
  | "tips";

interface VisualMaterial {
  src: string;
  caption: string;
  source: string;
  page?: number;
}

interface ActivityQuestion {
  q: string;
  answer: string;
  pts?: number;
}

interface ActivityMaterial {
  concept: string;
  objective: string;
  teacherPrompt: string;
  studentTask: string;
  observation: string;
  questions: ActivityQuestion[];
  expectedConclusion?: string;
  source: string;
  nature: string;
  title: string;
  author: string;
  date: string;
  context: string;
  visuals: VisualMaterial[];
}

interface PresentationDocument {
  label: string;
  text: string;
  nature: string;
  source: string;
  date: string;
  context: string;
  questions: ActivityQuestion[];
  conclusion: string;
  visuals: VisualMaterial[];
}

interface PresentationSlide {
  kind: SlideKind;
  title: string;
  eyebrow?: string;
  paragraphs?: string[];
  items?: string[];
  table?: { head: string[]; rows: string[][] };
  callout?: { label: string; text: string; tone: "def" | "info" | "warn" };
  doc?: PresentationDocument;
  activity?: ActivityMaterial;
  schema?: { title?: string; rows: { label: string; value: string }[] };
  image?: VisualMaterial;
  images?: VisualMaterial[];
  timeline?: { date: string; event: string }[];
}

interface PresentationMeta {
  subjectLabel: string;
  levelLabel: string;
  branchLabel: string;
}

const UNKNOWN = "غير محدد في المحتوى المنشور";

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

function clean(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function uniqueVisuals(items: VisualMaterial[]): VisualMaterial[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.src || seen.has(item.src)) return false;
    seen.add(item.src);
    return true;
  });
}

function lessonVisual(lesson: LessonContent): VisualMaterial | undefined {
  if (!lesson.bookPage?.src) return undefined;
  return {
    src: lesson.bookPage.src,
    page: lesson.bookPage.page,
    caption: lesson.bookPage.caption ?? `صفحة ${lesson.bookPage.page} من الكتاب/المورد المرتبط بالدرس`,
    source: `${lesson.bookPage.book} — الصفحة ${lesson.bookPage.page}`,
  };
}

function deckSource(deck: Deck, page: number): string {
  const label = deck.bookTitle ?? deck.bookId ?? `العرض المرتبط بالدرس «${deck.title}»`;
  return `${label} — الصفحة ${page}`;
}

function deckVisuals(deck: Deck, slide: DeckSlide): VisualMaterial[] {
  const pages = [slide.page, ...(slide.pages ?? [])].filter((page, index, all) => all.indexOf(page) === index).slice(0, 2);
  return pages.map((page) => ({
    src: pageUrl(page, deck.pageBase),
    page,
    caption: `${slide.title} — الصفحة ${page}`,
    source: deckSource(deck, page),
  }));
}

function allLessonVisuals(lesson: LessonContent, deck?: Deck): VisualMaterial[] {
  const visuals: VisualMaterial[] = [];
  const original = lessonVisual(lesson);
  if (original) visuals.push(original);
  deck?.slides.slice(0, 6).forEach((slide) => visuals.push(...deckVisuals(deck, slide)));
  return uniqueVisuals(visuals);
}

function findTargetConcept(lesson: LessonContent, text: string, fallback: string): string {
  const match = lesson.glossary.find((entry) => text.includes(entry.term));
  return match ? `${match.term}: ${match.def}` : fallback;
}

function blocksToSlides(sectionTitle: string, blocks: LessonBlock[], slides: PresentationSlide[]): void {
  const paragraphs: string[] = [];
  const flushParagraphs = () => {
    if (paragraphs.length === 0) return;
    slides.push({ kind: "paragraph", title: sectionTitle, eyebrow: "المعرفة الأساس في الدرس", paragraphs: paragraphs.splice(0, paragraphs.length) });
  };
  blocks.forEach((block) => {
    if (block.type === "p") {
      paragraphs.push(block.text);
      return;
    }
    flushParagraphs();
    if (block.type === "ul") {
      slides.push({ kind: "list", title: block.title ?? sectionTitle, eyebrow: "أفكار أساسية مستخرجة من الدرس", items: block.items });
    } else if (block.type === "table") {
      slides.push({ kind: "table", title: sectionTitle, eyebrow: "تنظيم المعطيات الواردة في الدرس", table: { head: block.head, rows: block.rows } });
    } else {
      slides.push({ kind: "callout", title: block.label, eyebrow: sectionTitle, callout: block });
    }
  });
  flushParagraphs();
}

function planActivity(
  lesson: LessonContent,
  sectionTitle: string,
  sectionIndex: number,
  deck: Deck | undefined,
  deckSlide: DeckSlide | undefined,
): ActivityMaterial | undefined {
  const plan = lesson.didacticPlan?.activities.find((item) => item.sectionIndex === sectionIndex);
  const formative = lesson.formativeAssessments?.find((item) => item.sectionIndex === sectionIndex);
  if (!deckSlide && !plan && !formative) return undefined;

  const focus = clean(deckSlide?.focus) || clean(plan?.support) || `المقطع: ${sectionTitle}`;
  const tasks: ActivityQuestion[] = deckSlide?.tasks?.map((task) => ({ q: task.q, answer: task.a })) ?? [];
  if (tasks.length === 0 && formative) tasks.push({ q: formative.prompt, answer: formative.expected });
  if (tasks.length === 0) {
    tasks.push({
      q: `ما الفكرة الأساسية في محور «${sectionTitle}»؟ وما الدليل الذي يمكن استخراجه من محتوى الدرس؟`,
      answer: formative?.expected ?? plan?.product ?? `يستخرج المتعلم الفكرة الأساسية من المعطيات الواردة في محور «${sectionTitle}» ويربطها بإشكالية الدرس.`,
    });
  }

  const source = deck && deckSlide ? deckSource(deck, deckSlide.page) : plan?.support || "محتوى المحور والوثائق التابعة له داخل الدرس";
  const visuals = deck && deckSlide ? deckVisuals(deck, deckSlide) : [];
  const conceptText = `${sectionTitle} ${deckSlide?.title ?? ""} ${focus}`;
  const expectedConclusion = clean(deckSlide?.keys?.join("؛ ")) || clean(plan?.product) || clean(formative?.expected) || `يربط المتعلم عناصر الوثيقة التي لاحظها بمحور «${sectionTitle}»، ثم يصوغ استنتاجًا جزئيًا يساعد على الإجابة عن إشكالية الدرس.`;
  return {
    concept: findTargetConcept(lesson, conceptText, sectionTitle),
    objective:
      clean(lesson.objectives[sectionIndex]) ||
      `استخراج المعطيات المرتبطة بمحور «${sectionTitle}» وتحويلها إلى استنتاج يجيب عن إشكالية الدرس.`,
    teacherPrompt: "يعرض الأستاذ الوثيقة دون تقديم تفسير جاهز، ويطلب وصفها أولًا ثم يوجه النقاش من الملاحظة إلى الاستنتاج.",
    studentTask: clean(plan?.task) || `ألاحظ الوثيقة، أحدد عناصرها، أستخرج المعطيات الدالة، ثم أصوغ فرضية واستنتاجًا مرتبطًا بمحور «${sectionTitle}».`,
    observation: focus,
    questions: tasks,
    expectedConclusion,
    source,
    nature: deckSlide ? "صفحة مصوّرة من الكتاب المدرسي تتضمن وثائق الدرس" : "نشاط/وثيقة كما وردت في بنية الدرس",
    title: deckSlide?.title ?? sectionTitle,
    author: UNKNOWN,
    date: UNKNOWN,
    context: focus,
    visuals,
  };
}

function documentFromLessonDoc(doc: LessonDoc, lesson: LessonContent, visual?: VisualMaterial): PresentationDocument {
  return {
    label: doc.label,
    text: doc.text,
    nature: "وثيقة كما ورد وصفها في الدرس؛ نوعها التفصيلي غير مذكور إن لم يظهر في البطاقة الأصلية.",
    source: UNKNOWN,
    date: UNKNOWN,
    context: `تُقرأ هذه الوثيقة في ضوء إشكالية الدرس: ${lesson.coreQuestion}`,
    questions: doc.questions.map((question) => ({ q: question.q, answer: question.answer, pts: question.pts })),
    conclusion: `تساعد الوثيقة على بناء جواب جزئي عن الإشكالية المركزية للدرس: ${lesson.coreQuestion}`,
    visuals: visual ? [visual] : [],
  };
}

/**
 * يبني العرض من محتوى الدرس الأصلي، ثم يربط كل صفحة/وثيقة ببطاقة ديداكتيكية:
 * المفهوم المستهدف ← الهدف ← مهمة المتعلم ← الملاحظة ← الأسئلة ← الاستنتاج.
 * لا تُضاف معلومة خارجية إلى متن الدرس؛ والحقول غير المتوفرة تُوسم بوضوح.
 */
export function buildLessonPresentation(lesson: LessonContent): PresentationSlide[] {
  const slides: PresentationSlide[] = [
    { kind: "title", title: lesson.title, eyebrow: "عرض تدريسي مبني على الدرس الأصلي" },
    { kind: "objectives", title: "أهداف التعلم", eyebrow: "كما وردت في الدرس", items: lesson.objectives },
    { kind: "context", title: "الوضعية التمهيدية", eyebrow: "ملاحظة أولية قبل بناء المعرفة", paragraphs: [lesson.intro] },
    { kind: "problem", title: "الإشكالية المركزية", eyebrow: "السؤال الذي ينظم مراحل بناء التعلم", paragraphs: [lesson.coreQuestion] },
  ];

  chunks(lesson.glossary, 5).forEach((group, index) => {
    slides.push({
      kind: "concepts",
      title: index === 0 ? "المفاهيم الأساسية" : "المفاهيم الأساسية — تابع",
      eyebrow: "معجم الدرس قبل تحليل الوثائق",
      items: group.map((item) => `${item.term}: ${item.def}`),
    });
  });

  const deck = getDeckForLesson(lesson.id);
  lesson.sections.forEach((section, sectionIndex) => {
    slides.push({ kind: "section", title: section.title, eyebrow: `المحور ${sectionIndex + 1} — نبني التعلم انطلاقًا من الدليل` });
    blocksToSlides(section.title, section.blocks, slides);
    const activity = planActivity(lesson, section.title, sectionIndex, deck, deck?.slides[sectionIndex]);
    if (activity) slides.push({ kind: "activity", title: activity.title, eyebrow: "وثيقة ديداكتيكية — من الملاحظة إلى الاستنتاج", activity });
  });

  // إذا كان العرض المرتبط بالكتاب يتضمن أنشطة أكثر من عدد محاور الدرس، لا تُهمل أي وثيقة.
  const remainingDeckSlides = deck?.slides.slice(lesson.sections.length) ?? [];
  remainingDeckSlides.forEach((deckSlide) => {
    const activity = planActivity(lesson, deckSlide.title, lesson.sections.length, deck, deckSlide);
    if (activity) slides.push({ kind: "activity", title: activity.title, eyebrow: "وثيقة ديداكتيكية إضافية مرتبطة بالدرس", activity });
  });

  const originalVisual = lessonVisual(lesson);
  (lesson.docs ?? []).forEach((doc, index) => {
    slides.push({
      kind: "document",
      title: `تحليل الوثيقة ${index + 1}`,
      eyebrow: "وثيقة من محتوى الدرس — لا تُعرض للزينة",
      doc: documentFromLessonDoc(doc, lesson),
    });
  });

  // بعض الدروس تملك صفحة كتاب أصلية دون Deck أو بطاقة وثيقة منفصلة؛
  // نربط الصفحة بنشاط ملاحظة صريح بدل عرضها كصورة زخرفية أو إهمالها.
  if (originalVisual && !deck) {
    slides.push({
      kind: "activity",
      title: "قراءة الصفحة الأصلية المرتبطة بالدرس",
      eyebrow: "مورد بصري — الملاحظة قبل الشرح",
      activity: {
        concept: findTargetConcept(lesson, lesson.title, lesson.title),
        objective: lesson.objectives[0] ?? "استخراج المعطيات الدالة من المورد البصري المرتبط بالدرس.",
        teacherPrompt: "يعرض الأستاذ الصفحة دون شرح مسبق، ويطلب من المتعلمين تحديد نوع الوثائق والعناصر البارزة قبل ربطها بمحور الدرس.",
        studentTask: "ألاحظ الصفحة، أحدد الوثائق أو الخرائط أو الجداول الظاهرة فيها، ثم أختار عنصرين يساعدان على فهم إشكالية الدرس.",
        observation: originalVisual.caption,
        questions: [
          {
            q: "ما طبيعة المورد البصري؟ وما العناصر التي يمكن ملاحظتها قبل قراءة الشرح؟",
            answer: "يصف المتعلم ما يظهر في الصفحة فقط، ثم يربط العناصر التي لاحظها بموضوع الدرس دون إضافة معلومات من خارج المصدر.",
          },
          {
            q: "كيف يمكن توظيف هذه الصفحة للإجابة تدريجيًا عن إشكالية الدرس؟",
            answer: `ينتقي المتعلم المعطيات الدالة من الصفحة ويستعملها لبناء جواب جزئي عن الإشكالية: ${lesson.coreQuestion}`,
          },
        ],
        expectedConclusion: `تُستعمل الصفحة الأصلية بوصفها دليلًا بصريًا لبناء جواب تدريجي عن إشكالية الدرس: ${lesson.coreQuestion}`,
        source: originalVisual.source,
        nature: "صفحة أصلية مصوّرة من مادة الدرس",
        title: originalVisual.caption,
        author: UNKNOWN,
        date: UNKNOWN,
        context: `صفحة مرتبطة مباشرة بدرس «${lesson.title}»`,
        visuals: [originalVisual],
      },
    });
  }

  if (lesson.schema?.rows.length) {
    slides.push({ kind: "schema", title: lesson.schema.title ?? "الخطاطة التركيبية", eyebrow: "تركيب ما بُني عبر الأنشطة", schema: lesson.schema });
  }

  if (lesson.application) {
    slides.push({
      kind: "activity",
      title: lesson.application.title,
      eyebrow: `توظيف وتركيب — ${lesson.application.duration}`,
      activity: {
        concept: "توظيف مكتسبات الدرس في إنتاج منظم",
        objective: "تركيب المعرفة الأساسية في جواب مستقل يجيب عن إشكالية الدرس.",
        teacherPrompt: "يمنح الأستاذ وقتًا للتفكير والكتابة، ثم يجمع بعض الأجوبة ويقود تصحيحًا جماعيًا.",
        studentTask: lesson.application.prompt,
        observation: lesson.application.guide.join("؛ "),
        questions: [{ q: lesson.application.prompt, answer: lesson.application.model.join("؛ ") }],
        expectedConclusion: lesson.application.model.join("؛ "),
        source: "تمرين تطبيقي مرفق بالدرس",
        nature: "مهمة تركيبية",
        title: lesson.application.title,
        author: UNKNOWN,
        date: UNKNOWN,
        context: lesson.coreQuestion,
        visuals: [],
      },
    });
  }

  chunks(lesson.timeline, 6).forEach((group, index) => {
    slides.push({ kind: "timeline", title: index === 0 ? "التموقع الزمني" : "التموقع الزمني — تابع", eyebrow: "تواريخ وأحداث وردت في الدرس فقط", timeline: group });
  });

  chunks(lesson.summary, 4).forEach((group, index) => {
    slides.push({ kind: "summary", title: index === 0 ? "الخلاصة / الأثر الكتابي" : "الخلاصة — تابع", eyebrow: "ما ينبغي أن يحتفظ به المتعلم", items: group });
  });

  if (lesson.examTips.length) {
    slides.push({ kind: "tips", title: "منهجية التوظيف", eyebrow: "إرشادات مرتبطة بهذا الدرس", items: lesson.examTips.slice(0, 5) });
  }

  if (lesson.quiz.length) {
    slides.push({ kind: "assessment", title: "التقويم الختامي", eyebrow: "3 إلى 5 أسئلة للتحقق من بناء التعلم", items: lesson.quiz.slice(0, 5).map((item, index) => `${index + 1}. ${item.q}`) });
  }

  // دروس بلا Deck أو صفحة كتاب: نصرّح بغياب الوثيقة البصرية بدل اختراع صورة.
  if (!allLessonVisuals(lesson, deck).length) {
    slides.splice(4, 0, {
      kind: "image",
      title: "مورد بصري للتحقق قبل الاستعمال",
      eyebrow: "لا توجد صورة موثقة مرتبطة بهذا الدرس في المشروع حاليًا",
      paragraphs: ["يُستحسن أن يضيف الأستاذ هنا خريطة أو صورة أو مبيانًا موثقًا بعد التحقق من مصدره وملاءمته. لم تُدرج صورة خارجية غير مؤكدة."],
    });
  }

  return slides;
}

function activityPlainText(activity: ActivityMaterial): string {
  const questions = activity.questions.map((item, index) => `${index + 1}. ${item.q}`).join("\n");
  return [
    `المفهوم المستهدف: ${activity.concept}`,
    `الهدف التعلمي: ${activity.objective}`,
    `دور الأستاذ: ${activity.teacherPrompt}`,
    `مهمة المتعلم: ${activity.studentTask}`,
    `الملاحظة والتحليل: ${activity.observation}`,
    `الأسئلة:\n${questions}`,
    activity.expectedConclusion ? `الاستنتاج المنتظر: ${activity.expectedConclusion}` : "استنتاج المتعلمين: …",
    `المصدر: ${activity.source}`,
  ].join("\n\n");
}

function documentPlainText(doc: PresentationDocument): string {
  return [
    `الوثيقة: ${doc.label}`,
    `الطبيعة: ${doc.nature}`,
    `المصدر/المؤلف: ${doc.source}`,
    `التاريخ: ${doc.date}`,
    `السياق: ${doc.context}`,
    doc.text,
    `الأسئلة:\n${doc.questions.map((item, index) => `${index + 1}. ${item.q}`).join("\n")}`,
    `الخلاصة: ${doc.conclusion}`,
  ].join("\n\n");
}

function pptParagraphs(slide: PresentationSlide): string {
  if (slide.paragraphs?.length) return slide.paragraphs.join("\n\n");
  if (slide.items?.length) return slide.items.map((item) => `• ${item}`).join("\n");
  if (slide.callout) return `${slide.callout.label}\n\n${slide.callout.text}`;
  if (slide.schema?.rows.length) return slide.schema.rows.map((row) => `${row.label}: ${row.value}`).join("\n");
  if (slide.timeline?.length) return slide.timeline.map((item) => `${item.date} — ${item.event}`).join("\n");
  if (slide.activity) return activityPlainText(slide.activity);
  if (slide.doc) return documentPlainText(slide.doc);
  if (slide.image) return slide.image.caption;
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

async function loadVisuals(visuals: VisualMaterial[]): Promise<{ visual: VisualMaterial; data: string }[]> {
  const loaded = await Promise.all(visuals.map(async (visual) => ({ visual, data: await imageDataUrl(visual.src) })));
  return loaded.filter((item): item is { visual: VisualMaterial; data: string } => Boolean(item.data));
}

function addPptMetadata(output: any, title: string, eyebrow?: string): void {
  output.addText(title, { x: 0.55, y: 0.28, w: 12.25, h: 0.55, fontFace: "Arial", fontSize: 22, bold: true, color: "07553E", align: "right", rtlMode: true, margin: 0.03 });
  if (eyebrow) output.addText(eyebrow, { x: 0.6, y: 0.9, w: 12.1, h: 0.3, fontFace: "Arial", fontSize: 9, color: "B17617", align: "right", rtlMode: true, margin: 0.02 });
}

function addPptText(output: any, text: string, options: Record<string, unknown> = {}): void {
  output.addText(text, {
    x: 0.65,
    y: 1.35,
    w: 11.7,
    h: 5.65,
    fontFace: "Arial",
    fontSize: 13,
    color: "24332D",
    align: "right",
    valign: "top",
    rtlMode: true,
    margin: 0.1,
    breakLine: false,
    ...options,
  });
}

function addPptVisualCaptions(output: any, loaded: { visual: VisualMaterial; data: string }[], x: number, y: number, w: number, h: number): void {
  const selected = loaded.slice(0, 2);
  if (selected.length === 1) {
    const entry = selected[0];
    output.addImage({ data: entry.data, x, y, w, h: h - 0.5 });
    output.addText(`${entry.visual.caption}\nالمصدر: ${entry.visual.source}`, { x, y: y + h - 0.42, w, h: 0.38, fontFace: "Arial", fontSize: 8, color: "5B6C64", align: "center", rtlMode: true, margin: 0 });
    return;
  }
  selected.forEach((entry, index) => {
    const itemY = y + index * (h / 2);
    output.addImage({ data: entry.data, x, y: itemY, w, h: h / 2 - 0.18 });
    output.addText(`${entry.visual.caption}\nالمصدر: ${entry.visual.source}`, { x, y: itemY + h / 2 - 0.12, w, h: 0.35, fontFace: "Arial", fontSize: 7, color: "5B6C64", align: "center", rtlMode: true, margin: 0 });
  });
}

/** ينشئ ملف PowerPoint حقيقيًا من الشرائح، مع إدماج الوثيقة داخل نشاطها لا كرابط فقط. */
export async function downloadLessonPowerPoint(lesson: LessonContent, meta: PresentationMeta): Promise<void> {
  if (typeof window !== "undefined" && !isUnlocked()) throw new Error("تحميل PowerPoint متاح للأستاذ فقط.");
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
      output.addText(item.title, { x: 0.7, y: 1.55, w: 12, h: 1.3, fontFace: "Arial", fontSize: 29, bold: true, color: "FFFFFF", align: "center", valign: "middle", rtlMode: true, margin: 0.1 });
      output.addText(`${meta.subjectLabel} · ${meta.levelLabel} · ${meta.branchLabel}\n${lesson.duration}`, { x: 1.1, y: 3.25, w: 11.2, h: 0.75, fontFace: "Arial", fontSize: 16, color: "F6D98B", align: "center", valign: "middle", rtlMode: true });
    } else {
      addPptMetadata(output, item.title, item.kind === "activity" ? undefined : item.eyebrow);
      if (item.kind === "table" && item.table) {
        const rows = [item.table.head, ...item.table.rows].map((row) => row.map((cell) => ({ text: cell })));
        output.addTable(rows, { x: 0.45, y: 1.35, w: 12.4, h: 5.55, fontFace: "Arial", fontSize: 10, color: "24332D", border: { type: "solid", color: "C9DDD3", pt: 0.6 }, fill: { color: "FFFFFF" }, margin: 0.06, valign: "middle" });
      } else if (item.kind === "activity" && item.activity) {
        const loaded = await loadVisuals(item.activity.visuals);
        if (loaded.length) {
          addPptVisualCaptions(output, loaded, 0.55, 1.38, 5.15, 4.8);
          addPptText(output, activityPlainText(item.activity), { x: 5.95, y: 1.28, w: 6.55, h: 5.75, fontSize: 10.5 });
        } else {
          addPptText(output, activityPlainText(item.activity), { fontSize: 12 });
        }
      } else if (item.kind === "document" && item.doc) {
        const loaded = await loadVisuals(item.doc.visuals);
        if (loaded.length) {
          addPptVisualCaptions(output, loaded, 0.55, 1.38, 5.15, 4.8);
          addPptText(output, documentPlainText(item.doc), { x: 5.95, y: 1.28, w: 6.55, h: 5.75, fontSize: 10.5 });
        } else {
          addPptText(output, documentPlainText(item.doc), { fontSize: 12 });
        }
      } else if (item.kind === "image" && item.images?.length) {
        const loaded = await loadVisuals(item.images);
        if (loaded.length) addPptVisualCaptions(output, loaded, 0.55, 1.35, 12, 5.45);
        else addPptText(output, pptParagraphs(item), { fontSize: 15 });
      } else {
        addPptText(output, pptParagraphs(item), { fontSize: item.kind === "problem" ? 23 : item.kind === "assessment" ? 15 : 16 });
      }
    }
    output.addText(`${index + 1} / ${slides.length}`, { x: 11.75, y: 7.08, w: 1, h: 0.2, fontFace: "Arial", fontSize: 8, color: item.kind === "title" ? "CFE7DC" : "7A8C83", align: "right", rtlMode: true, margin: 0 });
    const note = item.activity ? `${activityPlainText(item.activity)}\n\n` : item.doc ? `${documentPlainText(item.doc)}\n\n` : "";
    output.addNotes(`${note}هذا العرض مبني على محتوى الدرس الأصلي والوثائق المرتبطة به داخل المشروع. لا تُعدّ الحقول غير المحددة مصدرًا جديدًا.`);
  }

  const filePart = lesson.id.replace(/[^a-zA-Z0-9.-]+/g, "-").replace(/^-|-$/g, "") || "lesson";
  await pptx.writeFile({ fileName: `presentation-${filePart}.pptx`, compression: true });
}

function SlideIcon({ kind }: { kind: SlideKind }) {
  if (kind === "objectives") return <Target className="size-6" aria-hidden="true" />;
  if (kind === "concepts") return <Lightbulb className="size-6" aria-hidden="true" />;
  if (kind === "document" || kind === "activity") return <FileText className="size-6" aria-hidden="true" />;
  if (kind === "schema") return <Network className="size-6" aria-hidden="true" />;
  if (kind === "table") return <Table2 className="size-6" aria-hidden="true" />;
  if (kind === "assessment" || kind === "tips") return <ListChecks className="size-6" aria-hidden="true" />;
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

function InfoCard({ label, text, tone = "paper" }: { label: string; text: string; tone?: "paper" | "brand" | "gold" | "sky" }) {
  const classes = tone === "brand" ? "border-brand-200 bg-brand-50" : tone === "gold" ? "border-gold-200 bg-gold-50" : tone === "sky" ? "border-sky-200 bg-sky-50" : "border-ink-900/8 bg-paper-warm/70";
  return <div className={`rounded-2xl border p-4 ${classes}`}><p className="text-[11px] font-black text-brand-700">{label}</p><p className="mt-2 text-sm leading-[1.9] text-ink-800">{text}</p></div>;
}

function VisualFigures({ visuals }: { visuals: VisualMaterial[] }) {
  if (!visuals.length) return <div className="rounded-2xl border-2 border-dashed border-gold-300 bg-gold-50 p-5 text-center"><ImageIcon className="mx-auto size-8 text-gold-600" /><p className="mt-3 text-sm font-extrabold text-gold-900">لا توجد صورة موثقة متاحة لهذا النشاط</p><p className="mt-1 text-xs leading-relaxed text-gold-800">يُترك المورد فارغًا إلى حين التحقق من صورة أو خريطة أو مبيان مناسب؛ لم تُخترع وثيقة بديلة.</p></div>;
  return <div className="space-y-3">{visuals.map((visual) => <figure key={visual.src} className="overflow-hidden rounded-2xl border border-ink-900/10 bg-paper-warm"><img src={visual.src} alt={visual.caption} className="mx-auto max-h-[330px] w-full object-contain" /><figcaption className="p-3 text-center text-xs font-bold leading-relaxed text-ink-500">{visual.caption}<br /><span className="font-semibold text-ink-400">المصدر: {visual.source}</span></figcaption></figure>)}</div>;
}

function ActivityBody({ activity, showAnswers }: { activity: ActivityMaterial; showAnswers: boolean }) {
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"><div><VisualFigures visuals={activity.visuals} /><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1"><InfoCard label="طبيعة الوثيقة" text={activity.nature} /><InfoCard label="العنوان / المؤلف / التاريخ" text={`${activity.title} · ${activity.author} · ${activity.date}`} /><InfoCard label="المصدر" text={activity.source} /></div></div><div className="space-y-3"><InfoCard label="المفهوم المستهدف" text={activity.concept} tone="brand" /><InfoCard label="الهدف التعلمي" text={activity.objective} tone="brand" /><InfoCard label="دور الأستاذ" text={activity.teacherPrompt} tone="gold" /><InfoCard label="مهمة المتعلم" text={activity.studentTask} tone="sky" /><InfoCard label="الملاحظة والتحليل" text={activity.observation} /><div className="rounded-2xl border border-ink-900/8 bg-white p-4"><p className="text-[11px] font-black text-brand-700">أسئلة موجهة للمتعلمين</p><div className="mt-3 space-y-3">{activity.questions.map((question, index) => <div key={`${index}-${question.q}`} className="rounded-xl bg-paper-warm/70 p-3"><p className="text-sm font-extrabold leading-relaxed text-ink-900">{index + 1}. {question.q}</p>{showAnswers ? <p className="mt-2 border-t border-ink-900/10 pt-2 text-xs leading-relaxed text-emerald-800"><strong>الإجابة المنتظرة:</strong> {question.answer}</p> : <p className="mt-2 text-[11px] font-bold text-ink-400">يناقش المتعلمون الفرضيات قبل إظهار الإجابة.</p>}</div>)}</div></div><div className="rounded-2xl border-s-4 border-gold-400 bg-gold-50 p-4"><p className="text-[11px] font-black text-gold-800">الاستنتاج</p>{showAnswers && activity.expectedConclusion ? <p className="mt-2 text-sm font-bold leading-[1.9] text-ink-800">{activity.expectedConclusion}</p> : <p className="mt-2 text-sm font-bold text-gold-800">يُصاغ الاستنتاج جماعيًا انطلاقًا من الأدلة أعلاه.</p>}</div></div></div>;
}

function DocumentBody({ doc, showAnswers }: { doc: PresentationDocument; showAnswers: boolean }) {
  return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><InfoCard label="طبيعة الوثيقة" text={doc.nature} /><InfoCard label="المصدر / المؤلف" text={doc.source} /><InfoCard label="التاريخ" text={doc.date} /><InfoCard label="السياق" text={doc.context} /></div><div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"><VisualFigures visuals={doc.visuals} /><div className="rounded-2xl border border-brand-200 bg-brand-50 p-5"><p className="font-display font-black text-brand-900">{doc.label}</p><p className="mt-3 text-base leading-[2] text-ink-800">{doc.text}</p></div></div><div className="grid gap-3 sm:grid-cols-2">{doc.questions.map((question, index) => <div key={`${index}-${question.q}`} className="rounded-2xl bg-paper-warm p-4"><p className="text-sm font-extrabold leading-relaxed text-ink-900">{index + 1}. {question.q}</p>{showAnswers ? <p className="mt-3 border-t border-ink-900/10 pt-3 text-xs leading-relaxed text-emerald-800"><strong>الإجابة المتوقعة:</strong> {question.answer}</p> : <p className="mt-2 text-[11px] font-bold text-ink-400">مناقشة جماعية قبل إظهار التصحيح.</p>}</div>)}</div><div className="rounded-2xl border-s-4 border-gold-400 bg-gold-50 p-4"><p className="text-[11px] font-black text-gold-800">الخلاصة المرتبطة بالإشكالية</p>{showAnswers ? <p className="mt-2 text-sm font-bold leading-relaxed text-ink-800">{doc.conclusion}</p> : <p className="mt-2 text-sm font-bold text-gold-800">يكتب المتعلمون خلاصة قصيرة قبل عرض الصياغة المقترحة.</p>}</div></div>;
}

function SlideBody({ slide, lesson, meta, showAnswers }: { slide: PresentationSlide; lesson: LessonContent; meta: PresentationMeta; showAnswers: boolean }) {
  if (slide.kind === "title") return <div className="flex min-h-[420px] flex-col items-center justify-center text-center"><div className="grid size-20 place-items-center rounded-3xl bg-gold-400/15 text-gold-200"><MonitorPlay className="size-10" /></div><h2 className="mt-8 max-w-4xl font-display text-3xl font-black leading-[1.45] text-white sm:text-5xl">{slide.title}</h2><p className="mt-5 text-base font-bold text-white/70">{meta.subjectLabel} · {meta.levelLabel} · {meta.branchLabel}</p><p className="mt-2 text-sm text-gold-200">{lesson.duration}</p></div>;
  if (slide.kind === "section") return <div className="flex min-h-[280px] flex-col items-center justify-center text-center"><span className="grid size-16 place-items-center rounded-2xl bg-brand-100 text-brand-700"><SlideIcon kind={slide.kind} /></span><h2 className="mt-7 max-w-4xl font-display text-3xl font-black leading-relaxed text-ink-900 sm:text-4xl">{slide.title}</h2><div className="mt-6 h-1 w-24 rounded-full bg-gold-400" /></div>;
  if (slide.kind === "objectives" || slide.kind === "concepts" || slide.kind === "list" || slide.kind === "summary" || slide.kind === "assessment" || slide.kind === "tips") return <div className="space-y-4">{slide.items?.map((item, index) => <div key={`${index}-${item}`} className={`flex items-start gap-4 rounded-2xl p-4 ${slide.kind === "summary" ? "border border-brand-100 bg-brand-50/70" : "bg-paper-warm/70"}`}><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-700 text-xs font-black text-white">{index + 1}</span><p className="text-base leading-loose text-ink-800 break-words">{item}</p></div>)}</div>;
  if (slide.kind === "context" || slide.kind === "paragraph") return <div className="space-y-5">{slide.paragraphs?.map((paragraph, index) => <div key={`${index}-${paragraph}`} className="rounded-2xl bg-paper-warm/70 p-5"><p className="text-base leading-[2] text-ink-800">{paragraph}</p></div>)}</div>;
  if (slide.kind === "problem") return <div className="flex min-h-[300px] items-center justify-center rounded-3xl border-s-8 border-gold-400 bg-gold-50 p-8 text-center"><p className="max-w-4xl font-display text-2xl font-black leading-[2] text-ink-900 sm:text-3xl">{slide.paragraphs?.[0]}</p></div>;
  if (slide.kind === "callout" && slide.callout) {
    const tone = slide.callout.tone === "def" ? "border-brand-200 bg-brand-50" : slide.callout.tone === "warn" ? "border-gold-200 bg-gold-50" : "border-sky-200 bg-sky-50";
    return <div className={`rounded-3xl border p-7 ${tone}`}><Quote className="size-8 text-brand-600" /><p className="mt-5 font-display text-lg font-black text-ink-900">{slide.callout.label}</p><p className="mt-3 text-base leading-[2] text-ink-700">{slide.callout.text}</p></div>;
  }
  if (slide.kind === "table" && slide.table) return <div className="overflow-x-auto rounded-2xl border border-ink-900/10"><table className="w-full min-w-[650px] border-collapse text-sm"><thead className="bg-brand-700 text-white"><tr>{slide.table.head.map((head) => <th key={head} className="border border-white/20 px-4 py-3 text-start font-extrabold">{head}</th>)}</tr></thead><tbody>{slide.table.rows.map((row, rowIndex) => <tr key={rowIndex} className={rowIndex % 2 ? "bg-paper-warm/60" : "bg-white"}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`} className="border border-ink-900/8 px-4 py-3 align-top leading-relaxed text-ink-700">{cell}</td>)}</tr>)}</tbody></table></div>;
  if (slide.kind === "activity" && slide.activity) return <ActivityBody activity={slide.activity} showAnswers={showAnswers} />;
  if (slide.kind === "document" && slide.doc) return <DocumentBody doc={slide.doc} showAnswers={showAnswers} />;
  if (slide.kind === "schema" && slide.schema) return <div className="grid gap-3 sm:grid-cols-2">{slide.schema.rows.map((row) => <div key={`${row.label}-${row.value}`} className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5"><p className="text-xs font-extrabold text-brand-700">{row.label}</p><p className="mt-2 text-base font-bold leading-relaxed text-ink-800">{row.value}</p></div>)}</div>;
  if (slide.kind === "image") return <div className="rounded-3xl border-2 border-dashed border-gold-300 bg-gold-50 p-8 text-center"><ImageIcon className="mx-auto size-10 text-gold-600" /><p className="mt-4 text-base font-bold leading-relaxed text-gold-900">{slide.paragraphs?.[0] ?? "لا يوجد مورد بصري موثق"}</p></div>;
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
  const [teacherSession] = useState(() => isUnlocked());
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
      announce("تم تحميل ملف PowerPoint بالوثائق والصور المدمجة.");
    } catch {
      announce("تعذر إنشاء ملف PowerPoint الآن. أعد المحاولة.");
    } finally {
      setExporting(false);
    }
  };
  const requestTeacherAccess = () => {
    announce("تحميل PowerPoint متاح للأستاذ فقط. سجّل الدخول من لوحة الأستاذ.");
    window.setTimeout(() => go({ view: "dashboard" }), 700);
  };
  const next = () => setSlideIndex((current) => Math.min(slides.length - 1, current + 1));
  const previous = () => setSlideIndex((current) => Math.max(0, current - 1));

  return <section className="relative overflow-hidden bg-paper-warm/50 pt-28 pb-16 md:pt-32" dir="rtl"><style>{`@media print { [data-presentation-no-print] { display:none !important; } .presentation-slide { box-shadow:none !important; min-height:230mm !important; } }`}</style><div className="mx-auto max-w-7xl px-4 sm:px-8"><Reveal><header className="flex flex-wrap items-center justify-between gap-4" data-presentation-no-print><button type="button" onClick={() => go({ view: "lessons", level: level.id })} className="inline-flex items-center gap-2 text-sm font-extrabold text-brand-700"><ArrowRight className="size-4" /> العودة إلى الدروس</button><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setShowPrompt(true)} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-xs font-extrabold text-brand-700"><Clipboard className="size-4" /> تعليمات إنشاء العرض</button>{teacherSession ? <button type="button" onClick={exportPowerPoint} disabled={exporting} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-3 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"><Download className="size-4" /> {exporting ? "جارٍ إنشاء PowerPoint…" : "تحميل PowerPoint"}</button> : <button type="button" onClick={requestTeacherAccess} className="inline-flex items-center gap-2 rounded-xl border border-gold-300 bg-gold-50 px-3 py-2.5 text-xs font-extrabold text-gold-800"><Download className="size-4" /> PowerPoint للأستاذ فقط</button>}<button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-xs font-extrabold text-brand-700"><Printer className="size-4" /> طباعة العرض</button></div></header></Reveal><Reveal delay={80}><div className="mt-5 rounded-3xl border border-brand-200/70 bg-white p-5 shadow-[0_22px_55px_-34px_rgba(4,36,26,0.5)] sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[10px] font-extrabold text-brand-700"><MonitorPlay className="size-3.5" /> عرض تدريسي · {subjectLabel}</p><h1 className="mt-3 font-display text-2xl font-black text-ink-900 sm:text-3xl">{content.title}</h1><p className="mt-2 text-xs font-semibold text-ink-500">{level.label} · {branch.label} · {unit.title} · {content.duration}</p></div><div className="flex items-center gap-2" data-presentation-no-print><button type="button" onClick={() => setShowAnswers((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-gold-200 bg-gold-50 px-3 py-2.5 text-xs font-extrabold text-gold-800">{showAnswers ? <X className="size-4" /> : <CheckCircle2 className="size-4" />} {showAnswers ? "إخفاء الأجوبة" : "إظهار الأجوبة"}</button><span className="rounded-xl bg-brand-900 px-3 py-2.5 text-xs font-black text-white">{slideIndex + 1} / {slides.length}</span></div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-brand-50"><div className="h-full rounded-full bg-gradient-to-l from-gold-400 to-brand-600 transition-all" style={{ width: `${((slideIndex + 1) / slides.length) * 100}%` }} /></div></div></Reveal><Reveal delay={140}><article className={`presentation-slide mt-5 overflow-hidden rounded-[2rem] border border-brand-200/70 bg-white shadow-[0_30px_80px_-42px_rgba(4,36,26,0.55)] ${slide.kind === "title" ? "bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950" : ""}`}><div className="p-6 sm:p-10"><div className={`flex items-center gap-3 ${slide.kind === "title" ? "text-gold-200" : "text-brand-700"}`}><span className={`grid size-12 place-items-center rounded-2xl ${slide.kind === "title" ? "bg-white/10" : "bg-brand-50"}`}><SlideIcon kind={slide.kind} /></span><div><p className="text-[10px] font-extrabold uppercase tracking-wide opacity-75">{slide.eyebrow}</p>{slide.kind !== "title" && <h2 className="font-display text-xl font-black text-ink-900">{slide.title}</h2>}</div></div><div className="mt-7"><SlideBody slide={slide} lesson={content} meta={{ subjectLabel, levelLabel: level.label, branchLabel: branch.label }} showAnswers={showAnswers} /></div></div></article></Reveal><div className="mt-5 flex flex-wrap items-center justify-between gap-3" data-presentation-no-print><button type="button" onClick={previous} disabled={slideIndex === 0} className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-white px-4 py-2.5 text-xs font-extrabold text-ink-700 disabled:opacity-40">السابق</button><div className="flex max-w-[70%] gap-1.5 overflow-x-auto py-1">{slides.map((item, index) => <button type="button" key={`${item.title}-${index}`} onClick={() => setSlideIndex(index)} aria-label={`الشريحة ${index + 1}: ${item.title}`} className={`size-2.5 shrink-0 rounded-full transition-all ${index === slideIndex ? "w-7 bg-brand-700" : "bg-brand-200 hover:bg-brand-400"}`} />)}</div><button type="button" onClick={next} disabled={slideIndex === slides.length - 1} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-40">التالي</button></div>{notice && <p className="fixed bottom-5 start-1/2 z-50 -translate-x-1/2 rounded-xl bg-brand-900 px-4 py-3 text-xs font-extrabold text-white shadow-xl" role="status">{notice}</p>}{showPrompt && <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="dialog" aria-modal="true"><button type="button" aria-label="إغلاق" onClick={() => setShowPrompt(false)} className="absolute inset-0 bg-brand-950/60 backdrop-blur-sm" /><div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-ink-900/8 p-5"><div><h2 className="font-display text-lg font-black text-ink-900">تعليمات إنشاء العرض</h2><p className="mt-1 text-xs text-ink-500">العرض يستعمل محتوى الدرس وصوره ووثائقه المرتبطة فقط، ويكشف الإجابات تدريجيًا.</p></div><button type="button" onClick={() => setShowPrompt(false)} className="grid size-9 place-items-center rounded-xl border border-ink-900/10 text-ink-500" aria-label="إغلاق"><X className="size-4" /></button></div><div className="p-5"><textarea readOnly value={prompt} className="h-[50vh] w-full resize-none rounded-2xl border border-ink-900/10 bg-paper-warm p-4 text-xs leading-relaxed text-ink-700 outline-none" /><div className="mt-3 flex flex-wrap justify-end gap-2"><button type="button" onClick={copyPrompt} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-xs font-extrabold text-white"><Copy className="size-4" /> نسخ التعليمات</button><button type="button" onClick={() => setShowPrompt(false)} className="rounded-xl border border-ink-900/10 px-4 py-2.5 text-xs font-bold text-ink-700">إغلاق</button></div></div></div></div>}</div></section>;
}

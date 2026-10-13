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
  sourceUrl?: string;
  author?: string;
  date?: string;
  license?: string;
  concept?: string;
  guidingQuestion?: string;
  sectionIndex?: number;
  page?: number;
}

interface ActivityQuestion {
  q: string;
  answer: string;
  pts?: number;
}

interface ActivityMaterial {
  teacherGuidance?: string;
  concept: string;
  objective: string;
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
const LEARNING_SEQUENCE = ["الملاحظة", "التساؤل", "التحليل", "التفسير", "الاستنتاج", "الخلاصة"];

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

function externalLessonVisuals(lesson: LessonContent): VisualMaterial[] {
  return (lesson.externalVisuals ?? []).map((visual) => ({
    src: visual.src,
    caption: visual.title,
    source: visual.sourceName,
    sourceUrl: visual.sourceUrl,
    author: visual.author,
    date: visual.date,
    license: visual.license,
    concept: visual.concept,
    guidingQuestion: visual.guidingQuestion,
    sectionIndex: visual.sectionIndex,
  }));
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
  visuals.push(...externalLessonVisuals(lesson));
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
    slides.push({ kind: "paragraph", title: sectionTitle, eyebrow: "التفسير وبناء المعرفة بعد نشاط الملاحظة", paragraphs: paragraphs.splice(0, paragraphs.length) });
  };
  blocks.forEach((block) => {
    if (block.type === "p") {
      paragraphs.push(block.text);
      return;
    }
    flushParagraphs();
    if (block.type === "ul") {
      slides.push({ kind: "list", title: block.title ?? sectionTitle, eyebrow: "التفسير وبناء المعرفة انطلاقًا من نشاط المحور", items: block.items });
    } else if (block.type === "table") {
      slides.push({ kind: "table", title: sectionTitle, eyebrow: "التفسير وتنظيم المعطيات بعد تحليل الوثيقة", table: { head: block.head, rows: block.rows } });
    } else {
      slides.push({ kind: "callout", title: block.label, eyebrow: `${sectionTitle} — التفسير وبناء المعرفة`, callout: block });
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
  supportingVisuals: VisualMaterial[] = [],
): ActivityMaterial | undefined {
  const plan = lesson.didacticPlan?.activities.find((item) => item.sectionIndex === sectionIndex);
  const formative = lesson.formativeAssessments?.find((item) => item.sectionIndex === sectionIndex);
  if (!deckSlide && !plan && !formative && !supportingVisuals.length) return undefined;

  const focus = clean(deckSlide?.focus) || clean(plan?.support) || `المقطع: ${sectionTitle}`;
  const tasks: ActivityQuestion[] = deckSlide?.tasks?.map((task) => ({ q: task.q, answer: task.a })) ?? [];
  if (tasks.length === 0 && formative) tasks.push({ q: formative.prompt, answer: formative.expected });
  if (tasks.length === 0) {
    tasks.push({
      q: `ما الفكرة الأساسية في محور «${sectionTitle}»؟ وما الدليل الذي يمكن استخراجه من محتوى الدرس؟`,
      answer: formative?.expected ?? plan?.product ?? `يستخرج المتعلم الفكرة الأساسية من المعطيات الواردة في محور «${sectionTitle}» ويربطها بإشكالية الدرس.`,
    });
  }

  const externalVisual = supportingVisuals[0];
  if (externalVisual?.guidingQuestion && !tasks.some((task) => task.q === externalVisual.guidingQuestion)) {
    tasks.push({
      q: externalVisual.guidingQuestion,
      answer: `يستخرج المتعلم المعطيات البصرية الدالة من المورد، ثم يربطها بمحور «${sectionTitle}» وبإشكالية الدرس دون تجاوز ما تثبته الوثيقة.`,
    });
  }
  const sourceParts = [
    deck && deckSlide ? deckSource(deck, deckSlide.page) : plan?.support || "محتوى المحور والوثائق التابعة له داخل الدرس",
    ...supportingVisuals.map((visual) => `${visual.source} — ${visual.sourceUrl}`),
  ];
  const source = sourceParts.join("؛ ");
  // أعطِ المورد الخارجي الموثق الأولوية في العرض والتصدير، ثم أضف صفحة الكتاب إن وجدت.
  const visuals = uniqueVisuals([...supportingVisuals, ...(deck && deckSlide ? deckVisuals(deck, deckSlide) : [])]);
  const conceptText = `${sectionTitle} ${deckSlide?.title ?? ""} ${focus} ${externalVisual?.concept ?? ""}`;
  const expectedConclusion = clean(deckSlide?.keys?.join("؛ ")) || clean(plan?.product) || clean(formative?.expected) || `يربط المتعلم عناصر الوثيقة التي لاحظها بمحور «${sectionTitle}»، ثم يصوغ استنتاجًا جزئيًا يساعد على الإجابة عن إشكالية الدرس.`;
  return {
    teacherGuidance: `يوجّه الأستاذ المتعلمين إلى وصف طبيعة الوثيقة ومصدرها أولًا، ثم تنظيم الملاحظات في فرضيات وأسئلة، وتأجيل التصحيح والاستنتاج إلى ما بعد المناقشة الجماعية.`,
    concept: findTargetConcept(lesson, conceptText, externalVisual?.concept ?? sectionTitle),
    objective:
      clean(lesson.objectives[sectionIndex]) ||
      `استخراج المعطيات المرتبطة بمحور «${sectionTitle}» وتحويلها إلى استنتاج يجيب عن إشكالية الدرس.`,
    studentTask: clean(plan?.task) || `ألاحظ الوثيقة، أحدد عناصرها، أستخرج المعطيات الدالة، ثم أصوغ فرضية واستنتاجًا مرتبطًا بمحور «${sectionTitle}».`,
    observation: [focus, externalVisual?.guidingQuestion ? `سؤال الانطلاق من المورد: ${externalVisual.guidingQuestion}` : ""].filter(Boolean).join(" — "),
    questions: tasks,
    expectedConclusion,
    source,
    nature: externalVisual ? "وثيقة بصرية خارجية موثقة مرتبطة بمحور الدرس" : deckSlide ? "صفحة مصوّرة من الكتاب المدرسي تتضمن وثائق الدرس" : "نشاط/وثيقة كما وردت في بنية الدرس",
    title: externalVisual?.caption ?? deckSlide?.title ?? sectionTitle,
    author: externalVisual?.author ?? UNKNOWN,
    date: externalVisual?.date ?? UNKNOWN,
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
    { kind: "context", title: "الوضعية التمهيدية", eyebrow: "الملاحظة والانطلاق من وضعية مشكلة", paragraphs: [lesson.intro] },
    { kind: "problem", title: "الإشكالية المركزية", eyebrow: "التساؤل الذي ينظم مراحل بناء التعلم", paragraphs: [lesson.coreQuestion] },
    { kind: "objectives", title: "أهداف التعلم", eyebrow: "ما سنبنيه عبر الملاحظة والتحليل والتركيب", items: lesson.objectives },
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
  const externalVisuals = externalLessonVisuals(lesson);
  lesson.sections.forEach((section, sectionIndex) => {
    slides.push({ kind: "section", title: section.title, eyebrow: `المحور ${sectionIndex + 1} — نلاحظ ونتساءل قبل بناء المعرفة` });
    const sectionVisuals = externalVisuals.filter((visual) => visual.sectionIndex === sectionIndex);
    const activity = planActivity(lesson, section.title, sectionIndex, deck, deck?.slides[sectionIndex], sectionVisuals);
    if (activity) {
      slides.push({
        kind: "activity",
        title: activity.title,
        eyebrow: "الملاحظة ← التساؤل ← التحليل — لا نكشف الاستنتاج قبل المناقشة",
        activity,
      });
    }
    // لا يأتي الشرح قبل الدليل؛ تُعرض معارف المحور بعد النشاط حتى يبني المتعلم الفكرة من الملاحظة إلى التفسير.
    blocksToSlides(section.title, section.blocks, slides);
    if (sectionVisuals.length && !activity) {
      slides.push({
        kind: "image",
        title: "وثائق بصرية مرتبطة بالمحور",
        eyebrow: "مورد خارجي موثق — المصدر مذكور بجانب الصورة",
        image: sectionVisuals[0],
        images: sectionVisuals,
      });
    }
  });

  // إذا كان العرض المرتبط بالكتاب يتضمن أنشطة أكثر من عدد محاور الدرس، لا تُهمل أي وثيقة.
  const remainingDeckSlides = deck?.slides.slice(lesson.sections.length) ?? [];
  remainingDeckSlides.forEach((deckSlide) => {
    const activity = planActivity(lesson, deckSlide.title, lesson.sections.length, deck, deckSlide);
    if (activity) slides.push({ kind: "activity", title: activity.title, eyebrow: "نشاط مرتبط بالدرس — الملاحظة ← التساؤل ← التحليل ← الاستنتاج", activity });
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
    `توجيه الأستاذ: ${activity.teacherGuidance ?? "يوجّه المتعلمين إلى الملاحظة والوصف والفرضيات، ثم يؤجل الأجوبة إلى نهاية المناقشة."}`,
    "مسار النشاط: الملاحظة ← التساؤل ← التحليل ← التفسير ← الاستنتاج ← الخلاصة",
    `الوثيقة: ${activity.title}`,
    `طبيعتها: ${activity.nature}`,
    `المؤلف/الجهة: ${activity.author}`,
    `التاريخ: ${activity.date}`,
    `ما أتعلمه من النشاط: ${activity.concept}`,
    `هدفي: ${activity.objective}`,
    `مهمتي: ${activity.studentTask}`,
    `ما ألاحظ وأحلل: ${activity.observation}`,
    `أسئلة أجيب عنها:\n${questions}`,
    "خلاصتي: ................................................................................",
    `المصدر والرابط: ${activity.source}`,
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
    `أسئلة أجيب عنها:\n${doc.questions.map((item, index) => `${index + 1}. ${item.q}`).join("\n")}`,
    "خلاصتي من الوثيقة: ................................................................................",
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

const PPT_FONT_BODY = "Readex Pro";
const PPT_FONT_DISPLAY = "Cairo";
const PPT_COLORS = {
  paper: "F7F5EF",
  paperWarm: "EFECE2",
  white: "FFFFFF",
  ink: "0B1D17",
  ink700: "33473F",
  ink500: "5B6E66",
  brand50: "EDF7F2",
  brand100: "D4EDE0",
  brand200: "A9DCC4",
  brand600: "0F7C5B",
  brand700: "0C6147",
  brand800: "0A4D3A",
  brand900: "073828",
  brand950: "04241A",
  gold50: "FDF7E9",
  gold100: "FBF0D8",
  gold200: "F5DFAE",
  gold300: "EFCB80",
  gold400: "E6B457",
  gold700: "8F5F1C",
  sky50: "EFF8FF",
  sky200: "BAE0FE",
  sky700: "0369A1",
  line: "DDE7E1",
} as const;

type PptTone = "paper" | "brand" | "gold" | "sky";

function pptTone(tone: PptTone): { fill: string; line: string; label: string } {
  if (tone === "brand") return { fill: PPT_COLORS.brand50, line: PPT_COLORS.brand200, label: PPT_COLORS.brand700 };
  if (tone === "gold") return { fill: PPT_COLORS.gold50, line: PPT_COLORS.gold200, label: PPT_COLORS.gold700 };
  if (tone === "sky") return { fill: PPT_COLORS.sky50, line: PPT_COLORS.sky200, label: PPT_COLORS.sky700 };
  return { fill: PPT_COLORS.paperWarm, line: PPT_COLORS.line, label: PPT_COLORS.brand700 };
}

function addPptText(output: any, text: string, options: Record<string, unknown> = {}): void {
  output.addText(text, {
    fontFace: PPT_FONT_BODY,
    fontSize: 11,
    color: PPT_COLORS.ink,
    align: "right",
    valign: "top",
    rtlMode: true,
    margin: 0.08,
    fit: "shrink",
    breakLine: false,
    ...options,
  });
}

function addPptCard(output: any, x: number, y: number, w: number, h: number, fill: string, line = fill): void {
  output.addShape("roundRect", {
    x,
    y,
    w,
    h,
    rectRadius: 0.12,
    fill: { color: fill },
    line: { color: line, width: 0.7 },
  });
}

function addPptInfoCard(output: any, label: string, text: string, x: number, y: number, w: number, h: number, tone: PptTone = "paper", fontSize = 8.2): void {
  const colors = pptTone(tone);
  addPptCard(output, x, y, w, h, colors.fill, colors.line);
  addPptText(output, label, { x: x + 0.16, y: y + 0.08, w: w - 0.32, h: Math.min(0.2, h * 0.32), fontFace: PPT_FONT_DISPLAY, fontSize: 6.8, bold: true, color: colors.label, margin: 0 });
  addPptText(output, text, { x: x + 0.16, y: y + Math.min(0.28, h * 0.38), w: w - 0.32, h: Math.max(0.18, h - Math.min(0.3, h * 0.4) - 0.08), fontSize, color: PPT_COLORS.ink700, margin: 0.02 });
}

function addPptSlideFrame(output: any, item: PresentationSlide, index: number, total: number, meta: PresentationMeta, lesson: LessonContent): void {
  if (item.kind === "title") {
    output.background = { color: PPT_COLORS.brand900 };
    output.addShape("rect", { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: PPT_COLORS.brand900 }, line: { color: PPT_COLORS.brand900 } });
    output.addShape("rect", { x: 0, y: 0, w: 13.333, h: 0.11, fill: { color: PPT_COLORS.gold400 }, line: { color: PPT_COLORS.gold400 } });
    output.addShape("roundRect", { x: 6.02, y: 0.78, w: 1.28, h: 1.28, fill: { color: PPT_COLORS.gold400, transparency: 82 }, line: { color: PPT_COLORS.gold300, transparency: 55, width: 1 } });
    addPptText(output, "▶", { x: 6.02, y: 1.02, w: 1.28, h: 0.65, fontFace: "Arial", fontSize: 28, bold: true, color: PPT_COLORS.gold200, align: "center", valign: "mid", margin: 0 });
    addPptText(output, item.title, { x: 0.8, y: 2.25, w: 11.75, h: 1.35, fontFace: PPT_FONT_DISPLAY, fontSize: 29, bold: true, color: PPT_COLORS.white, align: "center", valign: "mid", margin: 0.08 });
    addPptText(output, `${meta.subjectLabel} · ${meta.levelLabel} · ${meta.branchLabel}`, { x: 0.9, y: 4.02, w: 11.55, h: 0.4, fontSize: 15, bold: true, color: "D4EDE0", align: "center", valign: "mid", margin: 0 });
    addPptText(output, lesson.duration, { x: 1.2, y: 4.55, w: 10.95, h: 0.35, fontSize: 11, color: PPT_COLORS.gold200, align: "center", valign: "mid", margin: 0 });
    output.addShape("line", { x: 5.15, y: 5.35, w: 3.03, h: 0, line: { color: PPT_COLORS.gold400, width: 1.5 } });
    addPptText(output, `${index + 1} / ${total}`, { x: 11.65, y: 7.05, w: 1, h: 0.2, fontSize: 8, color: PPT_COLORS.brand100, align: "right", margin: 0 });
    return;
  }

  output.background = { color: PPT_COLORS.paper };
  addPptCard(output, 0.25, 0.18, 12.83, 7.12, PPT_COLORS.white, PPT_COLORS.brand200);
  const glyphs: Record<SlideKind, string> = {
    title: "▶",
    objectives: "◎",
    context: "◌",
    problem: "؟",
    concepts: "✦",
    section: "✦",
    paragraph: "▤",
    list: "☷",
    table: "▦",
    callout: "❝",
    document: "▤",
    activity: "▤",
    schema: "◇",
    image: "▧",
    timeline: "⌁",
    summary: "✓",
    assessment: "✓",
    tips: "✓",
  };
  output.addShape("roundRect", { x: 0.64, y: 0.37, w: 0.58, h: 0.58, fill: { color: PPT_COLORS.brand50 }, line: { color: PPT_COLORS.brand100, width: 0.6 } });
  addPptText(output, glyphs[item.kind], { x: 0.64, y: 0.47, w: 0.58, h: 0.3, fontFace: "Arial", fontSize: 17, bold: true, color: PPT_COLORS.brand700, align: "center", valign: "mid", margin: 0 });
  addPptText(output, item.eyebrow ?? "", { x: 1.38, y: 0.4, w: 11, h: 0.22, fontFace: PPT_FONT_BODY, fontSize: 7.3, bold: true, color: PPT_COLORS.gold700, margin: 0 });
  addPptText(output, item.title, { x: 1.38, y: 0.66, w: 11, h: 0.43, fontFace: PPT_FONT_DISPLAY, fontSize: 17, bold: true, color: PPT_COLORS.ink, margin: 0 });
  output.addShape("line", { x: 0.65, y: 1.17, w: 12.02, h: 0, line: { color: PPT_COLORS.brand100, width: 0.8 } });
  output.addShape("rect", { x: 0.65, y: 1.15, w: 1.2, h: 0.04, fill: { color: PPT_COLORS.gold400 }, line: { color: PPT_COLORS.gold400 } });
  addPptText(output, `${index + 1} / ${total}`, { x: 11.65, y: 7.05, w: 1, h: 0.2, fontSize: 8, color: PPT_COLORS.ink500, align: "right", margin: 0 });
}

function addPptNumberedCards(output: any, items: string[], summary = false): void {
  const gap = 0.11;
  const y = 1.4;
  const available = 5.45;
  const cardH = Math.min(1.02, (available - gap * Math.max(0, items.length - 1)) / Math.max(1, items.length));
  items.forEach((item, index) => {
    const itemY = y + index * (cardH + gap);
    addPptCard(output, 0.65, itemY, 12.02, cardH, summary ? PPT_COLORS.brand50 : PPT_COLORS.paperWarm, summary ? PPT_COLORS.brand100 : PPT_COLORS.paperWarm);
    output.addShape("roundRect", { x: 11.87, y: itemY + Math.max(0.1, (cardH - 0.48) / 2), w: 0.56, h: 0.48, fill: { color: PPT_COLORS.brand700 }, line: { color: PPT_COLORS.brand700 } });
    addPptText(output, String(index + 1), { x: 11.87, y: itemY + Math.max(0.19, (cardH - 0.25) / 2), w: 0.56, h: 0.18, fontFace: PPT_FONT_DISPLAY, fontSize: 8.5, bold: true, color: PPT_COLORS.white, align: "center", valign: "mid", margin: 0 });
    addPptText(output, item, { x: 0.92, y: itemY + 0.12, w: 10.65, h: cardH - 0.22, fontSize: items.length >= 5 ? 8.8 : 10.2, color: PPT_COLORS.ink700, margin: 0.02 });
  });
}

function addPptParagraphCards(output: any, paragraphs: string[]): void {
  const gap = 0.14;
  const y = 1.45;
  const h = Math.min(1.45, (5.32 - gap * Math.max(0, paragraphs.length - 1)) / Math.max(1, paragraphs.length));
  paragraphs.forEach((paragraph, index) => {
    const itemY = y + index * (h + gap);
    addPptCard(output, 0.65, itemY, 12.02, h, PPT_COLORS.paperWarm, PPT_COLORS.paperWarm);
    addPptText(output, paragraph, { x: 0.95, y: itemY + 0.16, w: 11.42, h: h - 0.3, fontSize: paragraphs.length > 2 ? 9.6 : 12, color: PPT_COLORS.ink700, margin: 0.02 });
  });
}

function addPptProblem(output: any, text: string): void {
  addPptCard(output, 0.65, 1.62, 12.02, 4.8, PPT_COLORS.gold50, PPT_COLORS.gold200);
  output.addShape("rect", { x: 12.58, y: 1.62, w: 0.09, h: 4.8, fill: { color: PPT_COLORS.gold400 }, line: { color: PPT_COLORS.gold400 } });
  addPptText(output, text, { x: 1.15, y: 2.55, w: 11.02, h: 2.7, fontFace: PPT_FONT_DISPLAY, fontSize: 24, bold: true, align: "center", valign: "mid", color: PPT_COLORS.ink, margin: 0.15 });
}

function addPptCallout(output: any, callout: NonNullable<PresentationSlide["callout"]>): void {
  const colors = callout.tone === "def" ? pptTone("brand") : callout.tone === "warn" ? pptTone("gold") : pptTone("sky");
  addPptCard(output, 0.65, 1.55, 12.02, 4.85, colors.fill, colors.line);
  addPptText(output, "❝", { x: 0.95, y: 1.85, w: 0.5, h: 0.45, fontFace: "Arial", fontSize: 25, bold: true, color: PPT_COLORS.brand600, margin: 0 });
  addPptText(output, callout.label, { x: 0.95, y: 2.55, w: 11.3, h: 0.45, fontFace: PPT_FONT_DISPLAY, fontSize: 18, bold: true, color: PPT_COLORS.ink, margin: 0 });
  addPptText(output, callout.text, { x: 0.95, y: 3.2, w: 11.3, h: 2.4, fontSize: 15, color: PPT_COLORS.ink700, margin: 0.05 });
}

function addPptTable(output: any, table: NonNullable<PresentationSlide["table"]>): void {
  const header = table.head.map((cell) => ({ text: cell, options: { bold: true, color: PPT_COLORS.white, fill: { color: PPT_COLORS.brand700 }, align: "right", valign: "mid" } }));
  const body = table.rows.map((row, rowIndex) => row.map((cell) => ({ text: cell, options: { color: PPT_COLORS.ink700, fill: { color: rowIndex % 2 ? PPT_COLORS.paperWarm : PPT_COLORS.white }, align: "right", valign: "top" } })));
  output.addTable([header, ...body], {
    x: 0.62,
    y: 1.38,
    w: 12.08,
    h: 5.55,
    fontFace: PPT_FONT_BODY,
    fontSize: 9.2,
    color: PPT_COLORS.ink700,
    border: { type: "solid", color: PPT_COLORS.brand200, pt: 0.6 },
    margin: 0.08,
    valign: "top",
    rtlMode: true,
  });
}

function visualCitation(visual: VisualMaterial): string {
  return [
    visual.caption,
    `المصدر: ${visual.source}`,
    visual.author ? `المؤلف/الفنان: ${visual.author}` : "",
    visual.date ? `التاريخ: ${visual.date}` : "",
    visual.license ? `الرخصة: ${visual.license}` : "",
    visual.sourceUrl ? `الرابط الأصلي: ${visual.sourceUrl}` : "",
  ].filter(Boolean).join("\n");
}

function addPptVisualPlaceholder(output: any, x: number, y: number, w: number, h: number): void {
  addPptCard(output, x, y, w, h, PPT_COLORS.gold50, PPT_COLORS.gold300);
  addPptText(output, "▧", { x: x + w / 2 - 0.3, y: y + 0.55, w: 0.6, h: 0.5, fontFace: "Arial", fontSize: 25, color: PPT_COLORS.gold700, align: "center", margin: 0 });
  addPptText(output, "لا توجد صورة موثقة متاحة لهذا النشاط", { x: x + 0.35, y: y + 1.2, w: w - 0.7, h: 0.35, fontFace: PPT_FONT_DISPLAY, fontSize: 11, bold: true, color: PPT_COLORS.gold700, align: "center", margin: 0 });
  addPptText(output, "يُترك المورد فارغًا إلى حين التحقق من صورة أو خريطة أو مبيان مناسب.", { x: x + 0.45, y: y + 1.7, w: w - 0.9, h: 0.7, fontSize: 7.6, color: PPT_COLORS.gold700, align: "center", margin: 0 });
}

function addPptVisualCaptions(output: any, loaded: { visual: VisualMaterial; data: string }[], x: number, y: number, w: number, h: number): void {
  const selected = loaded.slice(0, 2);
  if (!selected.length) {
    addPptVisualPlaceholder(output, x, y, w, h);
    return;
  }
  if (selected.length === 1) {
    const entry = selected[0];
    addPptCard(output, x, y, w, h, PPT_COLORS.paperWarm, PPT_COLORS.line);
    output.addImage({ data: entry.data, x: x + 0.12, y: y + 0.12, w: w - 0.24, h: h - 1.04 });
    addPptText(output, visualCitation(entry.visual), { x: x + 0.16, y: y + h - 0.84, w: w - 0.32, h: 0.7, fontSize: 5.8, color: PPT_COLORS.ink500, align: "center", margin: 0, hyperlink: entry.visual.sourceUrl ? { url: entry.visual.sourceUrl } : undefined });
    return;
  }
  const itemH = (h - 0.12) / 2;
  selected.forEach((entry, index) => {
    const itemY = y + index * (itemH + 0.12);
    addPptCard(output, x, itemY, w, itemH, PPT_COLORS.paperWarm, PPT_COLORS.line);
    output.addImage({ data: entry.data, x: x + 0.1, y: itemY + 0.08, w: w - 0.2, h: itemH - 0.62 });
    addPptText(output, visualCitation(entry.visual), { x: x + 0.12, y: itemY + itemH - 0.49, w: w - 0.24, h: 0.4, fontSize: 4.5, color: PPT_COLORS.ink500, align: "center", margin: 0, hyperlink: entry.visual.sourceUrl ? { url: entry.visual.sourceUrl } : undefined });
  });
}

function addPptLearningPath(output: any, y: number): void {
  addPptCard(output, 0.65, y, 12.02, 0.62, PPT_COLORS.brand50, PPT_COLORS.brand200);
  addPptText(output, "مسار بناء التعلمات", { x: 10.75, y: y + 0.11, w: 1.7, h: 0.2, fontFace: PPT_FONT_DISPLAY, fontSize: 6.8, bold: true, color: PPT_COLORS.brand700, margin: 0 });
  addPptText(output, LEARNING_SEQUENCE.map((phase, index) => `${index + 1}. ${phase}`).join("  ←  "), { x: 0.9, y: y + 0.2, w: 9.7, h: 0.2, fontSize: 6.5, bold: true, color: PPT_COLORS.ink700, align: "center", valign: "mid", margin: 0 });
}

function addPptActivity(output: any, activity: ActivityMaterial, loaded: { visual: VisualMaterial; data: string }[]): void {
  addPptLearningPath(output, 1.34);
  const leftX = 0.65;
  const leftW = 4.18;
  const rightX = 5.05;
  const rightW = 7.62;
  if (loaded.length) addPptVisualCaptions(output, loaded, leftX, 2.08, leftW, 2.92);
  else addPptVisualPlaceholder(output, leftX, 2.08, leftW, 2.92);
  addPptInfoCard(output, "توجيه الأستاذ", activity.teacherGuidance ?? "يوجّه الأستاذ المتعلمين إلى الملاحظة والوصف وطرح الفرضيات، ثم يؤجل الأجوبة والخلاصة.", leftX, 5.12, leftW, 0.63, "gold", 5.9);
  addPptInfoCard(output, "طبيعة الوثيقة / المصدر", `${activity.nature} · ${activity.source}`, leftX, 5.84, leftW, 0.7, "paper", 5.6);

  const cardW = (rightW - 0.14) / 2;
  addPptInfoCard(output, "المفهوم المستهدف", activity.concept, rightX, 2.08, cardW, 0.75, "brand", 6.5);
  addPptInfoCard(output, "الهدف التعلمي", activity.objective, rightX + cardW + 0.14, 2.08, cardW, 0.75, "brand", 6.5);
  addPptInfoCard(output, "مهمة المتعلم", activity.studentTask, rightX, 2.95, cardW, 0.82, "sky", 6.3);
  addPptInfoCard(output, "الملاحظة والتحليل", activity.observation, rightX + cardW + 0.14, 2.95, cardW, 0.82, "paper", 6.3);

  addPptCard(output, rightX, 3.93, rightW, 1.82, PPT_COLORS.white, PPT_COLORS.line);
  addPptText(output, "أسئلة موجهة للمتعلمين", { x: rightX + 0.18, y: 4.08, w: rightW - 0.36, h: 0.2, fontFace: PPT_FONT_DISPLAY, fontSize: 7.2, bold: true, color: PPT_COLORS.brand700, margin: 0 });
  addPptText(output, activity.questions.map((question, index) => `${index + 1}. ${question.q}`).join("\n"), { x: rightX + 0.18, y: 4.38, w: rightW - 0.36, h: 1.12, fontSize: 6.1, color: PPT_COLORS.ink, margin: 0.02 });
  addPptText(output, "يناقش المتعلمون الفرضيات قبل إظهار الإجابة.", { x: rightX + 0.18, y: 5.49, w: rightW - 0.36, h: 0.15, fontSize: 5.2, color: PPT_COLORS.ink500, margin: 0 });
  addPptCard(output, rightX, 5.91, rightW, 0.63, PPT_COLORS.gold50, PPT_COLORS.gold200);
  addPptText(output, "الاستنتاج", { x: rightX + 0.18, y: 6.04, w: 1.0, h: 0.18, fontFace: PPT_FONT_DISPLAY, fontSize: 6.8, bold: true, color: PPT_COLORS.gold700, margin: 0 });
  addPptText(output, activity.expectedConclusion ? activity.expectedConclusion : "يُصاغ الاستنتاج جماعيًا انطلاقًا من الأدلة أعلاه.", { x: rightX + 1.25, y: 6.02, w: rightW - 1.45, h: 0.25, fontSize: 5.8, bold: true, color: PPT_COLORS.ink700, margin: 0 });
}

function addPptDocument(output: any, doc: PresentationDocument, loaded: { visual: VisualMaterial; data: string }[]): void {
  const gap = 0.1;
  const metaW = (12.02 - gap * 3) / 4;
  const meta = [
    ["طبيعة الوثيقة", doc.nature],
    ["المصدر / المؤلف", doc.source],
    ["التاريخ", doc.date],
    ["السياق", doc.context],
  ];
  meta.forEach(([label, text], index) => addPptInfoCard(output, label, text, 0.65 + index * (metaW + gap), 1.34, metaW, 0.68, "paper", 5.9));
  if (loaded.length) addPptVisualCaptions(output, loaded, 0.65, 2.18, 4.58, 3.02);
  else addPptVisualPlaceholder(output, 0.65, 2.18, 4.58, 3.02);
  addPptCard(output, 5.42, 2.18, 7.25, 3.02, PPT_COLORS.brand50, PPT_COLORS.brand200);
  addPptText(output, doc.label, { x: 5.68, y: 2.37, w: 6.7, h: 0.3, fontFace: PPT_FONT_DISPLAY, fontSize: 12, bold: true, color: PPT_COLORS.brand900, margin: 0 });
  addPptText(output, doc.text, { x: 5.68, y: 2.82, w: 6.7, h: 2.05, fontSize: 9.1, color: PPT_COLORS.ink700, margin: 0.04 });
  addPptCard(output, 0.65, 5.42, 12.02, 0.88, PPT_COLORS.paperWarm, PPT_COLORS.paperWarm);
  addPptText(output, `أسئلة أجيب عنها:\n${doc.questions.map((item, index) => `${index + 1}. ${item.q}`).join("\n")}`, { x: 0.9, y: 5.55, w: 11.5, h: 0.58, fontSize: 6.5, color: PPT_COLORS.ink, margin: 0 });
  addPptCard(output, 0.65, 6.46, 12.02, 0.43, PPT_COLORS.gold50, PPT_COLORS.gold200);
  addPptText(output, "الخلاصة المرتبطة بالإشكالية: يكتب المتعلمون خلاصة قصيرة قبل عرض الصياغة المقترحة.", { x: 0.9, y: 6.56, w: 11.5, h: 0.18, fontSize: 6.2, color: PPT_COLORS.gold700, margin: 0 });
}

function addPptSchema(output: any, schema: NonNullable<PresentationSlide["schema"]>): void {
  const gap = 0.16;
  const w = (12.02 - gap) / 2;
  const rows = Math.ceil(schema.rows.length / 2);
  const h = Math.min(1.35, (5.35 - gap * Math.max(0, rows - 1)) / Math.max(1, rows));
  schema.rows.forEach((row, index) => {
    const col = index % 2;
    const rowIndex = Math.floor(index / 2);
    const x = col === 0 ? 0.65 : 0.65 + w + gap;
    const y = 1.42 + rowIndex * (h + gap);
    addPptInfoCard(output, row.label, row.value, x, y, w, h, "brand", rows >= 4 ? 7.5 : 9.2);
  });
}

function addPptTimeline(output: any, timeline: { date: string; event: string }[]): void {
  const gap = 0.12;
  const h = Math.min(0.72, (5.35 - gap * Math.max(0, timeline.length - 1)) / Math.max(1, timeline.length));
  output.addShape("line", { x: 11.88, y: 1.62, w: 0, h: Math.max(0.5, timeline.length * (h + gap) - gap - 0.2), line: { color: PPT_COLORS.brand200, width: 1.4 } });
  timeline.forEach((item, index) => {
    const y = 1.48 + index * (h + gap);
    output.addShape("ellipse", { x: 11.72, y: y + 0.18, w: 0.32, h: 0.32, fill: { color: PPT_COLORS.gold400 }, line: { color: PPT_COLORS.gold300, width: 1 } });
    addPptCard(output, 0.85, y, 10.65, h, PPT_COLORS.paperWarm, PPT_COLORS.paperWarm);
    addPptText(output, item.date, { x: 1.1, y: y + 0.11, w: 2.1, h: h - 0.2, fontFace: PPT_FONT_DISPLAY, fontSize: 8.2, bold: true, color: PPT_COLORS.brand800, margin: 0 });
    addPptText(output, item.event, { x: 3.25, y: y + 0.11, w: 7.9, h: h - 0.2, fontSize: 7.6, color: PPT_COLORS.ink700, margin: 0 });
  });
}

/** يبني ملف PowerPoint حقيقيًا من الشرائح، بنفس لغة التصميم البصرية للعرض التفاعلي. */
export async function createLessonPowerPointBlob(lesson: LessonContent, meta: PresentationMeta): Promise<Blob> {
  if (typeof window !== "undefined" && !isUnlocked()) throw new Error("تحميل PowerPoint متاح للأستاذ فقط.");
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.rtlMode = true;
  pptx.theme = { headFontFace: PPT_FONT_DISPLAY, bodyFontFace: PPT_FONT_BODY };
  pptx.author = "الأستاذ عماد طليل";
  pptx.company = "ثانوية القدس، القنيطرة";
  pptx.subject = `${meta.subjectLabel} — ${lesson.title}`;
  pptx.title = lesson.title;
  const slides = buildLessonPresentation(lesson);

  for (const [index, item] of slides.entries()) {
    const output = pptx.addSlide();
    addPptSlideFrame(output, item, index, slides.length, meta, lesson);
    if (item.kind === "title") {
      // العنوان والمعلومات وُضعت داخل إطار الغلاف في addPptSlideFrame.
    } else if (item.kind === "section") {
      output.addShape("roundRect", { x: 6.05, y: 2.18, w: 1.2, h: 1.2, fill: { color: PPT_COLORS.brand100 }, line: { color: PPT_COLORS.brand200, width: 0.6 } });
      addPptText(output, "✦", { x: 6.05, y: 2.48, w: 1.2, h: 0.4, fontFace: "Arial", fontSize: 22, bold: true, color: PPT_COLORS.brand700, align: "center", margin: 0 });
      addPptText(output, item.title, { x: 1.1, y: 3.75, w: 11.1, h: 0.85, fontFace: PPT_FONT_DISPLAY, fontSize: 25, bold: true, color: PPT_COLORS.ink, align: "center", valign: "mid", margin: 0.05 });
      output.addShape("rect", { x: 6.15, y: 5.0, w: 1.03, h: 0.06, fill: { color: PPT_COLORS.gold400 }, line: { color: PPT_COLORS.gold400 } });
    } else if ((item.kind === "objectives" || item.kind === "concepts" || item.kind === "list" || item.kind === "summary" || item.kind === "assessment" || item.kind === "tips") && item.items) {
      addPptNumberedCards(output, item.items, item.kind === "summary");
    } else if (item.kind === "context" || item.kind === "paragraph") {
      addPptParagraphCards(output, item.paragraphs ?? []);
    } else if (item.kind === "problem") {
      addPptProblem(output, item.paragraphs?.[0] ?? "");
    } else if (item.kind === "callout" && item.callout) {
      addPptCallout(output, item.callout);
    } else if (item.kind === "table" && item.table) {
      addPptTable(output, item.table);
    } else if (item.kind === "activity" && item.activity) {
      const loaded = await loadVisuals(item.activity.visuals);
      addPptActivity(output, item.activity, loaded);
    } else if (item.kind === "document" && item.doc) {
      const loaded = await loadVisuals(item.doc.visuals);
      addPptDocument(output, item.doc, loaded);
    } else if (item.kind === "schema" && item.schema) {
      addPptSchema(output, item.schema);
    } else if (item.kind === "image") {
      const visuals = item.images ?? (item.image ? [item.image] : []);
      const loaded = await loadVisuals(visuals);
      addPptVisualCaptions(output, loaded, 0.65, 1.42, 12.02, 5.35);
      if (item.paragraphs?.length) addPptText(output, item.paragraphs[0], { x: 1.0, y: 5.98, w: 11.3, h: 0.55, fontSize: 8.1, color: PPT_COLORS.gold700, align: "center", margin: 0 });
    } else if (item.kind === "timeline" && item.timeline) {
      addPptTimeline(output, item.timeline);
    } else {
      addPptText(output, pptParagraphs(item), { x: 0.9, y: 1.5, w: 11.5, h: 5.2, fontSize: 12 });
    }
    const note = item.activity ? `${activityPlainText(item.activity)}\n\n` : item.doc ? `${documentPlainText(item.doc)}\n\n` : "";
    output.addNotes(`${note}هذا العرض مبني على محتوى الدرس الأصلي والوثائق المرتبطة به داخل المشروع. لا تُعدّ الحقول غير المحددة مصدرًا جديدًا.`);
  }

  const output = await pptx.write({ outputType: "blob", compression: true });
  return output instanceof Blob ? output : new Blob([output as BlobPart], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
}

function presentationFilePart(lesson: LessonContent): string {
  return lesson.id.replace(/[^a-zA-Z0-9.-]+/g, "-").replace(/^-|-$/g, "") || "lesson";
}

/** ينزّل ملف PowerPoint القابل للتحرير مباشرة من المتصفح. */
export async function downloadLessonPowerPoint(lesson: LessonContent, meta: PresentationMeta): Promise<void> {
  const blob = await createLessonPowerPointBlob(lesson, meta);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `presentation-${presentationFilePart(lesson)}.pptx`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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

function LearningPath() {
  return <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-4" aria-label="تسلسل بناء التعلمات"><p className="text-[11px] font-black text-brand-700">مسار بناء التعلمات</p><div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-extrabold text-ink-700">{LEARNING_SEQUENCE.map((phase, index) => <span key={phase} className="inline-flex items-center gap-1.5"><span className={`rounded-full px-2.5 py-1 ${index < 3 ? "bg-white text-brand-800" : "bg-gold-100 text-gold-900"}`}>{index + 1}. {phase}</span>{index < LEARNING_SEQUENCE.length - 1 ? <span className="text-brand-300" aria-hidden="true">←</span> : null}</span>)}</div></div>;
}

function VisualFigures({ visuals }: { visuals: VisualMaterial[] }) {
  if (!visuals.length) return <div className="rounded-2xl border-2 border-dashed border-gold-300 bg-gold-50 p-5 text-center"><ImageIcon className="mx-auto size-8 text-gold-600" /><p className="mt-3 text-sm font-extrabold text-gold-900">لا توجد صورة موثقة متاحة لهذا النشاط</p><p className="mt-1 text-xs leading-relaxed text-gold-800">يُترك المورد فارغًا إلى حين التحقق من صورة أو خريطة أو مبيان مناسب؛ لم تُخترع وثيقة بديلة.</p></div>;
  return <div className="space-y-3">{visuals.map((visual) => {
    const details = [visual.author, visual.date, visual.license].filter(Boolean).join(" · ");
    return <figure key={visual.src} className="overflow-hidden rounded-2xl border border-ink-900/10 bg-paper-warm"><img src={visual.src} alt={visual.caption} className="mx-auto max-h-[330px] w-full object-contain" /><figcaption className="p-3 text-center text-xs font-bold leading-relaxed text-ink-500"><span>{visual.caption}</span><br /><span className="font-semibold text-ink-400">المصدر: {visual.source}</span>{visual.sourceUrl ? <><br /><a href={visual.sourceUrl} target="_blank" rel="noreferrer" className="break-all font-semibold text-brand-700 underline">الرابط الأصلي</a></> : null}{details ? <><br /><span className="font-semibold text-ink-400">{details}</span></> : null}{visual.concept ? <><br /><span className="font-semibold text-brand-700">المحور: {visual.concept}</span></> : null}</figcaption></figure>;
  })}</div>;
}

function ActivityBody({ activity, showAnswers }: { activity: ActivityMaterial; showAnswers: boolean }) {
  return (
    <div className="space-y-5">
      <LearningPath />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <VisualFigures visuals={activity.visuals} />
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <InfoCard label="توجيه الأستاذ" text={activity.teacherGuidance ?? "يوجّه الأستاذ المتعلمين إلى الملاحظة والوصف وطرح الفرضيات، ثم يؤجل الأجوبة والخلاصة إلى نهاية المناقشة."} tone="gold" />
            <InfoCard label="طبيعة الوثيقة" text={activity.nature} />
            <InfoCard label="العنوان / المؤلف / التاريخ" text={`${activity.title} · ${activity.author} · ${activity.date}`} />
            <InfoCard label="المصدر" text={activity.source} />
          </div>
        </div>
        <div className="space-y-3">
          <InfoCard label="المفهوم المستهدف" text={activity.concept} tone="brand" />
          <InfoCard label="الهدف التعلمي" text={activity.objective} tone="brand" />
          <InfoCard label="مهمة المتعلم" text={activity.studentTask} tone="sky" />
          <InfoCard label="الملاحظة والتحليل" text={activity.observation} />
          <div className="rounded-2xl border border-ink-900/8 bg-white p-4">
            <p className="text-[11px] font-black text-brand-700">أسئلة موجهة للمتعلمين</p>
            <div className="mt-3 space-y-3">
              {activity.questions.map((question, index) => (
                <div key={`${index}-${question.q}`} className="rounded-xl bg-paper-warm/70 p-3">
                  <p className="text-sm font-extrabold leading-relaxed text-ink-900">{index + 1}. {question.q}</p>
                  {showAnswers ? <p className="mt-2 border-t border-ink-900/10 pt-2 text-xs leading-relaxed text-emerald-800"><strong>الإجابة المنتظرة:</strong> {question.answer}</p> : <p className="mt-2 text-[11px] font-bold text-ink-400">يناقش المتعلمون الفرضيات قبل إظهار الإجابة.</p>}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border-s-4 border-gold-400 bg-gold-50 p-4">
            <p className="text-[11px] font-black text-gold-800">الاستنتاج</p>
            {showAnswers && activity.expectedConclusion ? <p className="mt-2 text-sm font-bold leading-[1.9] text-ink-800">{activity.expectedConclusion}</p> : <p className="mt-2 text-sm font-bold text-gold-800">يُصاغ الاستنتاج جماعيًا انطلاقًا من الأدلة أعلاه.</p>}
          </div>
        </div>
      </div>
    </div>
  );
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
  if (slide.kind === "image") return <div className="space-y-5"><VisualFigures visuals={slide.images ?? (slide.image ? [slide.image] : [])} />{slide.paragraphs?.length ? <div className="rounded-2xl border-2 border-dashed border-gold-300 bg-gold-50 p-5 text-center"><p className="text-base font-bold leading-relaxed text-gold-900">{slide.paragraphs[0]}</p></div> : null}</div>;
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

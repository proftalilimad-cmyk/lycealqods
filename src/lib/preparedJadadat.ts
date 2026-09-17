/* ============================================================
   الجذاذات المُعدَّة — الجذع المشترك العلمي (الاجتماعيات)
   ============================================================
   هذه المكتبة **تركّب** جذاذات الدروس الخمسة والعشرين في زمن التشغيل من
   مصدرين موجودين فعلًا في الموقع، بدل تخزين نسخة مكررة منهما:

     1) المضامين  ← دروس الموقع المنشورة (src/data/lessons/tcSciHistory.ts
        و tcSciGeo.ts عبر LESSON_CONTENT): الأهداف، الإشكالية، المحاور
        وكتلها (تعريفات، معطيات، جداول، نصوص)، المفاهيم، الكرونولوجيا،
        الخلاصات، أسئلة التقويم وأجوبتها وتعليلها، الوثائق بأسئلتها،
        التطبيق المنهجي، ونصائح الامتحان.
     2) الصياغة الديداكتيكية ← التوجيهات التربوية والبرامج الخاصة بتدريس
        مادة الاجتماعيات بالتعليم الثانوي التأهيلي، وديداكتيك المادة
        (النهج التاريخي والنهج الجغرافي): الكفايات، المراحل والمقاطع،
        التدبير (أنشطة الأستاذ والمتعلم)، الدعامات، الحيز الزمني،
        المهارات، القيم، والتقويم المرحلي/الإجمالي.

   قاعدة الأمانة: لا تُؤلَّف هنا أي معلومة تاريخية أو جغرافية. كل رقم
   أو مفهوم أو خلاصة أو سؤال تقويم مردّه إلى درس الموقع، وكل ما هو منهجي
   مُعلن كصياغة ديداكتيكية. لهذه الجذاذات حالة خاصة ("prepared") ومصدر
   مطبوع أسفل كل واحدة، وهي **لا تُعوّض** جذاذات الأستاذ الأصلية
   (قسم «الجذاذات») ولا ملفاته (مكتبة الجذاذات).

   مرجعيات الصياغة الديداكتيكية (اطُّلع عليها على الإنترنت):
     • التوجيهات التربوية والبرامج الخاصة بتدريس مادة الاجتماعيات —
       الثانوي التأهيلي: تعريف الجذاذة («ليست ملخصًا للدرس بل تحديد
       إستراتيجية محكمة…») وعناصرها الخمسة: تمهيد بأسئلة المراجعة وتقديم
       في نسق إشكالي / أنشطة المتعلمين حول الوثائق المتوفرة / الوسائل
       التعلمية المرتبطة بكل مرحلة وتوقيت استغلالها / أسئلة الاشتغال
       والإنجازات المرتقبة / تقويم مرحلي في نهاية كل فقرة وتقويم إجمالي.
       https://www.argeoweb.com/2019/11/hist-geo-rar.html
     • بناء درس الاجتماعيات بالثانوي من التصور إلى الأجرأة: مدخل الكفايات،
       الوضعيات-المشكلة، التدريس بالمجزوءات، الأشكلة، مكونات الجذاذة
       (أهداف التعلم، الإشكالية، المراحل والمقاطع، الدعامات، المفاهيم،
       الخلاصات، التقويم) وتوازن الحيز الزمني بين الأنشطة.
       http://histoire-geo4.blogspot.com/p/blog-page_13.html
     • دليل مادة الاجتماعيات بالثانوي (وزارة التربية الوطنية): كفايات
       التاريخ (الموضعة في الزمن، معالجة وثائق/آثار، تحليل خريطة تاريخية،
       قراءة خطاطة، كتابة مقال تاريخي) وكفايات الجغرافيا (النهج الجغرافي:
       الوصف/التفسير/التعميم، التعبير البياني والكرطوغرافي).
       https://www.ostad.ma/wp-content/uploads/2023/01/دليل-مادة-الاجتماعيات-بالثانو-670.pdf
     • الأطر المرجعية للامتحانات: خطوات الاشتغال بالوثائق (النوعية،
       المصدر، التأريخ، الإطار الزمني والمكاني، استخراج المعطيات، ربط
       العلاقات، تركيب الفكرة الأساس، المناقشة).
       https://elouaazikigh.blogspot.com/search/label/الامتحانات%20الوطنية
     • تدريس الجغرافيا بالسلك الثانوي التأهيلي: الكفاية تعبئة موارد
       نظرية ومنهجية ومواقف لمعالجة مشكلة جغرافية؛ خطوات المنهج العلمي
       الجغرافي (الملاحظة، الوصف، التفسير، التحليل، الاستنتاج).
       https://josooor.com/pdfs/twentytwo_one/first/69.pdf
     • الكتاب المدرسي: «منار التاريخ والجغرافيا — الجذع المشترك العلمي»
       (ومعه «مسار التاريخ والجغرافيا» في وثائق الأستاذ).
       https://www.argeoweb.com/2021/10/blog-post_21.html
   ============================================================ */
import { DOC_CSS } from "../components/Jadadat";
import { FICHES_PEDAGOGIQUES, type FicheFile } from "../data/jadadatFiles";
import { BOOK_TC, TC_SCI_SLOTS, TEACHER_NAME, TEACHER_SCHOOL, type Jadada, type JadadaSegment, type JadadaSlot } from "../data/jadadat";
import { LESSON_CONTENT } from "../data/lessonContent";
import type { LessonApplication, LessonBlock, LessonContent, LessonDoc, LessonQuizItem, LessonSchema, LessonSection } from "../types";

/** الغلاف الزمني الرسمي للحصة الدراسية بالسلك التأهيلي */
export const MINUTES_PER_SESSION = 55;
/** تاريخ إعداد هذه الجذاذات داخل الموقع */
export const PREPARED_AT = "2026-09-17T21:30:00+01:00";
const TRACK = "مسلك علوم";
const LEVEL_LABEL = "الجذع المشترك العلمي";

/* ------------------------------------------------------------------ */
/* مرجعية الصياغة الديداكتيكية (إطار منهجي — لا مضامين مؤلَّفة)          */
/* ------------------------------------------------------------------ */

/** الكفاية المركزية/المجالية للمادة وفق منهاج المادة */
export const SUBJECT_KIFAYA: Record<string, string> = {
  التاريخ:
    "التمكن من نهج المادة التاريخي (الموضعة في الزمان والمكان، معالجة الوثائق والآثار التاريخية، التحليل والنقد، التركيب) وبناء المفاهيم التاريخية وضبط استعمالها في سياقها، وتوظيف ذلك في فهم التحولات الكبرى التي عرفها العالم المتوسطي وأوربا والعالم الإسلامي خلال الحقبة المدروسة، مع إعمال الفكر النقدي والاعتزاز بالموروث الحضاري.",
  الجغرافيا:
    "إعمال النهج الجغرافي (الوصف، التفسير، التعميم) في دراسة ظواهر مجالية، والتمكن من أدوات التعبير الجغرافي (الخرائط، المبيانات، الجداول، الخطاطات، الصور)، وتنمية التربية المجالية للمتعلم بربط التعلمات بمحيطه السوسيو-اقتصادي والبيئي واتخاذ مواقف وسلوكات إيجابية تجاه المجال والبيئة.",
};

/** القدرات/المهارات المنهجية المستهدفة حسب المادة */
export const SUBJECT_SKILLS: Record<string, string[]> = {
  التاريخ: [
    "الموضعة في الزمن: بناء خط زمني للحدث/الظاهرة وربطه بالسياق العام",
    "الموضعة في المكان: توطين الأحداث والمجالات على خريطة تاريخية",
    "معالجة وثيقة تاريخية: تحديد نوعيتها ومصدرها وصاحبها وتأريخها وإطارها الزمني والمكاني",
    "استخراج المعطيات التاريخية من الوثائق وربط العلاقات بينها",
    "نقد الوثيقة ومناقشة مضامينها في ارتباط بسياقها",
    "تركيب الفكرة الأساس للوثائق وإنجاز خطاطة أو جدول زمني مركب",
    "الكتابة التاريخية: إنجاز مقال أو فقرة تاريخية بتصميم واضح (مقدمة، عرض، خاتمة)",
  ],
  الجغرافيا: [
    "قراءة وثائق جغرافية متنوعة: خرائط، مبيانات، جداول إحصائية، صور أرضية وجوية، نصوص",
    "الوصف الجغرافي: استخراج الخصائص، إبراز التطور، المقارنة بين المعطيات، التوطين",
    "التفسير الجغرافي: استخراج العوامل، تصنيفها، ربط العلاقات بينها",
    "التعميم الجغرافي: استخلاص قاعدة أو مبدأ منظم وصياغته في فقرة",
    "بناء أدوات التعبير الجغرافي واستثمارها: إنجاز خريطة تركيبية، مبيان، خطاطة",
    "دراسة منظومة بيئية أو مجال محلي بخطوات المنهج العلمي الجغرافي: الملاحظة، الوصف، التفسير، التحليل، الاستنتاج",
    "اقتراح تدابير معقلنة لتدبير المجال والبيئة وتبريرها",
  ],
};

/** القيم المستهدفة (من القيم المعلنة في المنهاج والتوجيهات التربوية) */
export const TARGET_VALUES: string[] = [
  "إعمال العقل واعتماد الفكر النقدي في مقاربة القضايا",
  "احترام البيئة الطبيعية والتعامل الإيجابي مع الموروث الطبيعي والثقافي والحضاري",
  "ممارسة المواطنة والديموقراطية والتفاعل الإيجابي مع المحيط الاجتماعي",
  "الاستقلالية في التفكير والمبادرة والإنجاز ضمن عمل فردي وجماعي",
  "تثمين العمل والاجتهاد والمثابرة والوعي بقيمة الوقت",
];

/** التدبير الديداكتيكي المشترك للمقاطع (أنشطة الأستاذ والمتعلم) */
const MANAGEMENT_COMMON = [
  "الأستاذ(ة): يقدم المقطع ويوجه ملاحظة المتعلمين إلى الوثائق والمعطيات المتوفرة",
  "الأستاذ(ة): يطرح أسئلة الاشتغال ويبني المعرفة بشراكة مع المتعلمين",
  "المتعلم(ة): يقرأ ويلاحظ، ثم يستخرج المعطيات ويصنفها ويربط العلاقات بينها",
  "المتعلم(ة): يناقش ويبرر استنتاجاته وينجز الخلاصة الجزئية للمقطع",
  "الأستاذ(ة): يصحح التمثلات، يضبط المفاهيم، ويثبت الخلاصة الجزئية",
];

/** الكفاية المحورية للوحدة: تُصاغ من عنوان الوحدة ودروسها الحقيقية */
export function unitKifaya(subject: string, unitTitle: string, lessonTitles: string[]): string {
  const list = lessonTitles.map((t) => `«${t}»`).join("، ");
  return subject === "التاريخ"
    ? `أن يحلل المتعلم قضايا الوحدة «${unitTitle}» (من خلال الدروس: ${list}) مستثمرًا وثائق تاريخية متنوعة، وموظفًا نهج المادة في الموضعة الزمنية والمجالية والتحليل والنقد والتركيب، لينتج خلاصات مركبة تُبرز التحولات التاريخية للوحدة وعلاقاتها المتبادلة.`
    : `أن يدرس المتعلم قضايا الوحدة «${unitTitle}» (من خلال الدروس: ${list}) بإعمال النهج الجغرافي (الوصف، التفسير، التعميم) وأدوات التعبير الجغرافي، ليفسر خصائص المجال المدروس ويربطها بالأنشطة البشرية، ويقترح إجراءات معقلنة لتنظيمه وتدبيره.`;
}

/* ------------------------------------------------------------------ */
/* أدوات النقل من درس الموقع (بلا تأليف)                                */
/* ------------------------------------------------------------------ */
const truncate = (s: string, max: number): string => {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max).replace(/\s\S*$/, "")}… (المتن الكامل في درس الموقع)`;
};

/** حذف ترقيم المحور («أولًا:»، «المحور الثاني:»…) من عنوان المقطع */
export function cleanSectionTitle(t: string): string {
  return t
    .replace(/^(أولًا|ثانيًا|ثالثًا|رابعًا|خامسًا|سادسًا|سابعًا)\s*[:：]\s*/, "")
    .replace(/^(المحور|الفقرة|المقطع)\s*(الأول|الثاني|الثالث|الرابع|الخامس|السادس)?\s*[:：]?\s*/, "")
    .trim();
}

const has = (sec: LessonSection, type: LessonBlock["type"]) => sec.blocks.some((b) => b.type === type);

/** نقل محتوى المحور كما ورد في درس الموقع */
export function sectionContent(sec: LessonSection): string[] {
  const out: string[] = [];
  for (const b of sec.blocks) {
    if (b.type === "callout") out.push(`${b.label}: ${truncate(b.text, 700)}`);
    else if (b.type === "ul") {
      if (b.title) out.push(b.title);
      out.push(...b.items.map((i) => `• ${truncate(i, 320)}`));
    } else if (b.type === "table") {
      out.push(`جدول المحور — الأعمدة: ${b.head.join(" | ")}`);
      out.push(...b.rows.slice(0, 8).map((r) => `⟵ ${r.map((c) => truncate(c, 120)).join(" | ")}`));
    } else out.push(truncate(b.text, 460));
  }
  return out;
}

/** أهداف التعلم المرتبطة بنشاط المقطع: تُشتق من نوع الكتل الفعلية في الدرس */
export function sectionObjectives(sec: LessonSection, subject: string): string[] {
  const t = cleanSectionTitle(sec.title);
  const o: string[] = [`التعرف على «${t}» وضبط مضامينها الأساسية`];
  if (has(sec, "callout")) o.push("ضبط دلالة المفاهيم الواردة في المقطع واستعمالها في سياقها المناسب");
  if (has(sec, "ul")) o.push(subject === "التاريخ" ? "استخراج المعطيات التاريخية وتصنيفها وربط العلاقات بينها" : "استخراج الخصائص المجالية وتصنيفها والمقارنة بينها");
  if (has(sec, "table"))
    o.push(
      subject === "التاريخ"
        ? "قراءة الجدول أو الوثيقة الإحصائية واستخراج دلالاتها التاريخية"
        : "قراءة الجدول أو المبيان واستخراج دلالاته المجالية وتحويله إلى تعبير بياني أو خريطي",
    );
  if (has(sec, "p")) o.push("تحليل نص المحور واستخراج أفكاره الأساس ومناقشتها");
  o.push(subject === "التاريخ" ? "الموضعة الزمنية والمجالية لأحداث المقطع وإنجاز خطاطة تركيبية" : "توطين الظواهر المدروسة مجاليًا وإنجاز خطاطة أو خريطة تركيبية");
  return o;
}

/** التدبير الديداكتيكي للمقطع (أنشطة الأستاذ والمتعلم) */
export function sectionManagement(sec: LessonSection, subject: string): string[] {
  const m = [...MANAGEMENT_COMMON];
  if (has(sec, "table")) m.push("المتعلم(ة): يحوّل معطيات الجدول إلى مبيان أو خطاطة ويستثمره في التفسير");
  if (has(sec, "callout")) m.push("المتعلم(ة): يصوغ تعريفًا مركبًا للمفهوم انطلاقًا من عناصر الوثيقة");
  m.push(
    subject === "التاريخ"
      ? "الأستاذ(ة): يوجه نحو الموضعة الزمنية والمجالية (خط زمني + توطين على الخريطة)"
      : "الأستاذ(ة): يوجه نحو خطوات النهج الجغرافي (الوصف ← التفسير ← التعميم)",
  );
  return m;
}

/** الدعامات الديداكتيكية للمقطع: تُشتق مما هو متوفر فعلًا */
export function sectionSupports(sec: LessonSection, book: string, originalFileNames: string[]): string[] {
  const s = [`الكتاب المدرسي: ${book} — وثائق الدرس وأنشطته`, "درس الموقع المنشور (محاور، مفاهيم، وثائق، خلاصات وتقويمات)"];
  if (has(sec, "table")) s.push("جدول أو مبيان معطيات المحور (من الدرس)");
  if (has(sec, "callout")) s.push("بطاقات تعريف المفاهيم (من معجم الدرس)");
  if (has(sec, "ul")) s.push("لائحة المعطيات أو العوامل المستخرجة من الوثائق");
  s.push("السبورة والطباشير الملون، ودفاتر المتعلمين");
  if (originalFileNames.length) s.push(`وثائق الأستاذ الأصلية المرتبطة بالدرس: ${originalFileNames.join("، ")}`);
  return s;
}

/** توزيع استرشادي للحيز الزمني — توازن بين الأنشطة كما تنص التوجيهات */
export function timings(weights: number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const rounded = weights.map((w) => Math.max(5, Math.round(((w / sum) * total) / 5) * 5));
  let diff = total - rounded.reduce((a, b) => a + b, 0);
  for (let i = 1; diff !== 0 && i < rounded.length * 6; i++) {
    const idx = i % rounded.length;
    if (diff > 0) {
      rounded[idx] += 5;
      diff -= 5;
    } else if (rounded[idx] > 5) {
      rounded[idx] -= 5;
      diff += 5;
    }
  }
  return rounded;
}

/* ------------------------------------------------------------------ */
/* أنواع الناتج                                                        */
/* ------------------------------------------------------------------ */
export interface PreparedStageTiming {
  phase: string;
  minutes: number;
}

export interface PreparedOriginalFile {
  name: string;
  url: string;
  kind: FicheFile["kind"];
  folder: string;
  pages: number | null;
}

/** المعطيات المصاحبة للجذاذة (ما لا تتسع له بنية Jadada الرسمية) */
export interface PreparedExtra {
  id: string;
  lessonKey: string;
  lessonTitle: string;
  lessonUrl: string;
  libraryUrl: string;
  originalFicheUrl: string;
  subject: "التاريخ" | "الجغرافيا";
  cycle: string;
  unitId: string;
  unitTitle: string;
  module: string;
  lessonNumber: string;
  tag: string | null;
  title: string;
  book: string;
  duration: string;
  sessionsCount: number | null;
  sessionsSource: string | null;
  stageTiming: PreparedStageTiming[];
  totalMinutes: number;
  introQuestions: string[];
  kifayaMarkaziya: string;
  kifayaMihwariya: string;
  intro: string;
  objectives: string[];
  skills: string[];
  values: string[];
  glossary: { term: string; def: string }[];
  timeline: { date: string; event: string }[];
  summary: string[];
  examTips: string[];
  quiz: LessonQuizItem[];
  docs: LessonDoc[];
  application: LessonApplication | null;
  schema: LessonSchema | null;
  sections: { title: string; blocks: number }[];
  originalFiles: PreparedOriginalFile[];
  keywords: string[];
  preparedAt: string;
}

export interface PreparedFiche {
  fiche: Jadada;
  extra: PreparedExtra;
  lesson: LessonContent;
  slot: JadadaSlot;
}

/** بطاقة تعريف القسم (العنوان والوصف والمراجع المعلنة) */
export const PREPARED_META = {
  title: "جذاذات مُعدَّة — الجذع المشترك العلمي",
  subtitle: "التاريخ والجغرافيا وفق التوجيهات التربوية وديداكتيك المادة",
  description:
    "جذاذات مُعدَّة لكل دروس الجذع المشترك العلمي (التاريخ والجغرافيا): مضامينها منقولة من دروس الموقع المنشورة (الأهداف، الإشكاليات، المحاور، المفاهيم، الكرونولوجيا، الخلاصات، أسئلة التقويم وأجوبتها، الوثائق والتطبيقات حيثما توفرت)، وصياغتها الديداكتيكية (الكفايات، المراحل والمقاطع، التدبير، الدعامات، الحيز الزمني، المهارات، القيم، التقويم) وفق التوجيهات التربوية والبرامج الخاصة بتدريس مادة الاجتماعيات بالتعليم الثانوي التأهيلي ومنهجية ديداكتيك المادة. تُعرض مع مصدرها الكامل، ولا تُلغي جذاذاتك الأصلية ولا ملفاتك.",
  level: LEVEL_LABEL,
  track: TRACK,
  book: BOOK_TC,
  minutesPerSession: MINUTES_PER_SESSION,
  authorLabel: `إعداد وإنجاز: ${TEACHER_NAME}`,
  school: TEACHER_SCHOOL,
  preparedAt: PREPARED_AT,
  sources: [
    {
      name: "دروس الموقع المنشورة — مصدر المضامين",
      detail: "25 درسًا كاملًا للجذع المشترك العلمي (أهداف، إشكاليات، محاور، مفاهيم، كرونولوجيا، خلاصات، تقويمات بأجوبتها)",
      url: "#/lessons/tc",
    },
    {
      name: "التوجيهات التربوية والبرامج الخاصة بتدريس مادة الاجتماعيات — الثانوي التأهيلي",
      detail: "تعريف الجذاذة وعناصرها الخمسة: تمهيد بأسئلة المراجعة وتقديم إشكالي / أنشطة المتعلمين حول الوثائق / الوسائل وتوقيت استغلالها / أسئلة الاشتغال والإنجازات المرتقبة / تقويم مرحلي وإجمالي",
      url: "https://www.argeoweb.com/2019/11/hist-geo-rar.html",
    },
    {
      name: "بناء درس الاجتماعيات بالثانوي: من التصور إلى الأجرأة",
      detail: "مدخل الكفايات، الوضعيات-المشكلة، التدريس بالمجزوءات، الأشكلة، مكونات الجذاذة، وتوازن الحيز الزمني بين الأنشطة",
      url: "http://histoire-geo4.blogspot.com/p/blog-page_13.html",
    },
    {
      name: "دليل مادة الاجتماعيات بالثانوي (وزارة التربية الوطنية)",
      detail: "كفايات وقدرات التاريخ (الموضعة في الزمن، معالجة الوثائق، قراءة الخطاطة، المقال التاريخي) والجغرافيا (النهج الجغرافي، التعبير البياني والكرطوغرافي)",
      url: "https://www.ostad.ma/wp-content/uploads/2023/01/%D8%AF%D9%84%D9%8A%D9%84-%D9%85%D8%A7%D8%AF%D8%A9-%D8%A7%D9%84%D8%A7%D8%AC%D8%AA%D9%85%D8%A7%D8%B9%D9%8A%D8%A7%D8%AA-%D8%A8%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%88%D9%8A-670.pdf",
    },
    {
      name: "الأطر المرجعية للامتحانات — الاشتغال بالوثائق",
      detail: "خطوات معالجة الوثيقة (النوعية، المصدر، التأريخ، الإطار الزمني والمكاني، استخراج المعطيات، ربط العلاقات، تركيب الفكرة الأساس)",
      url: "https://elouaazikigh.blogspot.com/search/label/%D8%A7%D9%84%D8%A7%D9%85%D8%AA%D8%AD%D8%A7%D9%86%D8%A7%D8%AA%20%D8%A7%D9%84%D9%88%D8%B7%D9%86%D9%8A%D8%A9",
    },
    {
      name: "تدريس الجغرافيا بالسلك الثانوي التأهيلي",
      detail: "الكفاية الجغرافية: تعبئة موارد نظرية ومنهجية ومواقف لمعالجة مشكلة جغرافية؛ خطوات المنهج العلمي الجغرافي",
      url: "https://josooor.com/pdfs/twentytwo_one/first/69.pdf",
    },
    {
      name: "الكتاب المدرسي المعتمد",
      detail: `${BOOK_TC} — الجذع المشترك العلمي والتكنولوجي (ومعه «مسار التاريخ والجغرافيا» في وثائق الأستاذ)`,
      url: "https://www.argeoweb.com/2021/10/blog-post_21.html",
    },
  ],
  provenance: {
    content: "المضامين منقولة من دروس الموقع المنشورة: لا تُؤلَّف هنا أي معلومة تاريخية أو جغرافية",
    didactics: "الصياغة الديداكتيكية (مراحل، تدبير، دعامات، كفايات، مهارات، قيم، حيز زمني) وفق مرجعية المادة الرسمية",
    originals: "جذاذات الأستاذ الأصلية وملفاته تبقى مرجع القسم: قسم «الجذاذات» ومكتبة الملفات",
  },
};

/* ------------------------------------------------------------------ */
/* تركيب الجذاذات                                                      */
/* ------------------------------------------------------------------ */
function buildOne(slot: JadadaSlot, index: number): PreparedFiche | null {
  const key = slot.lessonKey;
  const lesson = key ? LESSON_CONTENT[key] : undefined;
  if (!key || !lesson) return null;

  const subject = slot.subject;
  const unitLessons = TC_SCI_SLOTS.filter((s) => s.unitId === slot.unitId).map((s) => s.title);
  const ficheOfSlot = FICHES_PEDAGOGIQUES.find((f) => f.id === slot.id);
  const originalFiles = ficheOfSlot?.files ?? [];
  const originalNames = originalFiles.map((f) => f.name);
  const folders = Array.from(new Set(originalFiles.map((f) => f.folder)));
  const book = folders.some((f) => f.startsWith("مسار")) ? `${BOOK_TC} / مسار التاريخ والجغرافيا` : BOOK_TC;
  const sessionsCount = ficheOfSlot?.sessionsCount ?? null;
  const totalMinutes = (sessionsCount ?? 2) * MINUTES_PER_SESSION;
  const duration = sessionsCount
    ? `${sessionsCount} حصص × ${MINUTES_PER_SESSION} دقيقة (عدد الحصص كما ورد في وثيقة الأستاذ)`
    : `حصتان × ${MINUTES_PER_SESSION} دقيقة (توزيع مقترح — لم يرد تحديد في الوثيقة الأصلية)`;

  const prev = index > 0 ? TC_SCI_SLOTS[index - 1] : undefined;
  const prevSameSubject = prev && prev.subject === subject ? prev : undefined;

  const introQuestions = [
    prevSameSubject
      ? `تذكير بمكتسبات الدرس السابق: أبرز ما خلصنا إليه في «${prevSameSubject.title}»؟`
      : `انطلاقًا من عنوان الوحدة «${slot.unitTitle}»: ما القضايا الكبرى التي تتوقع أن تعالجها؟`,
    `قراءة أولية لعنوان الدرس «${slot.title}»: ما المفاهيم التي يوحي بها؟ وما الأسئلة التي يطرحها؟`,
    `الإشكالية الموجّهة للدرس: ${lesson.coreQuestion}`,
  ];

  /* ---- المقاطع: مقطع لكل محور من محاور الدرس المنشور ---- */
  const weights = [10, ...lesson.sections.map((s) => Math.max(12, s.blocks.length * 6)), 14, 16];
  const minutes = timings(weights, totalMinutes);
  const segments: JadadaSegment[] = [];
  const stageTiming: PreparedStageTiming[] = [];

  segments.push({
    phase: `وضعية الانطلاق والتمهيد (${minutes[0]} دقيقة)`,
    objectives: [
      "تعبئة المكتسبات السابقة وربطها بموضوع الدرس الجديد",
      "قراءة عنوان الدرس قراءة موجهة واستخراج مفاهيمه المفتاحية",
      "صياغة فرضيات وأسئلة أولى وتقديم الدرس في نسق إشكالي",
    ],
    management: [
      "الأستاذ(ة): يطرح أسئلة المراجعة ويربطها بتقديم الدرس في نسق إشكالي",
      "الأستاذ(ة): يكتب عنوان الدرس والإشكالية على السبورة ويوزع الوثائق",
      "المتعلم(ة): يجيب عن أسئلة المراجعة ويقترح فرضيات أولية",
      "المتعلم(ة): يقرأ الإشكالية ويحدد المطلوب منها",
    ],
    supports: [
      prevSameSubject ? `خلاصات الدرس السابق: «${prevSameSubject.title}»` : `الوحدة: «${slot.unitTitle}»`,
      `الكتاب المدرسي: ${book} (تقديم الدرس)`,
      "السبورة ودفاتر المتعلمين",
    ],
    content: [`وضعية الانطلاق (من درس الموقع): ${truncate(lesson.intro, 520)}`, `الإشكالية: ${lesson.coreQuestion}`, ...introQuestions.map((q) => `سؤال: ${q}`)],
  });
  stageTiming.push({ phase: "وضعية الانطلاق والتمهيد", minutes: minutes[0] });

  lesson.sections.forEach((sec, i) => {
    const title = cleanSectionTitle(sec.title);
    segments.push({
      phase: `المقطع ${i + 1}: ${title} (${minutes[i + 1]} دقيقة)`,
      objectives: sectionObjectives(sec, subject),
      management: sectionManagement(sec, subject),
      supports: sectionSupports(sec, book, i === 0 ? originalNames.slice(0, 3) : []),
      content: sectionContent(sec),
    });
    stageTiming.push({ phase: `المقطع ${i + 1}: ${title}`, minutes: minutes[i + 1] });
  });

  const tail = lesson.sections.length + 1;
  segments.push({
    phase: `التركيب والخلاصة (${minutes[tail]} دقيقة)`,
    objectives: ["تجميع الخلاصات الجزئية في بناء تركيبي منسجم يجيب عن الإشكالية", "إنجاز خطاطة أو جدول تركيبي للدرس", "ضبط المفاهيم والمصطلحات الموظفة"],
    management: [
      "المتعلم(ة): ينجز الخطاطة أو الفقرة التركيبية فرديًا ثم جماعيًا",
      "الأستاذ(ة): يوجه التركيب ويقارن بين الإنتاجات ويصحح",
      "الأستاذ(ة): يثبت الخلاصة العامة ويعيد صياغة الإشكالية وجوابها",
    ],
    supports: lesson.schema ? ["الخطاطة التركيبية للدرس (من درس الموقع)", "السبورة"] : ["السبورة ودفاتر المتعلمين", `الكتاب المدرسي: ${book}`],
    content: [
      ...lesson.summary.map((s) => `خلاصة: ${truncate(s, 420)}`),
      ...(lesson.schema ? [`الخطاطة التركيبية — ${lesson.schema.title ?? "خطاطة الدرس"}`, ...lesson.schema.rows.map((r) => `${r.label} ⟵ ${truncate(r.value, 200)}`)] : []),
      ...lesson.glossary.map((g) => `مفهوم: ${g.term} — ${truncate(g.def, 260)}`),
    ],
  });
  stageTiming.push({ phase: "التركيب والخلاصة", minutes: minutes[tail] });

  segments.push({
    phase: `التقويم الإجمالي والدعم (${minutes[tail + 1]} دقيقة)`,
    objectives: ["التحقق من مدى تحقق الكفايات والقدرات المستهدفة", "تدريب المتعلمين على وضعية تقويمية مشابهة للوضعيات الاختبارية", "رصد التعثرات وبرمجة أنشطة الدعم"],
    management: [
      "الأستاذ(ة): يقدم أسئلة التقويم الإجمالي ويترك زمنًا كافيًا للإنجاز",
      "المتعلم(ة): ينجز الإجابات فرديًا ثم تُناقَش جماعيًا",
      "الأستاذ(ة): يصحح ويثمّن الإجابات ويحدد حاجات الدعم",
    ],
    supports: ["أسئلة التقويم المرفقة بدرس الموقع مع عناصر الإجابة", `وثائق وأنشطة الكتاب المدرسي: ${book}`, "السبورة"],
    content: [
      ...lesson.quiz.map((q, i) => `س${i + 1}: ${q.q} — الإجابة الصحيحة: ${q.options[q.answer]} (التعليل: ${truncate(q.why, 220)})`),
      ...lesson.examTips.map((t) => `توجيه منهجي للامتحان: ${truncate(t, 260)}`),
      ...(lesson.application
        ? [`تطبيق: ${lesson.application.title} (${lesson.application.duration}) — ${truncate(lesson.application.prompt, 320)}`, ...lesson.application.guide.map((g) => `خطوة منهجية: ${g}`)]
        : []),
    ],
  });
  stageTiming.push({ phase: "التقويم الإجمالي والدعم", minutes: minutes[tail + 1] });

  const kifayaMarkaziya = SUBJECT_KIFAYA[subject];
  const kifayaMihwariya = unitKifaya(subject, slot.unitTitle, unitLessons);

  const fiche: Jadada = {
    id: slot.id,
    level: "tc",
    track: TRACK,
    subject,
    unitId: slot.unitId,
    unitTitle: slot.unitTitle,
    cycle: slot.cycle,
    module: slot.module,
    number: slot.number,
    title: slot.title,
    status: "prepared",
    sourceNote: `جذاذة مُعدَّة (لا تُغني عن جذاذتك الأصلية): مضامينها منقولة من درس الموقع المنشور «${lesson.title}» (أهدافه، إشكاليته، محاوره، مفاهيمه، كرونولوجيته، خلاصاته وتقويماته${lesson.docs?.length ? "، ووثائقه بأسئلتها وأجوبتها" : ""}${lesson.application ? "، وتطبيقه المنهجي" : ""})، وصياغتها الديداكتيكية (الكفايات، المراحل، التدبير، الدعامات، الحيز الزمني) وفق التوجيهات التربوية والبرامج الخاصة بتدريس مادة الاجتماعيات بالتعليم الثانوي التأهيلي وديداكتيك المادة.${originalFiles.length ? ` ولها ${originalFiles.length} ملفًا أصليًا في مكتبة الجذاذات.` : ""}`,
    duration,
    book,
    problematic: lesson.coreQuestion,
    concepts: lesson.glossary.map((g) => `${g.term}: ${g.def}`),
    kifayaMarkaziya,
    kifayaMihwariya,
    goals: { cognitive: lesson.objectives, skills: SUBJECT_SKILLS[subject], affective: TARGET_VALUES },
    segments,
    taqwimIjmali: [
      ...lesson.quiz.map((q, i) => `${i + 1}) ${q.q} — الجواب: ${q.options[q.answer]}`),
      ...(lesson.application ? [`وضعية تطبيقية: ${lesson.application.title} — ${lesson.application.prompt}`] : []),
      `توجيه منهجي: ${lesson.examTips[0] ?? "توظيف وثائق الدرس في كل إجابة"}`,
    ],
    conclusion: lesson.summary,
    references: [
      `درس الموقع (مصدر المضامين): «${lesson.title}» — الرابط الداخلي #/lesson/${key}`,
      "التوجيهات التربوية والبرامج الخاصة بتدريس مادة الاجتماعيات بسلك التعليم الثانوي التأهيلي (منهاج المادة، مدخل الكفايات، عناصر الجذاذة)",
      "ديداكتيك المادة: النهج التاريخي (الموضعة الزمنية والمجالية، معالجة الوثائق، التركيب) والنهج الجغرافي (الوصف، التفسير، التعميم) وأدوات التعبير الجغرافي",
      `الكتاب المدرسي المعتمد: ${book} — الجذع المشترك العلمي والتكنولوجي`,
      ...(originalFiles.length ? [`وثائق الأستاذ الأصلية المرتبطة بالدرس: ${originalNames.join("، ")}`] : []),
      `${TEACHER_NAME} — ${TEACHER_SCHOOL}`,
    ],
    lessonKey: key,
  };

  const extra: PreparedExtra = {
    id: slot.id,
    lessonKey: key,
    lessonTitle: lesson.title,
    lessonUrl: `#/lesson/${key}`,
    libraryUrl: `#/jadadat/joth3-mochtrak-scientifique/${slot.id}`,
    originalFicheUrl: `#/jadadat/tc/${slot.id}`,
    subject,
    cycle: slot.cycle,
    unitId: slot.unitId,
    unitTitle: slot.unitTitle,
    module: slot.module,
    lessonNumber: slot.number,
    tag: slot.tag ?? null,
    title: slot.title,
    book,
    duration,
    sessionsCount,
    sessionsSource: ficheOfSlot?.sessionsSource ?? null,
    stageTiming,
    totalMinutes,
    introQuestions,
    kifayaMarkaziya,
    kifayaMihwariya,
    intro: lesson.intro,
    objectives: lesson.objectives,
    skills: SUBJECT_SKILLS[subject],
    values: TARGET_VALUES,
    glossary: lesson.glossary,
    timeline: lesson.timeline ?? [],
    summary: lesson.summary,
    examTips: lesson.examTips,
    quiz: lesson.quiz,
    docs: lesson.docs ?? [],
    application: lesson.application ?? null,
    schema: lesson.schema ?? null,
    sections: lesson.sections.map((s) => ({ title: cleanSectionTitle(s.title), blocks: s.blocks.length })),
    originalFiles: originalFiles.map((f) => ({ name: f.name, url: f.url, kind: f.kind, folder: f.folder, pages: f.pages })),
    keywords: [
      slot.title,
      subject,
      slot.cycle,
      slot.unitTitle,
      `الجذاذة ${slot.number}`,
      `الدرس ${Number(slot.number)}`,
      LEVEL_LABEL,
      "جذاذة مُعدَّة",
      "التوجيهات التربوية",
      "ديداكتيك المادة",
      book,
      ...lesson.glossary.map((g) => g.term),
    ],
    preparedAt: PREPARED_AT,
  };

  return { fiche, extra, lesson, slot };
}

let cache: PreparedFiche[] | null = null;

/** كل الجذاذات المُعدَّة (25) — تُركَّب مرة واحدة ثم تُخزَّن */
export function getPreparedCatalog(): PreparedFiche[] {
  if (cache) return cache;
  const built: PreparedFiche[] = [];
  TC_SCI_SLOTS.forEach((slot, i) => {
    const p = buildOne(slot, i);
    if (p) built.push(p);
  });
  cache = built;
  return built;
}

export function getPreparedFiche(id: string): PreparedFiche | undefined {
  return getPreparedCatalog().find((p) => p.fiche.id === id);
}

/** الوحدات مجمَّعة للعرض (المادة ← الدورة ← الوحدة) */
export function getPreparedUnits() {
  const map = new Map<string, { subject: string; cycle: string; unitId: string; unitTitle: string; module: string; count: number }>();
  for (const p of getPreparedCatalog()) {
    const k = `${p.fiche.subject}|${p.fiche.cycle}|${p.fiche.unitId}`;
    if (!map.has(k)) map.set(k, { subject: p.fiche.subject, cycle: p.fiche.cycle, unitId: p.fiche.unitId, unitTitle: p.fiche.unitTitle, module: p.fiche.module, count: 0 });
    map.get(k)!.count++;
  }
  return Array.from(map.values());
}

export function getPreparedStats() {
  const list = getPreparedCatalog();
  return {
    total: list.length,
    history: list.filter((p) => p.fiche.subject === "التاريخ").length,
    geography: list.filter((p) => p.fiche.subject === "الجغرافيا").length,
    units: getPreparedUnits().length,
    segments: list.reduce((s, p) => s + p.fiche.segments.length, 0),
    concepts: list.reduce((s, p) => s + p.extra.glossary.length, 0),
    quiz: list.reduce((s, p) => s + p.extra.quiz.length, 0),
    withPdf: list.filter((p) => p.extra.originalFiles.some((f) => f.kind === "pdf")).length,
    withOriginalFiles: list.filter((p) => p.extra.originalFiles.length > 0).length,
    withDocs: list.filter((p) => p.extra.docs.length > 0).length,
    withApplication: list.filter((p) => p.extra.application).length,
    withSchema: list.filter((p) => p.extra.schema).length,
    withSessions: list.filter((p) => p.extra.sessionsCount).length,
    words: list.reduce((s, p) => s + JSON.stringify(p.fiche).split(/\s+/).length, 0),
  };
}

/* ------------------------------------------------------------------ */
/* وثيقة الطباعة/التحميل (نفس هوية وثائق القسم: بني/بيج)                */
/* ------------------------------------------------------------------ */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function preparedToHtml(p: PreparedFiche): string {
  const { fiche, extra } = p;
  const rows = fiche.segments
    .map(
      (s) =>
        `<tr><td class="first">${esc(s.phase)}</td><td>${s.objectives.map(esc).join("<br />")}</td><td>${s.management.map(esc).join("<br />")}</td><td class="prod">${s.supports.map(esc).join("<br />")}</td><td>${s.content.map(esc).join("<br />")}</td></tr>`,
    )
    .join("\n");
  const li = (arr: string[]) => arr.map((x) => `<p class="pdfline">${esc(x)}</p>`).join("");
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8" /><title>${esc(PREPARED_META.title)} — ${esc(fiche.title)}</title><style>${DOC_CSS}</style></head>
<body><div class="sheet">
<div class="masthead"><h1>${esc(PREPARED_META.title)}</h1><p>${esc(PREPARED_META.subtitle)} · ${esc(LEVEL_LABEL)} — ${esc(fiche.subject)}<br />${esc(PREPARED_META.authorLabel)} — ${esc(TEACHER_SCHOOL)}</p></div>
<div class="pad">
<div class="titlerow"><span class="num">${esc(fiche.number)}</span><span class="titlebox">الجذاذة ${esc(fiche.number)} — ${esc(fiche.subject)} · ${esc(fiche.cycle)}: ${esc(fiche.title)}</span></div>
<table><tbody>
<tr class="head"><th>المستوى</th><th>المادة</th><th>الدورة</th><th>المجزوءة / الوحدة</th><th>الغلاف الزمني</th><th>الكتاب المعتمد</th></tr>
<tr><td>${esc(LEVEL_LABEL)} (${esc(fiche.track)})</td><td>${esc(fiche.subject)}</td><td>${esc(fiche.cycle)}</td><td>${esc(fiche.module)} — ${esc(fiche.unitTitle)}</td><td>${esc(fiche.duration)}</td><td>${esc(fiche.book)}</td></tr>
</tbody></table>
<div class="produit"><h2>الكفايات والأهداف</h2>
<p class="pdfline"><strong>الكفاية المركزية/المجالية:</strong> ${esc(fiche.kifayaMarkaziya)}</p>
<p class="pdfline"><strong>الكفاية المحورية للوحدة:</strong> ${esc(fiche.kifayaMihwariya)}</p>
<p class="pdfline"><strong>الأهداف المعرفية (من درس الموقع):</strong></p>${li(fiche.goals.cognitive)}
<p class="pdfline"><strong>الأهداف المنهجية/المهارية (مرجعية المادة):</strong></p>${li(fiche.goals.skills)}
<p class="pdfline"><strong>القيم المستهدفة:</strong></p>${li(fiche.goals.affective)}
</div>
${fiche.problematic ? `<div class="produit"><h2>الإشكالية والمفاهيم</h2><p class="pdfline"><strong>الإشكالية:</strong> ${esc(fiche.problematic)}</p>${li((fiche.concepts ?? []).map((c) => `مفهوم — ${c}`))}</div>` : ""}
<table><tbody>
<tr class="head"><th>مراحل إنجاز الدرس</th><th>أهداف التعلم المرتبطة بالنشاط</th><th>التدبير الديداكتيكي (أنشطة الأستاذ والمتعلم)</th><th>الدعامات الديداكتيكية</th><th>المتن (مضامين من درس الموقع)</th></tr>
${rows}
<tr><td class="first">تقويم إجمالي</td><td colspan="4">${fiche.taqwimIjmali.map(esc).join("<br />")}</td></tr>
</tbody></table>
${extra.timeline.length ? `<div class="produit"><h2>الضبط الزمني (كرونولوجيا الدرس)</h2>${li(extra.timeline.map((t) => `${t.date} — ${t.event}`))}</div>` : ""}
${fiche.conclusion?.length ? `<div class="produit"><h2>الخلاصة والاستنتاج</h2>${li(fiche.conclusion)}</div>` : ""}
${extra.docs.length ? `<div class="produit"><h2>وثائق الاشتغال بأسئلتها وعناصر إجابتها</h2>${extra.docs.map((d) => `<p class="pdfline"><strong>${esc(d.label)}</strong></p><p class="pdfline">${esc(d.text)}</p>${li(d.questions.map((q) => `${q.q} (${q.pts} ن) — الجواب: ${q.answer}`))}`).join("")}</div>` : ""}
${extra.application ? `<div class="produit"><h2>وضعية تطبيقية منهجية: ${esc(extra.application.title)} (${esc(extra.application.duration)})</h2><p class="pdfline">${esc(extra.application.prompt)}</p>${li(extra.application.guide.map((g) => `خطوة: ${g}`))}${li(extra.application.model.map((m) => `عنصر من الإنتاج المنتظر: ${m}`))}</div>` : ""}
<div class="sign"><span>${esc(PREPARED_META.authorLabel)} — ${esc(TEACHER_SCHOOL)}</span><span>${esc(fiche.duration)} · ${esc(fiche.book)}</span></div>
<p class="src">${esc(fiche.sourceNote ?? "")}</p>
${fiche.references?.length ? `<p class="src">المراجع: ${fiche.references.map(esc).join(" · ")}</p>` : ""}
</div></div></body></html>`;
}

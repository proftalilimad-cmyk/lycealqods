import type {
  CurriculumLevel,
  CurriculumUnit,
  LessonBlock,
  LessonContent,
  LessonDoc,
  LessonSection,
} from "../types";
import { LEVELS } from "../data/curriculum";
import { lessonAliasOf, resolveLesson } from "../data/lessonContent";

/* ============================================================
   مؤلِّف الجذاذات — قسم «الجذاذات»
   ------------------------------------------------------------
   كل جذاذة تُبنى حصريًا من محتوى الدرس الموجود فعلًا في الموقع
   (data/lessonContent): أهدافه، تمهيده، سؤاله المحوري، مقاطعه،
   وثائقه وأسئلة تحليلها، كرونولوجيته، خلاصته، خطاطته، وضعيته
   التطبيقية، تقويمه بأجوبته وتعليلاتها، شخصياته وأماكنه، ومراجعه.

   ما يُضاف هنا هو «الغلاف الديداكتيكي» فقط: الكفايات، الأهداف
   المهارية والقيمية، تدبير الأنشطة، توزيع الحيز الزمني، وترتيب
   المراحل (انطلاق ← مقاطع ← تركيب ← تقويم إجمالي ← امتداد)، وهو
   مستمد من التوجيهات التربوية الرسمية لتنظيم تدريس الاجتماعيات
   بالسلك الثانوي التأهيلي، ومصرَّح به في ذيل كل جذاذة.
   ============================================================ */

export const JADADAT_TEACHER = "الأستاذ عماد طليل";
export const JADADAT_SCHOOL = "ثانوية القدس، القنيطرة";
export const JADADAT_AUTHOR_LABEL = `إعداد وإنجاز: ${JADADAT_TEACHER}`;
export const JADADAT_SIGN = `إنجاز: ${JADADAT_TEACHER} — ${JADADAT_SCHOOL}`;

export const JADADAT_SOURCE_NOTE =
  "مضامين هذه الجذاذة مستخرجة من درس الموقع نفسه (الأهداف، التمهيد، السؤال المحوري، المقاطع، الوثائق، الكرونولوجيا، الخلاصة، الخطاطة، الوضعية التطبيقية، التقويم بأجوبته وتعليلاته، المراجع)، " +
  "أما الغلاف الديداكتيكي (الكفايات، الأهداف المهارية والقيمية، تدبير الأنشطة، توزيع الحيز الزمني، ترتيب المراحل) فقد صيغ وفق التوجيهات التربوية الرسمية لتنظيم تدريس مواد الاجتماعيات بالسلك الثانوي التأهيلي.";

/* ------------------------------------------------------------------ */
/* ألوان الموقع (نفس رموز index.css)                                    */
/* ------------------------------------------------------------------ */

export const SITE_COLORS = {
  brand500: "#18906b",
  brand600: "#0f7c5b",
  brand700: "#0c6147",
  brand900: "#083d2d",
  brandSoft: "#e7f2ed",
  brandSofter: "#f4faf7",
  gold300: "#f0cd8a",
  gold400: "#e6b457",
  gold500: "#d99e37",
  goldSoft: "#fbf3e2",
  goldInk: "#7a5a17",
  paper: "#f7f5ef",
  ink: "#0b1d17",
  inkSoft: "#3d554c",
  line: "#d7e5dd",
} as const;

/* ------------------------------------------------------------------ */
/* الغلاف الديداكتيكي: كفايات ومهارات وقيم                             */
/* ------------------------------------------------------------------ */

const SUBJECT_LABEL: Record<string, string> = {
  history: "التاريخ",
  geography: "الجغرافيا",
  citizenship: "التربية على المواطنة",
};

const SUBJECT_KIFAYA: Record<string, string[]> = {
  history: [
    "الموضعة في الزمن: تأطير الأحداث والظواهر التاريخية زمنيًا وربطها بسياقها.",
    "معالجة الوثائق التاريخية والآثار: نقدها، استخراج معطياتها، واستثمارها في بناء المعرفة.",
    "تحليل الخرائط التاريخية وقراءة الخطاطات وتصاميم المدن.",
    "دراسة الشخصيات التاريخية (البيوغرافيا) وإبراز أدوارها.",
    "كتابة المقال التاريخي وفق تصميم محكم (مقدمة — عرض — خاتمة).",
    "اكتساب المفاهيم التاريخية واستعمالها في سياقها.",
  ],
  geography: [
    "إعمال النهج الجغرافي: الوصف، ثم التفسير، ثم التعميم.",
    "استعمال وسائل التعبير الجغرافي: الخرائط، المبيانات، الجداول، والخطاطات.",
    "دراسة الوثائق الجغرافية: النصوص، المبيانات، الخرائط التحليلية والتركيبية، الصور الأرضية والجوية.",
    "التربية المجالية واتخاذ مواقف مسؤولة تجاه المجال وقضاياه.",
  ],
  citizenship: [
    "ترسيخ قيم المواطنة وحقوق الإنسان والتعبير عن موقف مسؤول إزاء قضية مجتمعية.",
  ],
};

const SUBJECT_SKILLS: Record<string, string[]> = {
  history: [
    "تأطير الحدث تاريخيًا (الزمن، المكان، السياق) وصياغة تساؤلات حوله.",
    "تحليل وثيقة تاريخية: تحديد نوعيتها وتاريخها ومصدرها وصاحبها، استخراج المعطيات، ربط العلاقات، تركيب الفكرة الأساس، ثم المناقشة.",
    "بناء تصميم للمقال التاريخي (سببي، كرونولوجي، موضوعاتي أو مقارن) وتحرير مقدمة تتضمن الزمن والمكان والسياق والتساؤلات.",
    "قراءة خريطة تاريخية وخطاطة تركيبية، وتحويل المعطيات إلى تعبير خريطي.",
  ],
  geography: [
    "الوصف الجغرافي: تحديد الخصائص، إبراز التطور، والمقارنة بين المجالات.",
    "التفسير الجغرافي: استخراج العوامل، تصنيفها، وربط العلاقات بينها.",
    "التعميم: استخلاص قاعدة عامة وصياغتها في فقرة مركّبة.",
    "بناء تعبير مبياني أو خريطي من جدول معطيات، وقراءة وثيقة جغرافية قراءة منهجية.",
  ],
  citizenship: ["صياغة موقف معلل من قضية مجتمعية والانخراط في حوار منظم داخل القسم."],
};

const TARGET_VALUES = [
  "الاعتزاز بالهوية الوطنية والحضارية مع الانفتاح على القيم الكونية.",
  "الروح النقدية والموضوعية والأمانة العلمية في نقل المعطيات وتوثيقها.",
  "التربية على المواطنة والمسؤولية تجاه المجال والمجتمع.",
  "العمل الجماعي واحترام الرأي الآخر أثناء مناقشة الوثائق.",
];

const MANAGEMENT_COMMON = [
  "تقديم الوثائق وطرح أسئلة الاشتغال، ثم مناقشة جماعية وتجميع الإنجازات على السبورة.",
  "اشتغال ثنائي أو في مجموعات على الوثائق، ثم عرض النتائج ومناقشتها وتصحيحها.",
  "حوار موجه بأسئلة متدرجة، مع تدوين الخلاصات الجزئية (الأثر الكتابي) على الدفاتر.",
];

const BASE_SUPPORTS = ["السبورة ووسائل الكتابة", "دفاتر المتعلمين", "الكتاب المدرسي"];

/** الكتب المدرسية المؤكَّدة من ملفات الأستاذ ومن صفحات الكتب المرفقة بالدروس */
const BOOK_EVIDENCE: Record<string, string> = {
  "tc-sci": "منار التاريخ والجغرافيا",
  "tc-arts": "مسار التاريخ والجغرافيا",
  "bac1-sci": "مورد التاريخ والجغرافيا — المسالك العلمية",
  "bac1-exp": "مورد التاريخ والجغرافيا — المسالك العلمية",
};

const DEFAULT_BOOK = "الكتاب المدرسي المقرر";

/* ------------------------------------------------------------------ */
/* أنواع الجذاذة                                                       */
/* ------------------------------------------------------------------ */

export interface JadadaStage {
  name: string;
  duration: string;
  objective: string;
  management: string;
  supports: string[];
  activities: string[];
  questions: string[];
  expected: string[];
  assessment: string[];
}

export interface JadadaDoc {
  label: string;
  text: string;
  questions: { q: string; pts: number; answer: string }[];
}

export interface JadadaQuizItem {
  q: string;
  options: string[];
  answer: string;
  why: string;
}

export interface JadadaFiche {
  key: string;
  levelId: string;
  levelLabel: string;
  levelShort: string;
  branchId: string;
  branchLabel: string;
  subjectId: string;
  subjectLabel: string;
  unitIndex: number;
  unitTitle: string;
  unitTerm?: 1 | 2;
  lessonIndex: number;
  lessonNumber: string;
  title: string;
  /** مسار درس الموقع (للعرض والرابط) */
  lessonPath: string;
  /* بطاقة التعريف */
  duration: string;
  durationMinutes: number;
  durationApprox: boolean;
  book: string;
  program: string;
  programNote: string;
  teacher: string;
  school: string;
  authorLabel: string;
  /* الغلاف الديداكتيكي */
  kifayat: string[];
  unitKifaya: string;
  cognitiveObjectives: string[];
  methodObjectives: string[];
  valueObjectives: string[];
  /* محتوى الدرس */
  intro: string;
  coreQuestion: string;
  concepts: { term: string; def: string }[];
  timeline: { date: string; event: string }[];
  characters: { name: string; role: string }[];
  places: { name: string; why: string }[];
  stages: JadadaStage[];
  /** المحاور الأصلية كاملة كما وردت في قسم الدروس (لضمان عدم اختزال المضمون) */
  sourceSections: { title: string; blocks: LessonBlock[] }[];
  docs: JadadaDoc[];
  schema: { title: string; rows: { label: string; value: string }[] } | null;
  summary: string[];
  examTips: string[];
  quiz: JadadaQuizItem[];
  application: LessonContent["application"] | null;
  bookPage: LessonContent["bookPage"] | null;
  references: { name: string; url: string }[];
  sectionsCount: number;
  /** إن كان محتوى الدرس مشتركًا مع درس آخر (حسب ALIASES في lessonContent) */
  sharedWith: { key: string; title: string } | null;
  sourceNote: string;
  sign: string;
}

export interface JadadaEntry {
  key: string;
  title: string;
  lessonNumber: string;
  levelId: string;
  levelLabel: string;
  levelShort: string;
  branchId: string;
  branchLabel: string;
  subjectId: string;
  subjectLabel: string;
  unitIndex: number;
  unitTitle: string;
  unitTerm?: 1 | 2;
  duration: string;
  durationMinutes: number;
  book: string;
  program: string;
  sectionsCount: number;
  sharedWithKey: string | null;
  hasDocs: boolean;
  hasApplication: boolean;
  hasSchema: boolean;
  lessonPath: string;
}

/* ------------------------------------------------------------------ */
/* أدوات على النصوص                                                    */
/* ------------------------------------------------------------------ */

function cleanTitle(title: string): string {
  return String(title ?? "").replace(/\s+/g, " ").trim();
}

/** أول جملة من نص، بلا استعمال lookbehind (توافقًا مع كل المتصفحات) */
function firstSentence(text: string, max = 140): string {
  const value = cleanTitle(text);
  if (!value) return "";
  const idx = value.search(/[.:؛!?]\s/);
  const first = idx >= 0 ? value.slice(0, idx + 1) : value;
  if (first.length <= max) return first;
  return `${first.slice(0, max).trimEnd()}…`;
}

function unique(items: string[]): string[] {
  return items.filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i);
}

function flattenBlocks(blocks: LessonBlock[]): string[] {
  const out: string[] = [];
  for (const block of blocks) {
    if (block.type === "p") {
      if (block.text.trim()) out.push(block.text.trim());
    } else if (block.type === "ul") {
      if (block.title?.trim()) out.push(block.title.trim());
      for (const item of block.items) if (item.trim()) out.push(item.trim());
    } else if (block.type === "table") {
      out.push(block.head.join(" "));
      for (const row of block.rows) out.push(row.join(" "));
    } else if (block.type === "callout") {
      out.push(`${block.label} ${block.text}`.trim());
    }
  }
  return out;
}

/** الأنشطة والمضامين: مختارات من محتوى المقطع نفسه */
function sectionActivities(section: LessonSection, subjectId: string): string[] {
  const out: string[] = [];
  for (const block of section.blocks) {
    if (block.type === "p" && block.text.trim()) {
      out.push(firstSentence(block.text, 190));
    } else if (block.type === "ul") {
      if (block.title?.trim()) out.push(cleanTitle(block.title));
      out.push(...block.items.filter((i) => i.trim()).slice(0, 4).map((i) => `• ${cleanTitle(i)}`));
    } else if (block.type === "table") {
      out.push(`قراءة الجدول (${block.head.map(cleanTitle).join(" / ")}) واستخراج معطياته`);
    } else if (block.type === "callout") {
      out.push(`${cleanTitle(block.label)}: ${firstSentence(block.text, 150)}`);
    }
  }
  if (!out.length) {
    out.push(subjectId === "geography" ? "وصف الظاهرة المدروسة ثم تفسيرها" : "استخراج المعطيات وبناء الفكرة الأساس");
  }
  return unique(out).slice(0, 8);
}

/** أسئلة الاشتغال: مبنية على مقاطع الدرس وأنواع دعاماته */
function sectionQuestions(section: LessonSection, subjectId: string): string[] {
  const out: string[] = [];
  for (const block of section.blocks) {
    if (block.type === "ul" && block.items.length) {
      out.push(`ما العناصر المكوِّنة لـ«${cleanTitle(block.title ?? section.title)}»؟ وما خصائص كل عنصر؟`);
    } else if (block.type === "table") {
      out.push(`استخرج من الجدول المعطيات المتعلقة بـ«${cleanTitle(block.head[0] ?? section.title)}»، قارنها، ثم استخلص ما تدل عليه.`);
    } else if (block.type === "callout" && block.tone === "def") {
      out.push(`عرّف «${cleanTitle(block.label)}» وبيّن دوره في فهم هذا المحور.`);
    } else if (block.type === "callout") {
      out.push(`ما الدلالة التاريخية/المجالية لـ«${cleanTitle(block.label)}»؟`);
    } else if (block.type === "p") {
      out.push(
        subjectId === "geography"
          ? "صف الظاهرة الواردة في الفقرة، فسّر عواملها، ثم استخلص النتيجة العامة."
          : "حدّد الإطار الزمني والمكاني للحدث، استخرج الفكرة الأساس، ثم ناقشها.",
      );
    }
  }
  return unique(out).slice(0, 4);
}

/** الإنجازات المرتقبة: صياغة مهارية لمحتوى المقطع */
function sectionExpected(section: LessonSection, subjectId: string): string[] {
  const out: string[] = [];
  for (const block of section.blocks) {
    if (block.type === "callout" && block.tone === "def") {
      out.push(`أن يعرّف المتعلم «${cleanTitle(block.label)}» ويستعمله في سياقه.`);
    } else if (block.type === "table") {
      out.push("أن يستخرج المعطيات من الجدول ويربط بينها في خلاصة مركّبة.");
    } else if (block.type === "ul") {
      out.push(`أن يصنّف عناصر «${cleanTitle(block.title ?? section.title)}» ويبرز خصائصها.`);
    } else if (block.type === "p") {
      out.push(
        subjectId === "geography"
          ? `أن يصف الظاهرة ويفسّرها ثم يعمّم النتيجة في فقرة: ${firstSentence(block.text, 70)}`
          : `أن يحرّر فقرة تاريخية منظمة حول: ${firstSentence(block.text, 70)}`,
      );
    }
  }
  if (!out.length) out.push("أن يبني المتعلم خلاصة المحور في فقرة منظمة.");
  return unique(out).slice(0, 4);
}

const SUPPORT_KEYWORDS: { re: RegExp; label: string }[] = [
  { re: /خريط|خرائط|كرطو/, label: "خريطة" },
  { re: /مبيان|مبيانات|منحنى|أعمدة/, label: "مبيان" },
  { re: /جدول|جداول/, label: "جدول معطيات" },
  { re: /نص|نصوص/, label: "نص وثائقي" },
  { re: /صور|صورة|أرضية|جوية/, label: "صورة (أرضية/جوية)" },
  { re: /خطاط|تصميم/, label: "خطاطة/تصميم" },
  { re: /إحصاء|إحصائيات|أرقام|نسبة|نسب/, label: "معطيات إحصائية" },
];

function detectSupports(text: string): string[] {
  return unique(SUPPORT_KEYWORDS.filter((k) => k.re.test(text)).map((k) => k.label));
}

/* ------------------------------------------------------------------ */
/* الحيز الزمني                                                        */
/* ------------------------------------------------------------------ */

export function parseDuration(duration: string): { minutes: number; approximate: boolean } {
  const value = String(duration ?? "");
  let minutes = 0;
  if (/ثلاث/.test(value)) minutes += 165;
  else if (/حصتان|حصتين/.test(value)) minutes += 110;
  else if (/حصة/.test(value)) minutes += 55;
  if (/ونصف/.test(value)) minutes += 25;
  const approximate = /تقريب/.test(value);
  if (!minutes) minutes = 55;
  return { minutes: Math.round(minutes / 5) * 5, approximate };
}

function round5(n: number): number {
  return Math.max(5, Math.round(n / 5) * 5);
}

function distribution(total: number, weights: number[]): number[] {
  if (!weights.length) return [];
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const values = weights.map((w) => round5((total * w) / sum));
  let difference = total - values.reduce((a, b) => a + b, 0);
  let cursor = 0;
  /* الحيز الزمني يعرض بالدقائق المضاعفة لـ5؛ نضبط التقريب حتى يساوي المجموع مدة الدرس. */
  while (difference !== 0 && cursor < values.length * 20) {
    const index = cursor % values.length;
    if (difference > 0) {
      values[index] += 5;
      difference -= 5;
    } else if (values[index] > 5) {
      values[index] -= 5;
      difference += 5;
    }
    cursor += 1;
  }
  return values;
}

function unitKifayaFor(subjectId: string, unitTitle: string): string {
  const u = cleanTitle(unitTitle);
  if (subjectId === "geography") {
    return `إعمال النهج الجغرافي (الوصف، التفسير، التعميم) في دراسة «${u}»، واستعمال أدوات التعبير الجغرافي، والتربية على اتخاذ مواقف مسؤولة تجاه المجال.`;
  }
  if (subjectId === "citizenship") {
    return `استثمار مكتسبات «${u}» في التعبير عن موقف مواطن مسؤول ومعلل.`;
  }
  return `الموضعة في الزمن وتأطير «${u}» في سياقها التاريخي، ومعالجة وثائقها، واكتساب مفاهيمها، وبناء مقال تاريخي حول إشكاليتها.`;
}

/** توزيع الوثائق على المقاطع بحسب ترتيبها (توزيع مقترح) */
function docsForSection(content: LessonContent, index: number): LessonDoc[] {
  const docs = content.docs ?? [];
  if (!docs.length) return [];
  const per = Math.ceil(docs.length / Math.max(1, content.sections.length));
  return docs.slice(index * per, index * per + per);
}

/** تقويم مرحلي لكل مقطع من أسئلة تقويم الدرس */
function quizForSection(content: LessonContent, index: number): string[] {
  const total = Math.max(1, content.sections.length);
  const per = Math.max(1, Math.ceil(content.quiz.length / total));
  return content.quiz.slice(index * per, index * per + per).slice(0, 2).map((q) => q.q);
}

function subjectOfKey(key: string, subjectLabel: string): string {
  const id = key.split(".")[1] ?? "";
  return id === "geography" || id === "citizenship" ? id : subjectLabel === "الجغرافيا" ? "geography" : "history";
}

/* ------------------------------------------------------------------ */
/* بناء الجذاذة                                                        */
/* ------------------------------------------------------------------ */

export function buildJadada(key: string): JadadaFiche | null {
  const resolved = resolveLesson(key);
  if (!resolved) return null;
  const { content, level, branch, subjectLabel, unit } = resolved;
  const subjectId = subjectOfKey(key, subjectLabel);

  const parts = key.split(".");
  const unitIndex = Number(parts[2] ?? 0) || 0;
  const lessonIndex = Number(parts[3] ?? 0) || 0;
  const lessonNumber = `${unitIndex + 1}-${lessonIndex + 1}`;
  const lessonPath = `/lesson/${encodeURIComponent(key)}`;

  const { minutes, approximate } = parseDuration(content.duration);
  const book = content.bookPage?.book?.trim() || BOOK_EVIDENCE[branch.id] || DEFAULT_BOOK;
  const program = branch.program ?? `${subjectLabel} — ${branch.label}`;
  const programNote = branch.programNote ?? branch.note ?? "";

  /* --- توزيع الحيز الزمني على المراحل --- */
  const weights = content.sections.map((s) => Math.max(1, flattenBlocks(s.blocks).join(" ").length));
  const phaseMinutes = distribution(minutes, [0.15, 0.6, 0.15, 0.1]);
  const sectionMinutes = distribution(phaseMinutes[1], weights);

  const stages: JadadaStage[] = [];

  /* 1 — الانطلاق والتمهيد */
  stages.push({
    name: "الانطلاق والتمهيد",
    duration: `${phaseMinutes[0]} دقيقة`,
    objective: `تعبئة المكتسبات السابقة وتقديم الدرس في نسق إشكالي: «${cleanTitle(content.title)}»`,
    management:
      "أسئلة المراجعة لربط الدرس بسابقه، ثم قراءة التمهيد ومناقشته جماعيًا لصياغة الإشكالية وفرضيات العمل.",
    supports: unique([
      ...BASE_SUPPORTS,
      ...(content.bookPage ? [`صفحة الكتاب: ${content.bookPage.book} ص ${content.bookPage.page}`] : []),
      ...(content.timeline.length ? ["شريط كرونولوجي"] : []),
    ]),
    activities: unique([
      content.intro ? firstSentence(content.intro, 250) : "",
      `السؤال المحوري: ${cleanTitle(content.coreQuestion)}`,
      "تدوين فرضيات المتعلمين على السبورة للرجوع إليها عند التركيب.",
    ]),
    questions: unique([cleanTitle(content.coreQuestion)]),
    expected: ["أن يربط المتعلم الدرس بمكتسباته السابقة.", "أن يصوغ الإشكالية ويقترح فرضيات للعمل."],
    assessment: [],
  });

  /* 2 — مقاطع بناء المعرفة */
  content.sections.forEach((section, i) => {
    const title = cleanTitle(section.title);
    const rawText = flattenBlocks(section.blocks).join(" ");
    stages.push({
      name: `المقطع ${i + 1}: ${title}`,
      duration: `${sectionMinutes[i] ?? round5(phaseMinutes[1] / Math.max(1, content.sections.length))} دقيقة`,
      objective: `بناء المعرفة حول: ${title}`,
      management: MANAGEMENT_COMMON[i % MANAGEMENT_COMMON.length],
      supports: unique([book, ...detectSupports(rawText), ...docsForSection(content, i).map((d) => cleanTitle(d.label))]),
      activities: sectionActivities(section, subjectId),
      questions: sectionQuestions(section, subjectId),
      expected: sectionExpected(section, subjectId),
      assessment: quizForSection(content, i),
    });
  });

  /* 3 — التركيب والأثر الكتابي */
  const synthesis = content.sections
    .filter((s) => /خلاص|تركيب|خاتم/i.test(s.title))
    .flatMap((s) => sectionActivities(s, subjectId));
  stages.push({
    name: "التركيب والأثر الكتابي",
    duration: `${phaseMinutes[2]} دقيقة`,
    objective: "تجميع خلاصات المقاطع في أثر كتابي مركّب ومقارنتها بفرضيات الانطلاق",
    management:
      "استثمار خطاطة الدرس إن وُجدت، ثم تحرير الخلاصة على الدفاتر بتصحيح جماعي، والعودة إلى فرضيات الانطلاق للتحقق منها.",
    supports: unique([
      book,
      "السبورة ووسائل الكتابة",
      ...(content.schema ? [`خطاطة: ${cleanTitle(content.schema.title ?? "خطاطة الدرس")}`] : []),
    ]),
    activities: unique([
      ...synthesis.slice(0, 2),
      ...content.summary.slice(0, 4).map((s) => `خلاصة: ${firstSentence(s, 190)}`),
      ...(content.examTips.length ? [`توجيه منهجي: ${firstSentence(content.examTips[0], 160)}`] : []),
    ]),
    questions: [
      "ما الخلاصة العامة التي يمكن تركيبها من مقاطع الدرس؟",
      "هل تأكدت فرضيات الانطلاق؟ وبمَ؟",
    ],
    expected: [
      "أن يحرّر المتعلم خلاصة منظمة (أثر كتابي) في دفتره.",
      "أن يحوّل معطيات الدرس إلى خطاطة أو تصميم.",
    ],
    assessment: [],
  });

  /* 4 — التقويم الإجمالي والدعم */
  stages.push({
    name: "التقويم الإجمالي والدعم",
    duration: `${phaseMinutes[3]} دقيقة`,
    objective: "قياس مدى تحقق الأهداف التعلمية ومعالجة التعثرات",
    management: "إنجاز فردي لأسئلة التقويم ثم تصحيح جماعي؛ فالتصحيح لحظة دعم ومعالجة لا إعادة للدرس.",
    supports: unique(["أسئلة التقويم المرفقة بالدرس", "دفاتر المتعلمين", "السبورة"]),
    activities: content.quiz.slice(0, 4).map((q) => `سؤال: ${cleanTitle(q.q)}`),
    questions: content.quiz.slice(4).map((q) => cleanTitle(q.q)),
    expected: content.quiz
      .slice(0, 3)
      .map((q) => `الجواب المرتقب: ${cleanTitle(q.options[q.answer] ?? "")}`)
      .filter((v) => v !== "الجواب المرتقب: "),
    assessment: content.examTips.slice(0, 2).map((t) => firstSentence(t, 160)),
  });

  /* 5 — الامتداد والوضعية التطبيقية */
  const app = content.application;
  if (app || content.docs?.length) {
    stages.push({
      name: "الامتداد والوضعية التطبيقية",
      duration: app?.duration ? cleanTitle(app.duration) : "في حصة الأنشطة أو خارج الحصة",
      objective: app ? cleanTitle(app.title) : "تطبيق المنهجية على وثائق الدرس",
      management: "اشتغال فردي أو في مجموعات على الوضعية والوثائق، ثم عرض الإنجازات ومناقشتها وتقويمها بشبكة.",
      supports: unique([
        ...(app ? ["نص الوضعية التطبيقية"] : []),
        ...(content.docs ?? []).map((d) => cleanTitle(d.label)),
        book,
      ]),
      activities: unique([
        ...(app ? [firstSentence(app.prompt, 260), ...app.guide.slice(0, 4).map((g) => `خطوة: ${cleanTitle(g)}`)] : []),
        ...(content.docs ?? []).slice(0, 2).map((d) => `${cleanTitle(d.label)}: ${firstSentence(d.text, 160)}`),
      ]),
      questions: unique(app?.guide.slice(0, 3).map(cleanTitle) ?? (content.docs ?? [])[0]?.questions.map((q) => cleanTitle(q.q)) ?? []),
      expected: unique(app?.model.slice(0, 3).map((m) => cleanTitle(m)) ?? ["إنجاز تطبيق يوظف منهجية الدرس."]),
      assessment: [],
    });
  }

  return {
    key,
    levelId: level.id,
    levelLabel: level.label,
    levelShort: level.short,
    branchId: branch.id,
    branchLabel: branch.label,
    subjectId,
    subjectLabel,
    unitIndex,
    unitTitle: unit.title,
    unitTerm: unit.term,
    lessonIndex,
    lessonNumber,
    title: content.title,
    lessonPath,
    duration: content.duration,
    durationMinutes: minutes,
    durationApprox: approximate,
    book,
    program,
    programNote,
    teacher: JADADAT_TEACHER,
    school: JADADAT_SCHOOL,
    authorLabel: JADADAT_AUTHOR_LABEL,
    kifayat: SUBJECT_KIFAYA[subjectId] ?? SUBJECT_KIFAYA.history,
    unitKifaya: unitKifayaFor(subjectId, unit.title),
    cognitiveObjectives: content.objectives.map(cleanTitle).filter(Boolean),
    methodObjectives: SUBJECT_SKILLS[subjectId] ?? SUBJECT_SKILLS.history,
    valueObjectives: TARGET_VALUES,
    intro: cleanTitle(content.intro),
    coreQuestion: cleanTitle(content.coreQuestion),
    concepts: content.glossary.map((g) => ({ term: cleanTitle(g.term), def: cleanTitle(g.def) })),
    timeline: content.timeline.map((t) => ({ date: cleanTitle(t.date), event: cleanTitle(t.event) })),
    characters: (content.characters ?? []).map((x) => ({ name: cleanTitle(x.name), role: cleanTitle(x.role) })),
    places: (content.places ?? []).map((x) => ({ name: cleanTitle(x.name), why: cleanTitle(x.why) })),
    stages,
    sourceSections: content.sections.map((section) => ({ title: section.title, blocks: section.blocks })),
    docs: (content.docs ?? []).map((d) => ({
      label: cleanTitle(d.label),
      text: cleanTitle(d.text),
      questions: d.questions.map((q) => ({ q: cleanTitle(q.q), pts: q.pts, answer: cleanTitle(q.answer) })),
    })),
    schema: content.schema
      ? {
          title: cleanTitle(content.schema.title ?? "خطاطة الدرس"),
          rows: content.schema.rows.map((r) => ({ label: cleanTitle(r.label), value: cleanTitle(r.value) })),
        }
      : null,
    summary: content.summary.map((s) => cleanTitle(s)).filter(Boolean),
    examTips: content.examTips.map((t) => cleanTitle(t)).filter(Boolean),
    quiz: content.quiz.map((q) => ({
      q: cleanTitle(q.q),
      options: q.options.map(cleanTitle),
      answer: cleanTitle(q.options[q.answer] ?? ""),
      why: cleanTitle(q.why),
    })),
    application: app ?? null,
    bookPage: content.bookPage ?? null,
    references: (content.references ?? []).map((r) => ({ name: cleanTitle(r.name), url: r.url })),
    sectionsCount: content.sections.length,
    sharedWith: (() => {
      const alias = lessonAliasOf(key);
      if (!alias) return null;
      return { key: alias.key, title: resolveLesson(alias.key)?.content.title ?? alias.key };
    })(),
    sourceNote: JADADAT_SOURCE_NOTE,
    sign: JADADAT_SIGN,
  };
}

export function getJadada(key: string): JadadaFiche | null {
  if (!key) return null;
  return buildJadada(key);
}

/* ------------------------------------------------------------------ */
/* الفهرس                                                              */
/* ------------------------------------------------------------------ */

let catalogCache: JadadaEntry[] | null = null;

export function getJadadatCatalog(): JadadaEntry[] {
  if (catalogCache) return catalogCache;
  const entries: JadadaEntry[] = [];
  for (const level of LEVELS as CurriculumLevel[]) {
    for (const branch of level.branches) {
      for (const subjectId of Object.keys(branch.units)) {
        const subjectLabel =
          branch.subjects.find((s) => s.id === subjectId)?.label ?? SUBJECT_LABEL[subjectId] ?? subjectId;
        (branch.units[subjectId] as CurriculumUnit[]).forEach((unit, unitIndex) => {
          unit.lessons.forEach((lesson, lessonIndex) => {
            if (lesson.soon) return; // درس غير منشور بعد في قسم الدروس
            const key = `${branch.id}.${subjectId}.${unitIndex}.${lessonIndex}`;
            const resolved = resolveLesson(key);
            if (!resolved?.content) return;
            const c = resolved.content;
            const { minutes } = parseDuration(c.duration);
            entries.push({
              key,
              title: c.title,
              lessonNumber: `${unitIndex + 1}-${lessonIndex + 1}`,
              levelId: level.id,
              levelLabel: level.label,
              levelShort: level.short,
              branchId: branch.id,
              branchLabel: branch.label,
              subjectId,
              subjectLabel,
              unitIndex,
              unitTitle: unit.title,
              unitTerm: unit.term,
              duration: c.duration,
              durationMinutes: minutes,
              book: c.bookPage?.book?.trim() || BOOK_EVIDENCE[branch.id] || DEFAULT_BOOK,
              program: branch.program ?? subjectLabel,
              sectionsCount: c.sections.length,
              sharedWithKey: lessonAliasOf(key)?.key ?? null,
              hasDocs: Boolean(c.docs?.length),
              hasApplication: Boolean(c.application),
              hasSchema: Boolean(c.schema),
              lessonPath: `/lesson/${encodeURIComponent(key)}`,
            });
          });
        });
      }
    }
  }
  catalogCache = entries;
  return entries;
}

export function getJadadatStats() {
  const entries = getJadadatCatalog();
  const byLevel: Record<string, number> = {};
  const bySubject: Record<string, number> = {};
  const byBranch: Record<string, number> = {};
  for (const e of entries) {
    byLevel[e.levelId] = (byLevel[e.levelId] ?? 0) + 1;
    bySubject[e.subjectId] = (bySubject[e.subjectId] ?? 0) + 1;
    byBranch[e.branchId] = (byBranch[e.branchId] ?? 0) + 1;
  }
  return {
    total: entries.length,
    levels: LEVELS.map((l) => ({ id: l.id, label: l.label, short: l.short, count: byLevel[l.id] ?? 0 })).filter(
      (l) => l.count > 0,
    ),
    branches: entries
      .reduce<{ id: string; label: string; levelId: string; count: number }[]>((acc, e) => {
        const found = acc.find((b) => b.id === e.branchId);
        if (found) found.count += 1;
        else acc.push({ id: e.branchId, label: e.branchLabel, levelId: e.levelId, count: 1 });
        return acc;
      }, []),
    subjects: Object.entries(bySubject).map(([id, count]) => ({ id, label: SUBJECT_LABEL[id] ?? id, count })),
    units: unique(entries.map((e) => e.unitTitle)).length,
  };
}

/* ------------------------------------------------------------------ */
/* CSS الجذاذة — بألوان الموقع (نسخة للشاشة ونسخة للطباعة)             */
/* ------------------------------------------------------------------ */

/**
 * ينشئ CSS الجذاذة.
 * @param scope بادئة تُحصر بها القواعد (مثل ".jadada-doc") كي لا تتسرّب إلى باقي الموقع
 * @param withPrint هل تُضاف قواعد الطباعة وصفحة A4 (تُستعمل في الملف المُصدَّر فقط)
 */
export function jadadaCss(scope = "", withPrint = false): string {
  const S = scope ? `${scope.trim()} ` : "";
  const c = SITE_COLORS;
  const rules = `
${S}:where(*){box-sizing:border-box}
${scope === "" ? `body{margin:0;background:${c.paper};color:${c.ink};font-family:"Readex Pro","Cairo","Segoe UI",Tahoma,sans-serif;font-size:14px;line-height:1.85}` : ""}
${S}.sheet{max-width:1000px;margin:0 auto;background:#fff;padding:26px 30px 40px;border-top:8px solid ${c.brand600};color:${c.ink};font-family:"Readex Pro","Cairo","Segoe UI",Tahoma,sans-serif;font-size:14px;line-height:1.85}
${S}.masthead{display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center;border-bottom:2px solid ${c.brandSoft};padding-bottom:12px;margin-bottom:16px}
${S}.masthead .site{font-family:"Cairo","Readex Pro",sans-serif;font-weight:700;font-size:17px;color:${c.brand700}}
${S}.masthead .site span{color:${c.gold500}}
${S}.masthead .meta{font-size:12px;color:${c.inkSoft}}
${S}.eyebrow{display:inline-block;background:${c.brandSoft};color:${c.brand700};border:1px solid ${c.line};border-radius:999px;padding:2px 12px;font-size:12px;font-weight:600}
${S}h1{font-family:"Cairo","Readex Pro",sans-serif;font-size:23px;line-height:1.5;margin:10px 0 4px;color:${c.ink};font-weight:700}
${S}h2{font-family:"Cairo","Readex Pro",sans-serif;font-size:16px;margin:24px 0 8px;padding:6px 12px;background:${c.brand600};color:#fff;border-radius:8px;border-inline-start:6px solid ${c.gold400};font-weight:700}
${S}h3{font-family:"Cairo","Readex Pro",sans-serif;font-size:14.5px;margin:14px 0 6px;color:${c.brand700};border-bottom:1px dashed ${c.line};padding-bottom:3px;font-weight:700}
${S}h4{font-family:"Cairo","Readex Pro",sans-serif;font-size:13.5px;margin:8px 0 4px;color:${c.brand700};font-weight:700}
${S}p{margin:6px 0}
${S}ul{margin:6px 0;padding-inline-start:20px;list-style:disc}
${S}li{margin:3px 0}
${S}table{width:100%;border-collapse:collapse;margin:8px 0;font-size:13px}
${S}th,${S}td{border:1px solid ${c.line};padding:7px 9px;text-align:start;vertical-align:top}
${S}thead th{background:${c.brand700};color:#fff;font-family:"Cairo","Readex Pro",sans-serif;font-weight:600}
${S}tbody tr:nth-child(even){background:${c.brandSofter}}
${S}table.info th{width:26%;background:${c.brandSoft};color:${c.brand700};font-weight:600}
${S}.chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
${S}.chip{background:${c.goldSoft};border:1px solid ${c.gold400};color:${c.goldInk};border-radius:999px;padding:2px 11px;font-size:12px;font-weight:600;display:inline-block}
${S}.callout{background:${c.brandSofter};border:1px solid ${c.line};border-inline-start:5px solid ${c.brand500};border-radius:8px;padding:10px 14px;margin:8px 0}
${S}.callout.gold{background:${c.goldSoft};border-inline-start-color:${c.gold500}}
${S}.q{background:#fff;border:1px solid ${c.line};border-radius:8px;padding:10px 12px;margin:8px 0}
${S}.q .qt{font-weight:700;color:${c.brand700}}
${S}.q .ans{color:${c.brand700};font-weight:600}
${S}.q .why{color:${c.inkSoft};font-size:12.5px}
${S}.note{font-size:12px;color:${c.inkSoft};background:${c.brandSofter};border:1px dashed ${c.line};border-radius:8px;padding:9px 12px;margin-top:12px}
${S}.sign{margin-top:26px;border-top:2px solid ${c.brandSoft};padding-top:12px;display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;font-size:12.5px;color:${c.inkSoft}}
${S}.sign strong{color:${c.brand700}}
${S}.toolbar{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:16px auto;max-width:1000px;padding:0 30px}
${S}.btn{font-family:"Cairo","Readex Pro",sans-serif;font-weight:600;border-radius:999px;padding:7px 18px;border:1px solid ${c.brand600};background:${c.brand600};color:#fff;font-size:13px;cursor:pointer}
${S}.btn.ghost{background:#fff;color:${c.brand700}}
${S}.stage-name{font-weight:700;color:${c.brand700};font-family:"Cairo","Readex Pro",sans-serif}`;

  if (!withPrint) return rules;
  return `${rules}
@media print{
  body{background:#fff}
  .toolbar{display:none!important}
  .sheet{max-width:none;margin:0;padding:0 4mm;border-top-width:4mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  h2,thead th,.chip,.callout{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  table,tr,td,th{page-break-inside:avoid}
  h2,h3{page-break-after:avoid}
  a{color:inherit;text-decoration:none}
}
@page{size:A4;margin:12mm}`;
}

/* ------------------------------------------------------------------ */
/* تصدير HTML (طباعة / تحميل)                                          */
/* ------------------------------------------------------------------ */

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function listHtml(items: string[]): string {
  if (!items.length) return "";
  return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
}

function rowsHtml(rows: { label: string; value: string }[]): string {
  return rows.map((r) => `<tr><th scope="row">${esc(r.label)}</th><td>${esc(r.value)}</td></tr>`).join("");
}

function sourceBlockHtml(block: LessonBlock): string {
  if (block.type === "p") return `<p>${esc(block.text)}</p>`;
  if (block.type === "ul") {
    return `<div class="source-block">${block.title ? `<h4>${esc(block.title)}</h4>` : ""}${listHtml(block.items)}</div>`;
  }
  if (block.type === "table") {
    return `<table><thead><tr>${block.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${block.rows
      .map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>`;
  }
  const tone = block.tone === "warn" ? "gold" : "";
  return `<div class="callout ${tone}"><strong>${esc(block.label)}</strong><p>${esc(block.text)}</p></div>`;
}

function sourceSectionsHtml(sections: { title: string; blocks: LessonBlock[] }[]): string {
  return sections
    .map((section) => `<div class="source-section"><h3>${esc(section.title)}</h3>${section.blocks.map(sourceBlockHtml).join("")}</div>`)
    .join("");
}

/** جسم الجذاذة (يُستعمل في الشاشة وفي الملف المُصدَّر) */
export function jadadaBodyHtml(f: JadadaFiche): string {
  let n = 0;
  const next = () => ++n;

  const stagesHtml = f.stages
    .map(
      (s) => `<tr>
  <td><span class="stage-name">${esc(s.name)}</span><br><span class="chip">${esc(s.duration)}</span></td>
  <td><p>${esc(s.objective)}</p>${listHtml(s.activities)}</td>
  <td>${s.questions.length ? `<p><strong>أسئلة الاشتغال:</strong></p>${listHtml(s.questions)}` : ""}${
        s.expected.length ? `<p><strong>الإنجازات المرتقبة:</strong></p>${listHtml(s.expected)}` : ""
      }${s.assessment.length ? `<p><strong>تقويم مرحلي:</strong></p>${listHtml(s.assessment)}` : ""}</td>
  <td>${esc(s.management)}</td>
  <td>${listHtml(s.supports)}</td>
</tr>`,
    )
    .join("");

  const quizHtml = f.quiz
    .map(
      (q, i) => `<div class="q"><div class="qt">${i + 1}) ${esc(q.q)}</div>
${q.options.length ? `<div><strong>الخيارات:</strong> ${q.options.map((o) => esc(o)).join(" — ")}</div>` : ""}
<div class="ans">الجواب: ${esc(q.answer)}</div>
${q.why ? `<div class="why">التعليل: ${esc(q.why)}</div>` : ""}</div>`,
    )
    .join("");

  const docsHtml = f.docs
    .map(
      (d) => `<div class="callout"><h3>${esc(d.label)}</h3><p>${esc(d.text)}</p>
${
  d.questions.length
    ? `<table><thead><tr><th>السؤال</th><th>النقط</th><th>عناصر الجواب</th></tr></thead><tbody>${d.questions
        .map((q) => `<tr><td>${esc(q.q)}</td><td>${esc(String(q.pts))}</td><td>${esc(q.answer)}</td></tr>`)
        .join("")}</tbody></table>`
    : ""
}</div>`,
    )
    .join("");

  const tableOf = (
    head: [string, string],
    rows: { label: string; value: string }[],
  ): string =>
    `<table><thead><tr><th>${esc(head[0])}</th><th>${esc(head[1])}</th></tr></thead><tbody>${rowsHtml(rows)}</tbody></table>`;

  return `<div class="sheet">
  <div class="masthead">
    <div class="site">ثانوية <span>القدس</span> — القنيطرة · مواد الاجتماعيات</div>
    <div class="meta">${esc(f.authorLabel)}</div>
  </div>

  <span class="eyebrow">جذاذة درس · ${esc(f.subjectLabel)}</span>
  <h1>${esc(f.title)}</h1>
  <div class="chips">
    <span class="chip">${esc(f.levelLabel)} — ${esc(f.branchLabel)}</span>
    <span class="chip">الوحدة ${f.unitIndex + 1}: ${esc(f.unitTitle)}</span>
    <span class="chip">الدرس رقم ${esc(f.lessonNumber)}</span>
    <span class="chip">الحيز الزمني: ${esc(f.duration)}</span>
  </div>

  <h2>${next()}. بطاقة تعريف الدرس</h2>
  <table class="info"><tbody>${rowsHtml([
    { label: "المستوى والشعبة", value: `${f.levelLabel} — ${f.branchLabel}` },
    { label: "المادة", value: f.subjectLabel },
    {
      label: "الوحدة / المجزوءة",
      value: `${f.unitIndex + 1}. ${f.unitTitle}${f.unitTerm ? ` (الدورة ${f.unitTerm === 1 ? "الأولى" : "الثانية"})` : ""}`,
    },
    { label: "عنوان الدرس", value: `${f.lessonNumber} — ${f.title}` },
    {
      label: "الحيز الزمني",
      value: `${f.duration} ≈ ${f.durationMinutes} دقيقة${f.durationApprox ? " (توزيع مقترح)" : ""}`,
    },
    { label: "الكتاب المدرسي", value: f.book },
    { label: "المنهاج الرسمي", value: f.program },
    ...(f.sharedWith
      ? [{ label: "مصدر المحتوى", value: `محتوى مشترك مع الدرس: «${f.sharedWith.title}» (${f.sharedWith.key}) — حسب برمجة المسالك المتقاربة` }]
      : []),
    ...(f.programNote ? [{ label: "ملاحظة المنهاج", value: f.programNote }] : []),
    { label: "إعداد وإنجاز", value: `${f.teacher} — ${f.school}` },
  ])}</tbody></table>

  <h2>${next()}. الكفايات المستهدفة</h2>
  <div class="callout gold"><strong>كفاية الوحدة:</strong> ${esc(f.unitKifaya)}</div>
  ${listHtml(f.kifayat)}

  <h2>${next()}. الأهداف التعلمية</h2>
  <h3>أهداف معرفية (من مضامين الدرس)</h3>
  ${listHtml(f.cognitiveObjectives)}
  <h3>أهداف مهارية ومنهجية</h3>
  ${listHtml(f.methodObjectives)}
  <h3>أهداف قيمية ووجدانية</h3>
  ${listHtml(f.valueObjectives)}

  <h2>${next()}. الإشكالية والمفاهيم</h2>
  ${f.intro ? `<p><strong>التمهيد:</strong> ${esc(f.intro)}</p>` : ""}
  <div class="callout gold"><strong>السؤال المحوري / الإشكالية:</strong> ${esc(f.coreQuestion)}</div>
  ${f.concepts.length ? `<h3>المفاهيم الأساس</h3>${tableOf(["المفهوم", "تعريفه"], f.concepts.map((x) => ({ label: x.term, value: x.def })))}` : ""}
  ${f.timeline.length ? `<h3>الكرونولوجيا</h3>${tableOf(["التاريخ", "الحدث"], f.timeline.map((x) => ({ label: x.date, value: x.event })))}` : ""}
  ${f.characters.length ? `<h3>شخصيات الدرس</h3>${tableOf(["الشخصية", "دورها"], f.characters.map((x) => ({ label: x.name, value: x.role })))}` : ""}
  ${f.places.length ? `<h3>أماكن ومجالات</h3>${tableOf(["المكان", "دلالته"], f.places.map((x) => ({ label: x.name, value: x.why })))}` : ""}

  <h2>${next()}. مجرى الحصة: المراحل والأنشطة</h2>
  <table>
    <thead><tr>
      <th style="width:16%">المرحلة والحيز الزمني</th>
      <th style="width:26%">الأنشطة والمضامين</th>
      <th style="width:24%">أسئلة الاشتغال والإنجازات المرتقبة</th>
      <th style="width:18%">التدبير الديداكتيكي</th>
      <th style="width:16%">الدعامات والوسائل</th>
    </tr></thead>
    <tbody>${stagesHtml}</tbody>
  </table>

  <h2>${next()}. مضامين المحاور كما وردت في الدرس</h2>
  <div class="callout gold"><strong>المصدر:</strong> هذه المقاطع منقولة من الدرس المنشور في قسم «الدروس»؛ صيغت المراحل أعلاه لتنظيم أجرأتها داخل الحصة.</div>
  ${sourceSectionsHtml(f.sourceSections)}

  ${f.docs.length ? `<h2>${next()}. الوثائق والدعامات وأسئلة تحليلها</h2>${docsHtml}` : ""}

  <h2>${next()}. الخلاصة والخطاطة (الأثر الكتابي)</h2>
  ${listHtml(f.summary)}
  ${f.schema ? `<h3>${esc(f.schema.title)}</h3>${tableOf(["المدخل", "المضمون"], f.schema.rows)}` : ""}
  ${f.examTips.length ? `<div class="callout"><strong>توجيهات منهجية:</strong>${listHtml(f.examTips)}</div>` : ""}

  <h2>${next()}. التقويم: أسئلة وأجوبة</h2>
  ${quizHtml || "<p>لا يتوفر تقويم لهذا الدرس.</p>"}

  ${
    f.application
      ? `<h2>${next()}. الوضعية التطبيقية</h2>
    <div class="callout"><h3>${esc(f.application.title)} — ${esc(f.application.duration)}</h3>
    <p>${esc(f.application.prompt)}</p>
    ${f.application.guide.length ? `<p><strong>خطوات الإنجاز:</strong></p>${listHtml(f.application.guide)}` : ""}
    ${f.application.model.length ? `<p><strong>عناصر الجواب النموذجي:</strong></p>${listHtml(f.application.model)}` : ""}
    </div>`
      : ""
  }

  ${
    f.references.length
      ? `<h2>${next()}. مراجع ومصادر</h2>${listHtml(
          f.references.map((r) => `${r.name}${r.url ? ` — ${r.url}` : ""}`),
        )}`
      : ""
  }

  <div class="note">${esc(f.sourceNote)}</div>
  <div class="sign">
    <div><strong>${esc(f.sign)}</strong></div>
    <div>جذاذة مبنية على درس الموقع · ${esc(f.levelLabel)} — ${esc(f.branchLabel)} · ${esc(f.subjectLabel)}</div>
  </div>
</div>`;
}

/* ------------------------------------------------------------------ */
/* نسخة الطباعة المختصرة                                              */
/* ------------------------------------------------------------------ */

function compactText(value: string, max: number): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max).replace(/\s+\S*$/, "").trimEnd();
  return `${cut}…`;
}

function compactListHtml(items: string[], maxItems: number, maxChars = 130): string {
  const selected = items.filter(Boolean).slice(0, maxItems).map((item) => compactText(item, maxChars));
  return selected.length ? `<ul class="p-list">${selected.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : "";
}

function compactSectionText(section: { title: string; blocks: LessonBlock[] }): string {
  const pieces: string[] = [];
  for (const block of section.blocks) {
    if (block.type === "p") pieces.push(block.text);
    else if (block.type === "callout") pieces.push(`${block.label}: ${block.text}`);
    else if (block.type === "ul") pieces.push(...block.items.slice(0, 2));
    else if (block.type === "table") {
      pieces.push(`${block.head.join(" / ")} — ${block.rows.slice(0, 2).map((row) => row.join(": ")).join("؛ ")}`);
    }
  }
  return compactText(pieces.join(" "), 270);
}

function printStageHtml(stage: JadadaStage): string {
  return `<article class="p-stage">
  <div class="p-stage-title"><strong>${esc(stage.name)}</strong><span>${esc(stage.duration)}</span></div>
  <p><b>الهدف:</b> ${esc(compactText(stage.objective, 105))}</p>
  <p><b>النشاط:</b> ${esc(compactText(stage.activities[0] ?? "مناقشة الوثائق وبناء الخلاصة", 115))}</p>
  <p><b>الدعامة:</b> ${esc(compactText(stage.supports.join("، "), 90))}</p>
</article>`;
}

/**
 * جسم مختصر للطباعة: ثلاث صفحات A4 ثابتة كحد أقصى.
 * لا يمس النسخة الكاملة الظاهرة على الشاشة؛ يختصر العبارات المتكررة
 * ويحافظ على بطاقة الدرس، التخطيط، المضمون الأساس، التقويم، والتوقيع.
 */
export function jadadaPrintBodyHtml(f: JadadaFiche): string {
  const coreStageCount = 1 + f.sourceSections.length + 2;
  const coreStages = f.stages.slice(0, coreStageCount);
  const sections = f.sourceSections;
  const conceptRows = f.concepts.slice(0, 14).map((item) => `<tr><th>${esc(compactText(item.term, 55))}</th><td>${esc(compactText(item.def, 120))}</td></tr>`).join("");
  const timelineRows = f.timeline.slice(0, 8).map((item) => `<tr><th>${esc(compactText(item.date, 32))}</th><td>${esc(compactText(item.event, 135))}</td></tr>`).join("");
  const quizHtml = f.quiz.slice(0, 10).map((q, i) => `<article class="p-q"><strong>${i + 1}. ${esc(compactText(q.q, 190))}</strong><span><b>الجواب:</b> ${esc(compactText(q.answer, 130))}${q.why ? ` — ${esc(compactText(q.why, 100))}` : ""}</span></article>`).join("");
  const docsHtml = f.docs.slice(0, 3).map((doc) => `<article class="p-doc"><h3>${esc(compactText(doc.label, 90))}</h3><p>${esc(compactText(doc.text, 180))}</p>${doc.questions.slice(0, 2).map((q) => `<p><b>س:</b> ${esc(compactText(q.q, 105))} <b>ج:</b> ${esc(compactText(q.answer, 130))}</p>`).join("")}</article>`).join("");
  const omittedDocs = Math.max(0, f.docs.length - 3);
  const omittedQuiz = Math.max(0, f.quiz.length - 10);

  return `<div class="print-document" dir="rtl">
  <section class="print-page p-page-one">
    <header class="p-header">
      <div><b>ثانوية <em>القدس</em> — القنيطرة</b><small>مواد الاجتماعيات · ${esc(f.authorLabel)}</small></div>
      <span>جذاذة درس · ${esc(f.subjectLabel)}</span>
    </header>
    <h1>${esc(f.title)}</h1>
    <div class="p-chips"><span>${esc(f.levelLabel)} — ${esc(f.branchLabel)}</span><span>الوحدة ${f.unitIndex + 1}: ${esc(f.unitTitle)}</span><span>الدرس ${esc(f.lessonNumber)}</span><span>${esc(f.duration)}</span></div>
    <table class="p-info"><tbody>
      <tr><th>المستوى والشعبة</th><td>${esc(f.levelLabel)} — ${esc(f.branchLabel)}</td><th>المادة</th><td>${esc(f.subjectLabel)}</td></tr>
      <tr><th>الكتاب</th><td>${esc(f.book)}</td><th>الحيز الزمني</th><td>${esc(`${f.durationMinutes} دقيقة${f.durationApprox ? " (توزيع مقترح)" : ""}`)}</td></tr>
      <tr><th>إعداد وإنجاز</th><td colspan="3">${esc(f.teacher)} — ${esc(f.school)}</td></tr>
    </tbody></table>
    <div class="p-callout"><b>الإشكالية:</b> ${esc(compactText(f.coreQuestion, 360))}</div>
    <div class="p-grid-2">
      <div class="p-box"><h2>الكفايات المستهدفة</h2>${compactListHtml(f.kifayat, 4, 125)}</div>
      <div class="p-box"><h2>الأهداف التعلمية</h2>${compactListHtml(f.cognitiveObjectives, 4, 120)}${compactListHtml(f.methodObjectives, 2, 120)}</div>
    </div>
    <h2>مراحل الحصة وتدبيرها</h2>
    <div class="p-stages">${coreStages.map(printStageHtml).join("")}</div>
    <div class="p-footer"><span>${esc(f.sign)}</span><span>الصفحة 1 / 3</span></div>
  </section>

  <section class="print-page p-page-two">
    <header class="p-mini-header"><b>جذاذة: ${esc(f.title)}</b><span>المضمون الأساس والأثر الكتابي</span></header>
    <h2>مضامين المحاور الأساسية</h2>
    <div class="p-sections">${sections.map((section) => `<article><h3>${esc(compactText(section.title, 90))}</h3><p>${esc(compactSectionText(section))}</p></article>`).join("")}</div>
    <div class="p-grid-2 p-tables">
      <div class="p-box"><h2>المفاهيم الأساس</h2><table><thead><tr><th>المفهوم</th><th>الدلالة</th></tr></thead><tbody>${conceptRows}</tbody></table>${f.concepts.length > 14 ? `<small>+ ${f.concepts.length - 14} مفاهيم في النسخة الكاملة.</small>` : ""}</div>
      <div class="p-box"><h2>الكرونولوجيا / المجالات</h2><table><thead><tr><th>التاريخ</th><th>الحدث</th></tr></thead><tbody>${timelineRows}</tbody></table>${f.timeline.length > 8 ? `<small>+ ${f.timeline.length - 8} معطيات في النسخة الكاملة.</small>` : ""}</div>
    </div>
    <div class="p-callout"><b>الخلاصة / الأثر الكتابي:</b> ${esc(f.summary.slice(0, 3).map((item) => compactText(item, 190)).join(" · "))}</div>
    ${f.schema ? `<div class="p-box"><h2>${esc(f.schema.title)}</h2><p>${esc(f.schema.rows.slice(0, 4).map((row) => `${row.label}: ${compactText(row.value, 110)}`).join(" · "))}</p></div>` : ""}
    <div class="p-footer"><span>${esc(f.sign)}</span><span>الصفحة 2 / 3</span></div>
  </section>

  <section class="print-page p-page-three">
    <header class="p-mini-header"><b>جذاذة: ${esc(f.title)}</b><span>التقويم والدعم والمراجع</span></header>
    <h2>التقويم الإجمالي والتغذية الراجعة</h2>
    <div class="p-quiz">${quizHtml || "<p>لا يتوفر تقويم لهذا الدرس.</p>"}</div>
    ${omittedQuiz ? `<p class="p-more">+ ${omittedQuiz} أسئلة في النسخة الكاملة داخل الموقع.</p>` : ""}
    ${docsHtml ? `<h2>وثائق مختارة وأسئلة تحليلها</h2><div class="p-docs">${docsHtml}</div>` : ""}
    ${omittedDocs ? `<p class="p-more">+ ${omittedDocs} وثائق في النسخة الكاملة داخل الموقع.</p>` : ""}
    ${f.application ? `<div class="p-callout"><b>الوضعية التطبيقية:</b> ${esc(compactText(f.application.title, 100))} — ${esc(compactText(f.application.prompt, 260))}<br><b>الخطوات:</b> ${esc(f.application.guide.slice(0, 3).map((item) => compactText(item, 100)).join(" · "))}</div>` : ""}
    ${f.examTips.length ? `<div class="p-box"><h2>توجيهات الدعم والامتحان</h2>${compactListHtml(f.examTips, 3, 170)}</div>` : ""}
    ${f.references.length ? `<div class="p-box"><h2>مراجع مختارة</h2>${compactListHtml(f.references.slice(0, 4).map((item) => item.name), 4, 145)}</div>` : ""}
    <div class="p-note">النسخة المطبوعة مختصرة لتناسب صفحتين أو ثلاثًا. التفاصيل الكاملة للمحاور والوثائق والتقويم متاحة في الجذاذة داخل الموقع. ${esc(f.sourceNote)}</div>
    <div class="p-sign"><b>${esc(f.sign)}</b><span>إعداد الجذاذة انطلاقًا من الدرس المنشور في قسم «الدروس».</span></div>
    <div class="p-footer"><span>${esc(f.sign)}</span><span>الصفحة 3 / 3</span></div>
  </section>
</div>`;
}

/** CSS مستقل للطباعة المختصرة — صفحة A4 مضغوطة بثلاث صفحات كحد أقصى */
export function jadadaPrintCss(): string {
  const c = SITE_COLORS;
  return `
@page{size:A4 portrait;margin:6mm}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff;color:${c.ink};font-family:"Readex Pro","Cairo","Segoe UI",Tahoma,sans-serif;font-size:8.3pt;line-height:1.28}
body{direction:rtl}
.print-export{display:none}
.print-page{height:285mm;overflow:hidden;position:relative;break-after:page;page-break-after:always;padding:0 0.5mm}
.print-page:last-child{break-after:auto;page-break-after:auto}
.p-header{display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1.2px solid ${c.brand600};padding-bottom:3mm;margin-bottom:2mm;color:${c.brand700}}
.p-header b{font-family:"Cairo",sans-serif;font-size:11pt}.p-header em{font-style:normal;color:${c.gold500}}.p-header small{display:block;color:${c.inkSoft};font-size:7.3pt;font-weight:400;margin-top:1mm}.p-header>span{border:1px solid ${c.gold400};border-radius:999px;padding:1.2mm 3mm;background:${c.goldSoft};color:${c.goldInk};font-size:7.5pt;font-weight:700}
h1{font-family:"Cairo",sans-serif;font-size:15pt;line-height:1.35;margin:1mm 0 1.5mm;color:${c.ink}}
h2{font-family:"Cairo",sans-serif;font-size:9.4pt;line-height:1.25;margin:2.3mm 0 1mm;padding:1.3mm 2mm;background:${c.brand600};border-inline-start:3px solid ${c.gold400};border-radius:1.2mm;color:#fff;font-weight:700}
h3{font-family:"Cairo",sans-serif;font-size:8.3pt;color:${c.brand700};margin:1.2mm 0 .6mm;font-weight:700}
p{margin:.7mm 0}table{width:100%;border-collapse:collapse;margin:1mm 0;font-size:7.4pt}th,td{border:.35px solid ${c.line};padding:1mm 1.2mm;text-align:start;vertical-align:top}thead th{background:${c.brand700};color:#fff;font-weight:700}tbody tr:nth-child(even){background:${c.brandSofter}}
.p-chips{display:flex;flex-wrap:wrap;gap:1mm;margin:1mm 0 1.5mm}.p-chips span{border:1px solid ${c.gold400};background:${c.goldSoft};color:${c.goldInk};border-radius:999px;padding:.7mm 2mm;font-size:7pt;font-weight:700}
.p-info th{background:${c.brandSoft};color:${c.brand700};width:14%;white-space:nowrap}.p-info td{width:36%}.p-callout,.p-box,.p-doc{border:1px solid ${c.line};background:${c.brandSofter};border-radius:1.5mm;padding:1.6mm 2mm;margin:1.2mm 0}.p-callout{border-inline-start:3px solid ${c.gold500};background:${c.goldSoft}}.p-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:2mm}.p-list{margin:.5mm 0;padding-inline-start:4mm}.p-list li{margin:.4mm 0}.p-list li::marker{color:${c.brand500}}
.p-stages{display:grid;grid-template-columns:1fr 1fr;gap:1.3mm}.p-stage{border:1px solid ${c.line};border-radius:1.2mm;padding:1.2mm 1.6mm;background:#fff;break-inside:avoid}.p-stage-title{display:flex;align-items:center;justify-content:space-between;gap:1mm;color:${c.brand700};font-size:7.7pt}.p-stage-title span{white-space:nowrap;border-radius:999px;background:${c.goldSoft};color:${c.goldInk};padding:.4mm 1.4mm;font-size:6.8pt}.p-stage p{font-size:7pt;color:${c.inkSoft};margin:.45mm 0}.p-stage b{color:${c.brand700}}
.p-mini-header{display:flex;justify-content:space-between;gap:4mm;border-bottom:1px solid ${c.line};padding-bottom:2mm;margin-bottom:2mm;color:${c.brand700};font-size:8pt}.p-mini-header b{font-family:"Cairo",sans-serif}.p-mini-header span{color:${c.inkSoft}}
.p-sections{columns:2;column-gap:4mm}.p-sections article{break-inside:avoid;border-bottom:.5px solid ${c.line};padding-bottom:1.3mm;margin-bottom:1.3mm}.p-sections article p{font-size:7.35pt;color:${c.inkSoft};text-align:justify}.p-tables{align-items:start}.p-box table{font-size:7pt}.p-box small,.p-more{display:block;color:${c.inkSoft};font-size:6.8pt;margin-top:.8mm}.p-quiz{display:grid;grid-template-columns:1fr 1fr;gap:1.2mm}.p-q{border:1px solid ${c.line};border-radius:1.2mm;padding:1.2mm 1.6mm;break-inside:avoid;background:#fff}.p-q strong{display:block;color:${c.brand700};font-size:7.25pt}.p-q span{display:block;color:${c.inkSoft};font-size:6.8pt;margin-top:.5mm}.p-docs{display:grid;grid-template-columns:1fr 1fr;gap:1.2mm}.p-doc{margin:0;background:${c.brandSofter}}.p-doc h3{margin:0 0 .5mm}.p-doc p{font-size:6.9pt}.p-note{border:1px dashed ${c.line};border-radius:1.2mm;padding:1.4mm 1.8mm;color:${c.inkSoft};font-size:6.7pt;margin-top:2mm}.p-sign{display:flex;justify-content:space-between;gap:3mm;border-top:1px solid ${c.brandSoft};padding-top:2mm;margin-top:2mm;color:${c.brand700};font-size:7.1pt}.p-footer{position:absolute;inset-inline:0;bottom:0;border-top:1px solid ${c.line};padding-top:1.5mm;display:flex;justify-content:space-between;color:${c.inkSoft};font-size:6.6pt}
@media screen{body{background:${c.paper};padding:8mm}.print-page{height:auto;min-height:285mm;margin:0 auto 6mm;max-width:198mm;background:#fff;padding:5mm;box-shadow:0 5px 25px rgba(4,36,26,.16)}.p-footer{position:static;margin-top:3mm}.p-page-three{min-height:0}}
@media print{.p-toolbar{display:none!important}.screen-export{display:none!important}.print-export{display:block!important}.print-page{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
`;
}

/** ملف HTML مستقل للنسخة المختصرة (يُرسل مباشرة إلى نافذة الطباعة) */
export function jadadaPrintHtml(f: JadadaFiche): string {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>جذاذة مختصرة: ${esc(f.title)}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800;900&family=Readex+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet"><style>${jadadaPrintCss()}</style></head><body><div class="p-toolbar"><button type="button" onclick="window.print()">طباعة / حفظ PDF</button></div>${jadadaPrintBodyHtml(f)}</body></html>`;
}

/** ملف HTML مستقل (يُفتح في نافذة الطباعة أو يُحمَّل) */
export function jadadaToHtml(f: JadadaFiche): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>جذاذة: ${esc(f.title)} — ${esc(f.levelLabel)} ${esc(f.branchLabel)}</title>
<meta name="description" content="جذاذة درس ${esc(f.title)} (${esc(f.levelLabel)} — ${esc(f.branchLabel)})، ${esc(f.authorLabel)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800;900&family=Readex+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>${jadadaCss("", true)}${jadadaPrintCss()}</style>
</head>
<body>
<div class="screen-export">
  <div class="toolbar">
    <button class="btn" type="button" onclick="window.print()">طباعة / حفظ PDF (2–3 صفحات)</button>
  </div>
  ${jadadaBodyHtml(f)}
</div>
<div class="print-export">${jadadaPrintBodyHtml(f)}</div>
</body>
</html>`;
}

/** اسم ملف الجذاذة (بأحرف عربية آمنة) */
export function jadadaFileName(f: JadadaFiche, ext: "html" | "pdf"): string {
  const clean = (s: string) =>
    s
      .replace(/[\u0640\u064B-\u0652]/g, "")
      .replace(/[\s]+/g, "_")
      .replace(/[\\/:*?"<>|.,;!?،؛]+/g, "")
      .replace(/_{2,}/g, "_")
      .replace(/^_+|_+$/g, "");
  return `جذاذة_${clean(f.levelShort)}_${clean(f.branchLabel)}_${clean(f.subjectLabel)}_${clean(f.title)}.${ext}`;
}

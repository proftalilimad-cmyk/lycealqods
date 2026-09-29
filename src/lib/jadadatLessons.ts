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
  const headingText = "#000000";
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
${S}h2{font-family:"Cairo","Readex Pro",sans-serif;font-size:16px;margin:24px 0 8px;padding:6px 12px;background:${c.brandSoft};color:${headingText};border-radius:8px;border-inline-start:6px solid ${c.gold400};font-weight:700}
${S}h3{font-family:"Cairo","Readex Pro",sans-serif;font-size:14.5px;margin:14px 0 6px;color:${headingText};border-bottom:1px dashed ${c.line};padding-bottom:3px;font-weight:700}
${S}h4{font-family:"Cairo","Readex Pro",sans-serif;font-size:13.5px;margin:8px 0 4px;color:${headingText};font-weight:700}
${S}p{margin:6px 0}
${S}ul{margin:6px 0;padding-inline-start:20px;list-style:disc}
${S}li{margin:3px 0}
${S}table{width:100%;border-collapse:collapse;margin:8px 0;font-size:13px}
${S}th,${S}td{border:1px solid ${c.line};padding:7px 9px;text-align:start;vertical-align:top}
${S}thead th{background:${c.brandSoft};color:${headingText};font-family:"Cairo","Readex Pro",sans-serif;font-weight:600}
${S}tbody tr:nth-child(even){background:${c.brandSofter}}
${S}table.info th{width:26%;background:${c.brandSoft};color:${headingText};font-weight:600}
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
${S}.stage-name{font-weight:700;color:${headingText};font-family:"Cairo","Readex Pro",sans-serif}`;

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
/* نسخة الطباعة الكاملة                                              */
/* ------------------------------------------------------------------ */

function printList(items: string[], className = "print-list"): string {
  const values = items.filter((item) => String(item ?? "").trim().length > 0);
  return values.length
    ? `<ul class="${className}">${values.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`
    : "";
}

function printTableHead(): string {
  return `<thead><tr>
    <th class="f-phase">مراحل إنجاز الدرس</th>
    <th>أهداف التعلم المرتبطة بالنشاط</th>
    <th>التدبير الديداكتيكي</th>
    <th>الدعامات الديداكتيكية</th>
    <th class="f-product">المنتوج / الأثر المنتظر</th>
  </tr></thead>`;
}

function printStageProduct(stage: JadadaStage): string {
  return [
    stage.activities.length
      ? `<div><strong>الأنشطة والمضامين:</strong>${printList(stage.activities)}</div>`
      : "",
    stage.questions.length
      ? `<div><strong>أسئلة الاشتغال:</strong>${printList(stage.questions)}</div>`
      : "",
    stage.expected.length
      ? `<div><strong>المنتوج / الأثر المنتظر:</strong>${printList(stage.expected)}</div>`
      : "",
    stage.assessment.length
      ? `<div class="stage-assessment"><strong>التقويم المرحلي:</strong>${printList(stage.assessment)}</div>`
      : "",
  ].join("");
}

function printStageRow(stage: JadadaStage): string {
  return `<tr class="print-stage-row">
    <td class="f-phase"><b>${esc(stage.name)}</b><span class="f-time">${esc(stage.duration)}</span></td>
    <td><p>${esc(stage.objective)}</p></td>
    <td>${esc(stage.management)}</td>
    <td>${printList(stage.supports)}</td>
    <td class="f-product">${printStageProduct(stage)}</td>
  </tr>`;
}

function printStageDetail(stage: JadadaStage | undefined): string {
  if (!stage) return "";
  return `<article class="print-stage-detail print-card">
    <h3>${esc(stage.name)}</h3>
    <p><strong>الحيز الزمني:</strong> ${esc(stage.duration)}</p>
    <p><strong>هدف التعلم:</strong> ${esc(stage.objective)}</p>
    ${stage.activities.length ? `<h4>الأنشطة والمضامين</h4>${printList(stage.activities)}` : ""}
    ${stage.questions.length ? `<h4>أسئلة الاشتغال</h4>${printList(stage.questions)}` : ""}
    ${stage.expected.length ? `<h4>المنتوج / الأثر المنتظر</h4>${printList(stage.expected)}` : ""}
    ${stage.management ? `<h4>التدبير الديداكتيكي</h4><p>${esc(stage.management)}</p>` : ""}
    ${stage.supports.length ? `<h4>الدعامات الديداكتيكية</h4>${printList(stage.supports)}` : ""}
    ${stage.assessment.length ? `<h4>التقويم المرحلي والمؤشرات</h4>${printList(stage.assessment)}` : ""}
  </article>`;
}

function printQuestionItem(question: JadadaQuizItem, index: number): string {
  return `<li class="print-question">
    <div class="question-text"><b>${index + 1}. ${esc(question.q)}</b></div>
    ${question.options.length ? `<div class="question-options"><strong>الاختيارات:</strong>${printList(question.options)}</div>` : ""}
    <div class="print-answer"><strong>الجواب المرتقب:</strong> ${esc(question.answer)}</div>
    ${question.why ? `<div class="print-rationale"><strong>التعليل/المؤشر:</strong> ${esc(question.why)}</div>` : ""}
  </li>`;
}

function printQuizList(quiz: JadadaQuizItem[], title?: string): string {
  if (!quiz.length) return "";
  return `${title ? `<h4>${esc(title)}</h4>` : ""}<ol class="print-questions">${quiz.map((question, index) => printQuestionItem(question, index)).join("")}</ol>`;
}

function printStageAssessment(stage: JadadaStage | undefined, f: JadadaFiche): string {
  if (!stage || !stage.assessment.length) return "";
  const items = stage.assessment
    .map((question) => f.quiz.find((item) => item.q === question))
    .filter((item): item is JadadaQuizItem => Boolean(item));
  const missing = stage.assessment.filter((question) => !f.quiz.some((item) => item.q === question));
  return `<article class="print-assessment print-card">
    <h4>${esc(stage.name)}</h4>
    ${items.length ? printQuizList(items) : ""}
    ${missing.length ? `<h5>أسئلة التقويم المرحلي الواردة في المرحلة</h5>${printList(missing)}` : ""}
  </article>`;
}

function printDocsHtml(docs: JadadaDoc[]): string {
  return docs
    .map(
      (doc) => `<article class="print-doc print-card">
        <h3>${esc(doc.label)}</h3>
        <p>${esc(doc.text)}</p>
        ${
          doc.questions.length
            ? `<table class="print-inner-table"><thead><tr><th>السؤال</th><th>النقط</th><th>عناصر الجواب</th></tr></thead><tbody>${doc.questions
                .map((question) => `<tr><td>${esc(question.q)}</td><td>${esc(String(question.pts))}</td><td>${esc(question.answer)}</td></tr>`)
                .join("")}</tbody></table>`
            : ""
        }
      </article>`,
    )
    .join("");
}

function printReferenceList(references: { name: string; url: string }[]): string {
  return references.length
    ? `<ul class="print-list">${references
        .map((reference) => `<li>${esc(reference.name)}${reference.url ? ` — <a href="${esc(reference.url)}">${esc(reference.url)}</a>` : ""}</li>`)
        .join("")}</ul>`
    : "";
}

/**
 * نسخة الطباعة الكاملة للجذاذة.
 * لا تستعمل هذه الدالة أي قصّ أو تلخيص: المصدر الكامل هو sourceSections،
 * وتُطبع معه جميع مراحل الحصة والوثائق والتقويمات والأجوبة والدعم.
 */
export function jadadaPrintBodyHtml(f: JadadaFiche): string {
  const sectionCount = f.sourceSections.length;
  const sectionStages = f.stages.slice(1, 1 + sectionCount);
  const synthesisStage = f.stages[1 + sectionCount];
  const assessmentStage = f.stages[2 + sectionCount];
  const applicationStage = f.stages[3 + sectionCount];

  const objectiveRows = [
    ["معرفية", f.cognitiveObjectives],
    ["مهارية", f.methodObjectives],
    ["قيمية", f.valueObjectives],
  ]
    .map(([label, items]) => `<div><b>${esc(label as string)}</b>${printList(items as string[])}</div>`)
    .join("");

  const stageRows = f.stages.map(printStageRow).join("");
  const sourceSections = f.sourceSections
    .map(
      (section, index) => `<article class="source-section print-section">
        <h3>${index + 1}. ${esc(section.title)}</h3>
        ${section.blocks.map(sourceBlockHtml).join("")}
      </article>`,
    )
    .join("");
  const stagedAssessments = sectionStages.map((stage) => printStageAssessment(stage, f)).join("");
  const concepts = f.concepts.length
    ? `<table class="print-inner-table"><thead><tr><th>المفهوم</th><th>الدلالة</th></tr></thead><tbody>${f.concepts
        .map((item) => `<tr><th>${esc(item.term)}</th><td>${esc(item.def)}</td></tr>`)
        .join("")}</tbody></table>`
    : "";
  const timeline = f.timeline.length
    ? `<h3>الكرونولوجيا والمجالات</h3><table class="print-inner-table"><thead><tr><th>التاريخ</th><th>الحدث</th></tr></thead><tbody>${f.timeline
        .map((item) => `<tr><th>${esc(item.date)}</th><td>${esc(item.event)}</td></tr>`)
        .join("")}</tbody></table>`
    : "";
  const characters = f.characters.length
    ? `<h3>شخصيات الدرس</h3><table class="print-inner-table"><thead><tr><th>الشخصية</th><th>الدور</th></tr></thead><tbody>${f.characters
        .map((item) => `<tr><th>${esc(item.name)}</th><td>${esc(item.role)}</td></tr>`)
        .join("")}</tbody></table>`
    : "";
  const places = f.places.length
    ? `<h3>الأماكن والمجالات</h3><table class="print-inner-table"><thead><tr><th>المكان</th><th>الدلالة</th></tr></thead><tbody>${f.places
        .map((item) => `<tr><th>${esc(item.name)}</th><td>${esc(item.why)}</td></tr>`)
        .join("")}</tbody></table>`
    : "";
  const schema = f.schema
    ? `<h3>${esc(f.schema.title)}</h3><table class="print-inner-table"><thead><tr><th>المدخل</th><th>المضمون</th></tr></thead><tbody>${f.schema.rows
        .map((row) => `<tr><th>${esc(row.label)}</th><td>${esc(row.value)}</td></tr>`)
        .join("")}</tbody></table>`
    : "";
  const application = f.application
    ? `<article class="print-card print-application"><h3>${esc(f.application.title)}</h3><p><strong>المدة:</strong> ${esc(f.application.duration)}</p><p>${esc(f.application.prompt)}</p><h4>خطوات الإنجاز</h4>${printList(f.application.guide)}<h4>عناصر الجواب النموذجي</h4>${printList(f.application.model)}</article>`
    : "";

  const header = `<header class="f-header print-section">
    <div class="f-meta-left"><table><tbody><tr><th>مدة الإنجاز</th><td>${esc(f.duration)}</td></tr><tr><th>الكتاب المعتمد</th><td>${esc(f.book)}</td></tr><tr><th>إعداد الأستاذ</th><td>${esc(f.teacher)}</td></tr></tbody></table></div>
    <div class="f-title"><span class="f-number">${String(f.lessonIndex + 1).padStart(2, "0")}</span><h1>${esc(f.title)}</h1><small>${esc(f.authorLabel)} · ${esc(f.school)}</small></div>
    <div class="f-meta-right"><table><tbody><tr><th>مادة</th><td>${esc(f.subjectLabel)}</td></tr><tr><th>المستوى</th><td>${esc(f.branchLabel)}</td></tr><tr><th>المجزوءة</th><td>${String(f.unitIndex + 1).padStart(2, "0")}</td></tr></tbody></table></div>
  </header>`;

  return `<main class="lesson-plan-print print-document" dir="rtl">
    ${header}
    <section class="print-section print-cover">
      <div class="f-page-label">الجذاذة — بطاقة الدرس</div>
      <table class="f-problem"><tbody>
        <tr><th>الكفاية / الإشكالية المركزية للمجزوءة</th><td>${esc(f.unitKifaya)}</td></tr>
        <tr><th>الإشكالية المحورية للدرس</th><td>${esc(f.coreQuestion)}</td></tr>
      </tbody></table>
      <h2>الأهداف</h2>
      <div class="f-objectives">${objectiveRows}</div>
    </section>

    <section class="print-section">
      <h2>مراحل إنجاز الدرس</h2>
      <table class="f-stage-table">${printTableHead()}<tbody>${stageRows}</tbody></table>
    </section>

    <section class="print-section">
      <h2>الانطلاق والتمهيد</h2>
      <p class="print-source-intro">${esc(f.intro)}</p>
      ${printStageDetail(f.stages[0])}
    </section>

    <section class="print-section">
      <h2>مضامين الدرس الكاملة</h2>
      <div class="print-source-note">المحتوى التالي منقول كاملًا من مصدر الجذاذة، دون تلخيص أو إعادة صياغة.</div>
      ${sourceSections}
    </section>

    <section class="print-section">
      <h2>التركيب والأثر الكتابي</h2>
      ${printStageDetail(synthesisStage)}
      ${f.summary.length ? `<h3>الخلاصة</h3>${printList(f.summary)}` : ""}
      ${schema}
      ${f.examTips.length ? `<h3>توجيهات منهجية</h3>${printList(f.examTips)}` : ""}
    </section>

    <section class="print-section">
      <h2>المفاهيم والامتدادات</h2>
      ${concepts}
      ${timeline}
      ${characters}
      ${places}
    </section>

    ${
      f.docs.length
        ? `<section class="print-section"><h2>الوثائق والدعامات وأسئلة الاشتغال</h2><div class="print-docs">${printDocsHtml(f.docs)}</div></section>`
        : ""
    }

    <section class="print-section">
      <h2>التقويم المرحلي والإجمالي</h2>
      <h3>التقويم المرحلي</h3>
      <p>تُعرض أسئلة التقويم المرحلي وأجوبتها كما وردت في بيانات كل مرحلة، بعد أنشطة بناء التعلمات.</p>
      ${stagedAssessments || "<p class=\"print-empty\">لا توجد أسئلة تقويم مرحلي مستقلة محفوظة لهذه الجذاذة.</p>"}
      <h3>التقويم الإجمالي والدعم</h3>
      ${printStageDetail(assessmentStage)}
      ${printQuizList(f.quiz, "أسئلة التقويم الإجمالي والأجوبة المرتقبة")}
      ${f.examTips.length ? `<h4>مؤشرات المعالجة والتتبع المتاحة</h4>${printList(f.examTips)}` : ""}
    </section>

    ${application ? `<section class="print-section"><h2>الوضعية التطبيقية</h2>${printStageDetail(applicationStage)}${application}</section>` : ""}

    ${
      f.references.length
        ? `<section class="print-section"><h2>المراجع والمصادر</h2>${printReferenceList(f.references)}</section>`
        : ""
    }

    <section class="print-section print-end-note">
      <p>${esc(f.sourceNote)}</p>
      <p><strong>${esc(f.sign)}</strong></p>
    </section>
  </main>`;
}

/** CSS مستقل لنسخة الطباعة الكاملة للجذاذة. */
export function jadadaPrintCss(): string {
  const brand = SITE_COLORS.brand700;
  const brandLight = SITE_COLORS.brand600;
  const accent = SITE_COLORS.brand500;
  const gold = SITE_COLORS.gold500;
  const soft = SITE_COLORS.brandSoft;
  const pale = SITE_COLORS.brandSofter;
  const goldSoft = SITE_COLORS.goldSoft;
  const line = SITE_COLORS.line;
  const ink = SITE_COLORS.ink;
  const muted = SITE_COLORS.inkSoft;
  return `
@page{size:A4 portrait;margin:12mm 10mm 14mm}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff;color:${ink};font-family:"Readex Pro","Cairo","Segoe UI",Tahoma,Arial,sans-serif;font-size:10pt;line-height:1.65}
body{direction:rtl}
.p-toolbar{display:flex;justify-content:center;gap:8px;padding:10px;background:#fff}
.p-toolbar button{border:0;border-radius:8px;background:${brand};color:#fff;padding:9px 18px;font:700 13px "Cairo",sans-serif;cursor:pointer}
.lesson-plan-print{width:100%;margin:0 auto;padding:0}
.print-section{margin:0 0 9mm;break-inside:auto;page-break-inside:auto}
.print-cover{break-after:page;page-break-after:always}
.print-card,.source-section,.print-doc{break-inside:auto;page-break-inside:auto}
h1,h2,h3,h4,h5{break-after:avoid;page-break-after:avoid}
h1,h2,h3,h4,h5,p{orphans:3;widows:3}
h2{margin:7mm 0 3mm;padding:2.5mm 3mm;background:${soft};border-inline-start:5px solid ${accent};color:${ink};font-family:"Cairo",sans-serif;font-size:15pt;line-height:1.45}
h3{margin:5mm 0 2mm;color:${brand};font-family:"Cairo",sans-serif;font-size:12pt;line-height:1.45}
h4{margin:3.5mm 0 1.5mm;color:${brand};font-family:"Cairo",sans-serif;font-size:10.5pt}
h5{margin:2.5mm 0 1mm;color:${muted};font-size:9.5pt}
p{margin:1.5mm 0}
.f-header{display:grid;grid-template-columns:1fr 1.7fr 1fr;gap:4mm;align-items:stretch;direction:ltr;margin:0 0 5mm}
.f-header>div{direction:rtl}
.f-header table,.f-problem,.f-stage-table,.print-inner-table{width:100%;border-collapse:collapse;table-layout:auto}
.f-header table{height:100%;background:#fff;font-size:9pt}
.f-header th,.f-header td{border:1px solid ${line};padding:2.2mm 2.5mm;vertical-align:middle}
.f-header th{width:40%;background:${soft};color:${ink};font-weight:800}
.f-header td{font-weight:600;color:${muted};background:#fff}
.f-title{position:relative;display:flex;min-height:34mm;align-items:center;justify-content:center;flex-direction:column;text-align:center;border-radius:6mm;background:linear-gradient(135deg,${brandLight},${brand});color:#fff;padding:5mm 8mm;box-shadow:0 1.5mm 0 rgba(0,0,0,.08)}
.f-title h1{margin:0;font-family:"Cairo",sans-serif;font-size:18pt;line-height:1.5;color:#fff}
.f-title small{font-size:8.5pt;color:#d4ede0;margin-top:2mm}
.f-number{position:absolute;inset-block-start:-3mm;inset-inline-end:-2.5mm;display:grid;place-items:center;width:13mm;height:13mm;border:1.2mm solid #fff;border-radius:50%;background:#04241a;color:#fff;font-family:"Cairo",sans-serif;font-size:11pt;font-weight:800}
.f-page-label{background:${soft};color:${ink};text-align:center;font-family:"Cairo",sans-serif;font-size:12pt;font-weight:800;padding:2.2mm 3mm;margin:0 0 3mm}
.f-problem{margin:3mm 0;font-size:10pt}
.f-problem th,.f-problem td{border:1px solid ${line};padding:3mm;vertical-align:top}
.f-problem th{width:28%;background:${soft};font-weight:800}
.f-problem td{background:${goldSoft};font-weight:600}
.f-objectives{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin:3mm 0}
.f-objectives>div{border:1px solid ${line};background:#fff;padding:3mm;break-inside:avoid}
.f-objectives b{display:block;text-align:center;background:${soft};color:${ink};margin:-3mm -3mm 2mm;padding:2mm;font-family:"Cairo",sans-serif}
.print-list{margin:1.5mm 0;padding-inline-start:6mm}
.print-list li{margin:1mm 0}
.print-list li::marker{color:${accent};font-weight:800}
.f-stage-table{font-size:8.5pt;line-height:1.55}
.f-stage-table th,.f-stage-table td{border:1px solid ${line};padding:2.5mm;vertical-align:top;text-align:start;overflow-wrap:anywhere}
.f-stage-table thead th{background:${soft};color:${ink};text-align:center;font-family:"Cairo",sans-serif;font-size:9pt}
.f-stage-table th:nth-child(1),.f-stage-table td:nth-child(1){width:15%}
.f-stage-table th:nth-child(2),.f-stage-table td:nth-child(2){width:20%}
.f-stage-table th:nth-child(3),.f-stage-table td:nth-child(3){width:20%}
.f-stage-table th:nth-child(4),.f-stage-table td:nth-child(4){width:17%}
.f-stage-table th:nth-child(5),.f-stage-table td:nth-child(5){width:28%}
.f-stage-table tbody tr:nth-child(even) td{background:#fff}
.f-stage-table tbody tr:nth-child(odd) td{background:${pale}}
.f-phase{background:${soft}!important;text-align:center!important;color:${ink};font-family:"Cairo",sans-serif}
.f-time{display:block;margin-top:2mm;padding:1mm 1.5mm;border-radius:1mm;background:${accent};color:#fff;font-family:"Readex Pro",sans-serif;font-size:8pt}
.f-product{background:#fffdf7!important}
.f-product>div{margin:0 0 2mm}
.f-product>div:last-child{margin-bottom:0}
.stage-assessment{border-inline-start:3px solid ${gold};padding-inline-start:2mm}
.print-source-intro{padding:3mm 4mm;border:1px dashed ${line};border-radius:2mm;background:${pale};font-size:10.5pt}
.print-source-note{padding:2.5mm 3mm;border-inline-start:4px solid ${gold};background:${goldSoft};margin:3mm 0;font-weight:700}
.source-section{margin:5mm 0}
.source-section>h3{border-bottom:2px solid ${line};padding-bottom:1.5mm}
.source-section p{line-height:1.75}
.source-section ul{margin-top:2mm}
.source-section table,.print-inner-table{margin:3mm 0;font-size:9pt}
.source-section th,.source-section td,.print-inner-table th,.print-inner-table td{border:1px solid ${line};padding:2.5mm;vertical-align:top;text-align:start;overflow-wrap:anywhere}
.source-section thead th,.print-inner-table thead th{background:${soft};color:${ink};text-align:center;font-family:"Cairo",sans-serif}
.source-section tbody tr:nth-child(even) td,.print-inner-table tbody tr:nth-child(even) td{background:${pale}}
.source-section .callout,.print-card{border:1px solid ${line};border-inline-start:4px solid ${gold};background:${goldSoft};padding:3mm 4mm;margin:3mm 0}
.source-section .callout p{margin-bottom:0}
.print-stage-detail{border:1px solid ${line};border-radius:2mm;background:#fff;padding:3mm 4mm;margin:4mm 0}
.print-stage-detail h3{margin-top:0;background:${soft};padding:2mm 3mm}
.print-stage-detail h4{border-bottom:1px solid ${line};padding-bottom:1mm}
.print-assessment{background:${goldSoft};border-inline-start-color:${gold};margin:4mm 0;padding:3mm 4mm}
.print-assessment h4{margin-top:0;color:${brand}}
.print-questions{margin:2mm 0;padding-inline-start:7mm}
.print-question{margin:3mm 0;padding:3mm 4mm;border:1px solid ${line};background:#fff;break-inside:avoid;page-break-inside:avoid}
.question-text{font-size:10pt;line-height:1.7}
.question-options{margin-top:2mm;color:${muted}}
.question-options .print-list{margin-top:1mm}
.print-answer{margin-top:2mm;color:${brand};font-weight:800}
.print-rationale{margin-top:1.5mm;color:${muted};font-size:9pt}
.print-docs{display:grid;grid-template-columns:1fr;gap:4mm}
.print-doc{padding:3mm 4mm;border:1px solid ${line};border-inline-start:4px solid ${accent};background:#fff}
.print-doc h3{margin-top:0}
.print-inner-table{break-inside:auto;page-break-inside:auto}
.print-application{background:${pale};border-inline-start-color:${accent}}
.print-end-note{margin-top:8mm;padding-top:4mm;border-top:2px solid ${brand};color:${muted};font-size:9pt}
.print-empty{padding:3mm;background:${pale};border:1px dashed ${line};color:${muted}
}
thead{display:table-header-group}
tfoot{display:table-footer-group}
table{page-break-inside:auto}
tr{break-inside:avoid;page-break-inside:avoid}
th,td{break-inside:auto;overflow-wrap:anywhere;word-break:normal}
.print-only{display:block!important}
@media screen{
  body{background:#eee8dc;padding:8mm}
  .lesson-plan-print{max-width:198mm;background:#fff;padding:8mm;box-shadow:0 2mm 12mm rgba(66,45,29,.18)}
}
@media print{
  .no-print,.p-toolbar{display:none!important}
  .print-only{display:block!important}
  .lesson-plan-print{width:100%;margin:0;padding:0}
  .print-section{break-inside:auto;page-break-inside:auto}
  .f-header{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  *{box-shadow:none!important;text-shadow:none!important}
}
`;
}

/** ملف HTML مستقل لنسخة الطباعة الكاملة (يُرسل مباشرة إلى نافذة الطباعة) */
export function jadadaPrintHtml(f: JadadaFiche): string {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>جذاذة: ${esc(f.title)}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800;900&family=Readex+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet"><style>${jadadaPrintCss()}</style></head><body><div class="p-toolbar"><button type="button" onclick="window.print()">طباعة / حفظ PDF</button></div>${jadadaPrintBodyHtml(f)}</body></html>`;
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
<style>${jadadaCss("", true)}</style>
</head>
<body>
<div class="toolbar">
  <button class="btn" type="button" onclick="window.print()">طباعة / حفظ PDF</button>
</div>
${jadadaBodyHtml(f)}
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

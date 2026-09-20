export type Subject = "history" | "geography";

export type Skill =
  | "مفاهيم تاريخية"
  | "التسلسل الزمني للأحداث"
  | "ربط المفاهيم"
  | "تحليل الوثائق التاريخية"
  | "استخراج المعلومات"
  | "الاستنتاج"
  | "مفاهيم جغرافية"
  | "قراءة الخرائط"
  | "قراءة الجداول الإحصائية"
  | "قراءة المبيانات"
  | "تحليل المعطيات الجغرافية"
  | "التعبير والكتابة";

export type QuestionKind = "mcq" | "tf" | "ordering" | "matching" | "doc" | "writing";

interface BaseQuestion {
  id: number;
  subject: Subject;
  skill: Skill;
  points: number;
  title: string;
  explanation?: string;
}

export interface McqQuestion extends BaseQuestion {
  kind: "mcq";
  options: string[];
  answer: number;
}

export interface TfQuestion extends BaseQuestion {
  kind: "tf";
  answer: boolean;
}

export interface OrderingQuestion extends BaseQuestion {
  kind: "ordering";
  items: string[]; // بالترتيب الصحيح
}

export interface MatchingQuestion extends BaseQuestion {
  kind: "matching";
  pairs: { term: string; def: string }[];
}

export interface DocQuestion extends BaseQuestion {
  kind: "doc";
  docLabel: string;
  doc: string;
  mapSketch?: boolean;
  options: string[];
  answer: number;
}

export interface WritingQuestion extends BaseQuestion {
  kind: "writing";
  prompt: string;
  guidance: string[];
}

export type Question =
  | McqQuestion
  | TfQuestion
  | OrderingQuestion
  | MatchingQuestion
  | DocQuestion
  | WritingQuestion;

export type Answer = number | boolean | number[] | Record<number, number> | string | null;

export interface RubricCriterion {
  key: string;
  label: string;
  weight: number;
  ratio: number;
  score: number;
  note: string;
}

export interface RubricResult {
  criteria: RubricCriterion[];
  total: number;
}

export type SkillsMap = Record<string, { got: number; max: number }>;

export interface Submission {
  id: string;
  name: string;
  className: string;
  studentNo?: string;
  bankId?: string;
  bankLabel?: string;
  /** المستوى الدراسي لبنك الأسئلة (الجذع المشترك / الأولى باك / الثانية باك) */
  bankLevel?: string;
  /** معرف المستوى الذي حمله QR Code (jad3-moshtarak / 1bac / 2bac) */
  diagnosticLevel?: string;
  /** رقم مسار التلميذ(ة) من اللائحة الرسمية للقسم */
  massar?: string;
  date: string;
  history: number;
  geography: number;
  total: number;
  percent: number;
  level: string;
  skills: SkillsMap;
  demo?: boolean;
  /* ---- معطيات التفصيل الفردي (تُحفظ منذ تفعيل التقارير الفردية) ----
     السجلات المحفوظة قبل هذا التحديث لا تتضمنها، وتُعلن الوثيقة ذلك صراحة. */
  /** إجابات التلميذ(ة) لكل سؤال، بترتيب بنك الأسئلة */
  answers?: Answer[];
  /** شبكة تنقيط الفقرة المكتوبة */
  rubric?: RubricResult;
  /** نص الفقرة المكتوبة */
  writingText?: string;
  /** المدة المستغرقة بالثواني */
  timeUsedSeconds?: number;
}

export interface Methodology {
  id: string;
  title: string;
  intro: string;
  steps: { title: string; text: string }[];
  tips: string[];
  mistakes: string[];
}

export interface ApplicationExercise {
  id: string;
  level: string;
  subject: "التاريخ" | "الجغرافيا";
  skillTag: string;
  title: string;
  duration: string;
  points: number;
  docs: { label: string; text: string }[];
  questions: { q: string; pts: number }[];
  correction: { q: number; text: string }[];
}

export interface LessonItem {
  title: string;
  tag?: "ملف" | "تقنية";
  soon?: boolean;
}

export interface CurriculumUnit {
  title: string;
  lessons: LessonItem[];
  /** الدورة الأولى (1) أم الدورة الثانية (2) */
  term?: 1 | 2;
}

export interface CurriculumBranch {
  id: string;
  label: string;
  note?: string;
  program?: string;
  /** نص مصدر قائمة الدروس (اختياري) — يعوّض النص الافتراضي في صفحة الدروس */
  programNote?: string;
  subjects: { id: "history" | "geography" | "citizenship"; label: string }[];
  units: Record<string, CurriculumUnit[]>;
}

export interface CurriculumLevel {
  id: string;
  label: string;
  short: string;
  desc: string;
  branches: CurriculumBranch[];
  extras: { label: string; target: "methods" | "apps" | "soon" }[];
}

/* ---------- محتوى الدرس ---------- */

export type LessonBlock =
  | { type: "p"; text: string }
  | { type: "ul"; title?: string; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "callout"; tone: "def" | "info" | "warn"; label: string; text: string };

export interface LessonSection {
  title: string;
  blocks: LessonBlock[];
}

export interface LessonQuizItem {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

/** وثيقة أصلية/تعليمية أساسية داخل صفحة الدرس مع أسئلة تحليلها وأجوبتها */
export interface LessonDoc {
  label: string;
  text: string;
  questions: { q: string; pts: number; answer: string }[];
}

/** خطاطة تركيبية للدرس: مدخل/أعمدة دلالية */
export interface LessonSchema {
  title?: string;
  rows: { label: string; value: string }[];
}

/** تمرين تطبيقي مصاحب للدرس */
export interface LessonApplication {
  title: string;
  duration: string;
  prompt: string;
  guide: string[];
  model: string[];
}

export interface LessonContent {
  id: string;
  title: string;
  duration: string;
  objectives: string[];
  intro: string;
  coreQuestion: string;
  sections: LessonSection[];
  glossary: { term: string; def: string }[];
  timeline: { date: string; event: string }[];
  summary: string[];
  examTips: string[];
  quiz: LessonQuizItem[];
  docs?: LessonDoc[];
  schema?: LessonSchema;
  application?: LessonApplication;
  /** مربعات منفصلة: شخصيات وأحداث وأماكن */
  characters?: { name: string; role: string }[];
  places?: { name: string; why: string }[];
  references?: { name: string; url: string }[];
  /** صفحة الكتاب/الملخص المدرسي الذي بُني عليه الدرس (صورة داخل public/) */
  bookPage?: { src: string; book: string; page: number; caption?: string };
}

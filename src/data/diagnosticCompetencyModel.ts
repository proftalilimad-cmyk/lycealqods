import type { Question, Skill, Subject, Submission } from "../types";
import { getBank, TEST_BANKS, type TestBankDef } from "./testBanks";
import { gradeAutoQuestion } from "../lib/grading";

/**
 * النموذج التحليلي الذي تستعمله لوحة الأستاذ.
 *
 * هذه نقطة انطلاق تنظيمية مستخرجة من حقل skill الموجود أصلًا في بنوك الأسئلة،
 * وليست لائحة كفايات رسمية مفترضة. يستطيع الأستاذ تعديل أسماء الكفايات
 * والقدرات، تعطيلها، أو إلغاء تصنيف سؤال من «مصفوفة الرائز» قبل اعتماد التقرير.
 */
export interface DiagnosticCompetency {
  id: string;
  name: string;
  description: string;
  subject: Subject;
  active: boolean;
  order: number;
  source: "draft" | "teacher";
}

export interface DiagnosticAbility {
  id: string;
  competencyId: string;
  name: string;
  description: string;
  subject: Subject;
  active: boolean;
  order: number;
  /** وزن اختياري داخل الكفاية؛ 1 يعني متوسطًا عاديًا. */
  weight: number;
  source: "imported-skill" | "teacher";
}

export interface DiagnosticModelState {
  version: 1;
  competencies: DiagnosticCompetency[];
  abilities: DiagnosticAbility[];
  /** المفتاح bankId:questionId، والقيمة abilityId أو __unclassified__. */
  questionMappings: Record<string, string>;
}

export interface QuestionClassification {
  bankId: string;
  questionId: number;
  question: Question;
  ability?: DiagnosticAbility;
  competency?: DiagnosticCompetency;
}

const subjectName = (subject: Subject) => (subject === "history" ? "التاريخ" : "الجغرافيا");

const skillAbility = (id: string, name: Skill, competencyId: string, subject: Subject, order: number): DiagnosticAbility => ({
  id,
  competencyId,
  name,
  description: `قدرة قابلة للتعديل مرتبطة بمهارة «${name}» في بنك الأسئلة الحالي.`,
  subject,
  active: true,
  order,
  weight: 1,
  source: "imported-skill",
});

/** كفايات مسودة تجمع المهارات الموجودة فعليًا دون نسبتها إلى إطار رسمي. */
export const DEFAULT_COMPETENCIES: DiagnosticCompetency[] = [
  {
    id: "history-knowledge",
    name: "بناء المعرفة التاريخية",
    description: "تجميع أولي لمهارات المفاهيم والتسلسل والربط في بنك التاريخ.",
    subject: "history",
    active: true,
    order: 1,
    source: "draft",
  },
  {
    id: "history-evidence",
    name: "معالجة الوثائق والاستدلال التاريخي",
    description: "تجميع أولي لمهارات قراءة الوثائق والاستخراج والاستنتاج.",
    subject: "history",
    active: true,
    order: 2,
    source: "draft",
  },
  {
    id: "geography-knowledge",
    name: "بناء المعرفة الجغرافية",
    description: "تجميع أولي لمهارات المفاهيم والقراءة المجالية في بنك الجغرافيا.",
    subject: "geography",
    active: true,
    order: 3,
    source: "draft",
  },
  {
    id: "geography-data",
    name: "معالجة المعطيات والتعبير الجغرافي",
    description: "تجميع أولي لمهارات تحليل المعطيات والتعبير والكتابة.",
    subject: "geography",
    active: true,
    order: 4,
    source: "draft",
  },
];

export const DEFAULT_ABILITIES: DiagnosticAbility[] = [
  skillAbility("history-concepts", "مفاهيم تاريخية", "history-knowledge", "history", 1),
  skillAbility("history-sequence", "التسلسل الزمني للأحداث", "history-knowledge", "history", 2),
  skillAbility("history-connections", "ربط المفاهيم", "history-knowledge", "history", 3),
  skillAbility("history-documents", "تحليل الوثائق التاريخية", "history-evidence", "history", 4),
  skillAbility("history-extract", "استخراج المعلومات", "history-evidence", "history", 5),
  skillAbility("history-inference", "الاستنتاج", "history-evidence", "history", 6),
  skillAbility("geography-concepts", "مفاهيم جغرافية", "geography-knowledge", "geography", 7),
  skillAbility("geography-maps", "قراءة الخرائط", "geography-knowledge", "geography", 8),
  skillAbility("geography-tables", "قراءة الجداول الإحصائية", "geography-data", "geography", 9),
  skillAbility("geography-charts", "قراءة المبيانات", "geography-data", "geography", 10),
  skillAbility("geography-data-analysis", "تحليل المعطيات الجغرافية", "geography-data", "geography", 11),
  skillAbility("geography-expression", "التعبير والكتابة", "geography-data", "geography", 12),
];

const SKILL_TO_ABILITY: Record<Skill, string> = {
  "مفاهيم تاريخية": "history-concepts",
  "التسلسل الزمني للأحداث": "history-sequence",
  "ربط المفاهيم": "history-connections",
  "تحليل الوثائق التاريخية": "history-documents",
  "استخراج المعلومات": "history-extract",
  "الاستنتاج": "history-inference",
  "مفاهيم جغرافية": "geography-concepts",
  "قراءة الخرائط": "geography-maps",
  "قراءة الجداول الإحصائية": "geography-tables",
  "قراءة المبيانات": "geography-charts",
  "تحليل المعطيات الجغرافية": "geography-data-analysis",
  "التعبير والكتابة": "geography-expression",
};

const MODEL_STORAGE_KEY = "lycealqods-diagnostic-model-v1";
export const UNCLASSIFIED_ID = "__unclassified__";

function validCompetency(value: unknown): value is DiagnosticCompetency {
  if (!value || typeof value !== "object") return false;
  const item = value as DiagnosticCompetency;
  return typeof item.id === "string" && typeof item.name === "string" && (item.subject === "history" || item.subject === "geography");
}

function validAbility(value: unknown): value is DiagnosticAbility {
  if (!value || typeof value !== "object") return false;
  const item = value as DiagnosticAbility;
  return typeof item.id === "string" && typeof item.name === "string" && typeof item.competencyId === "string" && (item.subject === "history" || item.subject === "geography");
}

export function defaultDiagnosticModel(): DiagnosticModelState {
  return {
    version: 1,
    competencies: DEFAULT_COMPETENCIES.map((item) => ({ ...item })),
    abilities: DEFAULT_ABILITIES.map((item) => ({ ...item })),
    questionMappings: {},
  };
}

/** لا يحفظ نتائج أو أسماء تلاميذ؛ يحفظ إعدادات التصنيف فقط. */
export function loadDiagnosticModel(): DiagnosticModelState {
  const fallback = defaultDiagnosticModel();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(MODEL_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<DiagnosticModelState>;
    const competencies = Array.isArray(parsed.competencies) ? parsed.competencies.filter(validCompetency) : fallback.competencies;
    const abilities = Array.isArray(parsed.abilities) ? parsed.abilities.filter(validAbility) : fallback.abilities;
    return {
      version: 1,
      competencies: competencies.length > 0 ? competencies : fallback.competencies,
      abilities: abilities.length > 0 ? abilities : fallback.abilities,
      questionMappings: parsed.questionMappings && typeof parsed.questionMappings === "object" ? parsed.questionMappings : {},
    };
  } catch {
    return fallback;
  }
}

export function saveDiagnosticModel(model: DiagnosticModelState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(model));
}

export function questionMappingKey(bankId: string, questionId: number): string {
  return `${bankId}:${questionId}`;
}

export function classifyQuestion(bankId: string, question: Question, model: DiagnosticModelState): QuestionClassification {
  const override = model.questionMappings[questionMappingKey(bankId, question.id)];
  const defaultAbilityId = SKILL_TO_ABILITY[question.skill];
  const abilityId = override ?? question.abilityId ?? defaultAbilityId;
  const ability = abilityId === UNCLASSIFIED_ID ? undefined : model.abilities.find((item) => item.id === abilityId && item.active);
  const competency = ability ? model.competencies.find((item) => item.id === ability.competencyId && item.active) : undefined;
  return { bankId, questionId: question.id, question, ability, competency };
}

export function allQuestionClassifications(model: DiagnosticModelState, banks: TestBankDef[] = TEST_BANKS): QuestionClassification[] {
  return banks.flatMap((bank) => bank.questions.map((question) => classifyQuestion(bank.id, question, model)));
}

export function modelCompetencies(model: DiagnosticModelState, subject?: Subject): DiagnosticCompetency[] {
  return model.competencies
    .filter((item) => item.active && (!subject || item.subject === subject))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "ar"));
}

export function modelAbilities(model: DiagnosticModelState, subject?: Subject): DiagnosticAbility[] {
  return model.abilities
    .filter((item) => item.active && (!subject || item.subject === subject))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "ar"));
}

export type ControlLevel = "good" | "medium" | "weak";
export type SupportPriority = "critical" | "high" | "reinforce" | "good";

export interface ControlThresholds {
  good: number;
  medium: number;
  criticalSupport: number;
  highSupport: number;
  reinforceSupport: number;
}

export const DEFAULT_THRESHOLDS: ControlThresholds = {
  good: 75,
  medium: 50,
  criticalSupport: 50,
  highSupport: 60,
  reinforceSupport: 75,
};

export function controlLevel(percent: number, thresholds = DEFAULT_THRESHOLDS): ControlLevel {
  if (percent >= thresholds.good) return "good";
  if (percent >= thresholds.medium) return "medium";
  return "weak";
}

export function supportPriority(percent: number, thresholds = DEFAULT_THRESHOLDS): SupportPriority {
  if (percent < thresholds.criticalSupport) return "critical";
  if (percent < thresholds.highSupport) return "high";
  if (percent < thresholds.reinforceSupport) return "reinforce";
  return "good";
}

export interface DiagnosticAnalysisFilters {
  schoolYear: string;
  level: string;
  branch: string;
  className: string;
  subject: "all" | Subject;
  bankId: string;
  periodFrom: string;
  periodTo: string;
  competencyId: string;
  abilityId: string;
}

export const EMPTY_ANALYSIS_FILTERS: DiagnosticAnalysisFilters = {
  schoolYear: "all",
  level: "all",
  branch: "all",
  className: "all",
  subject: "all",
  bankId: "all",
  periodFrom: "",
  periodTo: "",
  competencyId: "all",
  abilityId: "all",
};

export interface DiagnosticAbilityMetric {
  id: string;
  name: string;
  competencyId: string;
  competencyName: string;
  subject: Subject;
  got: number;
  max: number;
  percent: number;
  level: ControlLevel;
  priority: SupportPriority;
  participants: number;
  controlledStudents: number;
  questionCount: number;
  weight: number;
}

export interface DiagnosticCompetencyMetric {
  id: string;
  name: string;
  subject: Subject;
  percent: number;
  level: ControlLevel;
  priority: SupportPriority;
  abilities: DiagnosticAbilityMetric[];
  participants: number;
}

export interface DiagnosticQuestionMetric {
  bankId: string;
  bankLabel: string;
  questionId: number;
  title: string;
  subject: Subject;
  skill: Skill;
  abilityId?: string;
  abilityName?: string;
  competencyId?: string;
  competencyName?: string;
  got: number;
  max: number;
  percent: number;
  answered: number;
  participants: number;
}

export interface DiagnosticStudentMetric {
  id: string;
  name: string;
  className: string;
  bankId?: string;
  percent: number;
  level: ControlLevel;
  isDemo: boolean;
}

export interface DiagnosticAnalysis {
  filters: DiagnosticAnalysisFilters;
  submissions: Submission[];
  participants: number;
  totalSubmissions: number;
  excludedRecords: number;
  missingDataRecords: number;
  overallPercent: number;
  historyPercent: number;
  geographyPercent: number;
  goodAbilities: number;
  supportAbilities: number;
  criticalAbilities: number;
  competencies: DiagnosticCompetencyMetric[];
  abilities: DiagnosticAbilityMetric[];
  questions: DiagnosticQuestionMetric[];
  students: DiagnosticStudentMetric[];
  unclassifiedQuestions: QuestionClassification[];
  methodology: string[];
  isReportReady: boolean;
}

const safePercent = (got: number, max: number): number => (max > 0 && Number.isFinite(got) && Number.isFinite(max) ? Math.round((got / max) * 1000) / 10 : 0);
const safeNumber = (value: number): number => Number.isFinite(value) ? value : 0;

export function academicYearForSubmission(submission: Pick<Submission, "date" | "schoolYear">): string {
  if (submission.schoolYear?.trim()) return submission.schoolYear.trim();
  const stamp = Date.parse(submission.date || "");
  if (!Number.isFinite(stamp)) return "غير محددة";
  const date = new Date(stamp);
  const start = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
  return `${start}-${start + 1}`;
}

const inDateRange = (date: string, from: string, to: string): boolean => {
  const stamp = Date.parse(date || "");
  if (!Number.isFinite(stamp)) return !from && !to;
  if (from && stamp < Date.parse(`${from}T00:00:00`)) return false;
  if (to && stamp > Date.parse(`${to}T23:59:59`)) return false;
  return true;
};

function matchingBank(submission: Submission): TestBankDef | undefined {
  return getBank(submission.bankId) ?? TEST_BANKS.find((bank) => bank.level === submission.bankLevel && bank.questions.length > 0);
}

function filteredSubmission(submission: Submission, filters: DiagnosticAnalysisFilters): boolean {
  const bank = matchingBank(submission);
  if (filters.schoolYear !== "all" && academicYearForSubmission(submission) !== filters.schoolYear) return false;
  if (filters.level !== "all" && submission.bankLevel !== filters.level && bank?.level !== filters.level) return false;
  if (filters.branch !== "all" && submission.bankLabel !== filters.branch && submission.bankId !== filters.branch && bank?.branch !== filters.branch) return false;
  if (filters.className !== "all" && submission.className !== filters.className) return false;
  if (filters.bankId !== "all" && submission.bankId !== filters.bankId) return false;
  if (!inDateRange(submission.date, filters.periodFrom, filters.periodTo)) return false;
  return true;
}

/**
 * يبني التقرير من إجابات النتائج نفسها. عند غياب answers في سجل قديم،
 * يستعمل skills المحفوظة فقط لذلك السجل، ولا يخترع إجابة لسؤال بعينه.
 */
export function buildDiagnosticAnalysis(
  source: Submission[],
  filters: DiagnosticAnalysisFilters = EMPTY_ANALYSIS_FILTERS,
  model: DiagnosticModelState = defaultDiagnosticModel(),
  thresholds = DEFAULT_THRESHOLDS,
): DiagnosticAnalysis {
  const scoped = source.filter((submission) => filteredSubmission(submission, filters));
  const selected = scoped.filter((submission) => submission.assessmentStatus !== "absent" && submission.assessmentStatus !== "not_started" && submission.attendanceStatus !== "absent");
  const eligible = selected.filter((submission) => Boolean(submission.bankId || submission.bankLevel));
  const bankQuestions = new Map<string, QuestionClassification[]>();
  TEST_BANKS.forEach((bank) => bankQuestions.set(bank.id, bank.questions.map((question) => classifyQuestion(bank.id, question, model))));

  const visibleClassifications = Array.from(bankQuestions.values()).flat().filter((classification) => {
    if (filters.bankId !== "all" && classification.bankId !== filters.bankId) return false;
    if (filters.subject !== "all" && classification.question.subject !== filters.subject) return false;
    if (filters.competencyId !== "all" && classification.competency?.id !== filters.competencyId) return false;
    if (filters.abilityId !== "all" && classification.ability?.id !== filters.abilityId) return false;
    return true;
  });
  const unclassifiedQuestions = visibleClassifications.filter((item) => !item.ability || !item.competency);
  const questionBuckets = new Map<string, { got: number; max: number; answered: number; participants: number; classification: QuestionClassification }>();
  const abilityBuckets = new Map<string, { got: number; max: number; participants: number; controlledStudents: number; questionCount: number; classification: QuestionClassification }>();
  const studentMetrics: DiagnosticStudentMetric[] = [];
  const subjectTotals: Record<Subject, { got: number; max: number }> = { history: { got: 0, max: 0 }, geography: { got: 0, max: 0 } };

  eligible.forEach((submission) => {
    const bank = matchingBank(submission);
    if (!bank) return;
    const classifications = visibleClassifications.filter((item) => item.bankId === bank.id);
    const perAbility = new Map<string, { got: number; max: number }>();
    const perQuestion = new Map<string, { got: number; max: number; answered: boolean }>();
    const usedLegacySkills = new Set<string>();
    classifications.forEach((classification) => {
      const question = classification.question;
      const index = bank.questions.findIndex((item) => item.id === question.id);
      let got = 0;
      let max = question.points;
      let answered = false;
      if (submission.answers && index >= 0 && index < submission.answers.length) {
        const answer = submission.answers[index];
        answered = answer !== null && answer !== undefined && !(typeof answer === "string" && answer.trim() === "");
        got = safeNumber(gradeAutoQuestion(question, answer));
      } else {
        const legacy = submission.skills?.[question.skill];
        if (legacy && legacy.max > 0) {
          // سجل قديم لا يحتوي الإجابات الفردية: نوزع كل مهارة مرة واحدة فقط.
          if (usedLegacySkills.has(question.skill)) {
            max = 0;
          } else {
            got = safeNumber(legacy.got);
            max = safeNumber(legacy.max);
            answered = true;
            usedLegacySkills.add(question.skill);
          }
        } else {
          max = 0;
        }
      }
      const questionKey = `${bank.id}:${question.id}`;
      perQuestion.set(questionKey, { got, max, answered });
      if (max > 0) {
        const questionBucket = questionBuckets.get(questionKey) ?? { got: 0, max: 0, answered: 0, participants: 0, classification };
        questionBucket.got += got;
        questionBucket.max += max;
        questionBucket.answered += answered ? 1 : 0;
        questionBucket.participants += 1;
        questionBuckets.set(questionKey, questionBucket);
        subjectTotals[question.subject].got += got;
        subjectTotals[question.subject].max += max;
      }
      if (classification.ability && classification.competency && max > 0) {
        const abilityKey = `${classification.ability.id}:${classification.ability.competencyId}`;
        const abilityBucket = abilityBuckets.get(abilityKey) ?? { got: 0, max: 0, participants: 0, controlledStudents: 0, questionCount: 0, classification };
        abilityBucket.got += got;
        abilityBucket.max += max;
        abilityBucket.questionCount += 1;
        abilityBuckets.set(abilityKey, abilityBucket);
        const current = perAbility.get(abilityKey) ?? { got: 0, max: 0 };
        current.got += got;
        current.max += max;
        perAbility.set(abilityKey, current);
      }
    });
    perAbility.forEach((value, key) => {
      const bucket = abilityBuckets.get(key);
      if (!bucket || value.max <= 0) return;
      bucket.participants += 1;
      if (safePercent(value.got, value.max) >= thresholds.good) bucket.controlledStudents += 1;
    });
    const total = Array.from(perQuestion.values()).reduce((sum, item) => sum + item.got, 0);
    const max = Array.from(perQuestion.values()).reduce((sum, item) => sum + item.max, 0);
    // السجل المكتمل بلا إجابات أو مهارات محفوظة يُحتسب ضمن السجلات المحددة،
    // لكنه لا يُحتسب مشاركًا حتى لا نخلط نقص البيانات بنتيجة ضعيفة.
    if (max > 0) {
      studentMetrics.push({
        id: submission.id,
        name: submission.name,
        className: submission.className,
        bankId: submission.bankId,
        percent: safePercent(total, max),
        level: controlLevel(safePercent(total, max), thresholds),
        isDemo: Boolean(submission.demo || submission.isDemo || submission.dataSource === "demo"),
      });
    }
  });

  const abilityMetrics: DiagnosticAbilityMetric[] = Array.from(abilityBuckets.values()).map((bucket) => {
    const ability = bucket.classification.ability!;
    const competency = bucket.classification.competency!;
    const percent = safePercent(bucket.got, bucket.max);
    return {
      id: ability.id,
      name: ability.name,
      competencyId: competency.id,
      competencyName: competency.name,
      subject: ability.subject,
      got: bucket.got,
      max: bucket.max,
      percent,
      level: controlLevel(percent, thresholds),
      priority: supportPriority(percent, thresholds),
      participants: bucket.participants,
      controlledStudents: bucket.controlledStudents,
      questionCount: bucket.questionCount,
      weight: Number.isFinite(ability.weight) && ability.weight > 0 ? ability.weight : 1,
    };
  }).sort((a, b) => a.percent - b.percent || a.name.localeCompare(b.name, "ar"));

  const competencies = modelCompetencies(model, filters.subject === "all" ? undefined : filters.subject)
    .filter((competency) => filters.competencyId === "all" || competency.id === filters.competencyId)
    .map((competency) => {
      const abilities = abilityMetrics.filter((ability) => ability.competencyId === competency.id);
      const weighted = abilities.reduce((sum, ability) => sum + ability.percent * ability.weight, 0);
      const weight = abilities.reduce((sum, ability) => sum + ability.weight, 0);
      const percent = weight > 0 ? Math.round((weighted / weight) * 10) / 10 : 0;
      return {
        id: competency.id,
        name: competency.name,
        subject: competency.subject,
        percent,
        level: controlLevel(percent, thresholds),
        priority: supportPriority(percent, thresholds),
        abilities,
        participants: Math.max(0, ...abilities.map((ability) => ability.participants)),
      };
    })
    .filter((competency) => competency.abilities.length > 0 || unclassifiedQuestions.some((item) => item.competency?.id === competency.id));

  const questions: DiagnosticQuestionMetric[] = Array.from(questionBuckets.values()).map((bucket) => {
    const { classification } = bucket;
    return {
      bankId: classification.bankId,
      bankLabel: getBank(classification.bankId)?.branch ?? classification.bankId,
      questionId: classification.questionId,
      title: classification.question.title,
      subject: classification.question.subject,
      skill: classification.question.skill,
      abilityId: classification.ability?.id,
      abilityName: classification.ability?.name,
      competencyId: classification.competency?.id,
      competencyName: classification.competency?.name,
      got: bucket.got,
      max: bucket.max,
      percent: safePercent(bucket.got, bucket.max),
      answered: bucket.answered,
      participants: bucket.participants,
    };
  }).sort((a, b) => a.percent - b.percent || a.questionId - b.questionId);

  const overallGot = Object.values(subjectTotals).reduce((sum, item) => sum + item.got, 0);
  const overallMax = Object.values(subjectTotals).reduce((sum, item) => sum + item.max, 0);
  const historyPercent = safePercent(subjectTotals.history.got, subjectTotals.history.max);
  const geographyPercent = safePercent(subjectTotals.geography.got, subjectTotals.geography.max);
  const methodology = [
    "نسبة التحكم في القدرة = مجموع النقاط المحصل عليها في أسئلة القدرة ÷ مجموع النقاط الممكنة × 100.",
    "نسبة الكفاية = متوسط مرجح لنسب القدرات التابعة لها؛ وزن القدرة الافتراضي 1 ويمكن تعديله من إدارة النموذج.",
    "عدم الإجابة والغياب والبيانات الناقصة لا تدخل في البسط، ولا تُحوّل إلى NaN أو Infinity؛ يُعرض عدد المشاركين الفعلي.",
    `المستويات قابلة للضبط حاليًا: جيد ${thresholds.good}% فأكثر، متوسط ${thresholds.medium}% إلى أقل من ${thresholds.good}%، ضعيف أقل من ${thresholds.medium}%.`,
    "التقرير النهائي متاح فقط إذا كانت كل أسئلة النطاق مرتبطة بقدرة وكفاية مفعّلتين.",
  ];
  const filteredQuestions = visibleClassifications.length;
  return {
    filters,
    submissions: eligible,
    participants: studentMetrics.length,
    totalSubmissions: selected.length,
    excludedRecords: scoped.length - selected.length,
    missingDataRecords: Math.max(0, selected.length - studentMetrics.length),
    overallPercent: safePercent(overallGot, overallMax),
    historyPercent,
    geographyPercent,
    goodAbilities: abilityMetrics.filter((ability) => ability.priority === "good").length,
    supportAbilities: abilityMetrics.filter((ability) => ability.priority !== "good").length,
    criticalAbilities: abilityMetrics.filter((ability) => ability.priority === "critical").length,
    competencies,
    abilities: abilityMetrics,
    questions,
    students: studentMetrics.sort((a, b) => a.percent - b.percent),
    unclassifiedQuestions,
    methodology: [...methodology, `نطاق التقرير: ${filteredQuestions} سؤالًا مصنفًا/مطلوب تصنيفه.`],
    isReportReady: studentMetrics.length > 0 && filteredQuestions > 0 && unclassifiedQuestions.length === 0,
  };
}

export function subjectLabel(subject: Subject): string {
  return subjectName(subject);
}

export function priorityLabel(priority: SupportPriority): string {
  return {
    critical: "قصوى",
    high: "مرتفعة",
    reinforce: "تعزيز",
    good: "جيد",
  }[priority];
}

export function levelLabel(level: ControlLevel): string {
  return { good: "جيد", medium: "متوسط", weak: "ضعيف" }[level];
}

export function allBanksForFilters(): TestBankDef[] {
  return TEST_BANKS;
}

export function skillsForSubject(subject: Subject): Skill[] {
  return DEFAULT_ABILITIES.filter((ability) => ability.subject === subject).map((ability) => ability.name as Skill);
}

export function defaultAbilityForSkill(skill: Skill): DiagnosticAbility | undefined {
  return DEFAULT_ABILITIES.find((ability) => ability.id === SKILL_TO_ABILITY[skill]);
}

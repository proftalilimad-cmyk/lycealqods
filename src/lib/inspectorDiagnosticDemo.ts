/**
 * نموذج مستقل للتقويم التشخيصي داخل فضاء المفتش.
 * لا يستورد اللائحة الرسمية ولا يكتب إلى localStorage أو Supabase.
 * كل الأسماء والمعرّفات هنا واضحة بأنها تجريبية.
 */

export type InspectorDemoAttendance = "present" | "absent";
export type InspectorDemoAssessmentStatus = "completed" | "absent";

export interface InspectorDemoSkillResult {
  id: string;
  label: string;
  got: number;
  max: number;
  percent: number;
  controlled: boolean;
  difficulty: string;
}

export interface InspectorDemoSubjectResult {
  score: number;
  max: number;
  percent: number;
  level: string;
  controlledSkills: string[];
  difficulties: string[];
  skills: InspectorDemoSkillResult[];
}

export interface InspectorDemoStudent {
  id: string;
  number: number;
  name: string;
  demoMassar: string;
  level: "الجذع المشترك العلمي";
  className: "الجذع المشترك العلمي 1";
  subject: "الاجتماعيات";
  assessmentType: "تقويم تشخيصي";
  schoolYear: "2026–2027";
  attendance: InspectorDemoAttendance;
  assessmentStatus: InspectorDemoAssessmentStatus;
  history: InspectorDemoSubjectResult | null;
  geography: InspectorDemoSubjectResult | null;
  totalScore: number | null;
  totalMax: 20;
  percent: number | null;
  performanceLevel: string | null;
  success: boolean | null;
  support: boolean | null;
}

export interface InspectorDemoDistributionItem {
  label: string;
  count: number;
  percent: number;
}

export interface InspectorDemoIndicators {
  registered: number;
  present: number;
  absent: number;
  participants: number;
  completionPercent: number;
  historyAverage: number | null;
  geographyAverage: number | null;
  overallAverage: number | null;
  maxScore: number | null;
  minScore: number | null;
  successCount: number;
  successPercent: number | null;
  supportCount: number;
  supportPercent: number | null;
  distribution: InspectorDemoDistributionItem[];
  historySkills: InspectorDemoSkillResult[];
  geographySkills: InspectorDemoSkillResult[];
  commonDifficulties: string[];
}

export interface InspectorDemoDataset {
  version: string;
  title: string;
  level: InspectorDemoStudent["level"];
  className: InspectorDemoStudent["className"];
  subject: InspectorDemoStudent["subject"];
  assessmentType: InspectorDemoStudent["assessmentType"];
  schoolYear: InspectorDemoStudent["schoolYear"];
  successThreshold: number;
  students: InspectorDemoStudent[];
  indicators: InspectorDemoIndicators;
}

interface DemoSubjectPattern {
  history: number[];
  geography: number[];
}

const HISTORY_SKILLS = [
  { id: "h-context", label: "تحديد الإطار التاريخي", max: 2, difficulty: "تحديد السياق والزمن" },
  { id: "h-documents", label: "تحليل الوثائق التاريخية", max: 2, difficulty: "استخراج المعطيات من الوثيقة" },
  { id: "h-chronology", label: "التسلسل الزمني", max: 2, difficulty: "ترتيب الأحداث وربطها" },
  { id: "h-concepts", label: "توظيف المفاهيم التاريخية", max: 2, difficulty: "ضبط المفاهيم الأساسية" },
  { id: "h-writing", label: "التركيب والكتابة التاريخية", max: 2, difficulty: "بناء فقرة منظمة" },
] as const;

const GEOGRAPHY_SKILLS = [
  { id: "g-reading", label: "قراءة المعطيات الجغرافية", max: 2, difficulty: "استخراج المعلومات" },
  { id: "g-map", label: "قراءة الخريطة", max: 2, difficulty: "تحديد المواقع والرموز" },
  { id: "g-chart", label: "قراءة المبيان والجدول", max: 2, difficulty: "قراءة المؤشرات" },
  { id: "g-explanation", label: "التفسير الجغرافي", max: 2, difficulty: "ربط الظواهر بعواملها" },
  { id: "g-writing", label: "التعبير الجغرافي", max: 2, difficulty: "صياغة خلاصة جغرافية" },
] as const;

/** القيم الأولية هي إجابات/نقط المهارات؛ المجموع والنسب تُحسب أدناه آليًا. */
const PRESENT_PATTERNS: DemoSubjectPattern[] = [
  { history: [2, 2, 2, 2, 2], geography: [2, 2, 2, 2, 2] },
  { history: [2, 2, 2, 2, 1], geography: [2, 2, 2, 1, 2] },
  { history: [2, 2, 1, 2, 1], geography: [2, 2, 1, 2, 1] },
  { history: [2, 1, 2, 1, 1], geography: [2, 2, 1, 1, 1] },
  { history: [2, 1, 1, 1, 1], geography: [2, 1, 1, 2, 1] },
  { history: [1, 2, 1, 1, 1], geography: [1, 2, 1, 1, 1] },
  { history: [1, 1, 1, 1, 1], geography: [2, 1, 1, 1, 1] },
  { history: [1, 1, 1, 1, 0], geography: [1, 1, 1, 1, 1] },
  { history: [1, 1, 0, 1, 0], geography: [1, 1, 1, 0, 1] },
  { history: [1, 0, 1, 0, 0], geography: [1, 1, 0, 1, 0] },
];

const round1 = (value: number): number => Math.round(value * 10) / 10;

function levelOf(percent: number): string {
  if (percent >= 80) return "تحكم جيد جدًا";
  if (percent >= 65) return "تحكم جيد";
  if (percent >= 50) return "تحكم متوسط";
  return "يحتاج إلى الدعم";
}

function subjectResult(
  values: number[],
  skills: readonly { id: string; label: string; max: number; difficulty: string }[],
  threshold: number,
): InspectorDemoSubjectResult {
  const max = skills.reduce((sum, skill) => sum + skill.max, 0);
  const score = values.reduce((sum, value) => sum + value, 0);
  const percent = round1((score / max) * 100);
  const skillResults = skills.map((skill, index) => {
    const got = values[index] ?? 0;
    const skillPercent = round1((got / skill.max) * 100);
    return {
      id: skill.id,
      label: skill.label,
      got,
      max: skill.max,
      percent: skillPercent,
      controlled: skillPercent >= threshold,
      difficulty: skill.difficulty,
    };
  });
  return {
    score,
    max,
    percent,
    level: levelOf(percent),
    controlledSkills: skillResults.filter((skill) => skill.controlled).map((skill) => skill.label),
    difficulties: skillResults.filter((skill) => !skill.controlled).map((skill) => skill.difficulty),
    skills: skillResults,
  };
}

function aggregateSkills(
  students: InspectorDemoStudent[],
  subject: "history" | "geography",
  threshold: number,
): InspectorDemoSkillResult[] {
  const totals = new Map<string, { label: string; got: number; max: number; difficulty: string }>();
  students.forEach((student) => {
    const result = student[subject];
    if (!result) return;
    result.skills.forEach((skill) => {
      const current = totals.get(skill.id) ?? { label: skill.label, got: 0, max: 0, difficulty: skill.difficulty };
      current.got += skill.got;
      current.max += skill.max;
      totals.set(skill.id, current);
    });
  });
  return Array.from(totals.entries()).map(([id, item]) => {
    const percent = round1((item.got / item.max) * 100);
    return {
      id,
      label: item.label,
      got: item.got,
      max: item.max,
      percent,
      controlled: percent >= threshold,
      difficulty: item.difficulty,
    };
  });
}

function makeIndicators(students: InspectorDemoStudent[], threshold: number): InspectorDemoIndicators {
  const present = students.filter((student) => student.attendance === "present");
  const average = (selector: (student: InspectorDemoStudent) => number | null): number | null => {
    if (!present.length) return null;
    const values = present.map(selector).filter((value): value is number => value !== null);
    return values.length ? round1(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  };
  const scores = present.map((student) => student.totalScore).filter((value): value is number => value !== null);
  const successCount = present.filter((student) => student.success === true).length;
  const supportCount = present.filter((student) => student.support === true).length;
  const buckets = [
    { label: "أقل من 5/20", min: 0, max: 5 },
    { label: "من 5 إلى أقل من 10/20", min: 5, max: 10 },
    { label: "من 10 إلى أقل من 15/20", min: 10, max: 15 },
    { label: "من 15 إلى 20/20", min: 15, max: 20.01 },
  ];
  const distribution = buckets.map((bucket) => {
    const count = scores.filter((score) => score >= bucket.min && score < bucket.max).length;
    return { label: bucket.label, count, percent: present.length ? round1((count / present.length) * 100) : 0 };
  });
  const historySkills = aggregateSkills(present, "history", threshold);
  const geographySkills = aggregateSkills(present, "geography", threshold);
  const difficultyCounts = new Map<string, number>();
  [...historySkills, ...geographySkills]
    .filter((skill) => !skill.controlled)
    .forEach((skill) => difficultyCounts.set(skill.difficulty, (difficultyCounts.get(skill.difficulty) ?? 0) + 1));
  return {
    registered: students.length,
    present: present.length,
    absent: students.length - present.length,
    participants: present.length,
    completionPercent: students.length ? round1((present.length / students.length) * 100) : 0,
    historyAverage: average((student) => student.history?.score ?? null),
    geographyAverage: average((student) => student.geography?.score ?? null),
    overallAverage: average((student) => student.totalScore),
    maxScore: scores.length ? Math.max(...scores) : null,
    minScore: scores.length ? Math.min(...scores) : null,
    successCount,
    successPercent: present.length ? round1((successCount / present.length) * 100) : null,
    supportCount,
    supportPercent: present.length ? round1((supportCount / present.length) * 100) : null,
    distribution,
    historySkills,
    geographySkills,
    commonDifficulties: Array.from(difficultyCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ar"))
      .slice(0, 6)
      .map(([difficulty]) => difficulty),
  };
}

function makeDataset(): InspectorDemoDataset {
  const successThreshold = 50;
  const students: InspectorDemoStudent[] = Array.from({ length: 40 }, (_, index) => {
    const number = index + 1;
    const present = number <= 10;
    const pattern = PRESENT_PATTERNS[index];
    const history = present && pattern ? subjectResult(pattern.history, HISTORY_SKILLS, successThreshold) : null;
    const geography = present && pattern ? subjectResult(pattern.geography, GEOGRAPHY_SKILLS, successThreshold) : null;
    const totalScore = history && geography ? history.score + geography.score : null;
    const percent = totalScore === null ? null : round1((totalScore / 20) * 100);
    return {
      id: `INSPECTOR-DEMO-TC-SCI-${String(number).padStart(2, "0")}`,
      number,
      name: `التلميذ التجريبي ${String(number).padStart(2, "0")}`,
      demoMassar: `DEMO-MASSAR-${String(number).padStart(3, "0")}`,
      level: "الجذع المشترك العلمي",
      className: "الجذع المشترك العلمي 1",
      subject: "الاجتماعيات",
      assessmentType: "تقويم تشخيصي",
      schoolYear: "2026–2027",
      attendance: present ? "present" : "absent",
      assessmentStatus: present ? "completed" : "absent",
      history,
      geography,
      totalScore,
      totalMax: 20,
      percent,
      performanceLevel: percent === null ? null : levelOf(percent),
      success: percent === null ? null : percent >= successThreshold,
      support: percent === null ? null : percent < successThreshold,
    };
  });
  return {
    version: "inspector-diagnostic-demo-v1",
    title: "التقويم التشخيصي التجريبي — فضاء المفتش",
    level: "الجذع المشترك العلمي",
    className: "الجذع المشترك العلمي 1",
    subject: "الاجتماعيات",
    assessmentType: "تقويم تشخيصي",
    schoolYear: "2026–2027",
    successThreshold,
    students,
    indicators: makeIndicators(students, successThreshold),
  };
}

/** مولّد ثابت بلا تخزين: إعادة الاستدعاء تعيد نفس النموذج المعزول. */
export function getInspectorDiagnosticDemo(): InspectorDemoDataset {
  return makeDataset();
}

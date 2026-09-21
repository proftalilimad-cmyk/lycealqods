import type { InspectorReport, Submission } from "../types";
import { ROSTER_CLASSES, ROSTER_YEAR, type RosterStudent } from "../data/rosters";
import { displayClassName, scheduleForClass } from "../data/diagnosticSchedule";
import { analyse, recommendationsFor, skillState } from "./reportDoc";
import { isDemoSubmission } from "./storage";

export interface InspectorSkillAnalysis {
  skill: string;
  got: number;
  max: number;
  percent: number;
  state: string;
}

export interface InspectorStudentRow {
  rank: number;
  rosterNo?: number;
  name: string;
  massar?: string;
  level: string;
  className: string;
  submission?: Submission;
  score?: number;
  maxScore: number;
  percent?: number;
  controlled: string[];
  uncontrolled: string[];
  needs: string[];
  recommendations: string[];
  attendance: "حاضر" | "غائب";
  assessment: "أنجز" | "لم ينجز";
}

export interface InspectorDistribution {
  label: string;
  min: number;
  max: number;
  count: number;
  percent: number;
}

export interface InspectorAnalysis {
  report: InspectorReport;
  submissions: Submission[];
  students: InspectorStudentRow[];
  totalStudents: number;
  participants: number;
  absent: number;
  participationPercent: number;
  average: number | null;
  averagePercent: number | null;
  maxScore: number | null;
  minScore: number | null;
  maxScoreScale: number;
  successThreshold: number;
  successCount: number;
  successPercent: number | null;
  supportCount: number;
  supportPercent: number | null;
  distribution: InspectorDistribution[];
  skills: InspectorSkillAnalysis[];
  masteredSkills: InspectorSkillAnalysis[];
  supportSkills: InspectorSkillAnalysis[];
  commonDifficulties: string[];
  hasRealResults: boolean;
}

const HISTORY_SKILLS = new Set([
  "مفاهيم تاريخية",
  "التسلسل الزمني للأحداث",
  "ربط المفاهيم",
  "تحليل الوثائق التاريخية",
  "استخراج المعلومات",
  "الاستنتاج",
]);

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function dateValue(raw: string): number | null {
  if (!raw) return null;
  const value = new Date(`${raw}T23:59:59`).getTime();
  return Number.isNaN(value) ? null : value;
}

function reportDateWindow(report: InspectorReport, submission: Submission): boolean {
  const time = new Date(submission.date).getTime();
  if (Number.isNaN(time)) return false;
  const from = dateValue(report.periodFrom);
  const to = dateValue(report.periodTo);
  return (from === null || time >= from - 86_400_000) && (to === null || time <= to);
}

function usesHistory(report: InspectorReport): boolean {
  return report.subject.includes("التاريخ") && !report.subject.includes("الجغرافيا");
}

function usesGeography(report: InspectorReport): boolean {
  return report.subject.includes("الجغرافيا") && !report.subject.includes("التاريخ");
}

export function scoreForReport(report: InspectorReport, submission: Submission): { score: number; max: number; percent: number } {
  if (usesHistory(report)) {
    const score = round2(submission.history);
    return { score, max: 10, percent: round1((score / 10) * 100) };
  }
  if (usesGeography(report)) {
    const score = round2(submission.geography);
    return { score, max: 10, percent: round1((score / 10) * 100) };
  }
  const score = round2(submission.total);
  return { score, max: 20, percent: round1(submission.percent) };
}

function byClassAndPeriod(report: InspectorReport, submissions: Submission[]): Submission[] {
  return submissions
    .filter((submission) => !isDemoSubmission(submission))
    .filter((submission) => !report.className || submission.className === report.className)
    .filter((submission) => (submission.assessmentType ?? "diagnostic") === report.assessmentType)
    .filter((submission) => reportDateWindow(report, submission));
}

function rosterForReport(report: InspectorReport): { students: RosterStudent[]; className: string } {
  const roster = ROSTER_CLASSES.find((item) => item.label === report.className);
  return { students: roster?.students ?? [], className: report.className };
}

function findSubmission(student: RosterStudent, submissions: Submission[]): Submission | undefined {
  return submissions.find((submission) => (student.massar && submission.massar === student.massar) || submission.name === student.name);
}

function studentRows(report: InspectorReport, submissions: Submission[]): InspectorStudentRow[] {
  const roster = rosterForReport(report);
  if (roster.students.length > 0) {
    return roster.students.map((student, index) => {
      const submission = findSubmission(student, submissions);
      const details = submission ? analyse(submission) : undefined;
      const score = submission ? scoreForReport(report, submission) : undefined;
      const controlled = details?.skills.filter((skill) => skill.pct >= report.threshold).map((skill) => skill.skill) ?? [];
      const uncontrolled = details?.skills.filter((skill) => skill.pct < report.threshold).map((skill) => skill.skill) ?? [];
      return {
        rank: index + 1,
        rosterNo: student.n,
        name: student.name,
        massar: student.massar,
        level: report.level,
        className: report.className,
        submission,
        score: score?.score,
        maxScore: score?.max ?? (usesHistory(report) || usesGeography(report) ? 10 : 20),
        percent: score?.percent,
        controlled,
        uncontrolled,
        needs: uncontrolled.slice(0, 3),
        recommendations: submission && details ? recommendationsFor(submission, details).slice(0, 3) : [],
        attendance: submission ? "حاضر" : "غائب",
        assessment: submission ? "أنجز" : "لم ينجز",
      };
    });
  }
  return submissions.map((submission, index) => {
    const details = analyse(submission);
    const score = scoreForReport(report, submission);
    const controlled = details.skills.filter((skill) => skill.pct >= report.threshold).map((skill) => skill.skill);
    const uncontrolled = details.skills.filter((skill) => skill.pct < report.threshold).map((skill) => skill.skill);
    return {
      rank: index + 1,
      name: submission.name,
      massar: submission.massar,
      level: report.level,
      className: report.className,
      submission,
      score: score.score,
      maxScore: score.max,
      percent: score.percent,
      controlled,
      uncontrolled,
      needs: uncontrolled.slice(0, 3),
      recommendations: recommendationsFor(submission, details).slice(0, 3),
      attendance: "حاضر",
      assessment: "أنجز",
    };
  });
}

function skillsForReport(report: InspectorReport, submissions: Submission[]): InspectorSkillAnalysis[] {
  const totals = new Map<string, { got: number; max: number }>();
  submissions.forEach((submission) => {
    Object.entries(submission.skills ?? {}).forEach(([skill, value]) => {
      if (usesHistory(report) && !HISTORY_SKILLS.has(skill)) return;
      if (usesGeography(report) && HISTORY_SKILLS.has(skill)) return;
      const current = totals.get(skill) ?? { got: 0, max: 0 };
      current.got += Number(value.got) || 0;
      current.max += Number(value.max) || 0;
      totals.set(skill, current);
    });
  });
  return Array.from(totals.entries())
    .map(([skill, value]) => {
      const percent = value.max > 0 ? Math.round((value.got / value.max) * 100) : 0;
      return {
        skill,
        got: round2(value.got),
        max: round2(value.max),
        percent,
        state: skillState(percent),
      };
    })
    .sort((a, b) => b.percent - a.percent || a.skill.localeCompare(b.skill, "ar"));
}

function distributions(report: InspectorReport, submissions: Submission[]): InspectorDistribution[] {
  const max = usesHistory(report) || usesGeography(report) ? 10 : 20;
  const edges = max === 10
    ? [
        { label: "أقل من 2.5", min: 0, max: 2.5 },
        { label: "من 2.5 إلى أقل من 5", min: 2.5, max: 5 },
        { label: "من 5 إلى أقل من 7.5", min: 5, max: 7.5 },
        { label: "من 7.5 إلى 10", min: 7.5, max: 10.01 },
      ]
    : [
        { label: "أقل من 5", min: 0, max: 5 },
        { label: "من 5 إلى أقل من 10", min: 5, max: 10 },
        { label: "من 10 إلى أقل من 15", min: 10, max: 15 },
        { label: "من 15 إلى 20", min: 15, max: 20.01 },
      ];
  return edges.map((edge) => {
    const count = submissions.filter((submission) => {
      const score = scoreForReport(report, submission).score;
      return score >= edge.min && score < edge.max;
    }).length;
    return {
      ...edge,
      count,
      percent: submissions.length ? Math.round((count / submissions.length) * 1000) / 10 : 0,
    };
  });
}

export function analyseInspectorReport(report: InspectorReport, allSubmissions: Submission[]): InspectorAnalysis {
  const submissions = byClassAndPeriod(report, allSubmissions);
  const students = studentRows(report, submissions);
  const totalStudents = students.length;
  const participants = submissions.length;
  const absent = Math.max(0, totalStudents - participants);
  const scores = submissions.map((submission) => scoreForReport(report, submission));
  const maxScoreScale = usesHistory(report) || usesGeography(report) ? 10 : 20;
  const average = participants ? round1(scores.reduce((sum, item) => sum + item.score, 0) / participants) : null;
  const averagePercent = participants ? round1(scores.reduce((sum, item) => sum + item.percent, 0) / participants) : null;
  const maxScore = participants ? Math.max(...scores.map((item) => item.score)) : null;
  const minScore = participants ? Math.min(...scores.map((item) => item.score)) : null;
  const successCount = scores.filter((item) => item.percent >= report.threshold).length;
  const supportCount = participants - successCount;
  const skills = skillsForReport(report, submissions);
  const supportSkills = skills.filter((skill) => skill.percent < report.threshold);
  return {
    report,
    submissions,
    students,
    totalStudents,
    participants,
    absent,
    participationPercent: totalStudents ? round1((participants / totalStudents) * 100) : 0,
    average,
    averagePercent,
    maxScore,
    minScore,
    maxScoreScale,
    successThreshold: report.threshold,
    successCount,
    successPercent: participants ? round1((successCount / participants) * 100) : null,
    supportCount,
    supportPercent: participants ? round1((supportCount / participants) * 100) : null,
    distribution: distributions(report, submissions),
    skills,
    masteredSkills: skills.filter((skill) => skill.percent >= report.threshold),
    supportSkills,
    commonDifficulties: supportSkills.slice().sort((a, b) => a.percent - b.percent).slice(0, 5).map((skill) => skill.skill),
    hasRealResults: participants > 0,
  };
}

export function defaultInspectorReport(className = ""): InspectorReport {
  const schedule = scheduleForClass(className);
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `report-${Date.now()}`,
    teacherName: "الأستاذ عماد طليل",
    institution: "الثانوية التأهيلية القدس — القنيطرة",
    academy: "الأكاديمية الجهوية للتربية والتكوين لجهة الرباط سلا القنيطرة",
    directorate: "المديرية الإقليمية بالقنيطرة",
    level: schedule?.bankLevel ?? "الجذع المشترك",
    subject: "الاجتماعيات",
    className,
    schoolYear: ROSTER_YEAR,
    assessmentType: "diagnostic",
    periodFrom: today,
    periodTo: today,
    threshold: 50,
    tools: "بنك التقويم التشخيصي الرقمي، شبكة التصحيح، وتحليل المهارات والكفايات.",
    context: "أُنجز التقويم قصد تشخيص المكتسبات السابقة وتحديد حاجات المتعلمين قبل بناء التعلمات اللاحقة.",
    objectives: "رصد مستوى التحكم، تحديد الصعوبات المشتركة والفروق الفردية، وبناء خطة دعم قابلة للتتبع.",
    supportDuration: "أربعة أسابيع، مع تقويم قصير في نهاية كل أسبوع.",
    status: "draft",
    submissionIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function updateReportFromAnalysis(report: InspectorReport, analysis: InspectorAnalysis): InspectorReport {
  return {
    ...report,
    submissionIds: analysis.submissions.map((submission) => submission.id),
    updatedAt: new Date().toISOString(),
  };
}

export function reportClassLabel(report: InspectorReport): string {
  return displayClassName(report.className) || report.className || "كل الأقسام";
}

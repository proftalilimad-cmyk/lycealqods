import type { Answer, AssessmentStatus, AttendanceStatus, Question, Submission } from "../types";
import { ROSTER_CLASSES, type RosterStudent } from "../data/rosters";
import { getBank } from "../data/testBanks";
import {
  DIAGNOSTIC_SESSIONS,
  displayClassName,
  scheduleForSubmission,
  sessionTimeLabel,
  type DiagnosticSession,
} from "../data/diagnosticSchedule";
import { gradeAutoQuestion, gradeWriting, levelOf } from "./grading";
import { deleteAllCloudSubmissions, loadCloudSubmissions, saveCloudSubmission, type SubmissionSaveResult } from "./cloudStorage";
import { isAssessmentSubmissionConfigured, isCloudConfigured } from "./supabase";

const KEY = "talil_platform_submissions_v1";
/** تغيير الإصدار يعيد إنشاء Demo فقط؛ النتائج الحقيقية مصدرها Supabase. */
const SEED_FLAG = "talil_platform_demo_seed_v5";
export const DEMO_DATA_VERSION = "diagnostic-demo-v3-roster-names";

/**
 * الأقسام التي تدخل في النموذج التجريبي. لا تُستعمل هذه القائمة لإنشاء
 * أي نتيجة حقيقية أو اسم حقيقي؛ كل سجل ناتج عنها يحمل demo=true.
 */
export const DIAGNOSTIC_DEMO_CLASS_LABELS = [
  "جذع مشترك علوم خ ف 1",
  "جذع مشترك علوم خ ف 2",
  "جذع مشترك علوم خ ف 3",
  "الثانية بكالوريا علوم إنسانية خ ف 1",
  "الثانية بكالوريا علوم إنسانية خ ف 2",
] as const;

const DIAGNOSTIC_DEMO_CLASS_SET = new Set<string>(DIAGNOSTIC_DEMO_CLASS_LABELS);

interface DemoClassConfig {
  className: string;
  bankId: string;
  sessionId: string;
  count: number;
  firstStudentNo: number;
}

const DEMO_CLASSES: DemoClassConfig[] = [
  {
    className: "جذع مشترك علوم خ ف 1",
    bankId: "tc-sci",
    sessionId: "tc-sci-1-2026-09-17",
    count: 10,
    firstStudentNo: 1,
  },
  {
    className: "جذع مشترك علوم خ ف 2",
    bankId: "tc-sci",
    sessionId: "tc-sci-2",
    count: 10,
    firstStudentNo: 11,
  },
  {
    className: "جذع مشترك علوم خ ف 3",
    bankId: "tc-sci",
    sessionId: "tc-sci-3-2026-09-17",
    count: 10,
    firstStudentNo: 21,
  },
  {
    className: "الثانية بكالوريا علوم إنسانية خ ف 1",
    bankId: "bac2-hum",
    sessionId: "bac2-hum-1-2026-09-21",
    count: 8,
    firstStudentNo: 1,
  },
  {
    className: "الثانية بكالوريا علوم إنسانية خ ف 2",
    bankId: "bac2-hum",
    sessionId: "bac2-hum-2-2026-09-21",
    count: 2,
    firstStudentNo: 9,
  },
];

export interface DiagnosticStudentAttendance {
  student: RosterStudent;
  attendanceStatus: AttendanceStatus;
  assessmentStatus: AssessmentStatus;
  isDemo: boolean;
  submission?: Submission;
}

export interface DiagnosticAttendanceSummary {
  className: string;
  total: number;
  present: number;
  absent: number;
  participants: number;
  absentStudents: RosterStudent[];
  students: DiagnosticStudentAttendance[];
}

/** سجل مستقل للتلميذ داخل القسم، قبل ربطه بسجل نتيجة التقويم. */
export interface DiagnosticStudentRecord {
  student: {
    firstName: string;
    lastName: string;
    fullName: string;
    massarCode: string;
    level: string;
    className: string;
  };
  attendanceStatus: AttendanceStatus;
  assessmentStatus: AssessmentStatus;
  isDemo: boolean;
  submission?: Submission;
}

interface DemoProfile {
  id: string;
  targetCorrect: number;
  focus: "excellent" | "history" | "geography" | "documents" | "concepts" | "mixed";
  writingStrong: boolean;
}

/** خمسة ناجحين وخمسة محتاجين للدعم في كل قسم علمي: النسبة تُستخرج من النقط. */
const DEMO_PROFILES: DemoProfile[] = [
  { id: "excellent", targetCorrect: 19, focus: "excellent", writingStrong: true },
  { id: "very-good", targetCorrect: 17, focus: "excellent", writingStrong: true },
  { id: "good", targetCorrect: 14, focus: "excellent", writingStrong: true },
  { id: "medium", targetCorrect: 11, focus: "mixed", writingStrong: false },
  { id: "borderline", targetCorrect: 11, focus: "mixed", writingStrong: false },
  { id: "history-support", targetCorrect: 8, focus: "history", writingStrong: false },
  { id: "geography-support", targetCorrect: 8, focus: "geography", writingStrong: false },
  { id: "documents-support", targetCorrect: 7, focus: "documents", writingStrong: false },
  { id: "concepts-support", targetCorrect: 8, focus: "concepts", writingStrong: false },
  { id: "mixed-support", targetCorrect: 9, focus: "mixed", writingStrong: false },
];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function isWritingQuestion(question: Question): boolean {
  return question.kind === "writing";
}

function correctAnswer(question: Question): Answer {
  switch (question.kind) {
    case "mcq":
    case "doc":
      return question.answer;
    case "tf":
      return question.answer;
    case "ordering":
      return question.items.map((_, index) => index);
    case "matching":
      return Object.fromEntries(question.pairs.map((_, index) => [index, index]));
    case "writing":
      return "تتناول هذه الفقرة المجال المغربي وموقعه وسكانه وأنشطته الاقتصادية، كما تفسر الهجرة القروية بعوامل الشغل والخدمات. ويساعد تنظيم الأفكار وتوظيف مفاهيم الكثافة السكانية والتنمية والمجال على بناء تحليل واضح. وفي الختام نستنتج أن فهم المجال يحتاج إلى الربط بين الموقع والسكان والأنشطة والموارد.";
  }
}

function wrongAnswer(question: Question): Answer {
  switch (question.kind) {
    case "mcq":
    case "doc":
      return (question.answer + 1) % question.options.length;
    case "tf":
      return !question.answer;
    case "ordering":
      return question.items.map((_, index) => (index + 1) % question.items.length);
    case "matching":
      return Object.fromEntries(question.pairs.map((_, index) => [index, (index + 1) % question.pairs.length]));
    case "writing":
      return "فقرة تجريبية قصيرة تحتاج إلى تنظيم الأفكار وتوظيف مفاهيم الاجتماعيات.";
  }
}

function focusScore(question: Question, focus: DemoProfile["focus"]): number {
  if (focus === "excellent") return 5;
  if (focus === "history") return question.subject === "geography" ? 5 : 1;
  if (focus === "geography") return question.subject === "history" ? 5 : 1;
  if (focus === "documents") return question.kind === "doc" ? 0 : 5;
  if (focus === "concepts") return question.skill.includes("مفاهيم") ? 0 : 5;
  return ((question.id * 17) % 11) / 10;
}

function answersForProfile(questions: Question[], profile: DemoProfile): Answer[] {
  const ranked = questions
    .map((question, index) => ({ question, index, priority: focusScore(question, profile.focus) }))
    .sort((a, b) => b.priority - a.priority || a.index - b.index);
  const writing = ranked.find((item) => isWritingQuestion(item.question));
  const nonWriting = ranked.filter((item) => !isWritingQuestion(item.question));
  const correctIndexes = new Set<number>();
  if (profile.writingStrong && writing) correctIndexes.add(writing.index);
  nonWriting.slice(0, Math.max(0, profile.targetCorrect - correctIndexes.size)).forEach((item) => correctIndexes.add(item.index));
  return questions.map((question, index) => (correctIndexes.has(index) ? correctAnswer(question) : wrongAnswer(question)));
}

function scheduledDate(session: DiagnosticSession | undefined): string {
  if (!session?.date) return new Date().toISOString();
  const [day, month, year] = session.date.split("/");
  return new Date(`${year}-${month}-${day}T${session.start ?? "09:00"}:00+01:00`).toISOString();
}

function demoSkills(questions: Question[], answers: Answer[]): Record<string, { got: number; max: number }> {
  const skills: Record<string, { got: number; max: number }> = {};
  questions.forEach((question, index) => {
    const got = gradeAutoQuestion(question, answers[index] ?? null);
    if (!skills[question.skill]) skills[question.skill] = { got: 0, max: 0 };
    skills[question.skill].got = round2(skills[question.skill].got + got);
    skills[question.skill].max = round2(skills[question.skill].max + question.points);
  });
  return skills;
}

function demoWriting(questions: Question[], answers: Answer[]): { text: string; rubric: Submission["rubric"] } {
  const writingIndex = questions.findIndex(isWritingQuestion);
  if (writingIndex < 0) return { text: "", rubric: undefined };
  const text = typeof answers[writingIndex] === "string" ? (answers[writingIndex] as string) : "";
  return { text, rubric: gradeWriting(text) };
}

function demoSubmission(config: DemoClassConfig, order: number, profile: DemoProfile): Submission {
  const bank = getBank(config.bankId);
  const questions = bank?.questions ?? [];
  const answers = answersForProfile(questions, profile);
  const scores = questions.map((question, index) => gradeAutoQuestion(question, answers[index] ?? null));
  const history = round2(scores.reduce((sum, score, index) => sum + (questions[index]?.subject === "history" ? score : 0), 0));
  const geography = round2(scores.reduce((sum, score, index) => sum + (questions[index]?.subject === "geography" ? score : 0), 0));
  const total = round2(scores.reduce((sum, score) => sum + score, 0));
  const percent = round1((total / 20) * 100);
  const level = levelOf(percent);
  const studentNumber = config.firstStudentNo + order;
  const studentNo = `DEMO-${String(studentNumber).padStart(3, "0")}`;
  const roster = ROSTER_CLASSES.find((item) => item.label === config.className);
  const rosterStudent = roster?.students[order];
  if (!rosterStudent) throw new Error(`لا يوجد تلميذ في اللائحة للعينة التجريبية: ${config.className} / ${order + 1}`);
  const name = rosterStudent.name;
  const session = DIAGNOSTIC_SESSIONS.find((item) => item.id === config.sessionId);
  const writing = demoWriting(questions, answers);

  return {
    id: `demo-diagnostic-${config.sessionId}-${studentNo}`,
    name,
    className: config.className,
    studentNo,
    massar: rosterStudent.massar,
    bankId: config.bankId,
    bankLabel: bank?.branch,
    bankLevel: bank?.level,
    diagnosticLevel: bank?.level === "الثانية باكالوريا" ? "2bac" : "jad3-moshtarak",
    sessionId: config.sessionId,
    date: scheduledDate(session),
    history,
    geography,
    total,
    percent,
    level: level.label,
    skills: demoSkills(questions, answers),
    answers,
    rubric: writing.rubric,
    writingText: writing.text,
    timeUsedSeconds: 25 * 60 + ((order * 7) % 26) * 60,
    attendanceStatus: "present",
    assessmentStatus: "completed",
    demo: true,
    isDemo: true,
    dataSource: "demo",
  };
}

function seeded(): Submission[] {
  return DEMO_CLASSES.flatMap((config, classIndex) =>
    Array.from({ length: config.count }, (_, order) => {
      const profile = DEMO_PROFILES[(order + classIndex) % DEMO_PROFILES.length];
      return demoSubmission(config, order, profile);
    }),
  );
}

export function isDemoSubmission(submission: Submission): boolean {
  return submission.demo === true || submission.isDemo === true || submission.dataSource === "demo";
}

/**
 * يبني حالة الحضور من اللائحة الكاملة، لا من عدد النتائج فقط.
 * في النموذج التجريبي تُحجز أول عينة من اللائحة للمشاركين، بينما تبقى
 * بقية الأسماء غائبة بلا إجابات أو نقط أو تحليل.
 */
export function getDiagnosticAttendance(submissions: Submission[], className?: string): DiagnosticAttendanceSummary[] {
  return ROSTER_CLASSES.filter(
    (roster) => (!className ? DIAGNOSTIC_DEMO_CLASS_SET.has(roster.label) : roster.label === className),
  )
    .map((roster) => {
      const classSubmissions = submissions.filter((submission) => submission.className === roster.label);
      if (classSubmissions.length === 0) return null;

      const assignments = new Map<string, Submission>();
      const usedRosterKeys = new Set<string>();
      const rosterKey = (student: RosterStudent) => student.massar || student.name;
      const findRosterStudent = (submission: Submission): RosterStudent | undefined => roster.students.find(
        (student) => Boolean(submission.massar && student.massar === submission.massar) || student.name === submission.name,
      );

      // النتائج الحقيقية تُربط بما يوجد فعليًا في اللائحة عبر مسار أو الاسم.
      classSubmissions.filter((submission) => !isDemoSubmission(submission)).forEach((submission) => {
        const student = findRosterStudent(submission);
        if (student && !usedRosterKeys.has(rosterKey(student))) {
          assignments.set(rosterKey(student), submission);
          usedRosterKeys.add(rosterKey(student));
        }
      });

      // Demo هو عينة من اللائحة: لا نوسّع حجم القسم بعدد النتائج، بل نربطها
      // بالطلاب الأوائل غير المستعملين ونُبقي بقية اللائحة غائبة.
      classSubmissions.filter(isDemoSubmission).forEach((submission) => {
        const matched = findRosterStudent(submission);
        if (matched && usedRosterKeys.has(rosterKey(matched))) return;
        const student = matched ?? roster.students.find((candidate) => !usedRosterKeys.has(rosterKey(candidate)));
        if (student) {
          assignments.set(rosterKey(student), submission);
          usedRosterKeys.add(rosterKey(student));
        }
      });

      const students = roster.students.map((student): DiagnosticStudentAttendance => {
        const submission = assignments.get(rosterKey(student));
        return {
          student,
          attendanceStatus: submission ? "present" : "absent",
          assessmentStatus: submission ? "completed" : "absent",
          isDemo: Boolean(submission && isDemoSubmission(submission)),
          submission,
        };
      });
      const present = students.filter((entry) => entry.attendanceStatus === "present").length;
      const absentStudents = students.filter((entry) => entry.attendanceStatus === "absent").map((entry) => entry.student);
      return {
        className: roster.label,
        total: roster.students.length,
        present,
        absent: roster.students.length - present,
        participants: students.filter((entry) => entry.assessmentStatus === "completed").length,
        absentStudents,
        students,
      };
    })
    .filter((summary): summary is DiagnosticAttendanceSummary => summary !== null);
}

/** اللائحة الكاملة بصيغة موحّدة: سجل التلميذ + الحضور + المشاركة. */
export function getDiagnosticStudentRecords(submissions: Submission[], className?: string): DiagnosticStudentRecord[] {
  return getDiagnosticAttendance(submissions, className).flatMap((summary) => {
    const session = DIAGNOSTIC_SESSIONS.find((item) => item.className === summary.className);
    return summary.students.map((entry) => {
      const parts = entry.student.name.trim().split(/\s+/);
      return {
        student: {
          firstName: parts[0] ?? "",
          lastName: parts.slice(1).join(" "),
          fullName: entry.student.name,
          massarCode: entry.student.massar,
          level: session?.bankLevel ?? "غير محدد",
          className: summary.className,
        },
        attendanceStatus: entry.attendanceStatus,
        assessmentStatus: entry.assessmentStatus,
        isDemo: entry.isDemo,
        submission: entry.submission,
      };
    });
  });
}

export function getSubmissions(): Submission[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Submission[]) : [];
  } catch {
    return [];
  }
}

function normalizeRealSubmission(sub: Submission): Submission {
  return {
    ...sub,
    dataSource: sub.dataSource ?? "real",
    demo: false,
    isDemo: false,
    attendanceStatus: sub.attendanceStatus ?? "present",
    assessmentStatus: sub.assessmentStatus ?? "completed",
    assessmentType: sub.assessmentType ?? "diagnostic",
  };
}

/**
 * الحفظ الدائم للنتيجة يمر عبر Supabase فقط. لا نضع سجل التلميذ الحقيقي
 * في localStorage ولا نعرضه على أنه محفوظ إذا فشل الاتصال المركزي.
 */
export async function addSubmission(sub: Submission): Promise<SubmissionSaveResult> {
  const value = normalizeRealSubmission(sub);
  if (!isAssessmentSubmissionConfigured()) {
    return {
      localSaved: false,
      cloudConfigured: isCloudConfigured(),
      cloudSaved: false,
      error: "التخزين المركزي غير مهيأ. أضف VITE_PUBLIC_SITE_KEY واربطه بقاعدة Supabase.",
    };
  }
  try {
    await saveCloudSubmission(value);
    return { localSaved: false, cloudConfigured: true, cloudSaved: true };
  } catch (error) {
    return {
      localSaved: false,
      cloudConfigured: true,
      cloudSaved: false,
      error: error instanceof Error ? error.message : "تعذّر الحفظ المركزي.",
    };
  }
}

/**
 * مصدر لوحة الأستاذ: عند تفعيل السحابة نستعمل نتائج قاعدة البيانات، ونبقي
 * Demo محليًا ومعزولًا للعرض. لا نعرض أي سجل حقيقي من localStorage
 * على أنه مركزي إذا فشل الاتصال.
 */
export async function loadSubmissions(): Promise<{ submissions: Submission[]; remote: boolean; error?: string }> {
  ensureSeeded();
  const localDemo = getSubmissions().filter(isDemoSubmission);
  if (!isCloudConfigured()) return { submissions: localDemo, remote: false, error: "التخزين المركزي غير مهيأ؛ النتائج الحقيقية لا تُعرض من ذاكرة المتصفح." };
  const remote = await loadCloudSubmissions();
  if (remote.error) {
    return {
      submissions: localDemo,
      remote: true,
      error: remote.error,
    };
  }
  return {
    submissions: [...localDemo, ...remote.submissions.filter((submission) => !isDemoSubmission(submission))],
    remote: true,
  };
}

/**
 * Demo هو المحتوى الوحيد المسموح ببقائه في localStorage. هذا يحذف تلقائيًا
 * سجلات النتائج الحقيقية التي خزنتها الإصدارات القديمة، مع بقاء مصدرها
 * الرسمي هو Supabase فقط.
 */
export function ensureSeeded(): void {
  const local = getSubmissions();
  const localDemo = local.filter(isDemoSubmission);
  if (localStorage.getItem(SEED_FLAG) === DEMO_DATA_VERSION) {
    if (local.length !== localDemo.length) localStorage.setItem(KEY, JSON.stringify(localDemo));
    return;
  }
  localStorage.setItem(KEY, JSON.stringify([...localDemo, ...seeded()]));
  localStorage.setItem(SEED_FLAG, DEMO_DATA_VERSION);
}

/** إعادة إنشاء Demo من الصفر؛ لا تلمس النتائج المركزية. */
export function reseedDemoData(): void {
  localStorage.setItem(KEY, JSON.stringify(seeded()));
  localStorage.setItem(SEED_FLAG, DEMO_DATA_VERSION);
}

/** حذف Demo فقط؛ النتائج الحقيقية لا تُحفظ محليًا أصلًا. */
export function clearDemoData(): void {
  localStorage.setItem(KEY, JSON.stringify([]));
  localStorage.setItem(SEED_FLAG, DEMO_DATA_VERSION);
}

/** يمسح كل النتائج صراحةً كما كانت الوظيفة القديمة؛ أزرار Demo لا تستعمله. */
export function clearAllData(): void {
  localStorage.removeItem(KEY);
  localStorage.setItem(SEED_FLAG, DEMO_DATA_VERSION);
}

/** يمسح النتائج المحلية والمركزية بعد تأكيد الأستاذ. */
export async function clearAllStoredData(): Promise<void> {
  clearAllData();
  if (isCloudConfigured()) await deleteAllCloudSubmissions();
}

export function exportCsv(list: Submission[]): void {
  const header = "ر.ت,التلميذ(ة),رقم مسار,القسم,الحضور,التقويم,موعد التقويم,التاريخ /10,الجغرافيا /10,المجموع /20,النسبة,المستوى,تاريخ الإرسال\n";
  const attendance = getDiagnosticAttendance(list);
  const rosterRows = attendance.flatMap((summary) => summary.students.map((entry) => ({ ...entry, className: summary.className })));
  const rows = rosterRows.length > 0
    ? rosterRows
      .map((entry) => {
        const s = entry.submission;
        return [
          entry.student.n,
          entry.student.name,
          entry.student.massar,
          displayClassName(entry.className),
          entry.attendanceStatus === "present" ? "حاضر" : "غائب",
          entry.assessmentStatus === "completed" ? "أنجز" : "لم ينجز",
          s ? sessionTimeLabel(scheduleForSubmission(s)) : "—",
          s ? s.history : "—",
          s ? s.geography : "—",
          s ? s.total : "—",
          s ? `${s.percent}%` : "—",
          s?.level ?? "—",
          s ? new Date(s.date).toLocaleDateString("fr-MA") : "—",
        ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",");
      })
      .join("\n")
    : list
      .map(
        (s) =>
          `"—","${s.name}","${s.massar ?? "—"}","${displayClassName(s.className)}","حاضر","أنجز","${sessionTimeLabel(scheduleForSubmission(s))}",${s.history},${s.geography},${s.total},${s.percent}%,"${s.level}","${new Date(
            s.date,
          ).toLocaleDateString("fr-MA")}"`,
      )
      .join("\n");
  const csv = "﻿" + header + rows;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "نتائج-التقويم-التشخيصي.csv";
  a.click();
  URL.revokeObjectURL(url);
}

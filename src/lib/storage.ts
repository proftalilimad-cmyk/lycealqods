import type { Submission } from "../types";
import { ROSTER_CLASSES, type RosterClass, type RosterStudent } from "../data/rosters";
import { displayClassName, scheduleForSubmission, sessionTimeLabel } from "../data/diagnosticSchedule";
import { levelOf } from "./grading";

const KEY = "talil_platform_submissions_v1";
/* إصدار جديد حتى تُستبدل النماذج القديمة بالأقسام الرسمية المطلوبة عند فتح اللوحة. */
const SEED_FLAG = "talil_platform_seeded_v4";

/** الأقسام المستعملة في بيانات المعاينة الخاصة بالتقويم التشخيصي. */
export const DIAGNOSTIC_DEMO_CLASS_LABELS = [
  "جذع مشترك علوم خ ف 1",
  "جذع مشترك علوم خ ف 3",
] as const;

const DIAGNOSTIC_DEMO_CLASS_SET = new Set<string>(DIAGNOSTIC_DEMO_CLASS_LABELS);

export interface DiagnosticAttendanceSummary {
  className: string;
  total: number;
  present: number;
  absent: number;
  absentStudents: RosterStudent[];
}

/* مولّد شبه عشوائي ثابت: يعطي نتائج مختلفة بين التلاميذ، ويحافظ عليها بعد إعادة تحميل الصفحة. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shuffled<T>(items: T[], seed: number): T[] {
  const result = [...items];
  const random = seededRandom(seed);
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const halfPoint = (n: number) => Math.round(n * 2) / 2;

function demoSkills(history: number, geography: number, total: number) {
  return {
    "مفاهيم تاريخية": { got: Math.min(3, halfPoint(history * 0.3)), max: 3 },
    "التسلسل الزمني للأحداث": { got: Math.min(2, halfPoint(history * 0.24)), max: 2 },
    "تحليل الوثائق التاريخية": { got: Math.min(2, halfPoint(history * 0.2)), max: 2 },
    "قراءة الجداول الإحصائية": { got: Math.min(1, halfPoint(geography * 0.12)), max: 1 },
    "قراءة المبيانات": { got: Math.min(1, halfPoint(geography * 0.1 + 0.1)), max: 1 },
    "قراءة الخرائط": { got: Math.min(1, halfPoint(geography * 0.11)), max: 1 },
    "التعبير والكتابة": { got: Math.min(1, halfPoint((total / 20) * 0.9 + 0.05)), max: 1 },
  };
}

function demoSubmission(roster: RosterClass, student: RosterStudent, order: number, needsSupport: boolean): Submission {
  const random = seededRandom(hashSeed(`${roster.label}:${student.massar}`));
  /* نصف الحاضرين دون 10/20 (يحتاجون إلى الدعم)، والنصف الآخر فوق عتبة النجاح. */
  const total = needsSupport ? halfPoint(5 + random() * 4.5) : halfPoint(10.5 + random() * 9);
  let history = halfPoint(total * (0.38 + random() * 0.3));
  let geography = halfPoint(total - history);
  if (geography > 10) {
    geography = 10;
    history = halfPoint(total - geography);
  }
  if (history > 10) {
    history = 10;
    geography = halfPoint(total - history);
  }
  const percent = Math.round((total / 20) * 1000) / 10;

  return {
    id: `demo-diagnostic-${roster.id}-${student.massar}`,
    name: student.name,
    className: roster.label,
    studentNo: String(student.n),
    massar: student.massar,
    date: new Date(Date.now() - (order + 1) * 86400000).toISOString(),
    history,
    geography,
    total,
    percent,
    level: levelOf(percent).label,
    bankId: "tc-sci",
    bankLabel: "الجذع المشترك العلمي",
    bankLevel: "الجذع المشترك",
    diagnosticLevel: "jad3-moshtarak",
    skills: demoSkills(history, geography, total),
    demo: true,
  };
}

function seeded(): Submission[] {
  const targetClasses = ROSTER_CLASSES.filter((roster) => DIAGNOSTIC_DEMO_CLASS_SET.has(roster.label));
  return targetClasses.flatMap((roster) => {
    /* نصف القسم بالتقريب عند العدد الفردي: 16 من 31 في «علوم خ ف 3». */
    const presentCount = Math.round(roster.students.length / 2);
    return shuffled(roster.students, hashSeed(roster.label))
      .slice(0, presentCount)
      .map((student, index) => demoSubmission(roster, student, index, index < Math.floor(presentCount / 2)));
  });
}

/** مقارنة النتائج باللوائح الرسمية لإظهار الحاضرين والغائبين دون إنشاء نتيجة للغائب. */
export function getDiagnosticAttendance(submissions: Submission[], className?: string): DiagnosticAttendanceSummary[] {
  return ROSTER_CLASSES.filter(
    (roster) => DIAGNOSTIC_DEMO_CLASS_SET.has(roster.label) && (!className || roster.label === className),
  ).map((roster) => {
    const presentKeys = new Set(
      submissions
        .filter((submission) => submission.className === roster.label)
        .flatMap((submission) => [submission.massar, submission.name].filter(Boolean) as string[]),
    );
    const absentStudents = roster.students.filter((student) => !presentKeys.has(student.massar) && !presentKeys.has(student.name));
    return {
      className: roster.label,
      total: roster.students.length,
      present: roster.students.length - absentStudents.length,
      absent: absentStudents.length,
      absentStudents,
    };
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

export function addSubmission(sub: Submission): void {
  const list = getSubmissions();
  list.push(sub);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function ensureSeeded(): void {
  if (localStorage.getItem(SEED_FLAG)) return;
  /* نحافظ على أي نتائج حقيقية ونستبدل فقط النماذج التوضيحية القديمة. */
  const realSubmissions = getSubmissions().filter((submission) => !submission.demo);
  localStorage.setItem(KEY, JSON.stringify([...realSubmissions, ...seeded()]));
  localStorage.setItem(SEED_FLAG, "1");
}

/** إعادة إنشاء النماذج التوضيحية عند الحاجة مع الحفاظ على النتائج الحقيقية. */
export function reseedDemoData(): void {
  const realSubmissions = getSubmissions().filter((submission) => !submission.demo);
  localStorage.setItem(KEY, JSON.stringify([...realSubmissions, ...seeded()]));
  localStorage.setItem(SEED_FLAG, "1");
}

export function clearDemoData(): void {
  const list = getSubmissions().filter((s) => !s.demo);
  localStorage.setItem(KEY, JSON.stringify(list));
  localStorage.setItem(SEED_FLAG, "1"); // لا نعيد البذر
}

export function clearAllData(): void {
  localStorage.removeItem(KEY);
  localStorage.setItem(SEED_FLAG, "1");
}

export function exportCsv(list: Submission[]): void {
  const header = "التلميذ,القسم,المستوى - المسلك,موعد التقويم,التاريخ /10,الجغرافيا /10,المجموع /20,النسبة,المستوى,تاريخ الإرسال\n";
  const rows = list
    .map(
      (s) =>
        `"${s.name}","${displayClassName(s.className)}","${s.bankLabel ?? "الجذع المشترك"}","${sessionTimeLabel(scheduleForSubmission(s))}",${s.history},${s.geography},${s.total},${s.percent}%,${s.level},"${new Date(
          s.date
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

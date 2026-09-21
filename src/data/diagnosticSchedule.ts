/**
 * مواعيد التقويم التشخيصي المصرّح بها من الأستاذ.
 * هذه البيانات تنظيمية فقط؛ لا تُنشئ أي تلميذ أو إجابة أو نتيجة.
 */
export interface DiagnosticSession {
  id: string;
  bankId: string;
  bankLevel: string;
  branch: string;
  className: string;
  displayClass: string;
  date?: string;
  start?: string;
  end?: string;
  /** عدد الحاضرين المصرّح به في الموعد، لا يُنشئ سجلات فردية. */
  reportedParticipants?: number;
}

export const DIAGNOSTIC_SESSIONS: DiagnosticSession[] = [
  {
    id: "tc-sci-1-2026-09-17",
    bankId: "tc-sci",
    bankLevel: "الجذع المشترك",
    branch: "الجذع المشترك العلمي",
    className: "جذع مشترك علوم خ ف 1",
    displayClass: "الجذع المشترك العلمي 1",
    date: "17/09/2026",
    start: "09:00",
    end: "10:00",
  },
  {
    id: "tc-sci-2",
    bankId: "tc-sci",
    bankLevel: "الجذع المشترك",
    branch: "الجذع المشترك العلمي",
    className: "جذع مشترك علوم خ ف 2",
    displayClass: "الجذع المشترك العلمي 2",
  },
  {
    id: "tc-sci-3-2026-09-17",
    bankId: "tc-sci",
    bankLevel: "الجذع المشترك",
    branch: "الجذع المشترك العلمي",
    className: "جذع مشترك علوم خ ف 3",
    displayClass: "الجذع المشترك العلمي 3",
    date: "17/09/2026",
    start: "08:00",
    end: "09:00",
  },
  {
    id: "bac2-hum-1-2026-09-21",
    bankId: "bac2-hum",
    bankLevel: "الثانية باكالوريا",
    branch: "الثانية باكالوريا علوم إنسانية",
    className: "الثانية بكالوريا علوم إنسانية خ ف 1",
    displayClass: "الثانية باكالوريا علوم إنسانية 1",
    date: "21/09/2026",
    start: "08:00",
    end: "09:00",
    reportedParticipants: 8,
  },
  {
    id: "bac2-hum-2-2026-09-21",
    bankId: "bac2-hum",
    bankLevel: "الثانية باكالوريا",
    branch: "الثانية باكالوريا علوم إنسانية",
    className: "الثانية بكالوريا علوم إنسانية خ ف 2",
    displayClass: "الثانية باكالوريا علوم إنسانية 2",
    date: "21/09/2026",
    start: "10:00",
    end: "12:00",
    reportedParticipants: 2,
  },
];

export function scheduleForClass(className?: string, bankId?: string): DiagnosticSession | undefined {
  if (!className) return undefined;
  return DIAGNOSTIC_SESSIONS.find((session) => session.className === className && (!bankId || session.bankId === bankId))
    ?? DIAGNOSTIC_SESSIONS.find((session) => session.className === className);
}

export function scheduleForSubmission(submission: { className?: string; bankId?: string; sessionId?: string }): DiagnosticSession | undefined {
  return (submission.sessionId ? DIAGNOSTIC_SESSIONS.find((session) => session.id === submission.sessionId) : undefined)
    ?? scheduleForClass(submission.className, submission.bankId);
}

export function displayClassName(className?: string): string {
  return DIAGNOSTIC_SESSIONS.find((session) => session.className === className)?.displayClass ?? className ?? "قسم غير محدد";
}

export function sessionTimeLabel(session?: DiagnosticSession): string {
  if (!session?.date || !session.start || !session.end) return "لم يُحدَّد الموعد بعد";
  return `${session.date} — ${session.start} إلى ${session.end}`;
}

export function sessionDateLabel(session?: DiagnosticSession): string {
  return session?.date ?? "لم يُحدَّد";
}

export function sessionClockLabel(session?: DiagnosticSession): string {
  return session?.start && session?.end ? `${session.start} – ${session.end}` : "لم يُحدَّد";
}

export function scheduledClassesForLevel(level?: string, bankId?: string): DiagnosticSession[] {
  return DIAGNOSTIC_SESSIONS.filter((session) => (!level || session.bankLevel === level) && (!bankId || session.bankId === bankId));
}

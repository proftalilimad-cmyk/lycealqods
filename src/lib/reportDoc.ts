/* ============================================================
   وثائق التقارير الفردية والجماعية — التقويم التشخيصي
   ------------------------------------------------------------
   هذه المكتبة «نقية» (بلا DOM): تبني من نتيجة تلميذ محفوظة
   (Submission) كل ما يلزم لإخراج وثيقة رسمية:

     • أسماء الملفات بالصيغة المطلوبة:
         اسم_التلميذ_رقم_التلميذ_التقويم_التشخيصي.pdf
         مثال: محمد_العربي_001_التقويم_التشخيصي.pdf
       وداخل الأرشيف:  001_محمد_العربي.pdf  داخل مجلدات
       مرتبة حسب المستوى ثم القسم.

     • وثيقة التلميذ بثلاثة أوضاع:
         answers → الأسئلة وإجابات التلميذ والجواب الصحيح ونقطة كل سؤال
         report  → النتيجة النهائية + تحليل القوة والضعف + توصيات الدعم
         full    → الملف الفردي الكامل (الغلاف + الأجوبة + التقرير)

     • تقرير شامل للقسم/المجموعة.

   كل المعطيات من مصادر حقيقية داخل المشروع: بنك الأسئلة
   (data/testBanks)، شبكة التنقيط والتصحيح (lib/grading)، اللوائح
   الرسمية للأقسام (data/rosters). لا تُخترع أي معلومة: إن لم تكن
   إجابات التلميذ محفوظة (سجلات قديمة أو توضيحية) تُذكر الحقيقة صراحة.
   ============================================================ */
import type { Answer, Question, RubricResult, Subject, Submission } from "../types";
import { QUESTIONS } from "../data/questions";
import { getBank } from "../data/testBanks";
import { gradeAutoQuestion, levelOf, RECOMMENDATIONS } from "./grading";
import { ROSTER_SCHOOL, ROSTER_YEAR } from "../data/rosters";
import { displayClassName, scheduleForSubmission, sessionClockLabel, sessionDateLabel } from "../data/diagnosticSchedule";

/* ===================== معطيات ثابتة ===================== */
export const MINISTRY_LINE = "المملكة المغربية — وزارة التربية الوطنية والتعليم الأولي والرياضية";
export const SCHOOL_NAME = ROSTER_SCHOOL;
export const SCHOOL_SHORT = "ثانوية القدس، القنيطرة";
export const SCHOOL_YEAR = ROSTER_YEAR;
export const TEACHER_NAME = "الأستاذ عماد طليل";
export const SUBJECT_NAME = "الاجتماعيات";
export const TEST_TITLE = "التقويم التشخيصي";
export const TEST_FILE_TAG = "التقويم_التشخيصي";
export const SIGNATURE = `إنجاز: ${TEACHER_NAME} — ${SCHOOL_SHORT}`;

const LETTERS = ["أ", "ب", "ج", "د", "هـ", "و"];

/* ===================== أسماء الملفات ===================== */
const ILLEGAL_CHARS = /[\\/:*?"<>|]+/g;

/** جزء صالح للاستعمال في اسم ملف: مسافات → شرطة سفلية، وحذف الرموز الممنوعة */
export function fileNamePart(raw: string): string {
  const cleaned = (typeof raw === "string" ? raw : String(raw ?? ""))
    .trim()
    .replace(/[\u0640\u064B-\u0652]/g, "") // تطويل وتشكيل
    .replace(/\s+/g, "_")
    .replace(ILLEGAL_CHARS, "")
    .replace(/[.,;!?،؛]+/g, "")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || "بدون_اسم";
}

/** رقم التلميذ على ثلاثة أرقام (001) كما في الصيغة المطلوبة */
export function studentNumber3(sub: Submission): string {
  const raw = (sub.studentNo ?? "").trim();
  if (!raw) return "000";
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? digits.padStart(3, "0").slice(-3) : fileNamePart(raw);
}

/** اسم الملف الأساسي بلا امتداد: اسم_التلميذ_رقم_التلميذ_التقويم_التشخيصي */
export function studentBaseName(sub: Submission): string {
  return `${fileNamePart(sub.name)}_${studentNumber3(sub)}_${TEST_FILE_TAG}`;
}

/** اسم الملف بامتداده */
export function studentFileName(sub: Submission, ext: "pdf" | "html" | "doc" | "xlsx"): string {
  return `${studentBaseName(sub)}.${ext}`;
}

/** اسم الملف داخل الأرشيف: 001_محمد_العربي.pdf */
export function zipEntryBase(sub: Submission): string {
  return `${studentNumber3(sub)}_${fileNamePart(sub.name)}`;
}

/** ترتيب الأرشيف: مجلد المستوى ثم مجلد القسم */
export function zipFolders(sub: Submission): string {
  const level = fileNamePart(bankLevelOf(sub) || "المستوى_غير_محدد");
  const cls = fileNamePart(displayClassName(sub.className));
  return `${level}/${cls}`;
}

/** المسار الكامل لملف تلميذ داخل الأرشيف */
export function zipEntryPath(sub: Submission, ext: "html" | "doc"): string {
  return `${zipFolders(sub)}/${zipEntryBase(sub)}.${ext}`;
}

/** اسم أرشيف المجموعة: التقويم_التشخيصي_الجذع_المشترك_العلمي.zip */
export function groupZipName(subs: Submission[], scopeLabel?: string): string {
  const raw = scopeLabel ?? (subs.length > 0 ? branchOf(subs[0]) : "");
  /* إن مُرّر عنوان كامل يبدأ بـ«التقويم التشخيصي —» نأخذ الجزء الوصفي فقط */
  const label = String(raw).split("—").pop()?.trim() || String(raw);
  return `${TEST_FILE_TAG}_${fileNamePart(label || "النتائج")}.zip`;
}

/* ===================== معطيات التقويم ===================== */
export function branchOf(sub: Submission): string {
  return sub.bankLabel ?? getBank(sub.bankId)?.branch ?? "الجذع المشترك";
}

export function bankLevelOf(sub: Submission): string {
  return sub.bankLevel ?? getBank(sub.bankId)?.level ?? "الجذع المشترك";
}

/** أسئلة التقويم الذي أجراه التلميذ (من البنك المحفوظ، وإلا البنك الافتراضي) */
export function questionsOf(sub: Submission): Question[] {
  return getBank(sub.bankId)?.questions ?? QUESTIONS;
}

export function subjectLabel(s: Subject): string {
  return s === "history" ? "التاريخ" : "الجغرافيا";
}

export function kindLabel(q: Question): string {
  switch (q.kind) {
    case "mcq":
      return "اختيار من متعدد";
    case "tf":
      return "صح / خطأ";
    case "ordering":
      return "ترتيب أحداث";
    case "matching":
      return "ربط مفاهيم";
    case "doc":
      return "تحليل وثيقة";
    case "writing":
      return "كتابة فقرة";
    default:
      return "سؤال";
  }
}

/** إجابة التلميذ بصيغة مقروءة */
export function answerText(q: Question, a: Answer): string {
  if (a === null || a === undefined || a === "") return "— لم يُجب —";
  switch (q.kind) {
    case "mcq":
    case "doc": {
      const idx = typeof a === "number" ? a : Number(a);
      return Number.isNaN(idx) ? String(a) : `${LETTERS[idx] ?? idx}) ${q.options[idx] ?? ""}`.trim();
    }
    case "tf":
      return a ? "صح" : "خطأ";
    case "ordering": {
      if (!Array.isArray(a)) return String(a);
      return a.map((origIdx, pos) => `${pos + 1}. ${q.items[origIdx] ?? "؟"}`).join(" ← ");
    }
    case "matching": {
      if (typeof a !== "object" || Array.isArray(a)) return String(a);
      const rec = a as Record<number, number>;
      return q.pairs
        .map((p, termIdx) => {
          const picked = rec[termIdx];
          return `${p.term} ← ${picked === undefined || picked === null ? "—" : (q.pairs[picked]?.def ?? "—")}`;
        })
        .join(" ؛ ");
    }
    case "writing":
      return typeof a === "string" ? a.trim() : String(a);
    default:
      return String(a);
  }
}

/** الجواب الصحيح (يُعرض عند الحاجة: في التصحيح أو حين يخطئ التلميذ) */
export function correctText(q: Question): string {
  switch (q.kind) {
    case "mcq":
    case "doc":
      return `${LETTERS[q.answer]}) ${q.options[q.answer]}`;
    case "tf":
      return q.answer ? "صح" : "خطأ";
    case "ordering":
      return q.items.map((it, i) => `${i + 1}. ${it}`).join(" ← ");
    case "matching":
      return q.pairs.map((p) => `${p.term} ← ${p.def}`).join(" ؛ ");
    case "writing":
      return "فقرة تُقيَّم وفق شبكة التنقيط المعتمدة (أسفل الوثيقة)";
    default:
      return "—";
  }
}

export interface QuestionRow {
  index: number;
  question: Question;
  studentAnswer: string;
  correct: string;
  got: number;
  points: number;
  isCorrect: boolean;
  answered: boolean;
}

export interface QuestionRows {
  rows: QuestionRow[];
  /** هل إجابات التلميذ محفوظة فعلًا؟ (السجلات القديمة/التوضيحية لا تحتويها) */
  hasAnswers: boolean;
  answeredCount: number;
  correctCount: number;
  maxPoints: number;
}

/** جدول أسئلة التقويم مع إجابات التلميذ ونقطته في كل سؤال */
export function questionRows(sub: Submission): QuestionRows {
  const questions = questionsOf(sub);
  const hasAnswers = Array.isArray(sub.answers) && sub.answers.length > 0;
  const rows: QuestionRow[] = questions.map((q, i) => {
    const a: Answer = hasAnswers ? (sub.answers as Answer[])[i] ?? null : null;
    const got = hasAnswers ? Math.round(gradeAutoQuestion(q, a) * 100) / 100 : 0;
    const answered = a !== null && a !== undefined && a !== "";
    return {
      index: i + 1,
      question: q,
      studentAnswer: hasAnswers ? answerText(q, a) : "— غير محفوظة في هذا السجل —",
      correct: correctText(q),
      got,
      points: q.points,
      isCorrect: hasAnswers && got >= q.points - 0.001,
      answered: hasAnswers && answered,
    };
  });
  return {
    rows,
    hasAnswers,
    answeredCount: rows.filter((r) => r.answered).length,
    correctCount: rows.filter((r) => r.isCorrect).length,
    maxPoints: questions.reduce((s, q) => s + q.points, 0),
  };
}

/* ===================== التحليل التربوي ===================== */
export interface SkillRow {
  skill: string;
  got: number;
  max: number;
  pct: number;
  state: string;
}

export interface StudentAnalysis {
  skills: SkillRow[];
  strengths: string[];
  weaknesses: string[];
  historyPct: number;
  geographyPct: number;
  levelLabel: string;
  writing: { label: string; ratio: number; note: string }[];
}

export const skillState = (pct: number): string =>
  pct >= 75 ? "متحكَّم فيها" : pct >= 50 ? "في طور التحكّم" : "تحتاج دعمًا";

/** تحليل مواطن القوة والضعف من النتائج المحفوظة فعلًا */
export function analyse(sub: Submission): StudentAnalysis {
  const skills: SkillRow[] = Object.entries(sub.skills ?? {})
    .map(([skill, v]) => {
      const pct = v.max > 0 ? Math.round((v.got / v.max) * 100) : 0;
      return { skill, got: Math.round(v.got * 100) / 100, max: v.max, pct, state: skillState(pct) };
    })
    .sort((a, b) => b.pct - a.pct);

  const strengths = skills
    .filter((s) => s.pct >= 70)
    .map((s) => `${s.skill}: ${s.got}/${s.max} (${s.pct}٪) — ${s.state}`);
  const weaknesses = skills
    .filter((s) => s.pct < 50)
    .map((s) => `${s.skill}: ${s.got}/${s.max} (${s.pct}٪) — ${s.state}`);

  const historyMax = skills.filter((s) => HISTORY_SKILLS.includes(s.skill)).reduce((a, s) => a + s.max, 0) || 10;
  const historyGot = skills.filter((s) => HISTORY_SKILLS.includes(s.skill)).reduce((a, s) => a + s.got, 0);
  const geographyMax = skills.filter((s) => !HISTORY_SKILLS.includes(s.skill)).reduce((a, s) => a + s.max, 0) || 10;
  const geographyGot = skills.filter((s) => !HISTORY_SKILLS.includes(s.skill)).reduce((a, s) => a + s.got, 0);

  return {
    skills,
    strengths: strengths.length > 0 ? strengths : ["لا توجد مهارة بنسبة تحكّم ≥ 70٪ في هذا التقويم."],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["لا توجد مهارة تحت عتبة 50٪ — تعثّر محدود."],
    historyPct: Math.round((historyGot / historyMax) * 100),
    geographyPct: Math.round((geographyGot / geographyMax) * 100),
    levelLabel: sub.level || levelOf(sub.percent).label,
    writing: (sub.rubric?.criteria ?? []).map((c) => ({
      label: c.label,
      ratio: Math.round(c.ratio * 100),
      note: c.note,
    })),
  };
}

const HISTORY_SKILLS = [
  "مفاهيم تاريخية",
  "التسلسل الزمني للأحداث",
  "تحليل الوثائق التاريخية",
  "استخراج المعلومات",
  "الاستنتاج",
];

/** توصيات الدعم التربوي: من المهارات المتعثّرة + شبكة الكتابة + النتيجة العامة */
export function recommendationsFor(sub: Submission, analysis: StudentAnalysis): string[] {
  const out: string[] = [];

  for (const s of analysis.skills) {
    if (s.pct < 60) {
      const rec = RECOMMENDATIONS[s.skill];
      out.push(rec ? `${s.skill} (${s.pct}٪): ${rec}` : `${s.skill} (${s.pct}٪): إعادة بناء هذا المكتسب عبر تمارين موجّهة في قسم التطبيقات.`);
    }
  }

  const rubric: RubricResult | undefined = sub.rubric;
  if (rubric && rubric.criteria.length > 0) {
    const weak = [...rubric.criteria].sort((a, b) => a.ratio - b.ratio).slice(0, 2);
    for (const c of weak) {
      if (c.ratio < 0.6) out.push(`كتابة الفقرة — ${c.label} (${Math.round(c.ratio * 100)}٪): ${c.note}`);
    }
  }

  if (analysis.historyPct + 20 < analysis.geographyPct)
    out.push("الأولوية للتاريخ: مراجعة الخط الزمني للأحداث الكبرى والمفاهيم التاريخية قبل الانتقال إلى أنشطة جديدة.");
  else if (analysis.geographyPct + 20 < analysis.historyPct)
    out.push("الأولوية للجغرافيا: تدريب على قراءة الخرائط والمبيانات والجداول الإحصائية بمنهجية الوصف ← التفسير ← التعميم.");

  if (sub.percent < 50)
    out.push("يُقترح إدماج التلميذ(ة) في حصة دعم مركّزة مع تقويم قصير أسبوعيًا لقياس التقدّم.");
  else if (sub.percent < 70)
    out.push("يُقترح دعم منتظم: إنجاز تطبيق واحد أسبوعيًا من قسم التطبيقات مع التصحيح النموذجي.");
  else out.push("مكتسبات متينة: يُقترح الاستثمار في أنشطة التوسّع (تحليل وثائق إضافية، كتابة مقالات قصيرة).");

  return out;
}

/* ===================== التواريخ والمدد ===================== */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    const day = new Intl.DateTimeFormat("ar-MA", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
    const time = new Intl.DateTimeFormat("fr-MA", { hour: "2-digit", minute: "2-digit" }).format(d);
    return `${day} — الساعة ${time}`;
  } catch {
    return d.toLocaleDateString("fr-MA");
  }
}

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m} دقيقة و${s} ثانية` : `${m} دقيقة`;
}

export const round1 = (n: number): number => Math.round(n * 10) / 10;
export const round2 = (n: number): number => Math.round(n * 100) / 100;

/* ===================== تهريب HTML ===================== */
const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
export const esc = (s: string): string => String(s ?? "").replace(/[&<>"]/g, (c) => HTML_ESCAPES[c]);
export const nl2br = (s: string): string => esc(s).replace(/\n/g, "<br/>");

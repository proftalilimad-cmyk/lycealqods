import type { Answer, Question, RubricCriterion, RubricResult, SkillsMap } from "../types";
import { normalizeArabic } from "./arabic";
import { REFERENCE_CONCEPTS } from "../data/questions";

/* ===================== التصحيح الآلي ===================== */

export function gradeAutoQuestion(q: Question, a: Answer): number {
  if (a === null || a === undefined) return 0;
  switch (q.kind) {
    case "mcq":
    case "doc":
      return a === q.answer ? q.points : 0;
    case "tf":
      return a === q.answer ? q.points : 0;
    case "ordering": {
      if (!Array.isArray(a) || a.length === 0) return 0;
      const correct = a.filter((origIdx, pos) => origIdx === pos).length;
      return (correct / q.items.length) * q.points;
    }
    case "matching": {
      if (typeof a !== "object" || Array.isArray(a)) return 0;
      const rec = a as Record<number, number>;
      const correct = q.pairs.filter((_, termIdx) => rec[termIdx] === termIdx).length;
      return (correct / q.pairs.length) * q.points;
    }
    case "writing":
      return gradeWriting(typeof a === "string" ? a : "").total * q.points;
    default:
      return 0;
  }
}

/* ===================== شبكة تنقيط الكتابة ===================== */

const RUBRIC_TEMPLATE = [
  { key: "understand", label: "فهم الموضوع والتركيز على المطلوب", weight: 0.2 },
  { key: "info", label: "صحة المعلومات وغناها", weight: 0.2 },
  { key: "organisation", label: "تنظيم الأفكار وتسلسلها", weight: 0.2 },
  { key: "concepts", label: "توظيف المفاهيم التاريخية/الجغرافية", weight: 0.2 },
  { key: "expression", label: "سلامة التعبير وبناء الجمل", weight: 0.1 },
  { key: "conclusion", label: "القدرة على الاستنتاج والخلاصة", weight: 0.1 },
];

const CONNECTORS = ["لان", "بسبب", "مما ادى", "اذ", "ثم", "بالاضافه", "كما", "كذلك", "غير ان", "من جهه", "بان", "حيث", "وبالتالي"];
const CONCLUSION_MARKERS = ["نستنتج", "خلاصه", "في الختام", "وبالتالي", "لذلك", "ومن تم", "واخيرا"];

const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * تحليل استرشادي متعدد المعايير للفقرة المكتوبة.
 * لا يعتمد على الكلمات المفتاحية فقط، بل على مؤشرات متكاملة:
 * الحجم، البنية، التنويع الجملي، الرابطات المنطقية، المفاهيم، علامات الترقيم وموضع الخلاصة.
 */
export function gradeWriting(raw: string): RubricResult {
  const text = raw.trim();
  const normalized = normalizeArabic(text);
  const words = normalized.split(/\s+/).filter((w) => w.length > 1);
  const sentences = text
    .split(/[.!؟?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).filter((w) => w.length > 1).length >= 3);
  const punctuationCount = (text.match(/[،,؛:()«».!؟?-]/g) || []).length;
  const distinctWords = new Set(words).size;
  const lexicalVariety = words.length > 0 ? distinctWords / words.length : 0;

  const conceptsFound = REFERENCE_CONCEPTS.filter((c) => normalized.includes(c));
  const connectorsFound = CONNECTORS.filter((c) => normalized.includes(c));
  const conclAny = CONCLUSION_MARKERS.some((m) => normalized.includes(m));
  const tailNorm = normalized.slice(Math.max(0, normalized.length - Math.floor(normalized.length / 3)));
  const conclInTail = CONCLUSION_MARKERS.some((m) => tailNorm.includes(m));

  const avgSentenceLen = sentences.length > 0 ? words.length / sentences.length : 0;

  const ratios: Record<string, { ratio: number; note: string }> = {
    understand: {
      ratio: clamp01(0.45 * Math.min(1, words.length / 70) + 0.55 * Math.min(1, conceptsFound.length / 3)),
      note: `حجم الفقرة: ${words.length} كلمة تقريبًا — ارتباطها بموضوع المطلوب: ${conceptsFound.length > 0 ? "واضح" : "محدود"}.`,
    },
    info: {
      ratio: clamp01(Math.min(1, sentences.length / 6) * (0.6 + 0.4 * lexicalVariety)),
      note: `${sentences.length} جملة مفيدة بتنويع معجمي ${Math.round(lexicalVariety * 100)}٪ (تجنب التكرار يدل على غنى المعلومات).`,
    },
    organisation: {
      ratio: clamp01(0.5 * Math.min(1, connectorsFound.length / 3) + 0.5 * Math.min(1, sentences.length / 5)),
      note: `روابط منطقية مستعملة (${connectorsFound.length}): تسلسل الأفكار ${connectorsFound.length >= 2 ? "منظم" : "يحتاج مزيدًا من الروابط"}.`,
    },
    concepts: {
      ratio: clamp01(conceptsFound.length / 4),
      note:
        conceptsFound.length > 0
          ? `مفاهيم موظفة: ${conceptsFound.slice(0, 5).join("، ")}${conceptsFound.length > 5 ? "…" : ""}`
          : "لم يتم رصد مفاهيم من مادة الاجتماعيات — وظّف مصطلحات المادة الدقيقة.",
    },
    expression: {
      ratio: clamp01(
        (avgSentenceLen >= 4 && avgSentenceLen <= 32 ? 0.5 : 0.25) + 0.5 * Math.min(1, punctuationCount / 6)
      ),
      note: `متوسط طول الجملة ${Math.round(avgSentenceLen)} كلمة — الترقيم ${punctuationCount >= 4 ? "موظف بشكل جيد" : "محدود"}.`,
    },
    conclusion: {
      ratio: conclInTail ? 1 : conclAny ? 0.5 : 0,
      note: conclInTail
        ? "خلاصة واضحة في ختام الفقرة."
        : conclAny
          ? "يوجد مؤشر استنتاج لكنه ليس في موضعه الختامي الأمثل."
          : "الفقرة تفتقد خلاصة ختامية (نستنتج، خلاصة، وبالتالي...).",
    },
  };

  const criteria: RubricCriterion[] = RUBRIC_TEMPLATE.map((c) => ({
    ...c,
    ratio: ratios[c.key].ratio,
    score: round2(c.weight * ratios[c.key].ratio),
    note: ratios[c.key].note,
  }));

  return { criteria, total: round2(criteria.reduce((s, c) => s + c.score, 0)) };
}

/* ===================== المستويات والمهارات ===================== */

export function levelOf(percent: number): { label: string; tone: "excellent" | "verygood" | "good" | "mid" | "support" } {
  if (percent >= 80) return { label: "ممتاز", tone: "excellent" };
  if (percent >= 70) return { label: "جيد جدًا", tone: "verygood" };
  if (percent >= 60) return { label: "جيد", tone: "good" };
  if (percent >= 50) return { label: "متوسط", tone: "mid" };
  return { label: "يحتاج إلى الدعم", tone: "support" };
}

export const RECOMMENDATIONS: Record<string, string> = {
  "مفاهيم تاريخية": "مراجعة المفاهيم والتواريخ الأساسية في دروس التاريخ بقسم الدروس.",
  "التسلسل الزمني للأحداث": "التدريب على بناء خط زمني للأحداث الكبرى وترتيبها ذهنيًا قبل الحفظ.",
  "ربط المفاهيم": "إعداد بطاقات مفاهيم (المفهوم ← المدلول) ومراجعتها بانتظام.",
  "تحليل الوثائق التاريخية": "الاشتغال على منهجية تحليل الوثيقة التاريخية عبر قسم المنهجيات.",
  "استخراج المعلومات": "التدريب على تحديد معلومات النص دون إضافة معلومات خارجية — راجع منهجية تحليل الوثائق.",
  الاستنتاج: "التدريب على صياغة خلاصات قصيرة بعد قراءة كل وثيقة أو نص.",
  "مفاهيم جغرافية": "مراجعة المفاهيم الجغرافية الأساسية (المجال، الكثافة، الفلاحة البورية والسقوية...).",
  "قراءة الخرائط": "التدريب على قراءة الخرائط: المفتاح، مؤشر الشمال، ومقياس الرسم — عبر قسم التطبيقات.",
  "قراءة الجداول الإحصائية": "التدريب على قراءة الجداول الإحصائية خطوة بخطوة (العنوان، الوحدات، المنحى).",
  "قراءة المبيانات": "إنجاز تمارين إضافية في قراءة المبيانات بقسم التطبيقات.",
  "تحليل المعطيات الجغرافية": "ربط المعطيات ببعضها واتباع منهجية: ملاحظة ← مقارنة ← تفسير.",
  "التعبير والكتابة": "التدريب الأسبوعي على كتابة فقرة قصيرة وفق شبكة التنقيط المعروضة في هذا التقويم.",
};

export function buildSkillsMap(questions: Question[], answers: Answer[]): SkillsMap {
  const map: SkillsMap = {};
  questions.forEach((q, i) => {
    const got = gradeAutoQuestion(q, answers[i]);
    if (!map[q.skill]) map[q.skill] = { got: 0, max: 0 };
    map[q.skill].got += got;
    map[q.skill].max += q.points;
  });
  // تقريب النقاط
  Object.values(map).forEach((v) => {
    v.got = round2(v.got);
  });
  return map;
}

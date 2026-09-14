import type { Route } from "../routes";
import { LEVELS } from "./curriculum";
import { getLessonContent, hasLessonContent, lessonKey } from "./lessonContent";
import { APPLICATIONS } from "./applications";
import { TEST_BANKS } from "./testBanks";
import { TEACHER_FILES } from "./teacherFiles";
import { REFERENCE_FRAMEWORKS, REGIONAL_EXAMS } from "./regionalExams";
import { DECKS, deckTaskCount } from "./decks";

/* ============================================================
   مكتبة الموارد التعليمية — طبقة البيانات
   ------------------------------------------------------------
   تُجمَّع الموارد من ثلاثة مصادر:
   1) موارد مُولَّدة تلقائيًا من محتوى المنصة (دروس PDF، تطبيقات، تقويمات)
   2) وثائق بيانية مُعدّة للعرض التفاعلي (جداول، مبيانات، خرائط تخطيطية)
   3) ملفات الأستاذ (src/data/teacherFiles.ts) وروابط خارجية موثوقة
   ============================================================ */

export type ResourceType = "pdf" | "slides" | "map" | "table" | "chart" | "exercise" | "exam" | "national" | "regional" | "image";

export type ResourceLevel = "الجذع المشترك" | "الأولى باكالوريا" | "الثانية باكالوريا" | "جميع المستويات";
export type ResourceSubject = "التاريخ" | "الجغرافيا" | "مشترك";

/** وثيقة بيانية تُعرض داخل المنصة (بدون ملف خارجي) */
export interface TableDataDoc {
  kind: "table";
  caption: string;
  columns: string[];
  rows: string[][];
  unit?: string;
  note?: string;
  questions?: string[];
}

export interface ChartDataDoc {
  kind: "bar" | "line" | "pie";
  caption: string;
  unit?: string;
  series: { label: string; value: number }[];
  note?: string;
  questions?: string[];
}

export interface MapDataDoc {
  kind: "map";
  caption: string;
  sketch: "quartier" | "density" | "climate" | "relief";
  legend: { color: string; label: string }[];
  note?: string;
  questions?: string[];
}

export type DataDoc = TableDataDoc | ChartDataDoc | MapDataDoc;

export type ResourceAction =
  | { kind: "route"; route: Route; label?: string }
  | { kind: "url"; url: string; site?: string; label?: string }
  | { kind: "file"; url: string; size?: string; label?: string; correctionUrl?: string; correctionSize?: string }
  | { kind: "data"; data: DataDoc; methodId?: string; label?: string };

export interface ResourceItem {
  id: string;
  type: ResourceType;
  title: string;
  desc: string;
  level: ResourceLevel;
  subject: ResourceSubject;
  tags?: string[];
  /** سنة الإصدار (للامتحانات والفروض) */
  year?: number;
  /** مفتاح الدرس المرتبط إن وُجد */
  lessonKey?: string;
  /** الجهة (للامتحانات الجهوية) */
  region?: string;
  action: ResourceAction;
}

export const RESOURCE_TYPES: { id: ResourceType; label: string; plural: string; desc: string }[] = [
  { id: "pdf", label: "درس PDF", plural: "دروس وملخصات PDF", desc: "دروس كاملة قابلة للطباعة أو الحفظ بصيغة PDF" },
  { id: "slides", label: "عرض", plural: "عروض تفاعلية", desc: "عروض الدروس المبنية على صفحات الكتاب المدرسي مع الاشتغال على الوثائق" },
  { id: "map", label: "خريطة", plural: "خرائط وخطاطات", desc: "خرائط تخطيطية وخطاطات تركيبية للتدرب على القراءة والتحليل" },
  { id: "table", label: "جدول", plural: "جداول إحصائية", desc: "جداول رقمية للتدرب على منهجية قراءة الجدول" },
  { id: "chart", label: "مبيان", plural: "مبيانات", desc: "مبيانات بالأعمدة والمنحنيات والدوائر للتحليل" },
  { id: "exercise", label: "تمرين", plural: "تمارين وتطبيقات", desc: "تطبيقات مصححة حسب المهارة والمستوى" },
  { id: "exam", label: "فرض", plural: "فروض وتقويمات", desc: "تقويمات محروسة بمؤقت وتصحيح آلي" },
  { id: "national", label: "امتحان وطني", plural: "امتحانات وطنية", desc: "مواضيع الامتحان الوطني الموحد (2 باك) مع عناصر الإجابة" },
  { id: "regional", label: "امتحان جهوي", plural: "امتحانات جهوية", desc: "مواضيع الامتحان الجهوي الموحد (1 باك) مع عناصر الإجابة — حسب الجهة والسنة" },
  { id: "image", label: "صورة", plural: "صور ووثائق بصرية", desc: "صور تاريخية ووثائق مرئية" },
];

export const RESOURCE_LEVELS: ResourceLevel[] = ["الجذع المشترك", "الأولى باكالوريا", "الثانية باكالوريا"];

/* ------------------------------------------------------------
   1) موارد مولَّدة تلقائيًا من محتوى المنصة
   ------------------------------------------------------------ */
function generatedLessonPdfs(): ResourceItem[] {
  const out: ResourceItem[] = [];
  for (const lv of LEVELS) {
    for (const br of lv.branches) {
      for (const subj of br.subjects) {
        const units = br.units[subj.id] ?? [];
        units.forEach((unit, ui) => {
          unit.lessons.forEach((lesson, li) => {
            if (lesson.soon || !lesson.title) return;
            const key = lessonKey(br.id, subj.id, ui, li);
            if (!hasLessonContent(key)) return;
            const content = getLessonContent(key);
            out.push({
              id: `pdf-${key}`,
              type: "pdf",
              title: content?.title ?? lesson.title,
              desc: `${br.label} · ${unit.title}`,
              level: lv.label as ResourceLevel,
              subject: subj.label === "التاريخ" ? "التاريخ" : subj.label === "الجغرافيا" ? "الجغرافيا" : "مشترك",
              tags: [br.label, unit.title, ...(content?.glossary.slice(0, 4).map((g) => g.term) ?? [])],
              lessonKey: key,
              action: { kind: "route", route: { view: "lesson", id: key }, label: "فتح وطباعة PDF" },
            });
          });
        });
      }
    }
  }
  return out;
}

function generatedExercises(): ResourceItem[] {
  return APPLICATIONS.map((a) => ({
    id: `ex-${a.id}`,
    type: "exercise",
    title: a.title,
    desc: `${a.skillTag} · ${a.duration} · ${a.points} نقاط · تصحيح نموذجي مفصل`,
    level: a.level as ResourceLevel,
    subject: a.subject,
    tags: [a.skillTag, ...a.docs.map((d) => d.label)],
    action: { kind: "route", route: { view: "apps", id: a.id }, label: "فتح التطبيق" },
  }));
}

function generatedExams(): ResourceItem[] {
  return TEST_BANKS.map((b) => ({
    id: `exam-${b.id}`,
    type: "exam",
    title: `تقويم تشخيصي — ${b.branch}`,
    desc: `${b.desc} · ${b.questions.length} سؤالًا · /20 · تصحيح آلي فوري`,
    level: b.level as ResourceLevel,
    subject: "مشترك",
    tags: b.focus,
    action: { kind: "route", route: { view: "test", bank: b.id }, label: "بدء التقويم" },
  }));
}

/* ------------------------------------------------------------
   2) وثائق بيانية تفاعلية (جداول، مبيانات، خرائط تخطيطية)
   الأرقام تقريبية لأغراض تعليمية، مطابقة للوثائق المعتمدة في التقويمات والتطبيقات.
   ------------------------------------------------------------ */
const DATA_DOCS: ResourceItem[] = [
  /* ---------- جداول ---------- */
  {
    id: "tbl-maroc-urbain-rural",
    type: "table",
    title: "توزيع سكان المغرب بين الوسطين الحضري والقروي (1982–2024)",
    desc: "جدول تطوري بنسب مئوية للتدرب على استخراج المنحى العام وتفسير التمدن.",
    level: "الجذع المشترك",
    subject: "الجغرافيا",
    tags: ["التمدن", "الهجرة القروية", "السكان"],
    action: {
      kind: "data",
      methodId: "analysis-stat-table",
      data: {
        kind: "table",
        caption: "نسبة سكان المغرب حسب وسط الإقامة (نِسَب تقريبية لأغراض تعليمية)",
        columns: ["الوسط", "1982", "1994", "2004", "2014", "2024"],
        rows: [
          ["حضري", "40٪", "48٪", "55٪", "60٪", "65٪"],
          ["قروي", "60٪", "52٪", "45٪", "40٪", "35٪"],
        ],
        note: "المصدر: معطيات مبسطة مستوحاة من الإحصاءات العامة للسكان والسكنى.",
        questions: [
          "قدّم الجدول: نوعه، موضوعه، المجال والفترة الزمنية.",
          "استخرج نسبة سكان الحواضر سنتي 1982 و2024 واحسب الفارق.",
          "صف المنحى العام لتطور الوسطين.",
          "فسّر تسارع التمدن بالمغرب بعاملين على الأقل.",
        ],
      },
    },
  },
  {
    id: "tbl-dev-compare",
    type: "table",
    title: "مقارنة مؤشرات ثلاثة بلدان (كثافة، تمدن، خدمات)",
    desc: "جدول مقارن يدرّب على الربط بين مؤشرات مستوى التنمية.",
    level: "الأولى باكالوريا",
    subject: "الجغرافيا",
    tags: ["التنمية", "التمدن", "الكثافة السكانية"],
    action: {
      kind: "data",
      methodId: "analysis-stat-table",
      data: {
        kind: "table",
        caption: "مؤشرات مقارنة لثلاثة بلدان (أرقام تقريبية لأغراض تعليمية)",
        columns: ["البلد", "الكثافة (ن/كلم²)", "نسبة التمدن ٪", "حصة الخدمات من النشاط ٪"],
        rows: [
          ["بلد أ (متقدم)", "120", "85", "75"],
          ["بلد ب (صاعد)", "45", "62", "55"],
          ["بلد ج (نامٍ)", "18", "38", "30"],
        ],
        questions: [
          "رتّب البلدان الثلاثة حسب نسبة التمدن.",
          "ما العلاقة بين نسبة التمدن وحصة الخدمات؟",
          "استنتج مستوى تنمية كل بلد مع التعليل.",
        ],
      },
    },
  },
  {
    id: "tbl-age-structure",
    type: "table",
    title: "التركيبة العمرية: مقارنة بلد متقدم وبلد نامٍ",
    desc: "يُبرز الجدول تباين الفئات العمرية ويُمهّد لمفهومي الشيخوخة والفتوّة الديمغرافية.",
    level: "الأولى باكالوريا",
    subject: "الجغرافيا",
    tags: ["السكان", "التركيبة العمرية", "الانتقال الديمغرافي"],
    action: {
      kind: "data",
      methodId: "analysis-stat-table",
      data: {
        kind: "table",
        caption: "توزيع السكان حسب الفئات العمرية الكبرى (نِسَب تقريبية تعليمية)",
        columns: ["الفئة", "بلد (أ) متقدم", "بلد (ج) نامٍ"],
        rows: [
          ["أقل من 15 سنة", "18٪", "42٪"],
          ["15 – 64 سنة", "58٪", "53٪"],
          ["65 سنة فأكثر", "24٪", "5٪"],
        ],
        questions: [
          "قارن نسبة الشباب ونسبة الشيوخ في البلدين.",
          "ما الانعكاسات الاجتماعية والاقتصادية لكل بنية عمرية؟",
        ],
      },
    },
  },
  {
    id: "tbl-agri-actifs",
    type: "table",
    title: "نسبة النشيطين في الفلاحة حسب مستوى التنمية",
    desc: "مؤشر بسيط لقياس تطور بنية الاقتصاد وعلاقتها بالتنمية.",
    level: "الأولى باكالوريا",
    subject: "الجغرافيا",
    tags: ["السكان النشيطون", "الفلاحة", "التنمية"],
    action: {
      kind: "data",
      methodId: "analysis-stat-table",
      data: {
        kind: "table",
        caption: "نسبة النشيطين الفلاحيين من مجموع السكان النشيطين (تقريبي تعليمي)",
        columns: ["البلد", "نسبة النشيطين الفلاحيين"],
        rows: [
          ["بلد (أ) متقدم", "3٪"],
          ["بلد (ب) صاعد", "25٪"],
          ["بلد (ج) نامٍ", "55٪"],
        ],
        questions: ["ماذا تدل نسبة النشيطين الفلاحيين المرتفعة عن بنية الاقتصاد؟", "اربط بين هذه النسبة ومستوى التصنيع."],
      },
    },
  },
  {
    id: "tbl-maroc-pop",
    type: "table",
    title: "تطور عدد سكان المغرب (1960–2024)",
    desc: "معطيات ديمغرافية للتدرب على حساب معدل النمو ووصف الوتيرة.",
    level: "الثانية باكالوريا",
    subject: "الجغرافيا",
    tags: ["سكان المغرب", "النمو الديمغرافي"],
    action: {
      kind: "data",
      methodId: "analysis-stat-table",
      data: {
        kind: "table",
        caption: "عدد سكان المغرب بالملايين (أرقام مقرّبة لأغراض تعليمية)",
        columns: ["السنة", "1960", "1982", "2004", "2014", "2024"],
        rows: [["عدد السكان (مليون)", "≈12", "≈20", "≈30", "≈34", "≈37"]],
        questions: [
          "احسب الزيادة المطلقة بين 1960 و2024.",
          "قارن وتيرة النمو بين الفترتين 1960–1982 و2004–2024.",
          "فسّر تباطؤ النمو الديمغرافي في العقود الأخيرة.",
        ],
      },
    },
  },
  {
    id: "tbl-agri-rain",
    type: "table",
    title: "التباين الفلاحي بين منطقتين حسب التساقطات",
    desc: "يُبرز أثر العامل المناخي في المردودية الفلاحية بالمغرب.",
    level: "الجذع المشترك",
    subject: "الجغرافيا",
    tags: ["الفلاحة", "المناخ", "الأرياف"],
    action: {
      kind: "data",
      methodId: "analysis-stat-table",
      data: {
        kind: "table",
        caption: "التساقطات والمردودية الفلاحية في منطقتين (أرقام تقريبية تعليمية)",
        columns: ["المنطقة", "التساقطات السنوية", "نوع الفلاحة السائد", "المردودية"],
        rows: [
          ["المنطقة أ (سهول أطلنتية)", "≈800 ملم", "بورية وسقوية كثيفة", "مرتفعة"],
          ["المنطقة ب (هضاب شرقية)", "≈250 ملم", "بورية معاشية ورعي", "منخفضة"],
        ],
        questions: ["ما العلاقة بين كمية التساقطات ونوع الفلاحة؟", "اقترح تدبيرين للتخفيف من أثر الجفاف في المنطقة ب."],
      },
    },
  },

  /* ---------- مبيانات ---------- */
  {
    id: "chart-maroc-urbain",
    type: "chart",
    title: "مبيان تطور نسبة سكان الحواضر بالمغرب",
    desc: "مبيان بالأعمدة (1982–2024) للتدرب على قراءة المنحى واستخراج الأرقام الدالة.",
    level: "الجذع المشترك",
    subject: "الجغرافيا",
    tags: ["التمدن", "مبيان أعمدة", "السكان"],
    action: {
      kind: "data",
      methodId: "analysis-graph",
      data: {
        kind: "bar",
        caption: "نسبة سكان الحواضر من مجموع سكان المغرب (نِسَب تقريبية تعليمية)",
        unit: "٪",
        series: [
          { label: "1982", value: 40 },
          { label: "1994", value: 48 },
          { label: "2004", value: 55 },
          { label: "2014", value: 60 },
          { label: "2024", value: 65 },
        ],
        questions: ["قدّم المبيان (النوع، الموضوع، الفترة).", "صف المنحى العام مستعينًا برقمين دالين.", "فسّر هذا التطور."],
      },
    },
  },
  {
    id: "chart-secteurs-maroc",
    type: "chart",
    title: "مبيان مساهمة القطاعات الاقتصادية في الناتج الداخلي الخام بالمغرب",
    desc: "مبيان دائري يُبرز هيمنة الخدمات وتراجع الوزن النسبي للفلاحة.",
    level: "الثانية باكالوريا",
    subject: "الجغرافيا",
    tags: ["الاقتصاد المغربي", "مبيان دائري", "القطاعات"],
    action: {
      kind: "data",
      methodId: "analysis-graph",
      data: {
        kind: "pie",
        caption: "بنية الناتج الداخلي الخام بالمغرب حسب القطاعات (نِسَب تقريبية تعليمية)",
        unit: "٪",
        series: [
          { label: "الخدمات", value: 55 },
          { label: "الصناعة", value: 28 },
          { label: "الفلاحة", value: 12 },
          { label: "أنشطة أخرى", value: 5 },
        ],
        questions: ["أي قطاع يهيمن على الناتج؟", "قارن وزن الفلاحة في الناتج بوزنها في تشغيل السكان النشيطين.", "ماذا يعكس ذلك عن بنية الاقتصاد المغربي؟"],
      },
    },
  },
  {
    id: "chart-activites-tc",
    type: "chart",
    title: "مبيان توزيع الأنشطة الاقتصادية (نموذج تعليمي)",
    desc: "مبيان دائري مبسّط للتدرب الأولي على قراءة النِّسب.",
    level: "الجذع المشترك",
    subject: "الجغرافيا",
    tags: ["الأنشطة الاقتصادية", "مبيان دائري"],
    action: {
      kind: "data",
      methodId: "analysis-graph",
      data: {
        kind: "pie",
        caption: "مساهمة الأنشطة الاقتصادية (نِسَب تقريبية لأغراض تعليمية)",
        unit: "٪",
        series: [
          { label: "الخدمات", value: 45 },
          { label: "الفلاحة", value: 30 },
          { label: "الصناعة", value: 20 },
          { label: "الصيد والتعدين", value: 5 },
        ],
        questions: ["رتّب الأنشطة تنازليًا حسب مساهمتها.", "ما النشاط الذي يأتي في المرتبة الثانية؟"],
      },
    },
  },
  {
    id: "chart-energie-monde",
    type: "chart",
    title: "مبيان الاستهلاك العالمي للطاقة حسب المصدر",
    desc: "يُبرز هيمنة الطاقات الأحفورية ويفتح النقاش حول التحول الطاقي.",
    level: "الأولى باكالوريا",
    subject: "الجغرافيا",
    tags: ["الطاقة", "الموارد", "التنمية المستدامة"],
    action: {
      kind: "data",
      methodId: "analysis-graph",
      data: {
        kind: "pie",
        caption: "بنية الاستهلاك العالمي للطاقة حسب المصدر (نِسَب تقريبية تعليمية)",
        unit: "٪",
        series: [
          { label: "النفط", value: 32 },
          { label: "الفحم", value: 28 },
          { label: "الغاز الطبيعي", value: 24 },
          { label: "النووية والمتجددة", value: 16 },
        ],
        questions: ["ما حصة الطاقات الأحفورية مجتمعة؟", "ما الانعكاسات البيئية لهذه البنية؟", "لماذا يُطرح التحول نحو الطاقات المتجددة؟"],
      },
    },
  },
  {
    id: "chart-co2",
    type: "chart",
    title: "مبيان تطور انبعاثات ثاني أكسيد الكربون",
    desc: "منحنى تطوري يُوظَّف في ملف الاحتباس الحراري.",
    level: "الجذع المشترك",
    subject: "الجغرافيا",
    tags: ["الاحتباس الحراري", "البيئة", "منحنى"],
    lessonKey: "tc-sci.geography.2.1",
    action: {
      kind: "data",
      methodId: "analysis-graph",
      data: {
        kind: "line",
        caption: "تطور انبعاثات CO₂ عالميًا (وحدة مؤشرية تقريبية — 1990 = 22)",
        unit: "مليار طن",
        series: [
          { label: "1990", value: 22 },
          { label: "2000", value: 25 },
          { label: "2010", value: 30 },
          { label: "2020", value: 34 },
        ],
        questions: ["صف المنحى العام للانبعاثات.", "ما مصادر هذه الانبعاثات؟", "ما نتائجها على المناخ العالمي؟"],
      },
    },
  },
  {
    id: "chart-services",
    type: "chart",
    title: "مبيان تطور حصة قطاع الخدمات في الناتج",
    desc: "مبيان أعمدة يُبرز ظاهرة «تخديم» الاقتصاد.",
    level: "الأولى باكالوريا",
    subject: "الجغرافيا",
    tags: ["الخدمات", "بنية الاقتصاد"],
    action: {
      kind: "data",
      methodId: "analysis-graph",
      data: {
        kind: "bar",
        caption: "حصة الخدمات من الناتج الداخلي الخام (نِسَب تقريبية تعليمية)",
        unit: "٪",
        series: [
          { label: "1980", value: 45 },
          { label: "2000", value: 52 },
          { label: "2020", value: 60 },
        ],
        questions: ["احسب الزيادة بين 1980 و2020.", "فسّر تنامي قطاع الخدمات."],
      },
    },
  },

  /* ---------- خرائط وخطاطات ---------- */
  {
    id: "map-quartier",
    type: "map",
    title: "خريطة حي سكني: حي ميموزا — القنيطرة (مفتاح، شمال، مقياس)",
    desc: "خريطة بنمط Google Maps وصورة قمرية لحي ميموزا بالقنيطرة (ثانوية القدس، مسجد، مجرى مائي، حديقة وشارع رئيسي) للتدرب على عناصر الخريطة والاتجاهات.",
    level: "الجذع المشترك",
    subject: "الجغرافيا",
    tags: ["عناصر الخريطة", "الاتجاهات", "مقياس الرسم"],
    lessonKey: "tc-sci.geography.0.0",
    action: {
      kind: "data",
      methodId: "analysis-map",
      data: {
        kind: "map",
        sketch: "quartier",
        caption: "خريطة حي ميموزا — القنيطرة: ثانوية القدس هي المدرسة وسط المخطط (مفتاح، شمال، مقياس)",
        legend: [
          { color: "#d99e37", label: "ثانوية القدس (المدرسة)" },
          { color: "#0f7c5b", label: "مسجد الحي" },
          { color: "#0284c7", label: "مجرى مائي" },
          { color: "#16a34a", label: "حديقة الحي" },
          { color: "#33473f", label: "الشارع الرئيسي (شرق – غرب)" },
        ],
        questions: ["حدّد اتجاه مسجد الحي بالنسبة إلى ثانوية القدس.", "يسكن تلميذ قرب حديقة الحي: ما الاتجاه الذي يسلكه للوصول إلى المدرسة؟", "استعن بالمقياس وقدّر المسافة التقريبية بين ثانوية القدس والمجرى المائي.", "عدّد عناصر الخريطة الأساسية التي تتضمنها الوثيقة."],
      },
    },
  },
  {
    id: "map-density",
    type: "map",
    title: "خريطة تخطيطية لتوزيع الكثافة السكانية (نموذج)",
    desc: "خريطة موضوعاتية مبسّطة: شريط ساحلي مكتظ، أحواض نهرية، مجالات داخلية جبلية وجافة قليلة الكثافة.",
    level: "الثانية باكالوريا",
    subject: "الجغرافيا",
    tags: ["توزيع السكان", "الكثافة", "خريطة موضوعاتية"],
    action: {
      kind: "data",
      methodId: "analysis-map",
      data: {
        kind: "map",
        sketch: "density",
        caption: "توزيع الكثافة السكانية بمجال نموذجي (وثيقة تعليمية تخطيطية)",
        legend: [
          { color: "#0a4d3a", label: "كثافة مرتفعة: أكثر من 100 ن/كلم²" },
          { color: "#3fa883", label: "كثافة متوسطة: 20 إلى 100 ن/كلم²" },
          { color: "#d4ede0", label: "كثافة ضعيفة: أقل من 20 ن/كلم²" },
          { color: "#3b82c4", label: "نهر رئيسي" },
        ],
        questions: ["صف توزيع الكثافات المرتفعة والضعيفة.", "فسّر تركز السكان بالسواحل والأحواض النهرية.", "اقترح عنوانًا مناسبًا للخريطة."],
      },
    },
  },
  {
    id: "map-climate",
    type: "map",
    title: "خطاطة النطاقات المناخية الكبرى (من خط الاستواء إلى القطب)",
    desc: "خطاطة تركيبية لتوزيع النطاقات المناخية حسب خطوط العرض ومقابلتها بالغطاء النباتي.",
    level: "الجذع المشترك",
    subject: "الجغرافيا",
    tags: ["النطاقات المناخية", "الغطاء النباتي", "خطوط العرض"],
    lessonKey: "tc-sci.geography.0.3",
    action: {
      kind: "data",
      methodId: "analysis-map",
      data: {
        kind: "map",
        sketch: "climate",
        caption: "توزيع النطاقات المناخية الكبرى حسب خطوط العرض (خطاطة تعليمية)",
        legend: [
          { color: "#1d7a3f", label: "النطاق الاستوائي والمداري الرطب — غابة كثيفة / سافانا" },
          { color: "#e0b25c", label: "النطاق المداري الجاف — صحاري" },
          { color: "#7fb069", label: "النطاق المعتدل (متوسطي، محيطي، قاري) — غابات معتدلة وسهوب" },
          { color: "#9ec5e8", label: "النطاق البارد والقطبي — تايغا / تندرا / جليد" },
        ],
        questions: ["ما العامل الرئيسي المتحكم في تعاقب النطاقات؟", "قابل بين كل نطاق مناخي والغطاء النباتي المرتبط به.", "حدّد النطاق الذي ينتمي إليه المغرب."],
      },
    },
  },
  {
    id: "map-relief",
    type: "map",
    title: "خطاطة المجموعات البنيوية الكبرى وأشكال التضاريس",
    desc: "مقطع تخطيطي يربط بين الدروع القديمة والأحواض الرسوبية والسلاسل الالتوائية الحديثة.",
    level: "الجذع المشترك",
    subject: "الجغرافيا",
    tags: ["التضاريس", "البنية الجيولوجية", "مقطع"],
    lessonKey: "tc-sci.geography.0.2",
    action: {
      kind: "data",
      methodId: "analysis-map",
      data: {
        kind: "map",
        sketch: "relief",
        caption: "مقطع تخطيطي للمجموعات البنيوية الكبرى (خطاطة تعليمية)",
        legend: [
          { color: "#8f5f1c", label: "درع قديم (قاعدة صلبة) — هضاب وسهول مرتفعة" },
          { color: "#e6b457", label: "حوض رسوبي — سهول وهضاب منخفضة" },
          { color: "#0f7c5b", label: "سلسلة التوائية حديثة — جبال شاهقة" },
        ],
        questions: ["ميّز بين المجموعات البنيوية الثلاث من حيث العمر والصلابة.", "اربط بين كل مجموعة بنيوية وشكل التضاريس الناتج عنها.", "أعطِ مثالًا مغربيًا لكل مجموعة."],
      },
    },
  },
];

/* ------------------------------------------------------------
   3) روابط خارجية موثوقة: امتحانات وطنية وفروض (تُفتح في نافذة جديدة)
   ------------------------------------------------------------ */
const EXTERNAL_LINKS: ResourceItem[] = [
  {
    id: "nat-moutamadris",
    type: "national",
    title: "أرشيف الامتحانات الوطنية في التاريخ والجغرافيا (2007–2024) مع عناصر الإجابة",
    desc: "الدورتان العادية والاستدراكية · مسلكا الآداب والعلوم الإنسانية · ملفات PDF مرفقة بسلم التنقيط.",
    level: "الثانية باكالوريا",
    subject: "مشترك",
    tags: ["امتحان وطني", "آداب", "علوم إنسانية", "تصحيح"],
    year: 2024,
    action: { kind: "url", site: "Moutamadris", url: "https://moutamadris.ma/امتحانات-وطنية-مادة-التاريخ-والجغراف/" },
  },
  {
    id: "nat-talamidi",
    type: "national",
    title: "الامتحانات الوطنية — مسلك الآداب مع التصحيح (2007 إلى اليوم)",
    desc: "نسخ بالعربية وبالفرنسية (خيار دولي) مرتبة حسب السنة والدورة.",
    level: "الثانية باكالوريا",
    subject: "مشترك",
    tags: ["امتحان وطني", "آداب", "خيار دولي"],
    year: 2025,
    action: { kind: "url", site: "Talamidi", url: "https://talamidi.com/امتحانات-وطنية-تاريخ-جغرافيا-آداب/" },
  },
  {
    id: "nat-taalime-ratt",
    type: "national",
    title: "الامتحانات الوطنية — الدورة الاستدراكية (2014–2021) مع التصحيح",
    desc: "مسلكا الآداب والعلوم الإنسانية · مفيدة للتدرب على صيغ متنوعة من الأسئلة.",
    level: "الثانية باكالوريا",
    subject: "مشترك",
    tags: ["استدراكية", "امتحان وطني"],
    year: 2021,
    action: { kind: "url", site: "Taalime", url: "https://www.taalime.ma/امتحانات-وطنية-في-التاريخ-والجغرافيا/" },
  },
  {
    id: "nat-albostane",
    type: "national",
    title: "نماذج الامتحانات الوطنية — الدورة العادية (2010–2018)",
    desc: "مسلك الآداب · مواضيع رسمية للتدرب على منهجية الإجابة.",
    level: "الثانية باكالوريا",
    subject: "مشترك",
    tags: ["امتحان وطني", "آداب"],
    year: 2018,
    action: { kind: "url", site: "Albostane", url: "https://www.albostane.com/امتحانات-وطنية-في-التاريخ-والجغرافيا/" },
  },
  {
    id: "exam-ext-bac2-devoirs",
    type: "exam",
    title: "فروض محروسة في التاريخ والجغرافيا — الثانية باكالوريا (الدورتان) مع التصحيح",
    desc: "نماذج فروض مرحلية مرتبة حسب الدورة والمرحلة · مسلك الآداب والعلوم الإنسانية.",
    level: "الثانية باكالوريا",
    subject: "مشترك",
    tags: ["فروض", "الدورة الأولى", "الدورة الثانية"],
    year: 2025,
    action: { kind: "url", site: "Moutamadris", url: "https://moutamadris.ma/فروض-التاريخ-والجغرافيا-الثانية-باك-م/" },
  },
];

/* ------------------------------------------------------------
   العروض التفاعلية (الكتاب المدرسي — 1 باك علوم) ← نوع "slides"
   ------------------------------------------------------------ */
function generatedDecks(): ResourceItem[] {
  return DECKS.map((d) => ({
    id: `deck-${d.id}`,
    type: "slides",
    title: `عرض تفاعلي: ${d.title}`,
    desc: `${d.slides.length} شرائح من الكتاب المدرسي (ص ${d.pages[0]}–${d.pages[1]}) · ${deckTaskCount(d)} مهمة على الوثائق · ${d.quiz.length} أسئلة ختامية.`,
    level: "الأولى باكالوريا",
    subject: d.subject,
    tags: ["عرض تفاعلي", "الكتاب المدرسي", d.module.split(":")[0].trim(), ...d.concepts.slice(0, 3)],
    lessonKey: d.lessonKey,
    action: { kind: "route", route: { view: "decks", id: d.id }, label: "ابدأ العرض" },
  }));
}

/* ------------------------------------------------------------
   التجميع النهائي
   ------------------------------------------------------------ */
export const RESOURCES: ResourceItem[] = [
  ...generatedLessonPdfs(),
  ...generatedDecks(),
  ...DATA_DOCS,
  ...generatedExercises(),
  ...generatedExams(),
  ...REFERENCE_FRAMEWORKS,
  ...REGIONAL_EXAMS,
  ...EXTERNAL_LINKS,
  ...TEACHER_FILES,
];

export function countByType(type: ResourceType): number {
  return RESOURCES.filter((r) => r.type === type).length;
}

export function typeMeta(type: ResourceType) {
  return RESOURCE_TYPES.find((t) => t.id === type)!;
}

export function getResource(id: string): ResourceItem | undefined {
  return RESOURCES.find((r) => r.id === id);
}

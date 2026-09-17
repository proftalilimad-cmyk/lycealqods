/* ============================================================
   لائحة تتبّع الجذاذات — الجذع المشترك العلمي (الاجتماعيات)
   ============================================================

   هذه اللائحة «عناوين فقط» (25 خانة جذاذة حسب المقرر الرسمي):
   لا تحتوي أي محتوى جذاذة، لأن قسم الجذاذات حُذف من الموقع بطلب
   الأستاذ. غرضها الوحيد: تمكين لوحة الأستاذ من تتبّع إنجاز
   الجذاذات (أُنجزت / قيد الإنجاز / لم تُنجز) بالتاريخ والقسم.

   الترتيب والترقيم مطابقان للمقرر: الدورة ← الوحدة/المجزوءة ← الدرس،
   مع ترقيم تسلسلي داخل كل مادة (التاريخ 01–13، الجغرافيا 01–12).
   ============================================================ */

export type TrackerSubject = "التاريخ" | "الجغرافيا";

export interface TrackerUnit {
  id: string;
  subject: TrackerSubject;
  cycle: string;
  title: string;
  module: string;
}

export interface TrackerSlot {
  /** معرّف الخانة (tc-sci-h01 …) — ثابت لا يتغيّر حتى تبقى الحالة محفوظة */
  id: string;
  subject: TrackerSubject;
  unitId: string;
  unitTitle: string;
  cycle: string;
  module: string;
  /** رقم الجذاذة داخل المادة حسب ترتيب المقرر */
  number: string;
  /** عنوان الدرس كما ورد في المقرر الرسمي */
  title: string;
  tag?: string;
}

interface UnitSeed extends TrackerUnit {
  prefix: "h" | "g";
  lessons: { t: string; tag?: string }[];
}

export const TRACKER_UNITS_SEED: UnitSeed[] = [
  {
    id: "tc-h-u1",
    prefix: "h",
    subject: "التاريخ",
    cycle: "الدورة الأولى",
    title: "العالم المتوسطي في القرنين 15 و16م",
    module: "01",
    lessons: [
      { t: "التحولات الفكرية والعلمية والفنية (الحركة الإنسية)" },
      { t: "التحولات السياسية والاجتماعية (ظهور الطبقة البورجوازية، الدولة المدنية، الميثاق السياسي، الدولة الأمة)" },
      { t: "الاكتشافات الجغرافية وظاهرة الميركنتيلية" },
      { t: "المد الإسلامي (امتداد النفوذ العثماني وبداية التدخل الأوروبي)" },
      { t: "التطورات السياسية والاجتماعية في العالم الإسلامي" },
      { t: "التطورات الاقتصادية في العالم الإسلامي" },
    ],
  },
  {
    id: "tc-h-u2",
    prefix: "h",
    subject: "التاريخ",
    cycle: "الدورة الثانية",
    title: "العالم المتوسطي في القرنين 17 و18م",
    module: "02",
    lessons: [
      { t: "عصر الأنوار (الفكر الإنجليزي والفكر الفرنسي)" },
      { t: "الثورات الاجتماعية والسياسية (الثورة الفرنسية)" },
      { t: "انطلاقة الثورة الصناعية" },
      { t: "الأوضاع العامة في العالم الإسلامي" },
      { t: "تصاعد الضغوط الأوروبية على العالم الإسلامي" },
      { t: "بداية محاولات الإصلاح وحدودها" },
      { t: "اختلال التوازن بالعالم المتوسطي وبداية الهيمنة الأوروبية" },
    ],
  },
  {
    id: "tc-g-u1",
    prefix: "g",
    subject: "الجغرافيا",
    cycle: "الدورة الأولى",
    title: "التعريف بمكونات الوسط الطبيعي",
    module: "01",
    lessons: [
      { t: "الجغرافيا: الموضوع، الوظيفة، الأدوات" },
      { t: "الكوارث الطبيعية: تعريفها وأنواعها" },
      { t: "المجموعات البنيوية الكبرى وأشكال التضاريس" },
      { t: "النطاقات المناخية والغطاء النباتي في العالم (مقابلة بين خريطتين)" },
      { t: "المنظومة البيئية: مفهومها، أسس توازنها والتعريف بأنواعها" },
    ],
  },
  {
    id: "tc-g-u2",
    prefix: "g",
    subject: "الجغرافيا",
    cycle: "الدورة الثانية",
    title: "أشكال استغلال الإنسان للمجال وتنظيمه",
    module: "02",
    lessons: [
      { t: "أشكال استغلال الإنسان للمجال في الأرياف" },
      { t: "أشكال استغلال الإنسان للمجال في المدن" },
      { t: "تقنيات رسم خرائط المجال الريفي والحضري (تمثيل المعطيات النوعية والكمية)", tag: "تقنية" },
      { t: "الإجراءات والتدابير على مستوى تنظيم المجال (التشريعية والتقنية، التربوية)" },
    ],
  },
  {
    id: "tc-g-u3",
    prefix: "g",
    subject: "الجغرافيا",
    cycle: "الدورة الثانية",
    title: "ملفات التربية على المواطنة البيئية",
    module: "03",
    lessons: [
      { t: "ملف حول كارثة طبيعية: الزلازل في المغرب", tag: "ملف" },
      { t: "ملف حول كارثة بيئية: الاحتباس الحراري", tag: "ملف" },
      { t: "ملف حول دور الجمعيات والمنظمات غير الحكومية في حماية البيئة", tag: "ملف" },
    ],
  },
];

/** الوحدات دون الدروس (للترويسات والتصفية) */
export const TRACKER_UNITS: TrackerUnit[] = TRACKER_UNITS_SEED.map(({ prefix: _p, lessons: _l, ...u }) => u);

const pad = (n: number) => String(n).padStart(2, "0");

/** 25 خانة جذاذة بترقيم تسلسلي داخل كل مادة */
export const TRACKER_SLOTS: TrackerSlot[] = (() => {
  const counters: Record<string, number> = { التاريخ: 0, الجغرافيا: 0 };
  return TRACKER_UNITS_SEED.flatMap((u) =>
    u.lessons.map((l) => {
      counters[u.subject] += 1;
      const number = pad(counters[u.subject]);
      return {
        id: `tc-sci-${u.prefix}${number}`,
        subject: u.subject,
        unitId: u.id,
        unitTitle: u.title,
        cycle: u.cycle,
        module: u.module,
        number,
        title: l.t,
        tag: l.tag,
      } satisfies TrackerSlot;
    })
  );
})();

/* ------------------------------- حالات الإنجاز ------------------------------- */

export type TrackerStatus = "pending" | "progress" | "done";

export const TRACKER_STATUS: Record<TrackerStatus, { label: string; short: string; dot: string; chip: string }> = {
  done: {
    label: "أُنجزت",
    short: "منجزة",
    dot: "bg-emerald-500",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  progress: {
    label: "قيد الإنجاز",
    short: "قيد الإنجاز",
    dot: "bg-gold-500",
    chip: "border-gold-300 bg-gold-50 text-gold-700",
  },
  pending: {
    label: "لم تُنجز بعد",
    short: "لم تُنجز",
    dot: "bg-ink-300",
    chip: "border-ink-900/10 bg-paper-warm text-ink-500",
  },
};

export const TRACKER_STATUS_ORDER: TrackerStatus[] = ["done", "progress", "pending"];

export const TRACKER_TOTAL = TRACKER_SLOTS.length;
export const TRACKER_LEVEL_LABEL = "الجذع المشترك العلمي";
export const TRACKER_TEACHER = "الأستاذ عماد طليل";
export const TRACKER_SCHOOL = "ثانوية القدس، القنيطرة";

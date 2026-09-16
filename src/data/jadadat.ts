import { getImported, importedText, type ImportedFiche } from "./jadadatImported";

export { collectProduit, importedText, isProduitHeader, PRODUIT_HEADERS } from "./jadadatImported";
export type { ImportedFiche, SrcBlock, SrcCell, SrcTable, ProduitPart } from "./jadadatImported";

/* ============================================================
   الجذاذات — بصيغة الجذاذة المغربية الرسمية (نموذج الأستاذ):
   بطاقة تقنية، الكفاية المركزية/المجالية والمحورية، الأهداف
   (معرفيًا/مهاريًا/وجدانيًا)، جدول مراحل إنجاز الدرس (المقاطع،
   التدبير الديداكتيكي، الدعائم، المتن)، تقويمات مرحلية وإجمالية.
   أول حزمة: الجذع المشترك العلمي — كتاب «منار التاريخ والجغرافيا».
   ============================================================ */

export const TEACHER_NAME = "الأستاذ عماد طليل";
export const TEACHER_SCHOOL = "ثانوية القدس، القنيطرة";
export const BOOK_TC = "منار التاريخ والجغرافيا";

export interface JadadaSegment {
  /** وضعية الانطلاق / المقطع الأول… / تقويم مرحلي */
  phase: string;
  /** أهداف التعلم المرتبطة بالنشاط */
  objectives: string[];
  /** التدبير الديداكتيكي */
  management: string[];
  /** الدعائم الديداكتيكية */
  supports: string[];
  /** المتن */
  content: string[];
}

/**
 * حالة الجذاذة — شفافية كاملة تجاه الأستاذ:
 *  - "original": مُفرغة حرفيًا من وثيقة الأستاذ المرفقة (لا حذف ولا اختصار ولا إعادة صياغة).
 *  - "model":    رقمنة بنيوية على منهاج المقرر الرسمي، في انتظار المطابقة مع الوثيقة الأصلية.
 *  - "pending":  خانة الدرس مسجّلة في اللائحة، ومحتواها لم يُدرج بعد (لا يُؤلف شيء تلقائيًا).
 */
export type JadadaStatus = "original" | "model" | "pending";

export interface Jadada {
  id: string;
  level: "tc" | "bac1" | "bac2";
  track: string;
  subject: "التاريخ" | "الجغرافيا";
  /** معرّف الدورة/الوحدة */
  unitId: string;
  /** عنوان الدورة/الوحدة كما ورد في المقرر */
  unitTitle: string;
  /** الدورة الأولى / الدورة الثانية */
  cycle: string;
  /** رقم المجزوءة */
  module: string;
  /** رقم الجذاذة داخل المادة (حسب ترتيب المقرر) */
  number: string;
  title: string;
  status: JadadaStatus;
  /** مصدر المحتوى (يظهر للأستاذ أسفل الجذاذة) */
  sourceNote?: string;
  duration: string;
  book: string;
  /** الإشكالية (إن وردت في الوثيقة) */
  problematic?: string;
  /** المفاهيم والمصطلحات (إن وردت في الوثيقة) */
  concepts?: string[];
  kifayaMarkaziya: string;
  kifayaMihwariya: string;
  goals: { cognitive: string[]; skills: string[]; affective: string[] };
  segments: JadadaSegment[];
  taqwimIjmali: string[];
  /** الخلاصات والاستنتاجات (إن وردت في الوثيقة) */
  conclusion?: string[];
  /** المراجع والصفحات المشار إليها في الكتاب المدرسي */
  references?: string[];
  lessonKey?: string;
}

export const JADADA_LEVELS: { id: Jadada["level"]; label: string; tracks: string[] }[] = [
  { id: "tc", label: "الجذع المشترك", tracks: ["مسلك علوم", "مسلك آداب", "التعليم الأصيل"] },
  { id: "bac1", label: "الأولى باكالوريا", tracks: ["علوم", "علوم تجريبية", "آداب"] },
  { id: "bac2", label: "الثانية باكالوريا", tracks: ["علوم", "آداب", "علوم إنسانية"] },
];

/* ============================================================
   الجذاذات المُدرجة: كلها مأخوذة من وثائق الأستاذ الأصلية عبر
   التفريغ الآلي في src/data/jadadatImported.ts (مولَّد من مجلد
   «منار في التاريخ والجغرافيا» في المستودع). لا تُؤلَّف جذاذات هنا:
   أي خانة بلا وثيقة أصلية تبقى «في انتظار الإدراج».

   المسودات الرقمية الثماني السابقة حُذفت وعُوّضت بمحتوى الوثائق
   الأصلية تنفيذًا لاختيار الأستاذ: «استبدلها فورًا بما سأرسله».
   ============================================================ */

export const JADADAT: Jadada[] = [
  /* لا جذاذات مُؤلَّفة: كل المحتوى من وثائق الأستاذ في jadadatImported.ts */
];

/* ============================================================
   اللائحة الرسمية الكاملة لدروس الجذع المشترك العلمي
   (مادة الاجتماعيات — التاريخ والجغرافيا)، مرتبة حسب المقرر
   المغربي: الدورات، then الوحدات/المجزوءات، then الدروس.

   كل درس = خانة جذاذة (slot) برقم تسلسلي داخل المادة.
   إن وُجدت جذاذة مُدرجة في JADADAT بنفس المعرّف تُعرض بمحتواها،
   وإلا تبقى الخانة «في انتظار الوثيقة الأصلية» دون أي تأليف.
   ============================================================ */

export interface JadadaUnit {
  id: string;
  subject: "التاريخ" | "الجغرافيا";
  cycle: string;
  title: string;
  module: string;
}

export interface JadadaSlot {
  /** معرّف الخانة = معرّف الجذاذة عند إدراج محتواها (tc-sci-h10) */
  id: string;
  subject: "التاريخ" | "الجغرافيا";
  unitId: string;
  unitTitle: string;
  cycle: string;
  module: string;
  /** رقم الجذاذة داخل المادة حسب ترتيب المقرر */
  number: string;
  /** عنوان الدرس كما ورد في المقرر الرسمي */
  title: string;
  tag?: string;
  lessonKey?: string;
}

interface LessonSeed {
  /** عنوان الدرس في المقرر */
  t: string;
  /** مفتاح الدرس التفاعلي المقابل داخل الموقع */
  k?: string;
  tag?: string;
}
interface UnitSeed extends Omit<JadadaUnit, "id"> {
  id: string;
  prefix: "h" | "g";
  lessons: LessonSeed[];
}

export const TC_SCI_UNITS_SEED: UnitSeed[] = [
  {
    id: "tc-h-u1",
    prefix: "h",
    subject: "التاريخ",
    cycle: "الدورة الأولى",
    title: "العالم المتوسطي في القرنين 15 و16م",
    module: "01",
    lessons: [
      { t: "التحولات الفكرية والعلمية والفنية (الحركة الإنسية)", k: "tc-sci.history.0.0" },
      { t: "التحولات السياسية والاجتماعية (ظهور الطبقة البورجوازية، الدولة المدنية، الميثاق السياسي، الدولة الأمة)", k: "tc-sci.history.0.1" },
      { t: "الاكتشافات الجغرافية وظاهرة الميركنتيلية", k: "tc-sci.history.0.2" },
      { t: "المد الإسلامي (امتداد النفوذ العثماني وبداية التدخل الأوروبي)", k: "tc-sci.history.0.3" },
      { t: "التطورات السياسية والاجتماعية في العالم الإسلامي", k: "tc-sci.history.0.4" },
      { t: "التطورات الاقتصادية في العالم الإسلامي", k: "tc-sci.history.0.5" },
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
      { t: "عصر الأنوار (الفكر الإنجليزي والفكر الفرنسي)", k: "tc-sci.history.1.0" },
      { t: "الثورات الاجتماعية والسياسية (الثورة الفرنسية)", k: "tc-sci.history.1.1" },
      { t: "انطلاقة الثورة الصناعية", k: "tc-sci.history.1.2" },
      { t: "الأوضاع العامة في العالم الإسلامي", k: "tc-sci.history.1.3" },
      { t: "تصاعد الضغوط الأوروبية على العالم الإسلامي", k: "tc-sci.history.1.4" },
      { t: "بداية محاولات الإصلاح وحدودها", k: "tc-sci.history.1.5" },
      { t: "اختلال التوازن بالعالم المتوسطي وبداية الهيمنة الأوروبية", k: "tc-sci.history.1.6" },
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
      { t: "الجغرافيا: الموضوع، الوظيفة، الأدوات", k: "tc-sci.geography.0.0" },
      { t: "الكوارث الطبيعية: تعريفها وأنواعها", k: "tc-sci.geography.0.1" },
      { t: "المجموعات البنيوية الكبرى وأشكال التضاريس", k: "tc-sci.geography.0.2" },
      { t: "النطاقات المناخية والغطاء النباتي في العالم (مقابلة بين خريطتين)", k: "tc-sci.geography.0.3" },
      { t: "المنظومة البيئية: مفهومها، أسس توازنها والتعريف بأنواعها", k: "tc-sci.geography.0.4" },
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
      { t: "أشكال استغلال الإنسان للمجال في الأرياف", k: "tc-sci.geography.1.0" },
      { t: "أشكال استغلال الإنسان للمجال في المدن", k: "tc-sci.geography.1.1" },
      { t: "تقنيات رسم خرائط المجال الريفي والحضري (تمثيل المعطيات النوعية والكمية)", k: "tc-sci.geography.1.2", tag: "تقنية" },
      { t: "الإجراءات والتدابير على مستوى تنظيم المجال (التشريعية والتقنية، التربوية)", k: "tc-sci.geography.1.3" },
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
      { t: "ملف حول كارثة طبيعية: الزلازل في المغرب", k: "tc-sci.geography.2.0", tag: "ملف" },
      { t: "ملف حول كارثة بيئية: الاحتباس الحراري", k: "tc-sci.geography.2.1", tag: "ملف" },
      { t: "ملف حول دور الجمعيات والمنظمات غير الحكومية في حماية البيئة", k: "tc-sci.geography.2.2", tag: "ملف" },
    ],
  },
];

export const TC_SCI_UNITS: JadadaUnit[] = TC_SCI_UNITS_SEED.map(({ prefix: _prefix, lessons: _lessons, ...u }) => u);

const pad = (n: number) => String(n).padStart(2, "0");

/** بناء خانات الجذاذات: ترقيم تسلسلي داخل كل مادة حسب ترتيب المقرر */
export const TC_SCI_SLOTS: JadadaSlot[] = (() => {
  const counters: Record<string, number> = { التاريخ: 0, الجغرافيا: 0 };
  return TC_SCI_UNITS_SEED.flatMap((u) =>
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
        lessonKey: l.k,
      } satisfies JadadaSlot;
    }),
  );
})();

/** الروابط القديمة التي وُزّعت سابقًا تبقى صالحة (تُحوَّل إلى المعرّفات الرسمية) */
export const JADADA_ID_ALIASES: Record<string, string> = {
  "tc-sci-h1": "tc-sci-h02",
  "tc-sci-h2": "tc-sci-h03",
  "tc-sci-h3": "tc-sci-h04",
  "tc-sci-h4": "tc-sci-h10",
  "tc-sci-g1": "tc-sci-g01",
  "tc-sci-g2": "tc-sci-g02",
  "tc-sci-g3": "tc-sci-g03",
  "tc-sci-g4": "tc-sci-g04",
};

export function resolveJadadaId(id: string): string {
  return JADADA_ID_ALIASES[id] ?? id;
}

export function getJadada(id: string): Jadada | undefined {
  const rid = resolveJadadaId(id);
  return JADADAT.find((j) => j.id === rid);
}

export function getSlot(id: string): JadadaSlot | undefined {
  const rid = resolveJadadaId(id);
  return TC_SCI_SLOTS.find((s) => s.id === rid);
}

/** خانة جذاذة + محتواها: وثيقة الأستاذ الأصلية (imported) أو جذاذة مبنية (fiche) */
export interface CatalogEntry {
  slot: JadadaSlot;
  /** الوثيقة الأصلية للأستاذ، مُفرَّغة آليًا دون تغيير */
  imported?: ImportedFiche;
  /** جذاذة مبنية رقميًا (لا تُستعمل إلا إذا لم تتوفر وثيقة أصلية) */
  fiche?: Jadada;
  status: JadadaStatus;
  /** ملف المصدر داخل وثائق الأستاذ */
  sourceFile?: string;
}

export const TC_SCI_CATALOG: CatalogEntry[] = TC_SCI_SLOTS.map((slot) => {
  const imported = getImported(slot.id);
  const fiche = imported ? undefined : getJadada(slot.id);
  return {
    slot,
    imported,
    fiche,
    status: imported ? "original" : fiche ? fiche.status : "pending",
    sourceFile: imported?.source,
  };
});

/** نص الجذاذة المُدرج في البحث */
export function catalogText(e: CatalogEntry): string {
  if (e.imported) return importedText(e.imported);
  const f = e.fiche;
  if (!f) return "";
  return [
    f.title,
    f.kifayaMarkaziya,
    f.kifayaMihwariya,
    (f.concepts ?? []).join(" "),
    f.segments
      .map((sg) => `${sg.phase} ${sg.objectives.join(" ")} ${sg.management.join(" ")} ${sg.content.join(" ")} ${sg.supports.join(" ")}`)
      .join(" "),
    f.taqwimIjmali.join(" "),
    (f.references ?? []).join(" "),
  ].join(" ");
}

export function getCatalogEntry(id: string): CatalogEntry | undefined {
  const slot = getSlot(id);
  if (!slot) return undefined;
  return TC_SCI_CATALOG.find((e) => e.slot.id === slot.id);
}

export const JADADA_STATUS_META: Record<JadadaStatus, { label: string; short: string; note: string }> = {
  original: {
    label: "مطابقة للوثيقة الأصلية",
    short: "أصلية",
    note: "مُفرغة آليًا من وثيقة الأستاذ: لا حذف ولا اختصار ولا إعادة صياغة، مع تحقق آلي من مطابقة كل كلمة.",
  },
  model: {
    label: "رقمنة بنيوية — في انتظار المطابقة",
    short: "مسودة رقمية",
    note: "بنية الجذاذة الرسمية على منهاج المقرر؛ تُستبدل بمحتوى وثيقتك الأصلية عند التوصل بها.",
  },
  pending: {
    label: "في انتظار إدراج الوثيقة الأصلية",
    short: "قيد الإدراج",
    note: "خانة الدرس مسجّلة في اللائحة الرسمية؛ لم يُدرج محتواها بعد ولا يُؤلَّف أي محتوى بديل.",
  },
};

/** بطاقة تعريف القسم (تظهر في رأس الصفحة وفي كل جذاذة) */
export const SECTION_META = {
  title: "جذاذات الجذع المشترك العلمي",
  subject: "الاجتماعيات — التاريخ والجغرافيا",
  level: "الجذع المشترك العلمي",
  frame: "الثانوي التأهيلي بالمغرب",
  authorLabel: `إعداد وإنجاز: ${TEACHER_NAME}`,
  school: TEACHER_SCHOOL,
  book: BOOK_TC,
};

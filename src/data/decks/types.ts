/**
 * العروض التفاعلية المبنية على الكتاب المدرسي
 * «مورد التاريخ والجغرافيا — السنة الأولى من سلك الباكالوريا (المسالك العلمية)»
 *
 * كل عرض (Deck) = درس واحد من الكتاب، مقسّم إلى شرائح (Slides).
 * كل شريحة تعرض صفحة من الكتاب (صورة) مع لوحة عمل جانبية:
 *   - مهام الاشتغال على الوثائق (سؤال + عناصر إجابة قابلة للإظهار)
 *   - أفكار مفتاحية للاحتفاظ بها
 */

export type DeckSlideKind = "intro" | "activity" | "apply" | "eval" | "extend" | "summary";

export interface DeckTask {
  /** السؤال / التعليمة الموجهة للتلميذ */
  q: string;
  /** عناصر الإجابة (تظهر عند الطلب) */
  a: string;
}

export interface DeckSlide {
  /** الصفحة الرئيسية المعروضة (ترقيم الكتاب) */
  page: number;
  /** صفحات إضافية يمتد عليها النشاط */
  pages?: number[];
  kind: DeckSlideKind;
  title: string;
  /** الوثائق المستهدفة في هذه الشريحة وماذا نلاحظ فيها */
  focus?: string;
  tasks?: DeckTask[];
  /** أفكار مفتاحية / خلاصة الشريحة */
  keys?: string[];
}

export interface DeckQuiz {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface Deck {
  id: string;
  /** معرّف الكتاب المدرسي الذي تنتمي إليه الشرائح */
  bookId?: string;
  /** اسم الكتاب الظاهر في ترويسة العرض */
  bookTitle?: string;
  /** المستوى المرتبط بالكتاب */
  bookLevel?: string;
  /** مجلد صور الصفحات، مع استعمال مجلد مورد كقيمة افتراضية */
  pageBase?: string;
  /** عرض قراءة كتاب كامل بدل عرض درس منفرد */
  isBook?: boolean;
  /** مفتاح الدرس في المنصة (bac1-sci.history.1.0 …) إن كان له مقابل */
  lessonKey?: string;
  subject: "التاريخ" | "الجغرافيا" | "التاريخ والجغرافيا";
  /** رقم الوحدة في الكتاب المدرسي */
  unitNo: number;
  /** المجزوءة في الكتاب */
  module: string;
  title: string;
  /** مدى الصفحات في الكتاب [من, إلى] */
  pages: [number, number];
  /** التمهيد الإشكالي */
  problem: string;
  /** أهداف التعلم (كما وردت في الكتاب مع تصرف) */
  objectives: string[];
  /** المفاهيم المركزية */
  concepts: string[];
  slides: DeckSlide[];
  quiz: DeckQuiz[];
}

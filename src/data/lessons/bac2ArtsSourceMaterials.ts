import type { LessonSourceMaterial } from "../../types";

/**
 * روابط المادة التي رفعها صاحب المشروع داخل مجلد «دروس ملخصة».
 *
 * لا ننسخ ملفات PDF/Pages إلى public: فهي مواد مرجعية كبيرة وموجودة أصلًا في
 * المستودع. بدل ذلك نعرض رابط GitHub المباشر للمتعلم بجانب الدرس، مع إبقاء
 * متن الدرس والاختبارات داخل التطبيق.
 */
const GITHUB_BRANCH =
  "https://github.com/proftalilimad-cmyk/lycealqods/blob/arena/01a094f1-lycealqods/";

const githubFile = (path: string): string =>
  `${GITHUB_BRANCH}${path.split("/").map(encodeURIComponent).join("/")}`;

const historyFirst = "دروس ملخصة/التاريخ/التاريخ pdf/التاريخ المجزوءة الاولى.pdf";
const historySecond = "دروس ملخصة/التاريخ/التاريخ pdf/التاريخ المجزوءة الثانية.pdf";
const geographyFirst = "دروس ملخصة/الجغرافيا/الجغرافيا pdf/الجغرافيا المجزوءة الاولى.pdf";
const geographySecond = "دروس ملخصة/الجغرافيا/الجغرافيا pdf/الجغرافيا المجزوءة  الثانية.pdf";

const source = (
  title: string,
  note: string,
  files: { label: string; path: string }[],
): LessonSourceMaterial => ({
  title,
  note,
  files: files.map(({ label, path }) => ({ label, url: githubFile(path) })),
});

const historyUnitOne = source(
  "ملخصات التاريخ — المجزوءة الأولى",
  "أُنجز هذا الدرس بالرجوع إلى ملف المجزوءة الأولى، مع تنظيم مادته في محاور ومفاهيم ووثائق وأسئلة خاصة بعنوان الدرس.",
  [{ label: "فتح PDF المجزوءة الأولى للتاريخ", path: historyFirst }],
);

const historyUnitTwo = source(
  "ملخصات التاريخ — المجزوءة الثانية",
  "أُنجز هذا الدرس بالرجوع إلى ملف المجزوءة الثانية، مع تنظيم مادته في محاور ومفاهيم ووثائق وأسئلة خاصة بعنوان الدرس.",
  [{ label: "فتح PDF المجزوءة الثانية للتاريخ", path: historySecond }],
);

const geographyUnitOne = source(
  "ملخصات الجغرافيا — المجزوءة الأولى",
  "أُنجز هذا الدرس بالرجوع إلى ملف المجزوءة الأولى للجغرافيا، مع تحويل معطياته إلى درس تفاعلي مرتبط بالمفاهيم والمحاور والتقويم.",
  [{ label: "فتح PDF المجزوءة الأولى للجغرافيا", path: geographyFirst }],
);

const geographyUnitTwo = source(
  "ملخصات الجغرافيا — المجزوءة الثانية",
  "أُنجز هذا الدرس بالرجوع إلى ملف المجزوءة الثانية للجغرافيا والملخصات الخاصة بالمجالات المدروسة، مع ربط الأسئلة بمحتوى الدرس.",
  [{ label: "فتح PDF المجزوءة الثانية للجغرافيا", path: geographySecond }],
);

/**
 * يعيد المادة المرجعية لكل واحد من دروس الثانية باكالوريا آداب وعلوم إنسانية.
 * يعتمد التقسيم على رقم المجزوءة في معرف المنهج، لذلك لا يمكن أن يسقط درس
 * جديد من الواجهة من دون أن يحصل على مصدر واضح.
 */
export function getBac2ArtsSourceMaterial(
  lessonId: string,
): LessonSourceMaterial | undefined {
  const match = /^(bac2-arts)\.(history|geography)\.(\d+)\./.exec(lessonId);
  if (!match) return undefined;

  const subject = match[2];
  const unit = Number(match[3]);

  if (subject === "history") {
    return unit < 2 ? historyUnitOne : historyUnitTwo;
  }

  return unit < 2 ? geographyUnitOne : geographyUnitTwo;
}

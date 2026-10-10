import type { LessonSourceMaterial } from "../../types";

/**
 * المادة الأصلية التي رفعها الأستاذ داخل مجلد «دروس ملخصة».
 * لا تُعاد صياغة هذه الملفات ولا تُستبدل بملخصات مولدة؛ تعرض الواجهة رابط
 * الملف الأصلي كما هو، وتبقي المحتوى التفاعلي منفصلًا عن النسخة المرجعية.
 */
const GITHUB_BRANCH =
  "https://github.com/proftalilimad-cmyk/lycealqods/blob/arena/01a094f1-lycealqods/";

const githubFile = (path: string): string =>
  `${GITHUB_BRANCH}${path.split("/").map(encodeURIComponent).join("/")}`;

const historyFirst = "دروس ملخصة/التاريخ/التاريخ pdf/التاريخ المجزوءة الاولى.pdf";
const historySecond = "دروس ملخصة/التاريخ/التاريخ pdf/التاريخ المجزوءة الثانية.pdf";
const geographyFirst = "دروس ملخصة/الجغرافيا/الجغرافيا pdf/الجغرافيا المجزوءة الاولى.pdf";
const geographySecond = "دروس ملخصة/الجغرافيا/الجغرافيا pdf/الجغرافيا المجزوءة  الثانية.pdf";

const ORIGINAL_NOTE =
  "هذا رابط المادة الأصلية كما رُفعت داخل مجلد «دروس ملخصة». لم تُعد صياغة نص الملف أو تغيير ترتيب فقراته؛ افتح الملف للاطلاع على المحتوى الأصلي كاملًا.";

const source = (
  title: string,
  files: { label: string; path: string }[],
  note = ORIGINAL_NOTE,
): LessonSourceMaterial => ({
  title,
  note,
  files: files.map(({ label, path }) => ({ label, url: githubFile(path) })),
});

const historyUnitOne = source(
  "المصدر الأصلي — التاريخ، المجزوءة الأولى",
  [{ label: "فتح PDF التاريخ — المجزوءة الأولى", path: historyFirst }],
);

const historyUnitTwo = source(
  "المصدر الأصلي — التاريخ، المجزوءة الثانية",
  [{ label: "فتح PDF التاريخ — المجزوءة الثانية", path: historySecond }],
);

const geographyUnitOne = source(
  "المصدر الأصلي — الجغرافيا، المجزوءة الأولى",
  [{ label: "فتح PDF الجغرافيا — المجزوءة الأولى", path: geographyFirst }],
);

const geographyUnitTwo = source(
  "المصدر الأصلي — الجغرافيا، المجزوءة الثانية",
  [{ label: "فتح PDF الجغرافيا — المجزوءة الثانية", path: geographySecond }],
);

/** الملفات المنفصلة التي تطابق عنوان الدرس كما رفعها الأستاذ. */
const exactLessonFiles: Record<string, { label: string; path: string }> = {
  "bac2-arts.history.0.0": {
    label: "فتح الملف الأصلي — الثورة الروسية وأزمات الديمقراطيات الليبرالية",
    path: "دروس ملخصة/التاريخ/الدورة الاولى/2- الثورة الروسية وازمات الديمقراطيات الليبرالية.pages",
  },
  "bac2-arts.history.0.1": {
    label: "فتح الملف الأصلي — أزمة العالم الرأسمالي الكبرى لسنة 1929",
    path: "دروس ملخصة/التاريخ/الدورة الاولى/3-ازمة العالم الراسمالي الكبرى لسنة 1929 .pages",
  },
  "bac2-arts.history.0.2": {
    label: "فتح الملف الأصلي — الحرب العالمية الثانية",
    path: "دروس ملخصة/التاريخ/الدورة الاولى/4- الحرب العالمية الثانية الاسباب والمراحل والنتائج.pages",
  },
  "bac2-arts.history.1.0": {
    label: "فتح الملف الأصلي — المغرب تحت نظام الحماية",
    path: "دروس ملخصة/التاريخ/الدورة الاولى/5- المغرب تحت نظام الحماية.pages",
  },
  "bac2-arts.history.1.1": {
    label: "فتح الملف الأصلي — المغرب: الاستغلال الاستعماري في عهد الحماية",
    path: "دروس ملخصة/التاريخ/الدورة الاولى/6-  المغرب الاستغلال الاستعماري في عهد الحماية.pages",
  },
  "bac2-arts.history.1.2": {
    label: "فتح الملف الأصلي — سقوط الإمبراطورية العثمانية",
    path: "دروس ملخصة/التاريخ/الدورة الاولى/7- سقوط الامبراطورية العثمانية وتوغل الاستعمار بالمشرق العربي.pages",
  },
  "bac2-arts.history.1.3": {
    label: "فتح الملف الأصلي — القضية الفلسطينية",
    path: "دروس ملخصة/التاريخ/الدورة الاولى/8- القضية الفلسطينية.pages",
  },
  "bac2-arts.history.2.0": {
    label: "فتح الملف الأصلي — نظام القطبية الثنائية والحرب الباردة",
    path: "دروس ملخصة/التاريخ/الدورة الثانية/1-  نظام القطبية الثنائية والحرب الباردة.pages",
  },
  "bac2-arts.history.2.1": {
    label: "فتح الملف الأصلي — تصفية الاستعمار وبروز العالم الثالث",
    path: "دروس ملخصة/التاريخ/الدورة الثانية/2-  تصفية الاستعمار وبروز العالم الثالث.pages",
  },
  "bac2-arts.history.2.2": {
    label: "فتح الملف الأصلي — نضال المغرب من أجل الاستقلال",
    path: "دروس ملخصة/التاريخ/الدورة الثانية/4- نضال المغرب من اجل الاستقلال واستكمال الوحدة الترابية.pages",
  },
  "bac2-arts.history.2.3": {
    label: "فتح الملف الأصلي — الحركات الاستقلالية بالجزائر وتونس وليبيا",
    path: "دروس ملخصة/التاريخ/الدورة الثانية/5- الحركات الاستقلالية بالجزائر وتونس وليبيا.pages",
  },
  "bac2-arts.history.2.4": {
    label: "فتح الملف الأصلي — الحركات الاستقلالية بالمشرق العربي",
    path: "دروس ملخصة/التاريخ/الدورة الثانية/6-  الحركات الاستقلالية بالمشرق العربي.pages",
  },
  "bac2-arts.history.2.5": {
    label: "فتح الملف الأصلي — النظام العالمي الجديد والقطبية الواحدة",
    path: "دروس ملخصة/التاريخ/الدورة الثانية/3- النظام العالمي الجديد والقطبية الواحدة.pages",
  },
  "bac2-arts.geography.2.0": {
    label: "فتح الملف الأصلي — الولايات المتحدة الأمريكية",
    path: "دروس ملخصة/الجغرافيا/الدورة الثانية/‎⁨1- الولايات المتحدة الامريكية : قوة اقتصادية عظمى .pdf",
  },
  "bac2-arts.geography.2.1": {
    label: "فتح الملف الأصلي — فرنسا",
    path: "دروس ملخصة/الجغرافيا/الدورة الثانية/2-  فرنسا قوة فلاحية وصناعية كبرى في الانحاد الاوربي.pdf",
  },
  "bac2-arts.geography.2.2": {
    label: "فتح الملف الأصلي — اليابان",
    path: "دروس ملخصة/الجغرافيا/الدورة الثانية/3- اليابان قوة تجارية كبرى.pdf",
  },
  "bac2-arts.geography.2.3": {
    label: "فتح الملف الأصلي — الصين",
    path: "دروس ملخصة/الجغرافيا/الدورة الثانية/4-  الصين قوة اقتصادية صاعدة.pdf",
  },
  "bac2-arts.geography.2.5": {
    label: "فتح الملف الأصلي — كوريا الجنوبية",
    path: "دروس ملخصة/الجغرافيا/الدورة الثانية/7-  كوريا الجنوبية نمودج لبلد حديث النمو الاقتصادي.pdf",
  },
};

const curriculumOnlyLessons = new Set([
  "bac2-arts.history.0.3",
  "bac2-arts.history.1.4",
  "bac2-arts.history.2.6",
  "bac2-arts.geography.1.0",
  "bac2-arts.geography.1.4",
]);

/**
 * يعيد المصدر الأصلي لكل درس من دروس الثانية باكالوريا آداب وعلوم إنسانية.
 * إذا وُجد ملف مستقل مطابق للدرس يُعرض أولًا، ثم PDF المجزوءة الكامل كمرجع
 * احتياطي؛ أما العناوين الملفية الخاصة بالمسلك فتبقى معلّمة بوضوح دون نسبها
 * إلى ملف مستقل غير موجود.
 */
export function getBac2ArtsSourceMaterial(
  lessonId: string,
): LessonSourceMaterial | undefined {
  const match = /^(bac2-arts)\.(history|geography)\.(\d+)\./.exec(lessonId);
  if (!match) return undefined;

  const subject = match[2];
  const unit = Number(match[3]);
  const material = subject === "history"
    ? unit < 2 ? historyUnitOne : historyUnitTwo
    : unit < 2 ? geographyUnitOne : geographyUnitTwo;
  const exact = exactLessonFiles[lessonId];

  if (curriculumOnlyLessons.has(lessonId)) {
    return {
      ...material,
      note: "لا يوجد في المجلد ملف مستقل بهذا العنوان؛ لذلك لا نضع نصًا بديلًا أو معاد الصياغة. يعرض هذا الدرس ملف المجزوءة الأصلي كما هو إلى جانب بطاقة المنهاج.",
    };
  }

  if (!exact) return material;
  return {
    ...material,
    title: "المصدر الأصلي للدرس — كما رُفع في مجلد «دروس ملخصة»",
    files: [
      { label: exact.label, url: githubFile(exact.path) },
      ...material.files,
    ],
  };
}

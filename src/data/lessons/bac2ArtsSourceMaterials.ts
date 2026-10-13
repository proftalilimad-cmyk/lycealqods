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
  files: { label: string; path: string; localPath?: string; kind?: "pdf" | "pages" }[],
  note = ORIGINAL_NOTE,
): LessonSourceMaterial => ({
  title,
  note,
  files: files.map(({ label, path, localPath, kind }) => ({
    label,
    url: githubFile(path),
    ...(localPath ? { localUrl: localPath } : {}),
    ...(kind ? { kind } : {}),
  })),
});

const historyUnitOne = source(
  "المصدر الأصلي — التاريخ، المجزوءة الأولى",
  [{ label: "فتح PDF التاريخ — المجزوءة الأولى", path: historyFirst, localPath: "/sources/bac2/history/module-1.pdf", kind: "pdf" }],
);

const historyUnitTwo = source(
  "المصدر الأصلي — التاريخ، المجزوءة الثانية",
  [{ label: "فتح PDF التاريخ — المجزوءة الثانية", path: historySecond, localPath: "/sources/bac2/history/module-2.pdf", kind: "pdf" }],
);

const geographyUnitOne = source(
  "المصدر الأصلي — الجغرافيا، المجزوءة الأولى",
  [{ label: "فتح PDF الجغرافيا — المجزوءة الأولى", path: geographyFirst, localPath: "/sources/bac2/geography/module-1.pdf", kind: "pdf" }],
);

const geographyUnitTwo = source(
  "المصدر الأصلي — الجغرافيا، المجزوءة الثانية",
  [{ label: "فتح PDF الجغرافيا — المجزوءة الثانية", path: geographySecond, localPath: "/sources/bac2/geography/module-2.pdf", kind: "pdf" }],
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

const localExactFiles: Record<string, { localUrl: string; kind: "pdf" | "pages" }> = {
  "bac2-arts.history.0.0": { localUrl: "/sources/bac2/history/history-02-russian-revolution.pages", kind: "pages" },
  "bac2-arts.history.0.1": { localUrl: "/sources/bac2/history/history-03-crisis-1929.pages", kind: "pages" },
  "bac2-arts.history.0.2": { localUrl: "/sources/bac2/history/history-04-world-war-2.pages", kind: "pages" },
  "bac2-arts.history.1.0": { localUrl: "/sources/bac2/history/history-05-protectorate.pages", kind: "pages" },
  "bac2-arts.history.1.1": { localUrl: "/sources/bac2/history/history-06-colonial-exploitation.pages", kind: "pages" },
  "bac2-arts.history.1.2": { localUrl: "/sources/bac2/history/history-07-ottoman-levant.pages", kind: "pages" },
  "bac2-arts.history.1.3": { localUrl: "/sources/bac2/history/history-08-palestine.pages", kind: "pages" },
  "bac2-arts.history.2.0": { localUrl: "/sources/bac2/history/history-09-bipolar-cold-war.pages", kind: "pages" },
  "bac2-arts.history.2.1": { localUrl: "/sources/bac2/history/history-10-decolonization.pages", kind: "pages" },
  "bac2-arts.history.2.2": { localUrl: "/sources/bac2/history/history-12-morocco-independence.pages", kind: "pages" },
  "bac2-arts.history.2.3": { localUrl: "/sources/bac2/history/history-13-maghreb-independence.pages", kind: "pages" },
  "bac2-arts.history.2.4": { localUrl: "/sources/bac2/history/history-14-levant-independence.pages", kind: "pages" },
  "bac2-arts.history.2.5": { localUrl: "/sources/bac2/history/history-11-new-world-order.pages", kind: "pages" },
  "bac2-arts.geography.2.0": { localUrl: "/sources/bac2/geography/geography-01-usa.pdf", kind: "pdf" },
  "bac2-arts.geography.2.1": { localUrl: "/sources/bac2/geography/geography-02-france.pdf", kind: "pdf" },
  "bac2-arts.geography.2.2": { localUrl: "/sources/bac2/geography/geography-03-japan.pdf", kind: "pdf" },
  "bac2-arts.geography.2.3": { localUrl: "/sources/bac2/geography/geography-04-china.pdf", kind: "pdf" },
  "bac2-arts.geography.2.5": { localUrl: "/sources/bac2/geography/geography-05-south-korea.pdf", kind: "pdf" },
};

Object.assign(exactLessonFiles, {
  "bac2-sci.history.0.0": {
    label: "فتح الملف الأصلي — العالم غداة الحرب العالمية الأولى",
    path: "دروس ملخصة/التاريخ/الدورة الاولى/1- العالم غداة الحرب العالمية الاولى .pages",
  },
  "bac2-sci.history.0.1": exactLessonFiles["bac2-arts.history.0.0"],
  "bac2-sci.history.1.0": exactLessonFiles["bac2-arts.history.1.2"],
  "bac2-sci.history.1.1": exactLessonFiles["bac2-arts.history.1.3"],
  "bac2-sci.history.2.0": exactLessonFiles["bac2-arts.history.2.0"],
  "bac2-sci.history.2.1": exactLessonFiles["bac2-arts.history.2.1"],
  "bac2-sci.history.2.2": exactLessonFiles["bac2-arts.history.2.5"],
  "bac2-sci.history.3.0": exactLessonFiles["bac2-arts.history.2.2"],
  "bac2-sci.history.3.1": exactLessonFiles["bac2-arts.history.2.3"],
  "bac2-sci.history.3.2": exactLessonFiles["bac2-arts.history.2.4"],
  "bac2-sci.history.3.3": {
    label: "فتح الملف الأصلي — القضية الفلسطينية والصراع العربي الإسرائيلي",
    path: "دروس ملخصة/التاريخ/الدورة الثانية/7-  االقضية الفلسطينية والصراع العربي الاسرائيلي.pages",
  },
  "bac2-sci.geography.2.0": exactLessonFiles["bac2-arts.geography.2.1"],
  "bac2-sci.geography.2.1": exactLessonFiles["bac2-arts.geography.2.2"],
  "bac2-sci.geography.3.1": exactLessonFiles["bac2-arts.geography.2.5"],
});

const curriculumOnlyLessons = new Set([
  "bac2-arts.history.0.3",
  "bac2-arts.history.1.4",
  "bac2-arts.history.2.6",
  "bac2-arts.geography.1.0",
  "bac2-arts.geography.1.4",
]);

Object.assign(localExactFiles, {
  "bac2-sci.history.0.0": { localUrl: "/sources/bac2/history/history-01-world-after-ww1.pages", kind: "pages" },
  "bac2-sci.history.0.1": localExactFiles["bac2-arts.history.0.0"],
  "bac2-sci.history.1.0": localExactFiles["bac2-arts.history.1.2"],
  "bac2-sci.history.1.1": localExactFiles["bac2-arts.history.1.3"],
  "bac2-sci.history.2.0": localExactFiles["bac2-arts.history.2.0"],
  "bac2-sci.history.2.1": localExactFiles["bac2-arts.history.2.1"],
  "bac2-sci.history.2.2": localExactFiles["bac2-arts.history.2.5"],
  "bac2-sci.history.3.0": localExactFiles["bac2-arts.history.2.2"],
  "bac2-sci.history.3.1": localExactFiles["bac2-arts.history.2.3"],
  "bac2-sci.history.3.2": localExactFiles["bac2-arts.history.2.4"],
  "bac2-sci.history.3.3": { localUrl: "/sources/bac2/history/history-15-palestine-conflict.pages", kind: "pages" },
  "bac2-sci.geography.2.0": localExactFiles["bac2-arts.geography.2.1"],
  "bac2-sci.geography.2.1": localExactFiles["bac2-arts.geography.2.2"],
  "bac2-sci.geography.3.1": localExactFiles["bac2-arts.geography.2.5"],
});

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
      {
        label: exact.label,
        url: githubFile(exact.path),
        ...(localExactFiles[lessonId] ?? {}),
      },
      ...material.files,
    ],
  };
}


/** المصدر الأصلي الموازي لمسلك الثانية باكالوريا علوم، عند وجوده في المجلد. */
export function getBac2SciSourceMaterial(lessonId: string): LessonSourceMaterial | undefined {
  const match = /^(bac2-sci)\.(history|geography)\.(\d+)\./.exec(lessonId);
  if (!match) return undefined;
  const subject = match[2];
  const unit = Number(match[3]);
  const material = subject === "history"
    ? unit < 2 ? historyUnitOne : historyUnitTwo
    : unit < 2 ? geographyUnitOne : geographyUnitTwo;
  const exact = exactLessonFiles[lessonId];
  if (!exact) return material;
  return {
    ...material,
    title: "المصدر الأصلي للدرس — كما رُفع في مجلد «دروس ملخصة»",
    files: [
      { label: exact.label, url: githubFile(exact.path), ...(localExactFiles[lessonId] ?? {}) },
      ...material.files,
    ],
  };
}

/** يعيد المصدر الأصلي لأي درس في مسلكي الثانية المشمولين بالمجلد. */
export function getBac2SourceMaterial(lessonId: string): LessonSourceMaterial | undefined {
  if (lessonId.startsWith("bac2-arts.")) return getBac2ArtsSourceMaterial(lessonId);
  if (lessonId.startsWith("bac2-sci.")) return getBac2SciSourceMaterial(lessonId);
  return undefined;
}

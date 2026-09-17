/* ============================================================
   مكتبة جذاذات الجذع المشترك العلمي — فهرس الملفات الأصلية
   ============================================================
   ملف مولَّد آليًا، لا تُحرَّره يدويًا:
     npx esbuild scripts/build-jadadat-files.tsx --bundle --platform=node \
       --format=cjs --loader:.css=empty --outfile=/tmp/b.cjs && node /tmp/b.cjs

   المصدر: وثائق الأستاذ في «جذع مسترك شعبة علوم تجريبية/» (82 ملفًا حقيقيًا).
   كل بطاقة = جذاذة درس من اللائحة الرسمية (25 خانة) مرتبطة
   بملفاتها الأصلية؛ وكل حقل هنا مستخرج من الملفات أو من اللائحة الرسمية،
   ولا شيء مُؤلَّف: عدد الحصص والمكوّنات مأخوذة من نص الوثيقة نفسها،
   ومن لا يتوفر له ملف أصلي يبقى بلا ملفات (مع إحالة على الجذاذة الرقمية).

   المسارات: /files/jadadat/joth3-mochtrak-scientifique/<histoire|geographie|general>/<session-1|session-2|general>/
   ============================================================ */

export type FicheFileKind = "pdf" | "doc" | "docx";
export type FicheRelation = "exact" | "related";

export interface FicheFile {
  /** الاسم الأصلي للملف (يُحفظ كما هو عند التحميل) */
  name: string;
  /** مساره داخل الموقع (نسبي، يعمل مع التوجيه بالعناوين) */
  url: string;
  kind: FicheFileKind;
  bytes: number;
  /** عدد الصفحات (مقروء من ملف PDF نفسه؛ null لملفات Word) */
  pages: number | null;
  /** مجلد المصدر داخل وثائق الأستاذ */
  folder: string;
  /** exact = عنوانه مطابق للدرس · related = وثيقة مرتبطة بالدرس */
  relation: FicheRelation;
}

/** سجلّ مطابق لبنية جدول fiches_pedagogiques المطلوبة */
export interface FichePedagogique {
  id: string;
  title: string;
  level: string;
  subject: string;
  semester: string;
  semesterKey: string;
  subjectKey: string;
  unitTitle: string;
  unitId: string;
  module: string;
  lessonNumber: string;
  /** عدد الحصص كما ورد في الوثيقة الأصلية (null إن لم يرد) */
  sessionsCount: number | null;
  sessionsSource: string | null;
  description: string;
  pdfUrl: string | null;
  docUrl: string | null;
  files: FicheFile[];
  exactFiles: number;
  keywords: string[];
  /** المكوّنات الواردة فعلًا في الوثيقة الأصلية */
  components: string[];
  componentsMissing: string[];
  /** رابط الجذاذة الكاملة المعروضة داخل الموقع */
  ficheUrl: string;
  source: string | null;
  sourceLayout: "docx" | "doc" | "pdf" | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** وثائق عامة ومجموعات جذاذات (لا ترتبط بدرس واحد) */
export interface GeneralDoc {
  id: string;
  title: string;
  level: string;
  subject: string;
  semester: string;
  semesterKey: string;
  subjectKey: string;
  description: string;
  pdfUrl: string | null;
  docUrl: string | null;
  files: FicheFile[];
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

export const FICHES_LEVEL = "جذع مشترك علمي";
export const FICHES_BASE_URL = "/files/jadadat/joth3-mochtrak-scientifique";
export const FICHES_SOURCE_DIR = "جذع مسترك شعبة علوم تجريبية";
export const FICHES_TOTAL_FILES = 82;
export const FICHES_PDF_COUNT = 32;
export const FICHES_WORD_COUNT = 50;

export const FICHES_PEDAGOGIQUES: FichePedagogique[] = [
 {
  "id": "tc-sci-h01",
  "title": "التحولات الفكرية والعلمية والفنية (الحركة الإنسية)",
  "level": "جذع مشترك علمي",
  "subject": "التاريخ",
  "semester": "الدورة الأولى",
  "semesterKey": "session-1",
  "subjectKey": "histoire",
  "unitTitle": "العالم المتوسطي في القرنين 15 و16م",
  "unitId": "tc-h-u1",
  "module": "01",
  "lessonNumber": "01",
  "sessionsCount": 2,
  "sessionsSource": "عدد الحصص (وارد في الوثيقة الأصلية)",
  "description": "التحولات الفكرية والعلمية والفنية (الحركة الإنسية) — جذاذة التاريخ (الدورة الأولى، العالم المتوسطي في القرنين 15 و16م) · 2 ملفًا أصليًا من وثائق الأستاذ (ملفات Word: تحميل فقط).",
  "pdfUrl": null,
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/التحولات الفكرية والعلمية والفنية الحركة.docx",
  "files": [
   {
    "name": "التحولات الفكرية والعلمية والفنية الحركة.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/التحولات الفكرية والعلمية والفنية الحركة.docx",
    "kind": "docx",
    "bytes": 87013,
    "pages": null,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "الحركة الإنسية.doc",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/الحركة الإنسية.doc",
    "kind": "doc",
    "bytes": 58368,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 2,
  "keywords": [
   "التحولات",
   "الفكرية",
   "والعلمية",
   "والفنية",
   "الحركة",
   "الإنسية",
   "العالم",
   "المتوسطي",
   "القرنين",
   "و16م",
   "التاريخ",
   "الدورة الأولى",
   "جذاذة",
   "الجذاذة 01",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "الكفايات",
   "الوسائل والوثائق (الدعامات)",
   "أنشطة المتعلم",
   "الخلاصة / الاستنتاج / التركيب"
  ],
  "componentsMissing": [
   "الأهداف",
   "الإشكالية",
   "المفاهيم والمصطلحات",
   "مراحل الدرس",
   "أنشطة الأستاذ (التدبير)",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "التقويم",
   "المنتوج"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-h01",
  "source": "الحركة الإنسية.doc",
  "sourceLayout": "doc",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-h02",
  "title": "التحولات السياسية والاجتماعية (ظهور الطبقة البورجوازية، الدولة المدنية، الميثاق السياسي، الدولة الأمة)",
  "level": "جذع مشترك علمي",
  "subject": "التاريخ",
  "semester": "الدورة الأولى",
  "semesterKey": "session-1",
  "subjectKey": "histoire",
  "unitTitle": "العالم المتوسطي في القرنين 15 و16م",
  "unitId": "tc-h-u1",
  "module": "01",
  "lessonNumber": "02",
  "sessionsCount": null,
  "sessionsSource": null,
  "description": "التحولات السياسية والاجتماعية (ظهور الطبقة البورجوازية، الدولة المدنية، الميثاق السياسي، الدولة الأمة) — جذاذة التاريخ (الدورة الأولى، العالم المتوسطي في القرنين 15 و16م) · 3 ملفًا أصليًا من وثائق الأستاذ (ملفات Word: تحميل فقط).",
  "pdfUrl": null,
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/التحولات السياسية و الاجتماعية.doc",
  "files": [
   {
    "name": "التحولات السياسية و الاجتماعية.doc",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/التحولات السياسية و الاجتماعية.doc",
    "kind": "doc",
    "bytes": 54272,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "التحولات السياسية والاجتماعية.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/التحولات السياسية والاجتماعية.docx",
    "kind": "docx",
    "bytes": 175485,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "التحولات السياسية والاجتماعية الدولة الأمة بأوروبا.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/التحولات السياسية والاجتماعية الدولة الأمة بأوروبا.docx",
    "kind": "docx",
    "bytes": 18692,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 3,
  "keywords": [
   "التحولات",
   "السياسية",
   "والاجتماعية",
   "ظهور",
   "الطبقة",
   "البورجوازية،",
   "الدولة",
   "المدنية،",
   "الميثاق",
   "السياسي،",
   "الأمة",
   "العالم",
   "المتوسطي",
   "القرنين",
   "و16م",
   "التاريخ",
   "الدورة الأولى",
   "جذاذة",
   "الجذاذة 02",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "الإشكالية",
   "الوسائل والوثائق (الدعامات)",
   "مراحل الدرس",
   "أنشطة الأستاذ (التدبير)",
   "أنشطة المتعلم",
   "الخلاصة / الاستنتاج / التركيب",
   "التقويم"
  ],
  "componentsMissing": [
   "الأهداف",
   "الكفايات",
   "المفاهيم والمصطلحات",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "المنتوج"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-h02",
  "source": "التحولات السياسية والاجتماعية.docx",
  "sourceLayout": "docx",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-h03",
  "title": "الاكتشافات الجغرافية وظاهرة الميركنتيلية",
  "level": "جذع مشترك علمي",
  "subject": "التاريخ",
  "semester": "الدورة الأولى",
  "semesterKey": "session-1",
  "subjectKey": "histoire",
  "unitTitle": "العالم المتوسطي في القرنين 15 و16م",
  "unitId": "tc-h-u1",
  "module": "01",
  "lessonNumber": "03",
  "sessionsCount": 2,
  "sessionsSource": "عدد الحصص (وارد في الوثيقة الأصلية)",
  "description": "الاكتشافات الجغرافية وظاهرة الميركنتيلية — جذاذة التاريخ (الدورة الأولى، العالم المتوسطي في القرنين 15 و16م) · 4 ملفًا أصليًا من وثائق الأستاذ، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/الاكتشافات الجغرافية 2024.pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/الاكتشافات الجغرافية  وظاهرة الميركنتيلية.docx",
  "files": [
   {
    "name": "الاكتشافات الجغرافية 2024.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/الاكتشافات الجغرافية 2024.pdf",
    "kind": "pdf",
    "bytes": 487406,
    "pages": 4,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "الاكتشافات الجغرافية  وظاهرة الميركنتيلية.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/الاكتشافات الجغرافية  وظاهرة الميركنتيلية.docx",
    "kind": "docx",
    "bytes": 294820,
    "pages": null,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "الاكتشافات الجغرافية.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/الاكتشافات الجغرافية.docx",
    "kind": "docx",
    "bytes": 24231,
    "pages": null,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "الاكتشافات الجغرافية و ظاهرة الميركنتيلية.doc",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/الاكتشافات الجغرافية و ظاهرة الميركنتيلية.doc",
    "kind": "doc",
    "bytes": 70144,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 4,
  "keywords": [
   "الاكتشافات",
   "الجغرافية",
   "وظاهرة",
   "الميركنتيلية",
   "العالم",
   "المتوسطي",
   "القرنين",
   "و16م",
   "التاريخ",
   "الدورة الأولى",
   "جذاذة",
   "الجذاذة 03",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "الكفايات",
   "الوسائل والوثائق (الدعامات)",
   "أنشطة المتعلم"
  ],
  "componentsMissing": [
   "الأهداف",
   "الإشكالية",
   "المفاهيم والمصطلحات",
   "مراحل الدرس",
   "أنشطة الأستاذ (التدبير)",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب",
   "التقويم",
   "المنتوج"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-h03",
  "source": "الاكتشافات الجغرافية و ظاهرة الميركنتيلية.doc",
  "sourceLayout": "doc",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-h04",
  "title": "المد الإسلامي (امتداد النفوذ العثماني وبداية التدخل الأوروبي)",
  "level": "جذع مشترك علمي",
  "subject": "التاريخ",
  "semester": "الدورة الأولى",
  "semesterKey": "session-1",
  "subjectKey": "histoire",
  "unitTitle": "العالم المتوسطي في القرنين 15 و16م",
  "unitId": "tc-h-u1",
  "module": "01",
  "lessonNumber": "04",
  "sessionsCount": 2,
  "sessionsSource": "عدد الحصص (وارد في الوثيقة الأصلية)",
  "description": "المد الإسلامي (امتداد النفوذ العثماني وبداية التدخل الأوروبي) — جذاذة التاريخ (الدورة الأولى، العالم المتوسطي في القرنين 15 و16م) · 1 ملفًا أصليًا من وثائق الأستاذ (ملفات Word: تحميل فقط).",
  "pdfUrl": null,
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/العثمانيون.doc",
  "files": [
   {
    "name": "العثمانيون.doc",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/العثمانيون.doc",
    "kind": "doc",
    "bytes": 59904,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "related"
   }
  ],
  "exactFiles": 0,
  "keywords": [
   "المد",
   "الإسلامي",
   "امتداد",
   "النفوذ",
   "العثماني",
   "وبداية",
   "التدخل",
   "الأوروبي",
   "العالم",
   "المتوسطي",
   "القرنين",
   "و16م",
   "التاريخ",
   "الدورة الأولى",
   "جذاذة",
   "الجذاذة 04",
   "جذع مشترك علمي",
   "الاجتماعيات",
   "العثمانيون"
  ],
  "components": [
   "الكفايات",
   "الوسائل والوثائق (الدعامات)",
   "مراحل الدرس",
   "أنشطة المتعلم"
  ],
  "componentsMissing": [
   "الأهداف",
   "الإشكالية",
   "المفاهيم والمصطلحات",
   "أنشطة الأستاذ (التدبير)",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب",
   "التقويم",
   "المنتوج"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-h04",
  "source": "العثمانيون.doc",
  "sourceLayout": "doc",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-h05",
  "title": "التطورات السياسية والاجتماعية في العالم الإسلامي",
  "level": "جذع مشترك علمي",
  "subject": "التاريخ",
  "semester": "الدورة الأولى",
  "semesterKey": "session-1",
  "subjectKey": "histoire",
  "unitTitle": "العالم المتوسطي في القرنين 15 و16م",
  "unitId": "tc-h-u1",
  "module": "01",
  "lessonNumber": "05",
  "sessionsCount": 3,
  "sessionsSource": "عدد الحصص (وارد في الوثيقة الأصلية)",
  "description": "التطورات السياسية والاجتماعية في العالم الإسلامي — جذاذة التاريخ (الدورة الأولى، العالم المتوسطي في القرنين 15 و16م) · 3 ملفًا أصليًا من وثائق الأستاذ، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/التطورات السياسية والاجتماعية في العالم الإسلامي.pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/التطورات السياسية والاجتماعية في العالم الإسلامي.docx",
  "files": [
   {
    "name": "التطورات السياسية والاجتماعية في العالم الإسلامي.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/التطورات السياسية والاجتماعية في العالم الإسلامي.pdf",
    "kind": "pdf",
    "bytes": 443694,
    "pages": 5,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "التطورات السياسية والاجتماعية في العالم الإسلامي.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/التطورات السياسية والاجتماعية في العالم الإسلامي.docx",
    "kind": "docx",
    "bytes": 53148,
    "pages": null,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "التطورات السياسية و الإج بالعالم الإسىمي.doc",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/التطورات السياسية و الإج بالعالم الإسىمي.doc",
    "kind": "doc",
    "bytes": 68608,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 3,
  "keywords": [
   "التطورات",
   "السياسية",
   "والاجتماعية",
   "العالم",
   "الإسلامي",
   "المتوسطي",
   "القرنين",
   "و16م",
   "التاريخ",
   "الدورة الأولى",
   "جذاذة",
   "الجذاذة 05",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "الكفايات",
   "المفاهيم والمصطلحات",
   "الوسائل والوثائق (الدعامات)",
   "مراحل الدرس",
   "أنشطة المتعلم"
  ],
  "componentsMissing": [
   "الأهداف",
   "الإشكالية",
   "أنشطة الأستاذ (التدبير)",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب",
   "التقويم",
   "المنتوج"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-h05",
  "source": "التطورات السياسية و الإج بالعالم الإسىمي.doc",
  "sourceLayout": "doc",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-h06",
  "title": "التطورات الاقتصادية في العالم الإسلامي",
  "level": "جذع مشترك علمي",
  "subject": "التاريخ",
  "semester": "الدورة الأولى",
  "semesterKey": "session-1",
  "subjectKey": "histoire",
  "unitTitle": "العالم المتوسطي في القرنين 15 و16م",
  "unitId": "tc-h-u1",
  "module": "01",
  "lessonNumber": "06",
  "sessionsCount": 2,
  "sessionsSource": "عدد الحصص (وارد في الوثيقة الأصلية)",
  "description": "التطورات الاقتصادية في العالم الإسلامي — جذاذة التاريخ (الدورة الأولى، العالم المتوسطي في القرنين 15 و16م) · 3 ملفًا أصليًا من وثائق الأستاذ، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/التطورات الاقتصادية في العالم الاسلامي.pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/التطورات الاقتصادية  في العالم الإسلامي.docx",
  "files": [
   {
    "name": "التطورات الاقتصادية في العالم الاسلامي.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/التطورات الاقتصادية في العالم الاسلامي.pdf",
    "kind": "pdf",
    "bytes": 595850,
    "pages": 3,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "التطورات الاقتصادية  في العالم الإسلامي.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/التطورات الاقتصادية  في العالم الإسلامي.docx",
    "kind": "docx",
    "bytes": 54298,
    "pages": null,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "التطورات الاق في العالم الاسلامي.doc",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-1/التطورات الاق في العالم الاسلامي.doc",
    "kind": "doc",
    "bytes": 51200,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 3,
  "keywords": [
   "التطورات",
   "الاقتصادية",
   "العالم",
   "الإسلامي",
   "المتوسطي",
   "القرنين",
   "و16م",
   "التاريخ",
   "الدورة الأولى",
   "جذاذة",
   "الجذاذة 06",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "الكفايات",
   "الوسائل والوثائق (الدعامات)",
   "مراحل الدرس",
   "أنشطة المتعلم"
  ],
  "componentsMissing": [
   "الأهداف",
   "الإشكالية",
   "المفاهيم والمصطلحات",
   "أنشطة الأستاذ (التدبير)",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب",
   "التقويم",
   "المنتوج"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-h06",
  "source": "التطورات الاق في العالم الاسلامي.doc",
  "sourceLayout": "doc",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-h07",
  "title": "عصر الأنوار (الفكر الإنجليزي والفكر الفرنسي)",
  "level": "جذع مشترك علمي",
  "subject": "التاريخ",
  "semester": "الدورة الثانية",
  "semesterKey": "session-2",
  "subjectKey": "histoire",
  "unitTitle": "العالم المتوسطي في القرنين 17 و18م",
  "unitId": "tc-h-u2",
  "module": "02",
  "lessonNumber": "07",
  "sessionsCount": 3,
  "sessionsSource": "مدة الإنجاز (واردة في الوثيقة الأصلية)",
  "description": "عصر الأنوار (الفكر الإنجليزي والفكر الفرنسي) — جذاذة التاريخ (الدورة الثانية، العالم المتوسطي في القرنين 17 و18م) · 6 ملفًا أصليًا من وثائق الأستاذ، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/عصر الأنوار (الفكر الانجليزي والفكر الفرنسي).pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/عصر_الأنوار_الفكر_الانجليزي_والفكر_الفرنسي.docx",
  "files": [
   {
    "name": "عصر الأنوار (الفكر الانجليزي والفكر الفرنسي).pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/عصر الأنوار (الفكر الانجليزي والفكر الفرنسي).pdf",
    "kind": "pdf",
    "bytes": 630157,
    "pages": 3,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "جدادة_عصر_الانوار_شعبة_العلوم_فتيحة.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/جدادة_عصر_الانوار_شعبة_العلوم_فتيحة.pdf",
    "kind": "pdf",
    "bytes": 564460,
    "pages": 5,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "عصر الأنوار ( الفكر الانجليزي والفكر الفرنسي).pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/عصر الأنوار ( الفكر الانجليزي والفكر الفرنسي).pdf",
    "kind": "pdf",
    "bytes": 341500,
    "pages": 4,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "عصر_الأنوار_الفكر_الانجليزي_والفكر_الفرنسي.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/عصر_الأنوار_الفكر_الانجليزي_والفكر_الفرنسي.docx",
    "kind": "docx",
    "bytes": 210337,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "عصر الأنوار ( الفكر الانجليزي والفكر الفرنسي).docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/عصر الأنوار ( الفكر الانجليزي والفكر الفرنسي).docx",
    "kind": "docx",
    "bytes": 166700,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "عصر الأنوار الفكر الانجليزي والفكر الفرنسي.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/عصر الأنوار الفكر الانجليزي والفكر الفرنسي.docx",
    "kind": "docx",
    "bytes": 76080,
    "pages": null,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 6,
  "keywords": [
   "عصر",
   "الأنوار",
   "الفكر",
   "الإنجليزي",
   "والفكر",
   "الفرنسي",
   "العالم",
   "المتوسطي",
   "القرنين",
   "و18م",
   "التاريخ",
   "الدورة الثانية",
   "جذاذة",
   "الجذاذة 07",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "الإشكالية",
   "الوسائل والوثائق (الدعامات)",
   "مراحل الدرس",
   "أنشطة الأستاذ (التدبير)",
   "المنتوج"
  ],
  "componentsMissing": [
   "الأهداف",
   "الكفايات",
   "المفاهيم والمصطلحات",
   "أنشطة المتعلم",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب",
   "التقويم"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-h07",
  "source": "عصر الأنوار ( الفكر الانجليزي والفكر الفرنسي).docx",
  "sourceLayout": "docx",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-h08",
  "title": "الثورات الاجتماعية والسياسية (الثورة الفرنسية)",
  "level": "جذع مشترك علمي",
  "subject": "التاريخ",
  "semester": "الدورة الثانية",
  "semesterKey": "session-2",
  "subjectKey": "histoire",
  "unitTitle": "العالم المتوسطي في القرنين 17 و18م",
  "unitId": "tc-h-u2",
  "module": "02",
  "lessonNumber": "08",
  "sessionsCount": null,
  "sessionsSource": null,
  "description": "الثورات الاجتماعية والسياسية (الثورة الفرنسية) — جذاذة التاريخ (الدورة الثانية، العالم المتوسطي في القرنين 17 و18م) · 4 ملفًا أصليًا من وثائق الأستاذ، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/الثورات الاجتماعية والسياسية (الثورة الفرنسية الأسباب والنتائج).pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/الثورات الاجتماعية والسياسية (الثورة الفرنسية الأسباب والنتائج).docx",
  "files": [
   {
    "name": "الثورات الاجتماعية والسياسية (الثورة الفرنسية الأسباب والنتائج).pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/الثورات الاجتماعية والسياسية (الثورة الفرنسية الأسباب والنتائج).pdf",
    "kind": "pdf",
    "bytes": 459088,
    "pages": 3,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "الثورة الفرنسية.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/الثورة الفرنسية.pdf",
    "kind": "pdf",
    "bytes": 367465,
    "pages": 3,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "الثورات الاجتماعية والسياسية (الثورة الفرنسية الأسباب والنتائج).docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/الثورات الاجتماعية والسياسية (الثورة الفرنسية الأسباب والنتائج).docx",
    "kind": "docx",
    "bytes": 163507,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "الثورة الإنجليزية.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/الثورة الإنجليزية.docx",
    "kind": "docx",
    "bytes": 127932,
    "pages": null,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "related"
   }
  ],
  "exactFiles": 3,
  "keywords": [
   "الثورات",
   "الاجتماعية",
   "والسياسية",
   "الثورة",
   "الفرنسية",
   "العالم",
   "المتوسطي",
   "القرنين",
   "و18م",
   "التاريخ",
   "الدورة الثانية",
   "جذاذة",
   "الجذاذة 08",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "الأهداف",
   "الإشكالية",
   "الوسائل والوثائق (الدعامات)",
   "مراحل الدرس",
   "أنشطة الأستاذ (التدبير)",
   "المنتوج"
  ],
  "componentsMissing": [
   "الكفايات",
   "المفاهيم والمصطلحات",
   "أنشطة المتعلم",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب",
   "التقويم"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-h08",
  "source": "الثورات الاجتماعية والسياسية (الثورة الفرنسية الأسباب والنتائج).docx",
  "sourceLayout": "docx",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-h09",
  "title": "انطلاقة الثورة الصناعية",
  "level": "جذع مشترك علمي",
  "subject": "التاريخ",
  "semester": "الدورة الثانية",
  "semesterKey": "session-2",
  "subjectKey": "histoire",
  "unitTitle": "العالم المتوسطي في القرنين 17 و18م",
  "unitId": "tc-h-u2",
  "module": "02",
  "lessonNumber": "09",
  "sessionsCount": null,
  "sessionsSource": null,
  "description": "انطلاقة الثورة الصناعية — جذاذة التاريخ (الدورة الثانية، العالم المتوسطي في القرنين 17 و18م) · 5 ملفًا أصليًا من وثائق الأستاذ، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/انطلاقة الثورة الصناعي.pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/انطلاقة الثورة الصناعي.docx",
  "files": [
   {
    "name": "انطلاقة الثورة الصناعي.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/انطلاقة الثورة الصناعي.pdf",
    "kind": "pdf",
    "bytes": 300999,
    "pages": 3,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "الثورة الصناعية .docx.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/الثورة الصناعية .docx.pdf",
    "kind": "pdf",
    "bytes": 134400,
    "pages": 2,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "انطلاقة الثورة الصناعي.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/انطلاقة الثورة الصناعي.docx",
    "kind": "docx",
    "bytes": 147378,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "انطلاق الثورة الصناعية - التطور التقني، الانعكاسات على البنية الاجتماعية -.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/انطلاق الثورة الصناعية - التطور التقني، الانعكاسات على البنية الاجتماعية -.docx",
    "kind": "docx",
    "bytes": 128358,
    "pages": null,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "انطلاق الثورة الصناعية.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/انطلاق الثورة الصناعية.docx",
    "kind": "docx",
    "bytes": 26662,
    "pages": null,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 5,
  "keywords": [
   "انطلاقة",
   "الثورة",
   "الصناعية",
   "العالم",
   "المتوسطي",
   "القرنين",
   "و18م",
   "التاريخ",
   "الدورة الثانية",
   "جذاذة",
   "الجذاذة 09",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "الإشكالية",
   "الوسائل والوثائق (الدعامات)",
   "مراحل الدرس",
   "أنشطة الأستاذ (التدبير)",
   "المنتوج"
  ],
  "componentsMissing": [
   "الأهداف",
   "الكفايات",
   "المفاهيم والمصطلحات",
   "أنشطة المتعلم",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب",
   "التقويم"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-h09",
  "source": "انطلاقة الثورة الصناعي.docx",
  "sourceLayout": "docx",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-h10",
  "title": "الأوضاع العامة في العالم الإسلامي",
  "level": "جذع مشترك علمي",
  "subject": "التاريخ",
  "semester": "الدورة الثانية",
  "semesterKey": "session-2",
  "subjectKey": "histoire",
  "unitTitle": "العالم المتوسطي في القرنين 17 و18م",
  "unitId": "tc-h-u2",
  "module": "02",
  "lessonNumber": "10",
  "sessionsCount": null,
  "sessionsSource": null,
  "description": "الأوضاع العامة في العالم الإسلامي — جذاذة التاريخ (الدورة الثانية، العالم المتوسطي في القرنين 17 و18م) · 4 ملفًا أصليًا من وثائق الأستاذ، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/الأوضاع العامة في العالم الإسلامي.pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/الأوضاع العامة في العالم الإسلامي.docx",
  "files": [
   {
    "name": "الأوضاع العامة في العالم الإسلامي.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/الأوضاع العامة في العالم الإسلامي.pdf",
    "kind": "pdf",
    "bytes": 377699,
    "pages": 3,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "الأوضاع_العامة_في_العالم_الإسلامي_1.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/الأوضاع_العامة_في_العالم_الإسلامي_1.pdf",
    "kind": "pdf",
    "bytes": 377699,
    "pages": 3,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "الأوضاع_العامة_في_العالم_الإسلامي.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/الأوضاع_العامة_في_العالم_الإسلامي.pdf",
    "kind": "pdf",
    "bytes": 115888,
    "pages": 3,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "الأوضاع العامة في العالم الإسلامي.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/الأوضاع العامة في العالم الإسلامي.docx",
    "kind": "docx",
    "bytes": 158834,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 4,
  "keywords": [
   "الأوضاع",
   "العامة",
   "العالم",
   "الإسلامي",
   "المتوسطي",
   "القرنين",
   "و18م",
   "التاريخ",
   "الدورة الثانية",
   "جذاذة",
   "الجذاذة 10",
   "جذع مشترك علمي",
   "الاجتماعيات",
   "الأوضاع"
  ],
  "components": [
   "الإشكالية",
   "الوسائل والوثائق (الدعامات)",
   "مراحل الدرس",
   "أنشطة الأستاذ (التدبير)",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "المنتوج"
  ],
  "componentsMissing": [
   "الأهداف",
   "الكفايات",
   "المفاهيم والمصطلحات",
   "أنشطة المتعلم",
   "الخلاصة / الاستنتاج / التركيب",
   "التقويم"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-h10",
  "source": "الأوضاع العامة في العالم الإسلامي.docx",
  "sourceLayout": "docx",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-h11",
  "title": "تصاعد الضغوط الأوروبية على العالم الإسلامي",
  "level": "جذع مشترك علمي",
  "subject": "التاريخ",
  "semester": "الدورة الثانية",
  "semesterKey": "session-2",
  "subjectKey": "histoire",
  "unitTitle": "العالم المتوسطي في القرنين 17 و18م",
  "unitId": "tc-h-u2",
  "module": "02",
  "lessonNumber": "11",
  "sessionsCount": null,
  "sessionsSource": null,
  "description": "تصاعد الضغوط الأوروبية على العالم الإسلامي — جذاذة التاريخ (الدورة الثانية، العالم المتوسطي في القرنين 17 و18م) · 3 ملفًا أصليًا من وثائق الأستاذ، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/تصاعد الضغوط الأوربية على العالم الإسلامي.pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/تصاعد الضغوط الأوربية على العالم الإسلامي.docx",
  "files": [
   {
    "name": "تصاعد الضغوط الأوربية على العالم الإسلامي.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/تصاعد الضغوط الأوربية على العالم الإسلامي.pdf",
    "kind": "pdf",
    "bytes": 386521,
    "pages": 3,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "تصاعد الضغوط الأوربية على العالم الإسلامي.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/تصاعد الضغوط الأوربية على العالم الإسلامي.docx",
    "kind": "docx",
    "bytes": 152261,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "تصاعد الضغوط الاوروبية على العالم الاسلامي.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/تصاعد الضغوط الاوروبية على العالم الاسلامي.docx",
    "kind": "docx",
    "bytes": 80142,
    "pages": null,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 3,
  "keywords": [
   "تصاعد",
   "الضغوط",
   "الأوروبية",
   "على",
   "العالم",
   "الإسلامي",
   "المتوسطي",
   "القرنين",
   "و18م",
   "التاريخ",
   "الدورة الثانية",
   "جذاذة",
   "الجذاذة 11",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "الإشكالية",
   "الوسائل والوثائق (الدعامات)",
   "مراحل الدرس",
   "أنشطة الأستاذ (التدبير)",
   "أنشطة المتعلم",
   "المنتوج"
  ],
  "componentsMissing": [
   "الأهداف",
   "الكفايات",
   "المفاهيم والمصطلحات",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب",
   "التقويم"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-h11",
  "source": "تصاعد الضغوط الأوربية على العالم الإسلامي.docx",
  "sourceLayout": "docx",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-h12",
  "title": "بداية محاولات الإصلاح وحدودها",
  "level": "جذع مشترك علمي",
  "subject": "التاريخ",
  "semester": "الدورة الثانية",
  "semesterKey": "session-2",
  "subjectKey": "histoire",
  "unitTitle": "العالم المتوسطي في القرنين 17 و18م",
  "unitId": "tc-h-u2",
  "module": "02",
  "lessonNumber": "12",
  "sessionsCount": null,
  "sessionsSource": null,
  "description": "بداية محاولات الإصلاح وحدودها — جذاذة التاريخ (الدورة الثانية، العالم المتوسطي في القرنين 17 و18م) · 5 ملفًا أصليًا من وثائق الأستاذ، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/بداية محاولات الإصلاح وحدودها.pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/بداية محاولات الإصلاح وحدودها.docx",
  "files": [
   {
    "name": "بداية محاولات الإصلاح وحدودها.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/بداية محاولات الإصلاح وحدودها.pdf",
    "kind": "pdf",
    "bytes": 320497,
    "pages": 3,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "بداية_محاولات_الإصلاح_وحدودها_1.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/بداية_محاولات_الإصلاح_وحدودها_1.pdf",
    "kind": "pdf",
    "bytes": 320497,
    "pages": 3,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "بداية_محاولات_الإصلاح_وحدودها.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/بداية_محاولات_الإصلاح_وحدودها.pdf",
    "kind": "pdf",
    "bytes": 119736,
    "pages": 3,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "بداية محاولات الإصلاح وحدودها.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/بداية محاولات الإصلاح وحدودها.docx",
    "kind": "docx",
    "bytes": 142164,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "بداية محاولات الاصلاح وحدودها.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/بداية محاولات الاصلاح وحدودها.docx",
    "kind": "docx",
    "bytes": 63819,
    "pages": null,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 5,
  "keywords": [
   "بداية",
   "محاولات",
   "الإصلاح",
   "وحدودها",
   "العالم",
   "المتوسطي",
   "القرنين",
   "و18م",
   "التاريخ",
   "الدورة الثانية",
   "جذاذة",
   "الجذاذة 12",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "الأهداف",
   "الإشكالية",
   "الوسائل والوثائق (الدعامات)",
   "مراحل الدرس",
   "أنشطة الأستاذ (التدبير)",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "المنتوج"
  ],
  "componentsMissing": [
   "الكفايات",
   "المفاهيم والمصطلحات",
   "أنشطة المتعلم",
   "الخلاصة / الاستنتاج / التركيب",
   "التقويم"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-h12",
  "source": "بداية محاولات الإصلاح وحدودها.docx",
  "sourceLayout": "docx",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-h13",
  "title": "اختلال التوازن بالعالم المتوسطي وبداية الهيمنة الأوروبية",
  "level": "جذع مشترك علمي",
  "subject": "التاريخ",
  "semester": "الدورة الثانية",
  "semesterKey": "session-2",
  "subjectKey": "histoire",
  "unitTitle": "العالم المتوسطي في القرنين 17 و18م",
  "unitId": "tc-h-u2",
  "module": "02",
  "lessonNumber": "13",
  "sessionsCount": null,
  "sessionsSource": null,
  "description": "اختلال التوازن بالعالم المتوسطي وبداية الهيمنة الأوروبية — جذاذة التاريخ (الدورة الثانية، العالم المتوسطي في القرنين 17 و18م) · 1 ملفًا أصليًا من وثائق الأستاذ (ملفات Word: تحميل فقط).",
  "pdfUrl": null,
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/اختلال التوازن بالعالم المتوسطي وبداية الهيمنة الاوروبية.docx",
  "files": [
   {
    "name": "اختلال التوازن بالعالم المتوسطي وبداية الهيمنة الاوروبية.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/session-2/اختلال التوازن بالعالم المتوسطي وبداية الهيمنة الاوروبية.docx",
    "kind": "docx",
    "bytes": 83245,
    "pages": null,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 1,
  "keywords": [
   "اختلال",
   "التوازن",
   "بالعالم",
   "المتوسطي",
   "وبداية",
   "الهيمنة",
   "الأوروبية",
   "العالم",
   "القرنين",
   "و18م",
   "التاريخ",
   "الدورة الثانية",
   "جذاذة",
   "الجذاذة 13",
   "جذع مشترك علمي",
   "الاجتماعيات",
   "جدادات"
  ],
  "components": [
   "الكفايات",
   "الإشكالية",
   "الوسائل والوثائق (الدعامات)",
   "أنشطة الأستاذ (التدبير)",
   "أنشطة المتعلم",
   "الأسئلة",
   "الخلاصة / الاستنتاج / التركيب",
   "التقويم"
  ],
  "componentsMissing": [
   "الأهداف",
   "المفاهيم والمصطلحات",
   "مراحل الدرس",
   "الأجوبة / عناصر الإجابة",
   "المنتوج"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-h13",
  "source": "جدادات جدع م علمي التاريخ.docx",
  "sourceLayout": "docx",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-g01",
  "title": "الجغرافيا: الموضوع، الوظيفة، الأدوات",
  "level": "جذع مشترك علمي",
  "subject": "الجغرافيا",
  "semester": "الدورة الأولى",
  "semesterKey": "session-1",
  "subjectKey": "geographie",
  "unitTitle": "التعريف بمكونات الوسط الطبيعي",
  "unitId": "tc-g-u1",
  "module": "01",
  "lessonNumber": "01",
  "sessionsCount": null,
  "sessionsSource": null,
  "description": "الجغرافيا: الموضوع، الوظيفة، الأدوات — جذاذة الجغرافيا (الدورة الأولى، التعريف بمكونات الوسط الطبيعي) · 2 ملفًا أصليًا من وثائق الأستاذ، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/الجغرافيا الوظيفة الموضوع الادوات.pdf",
  "docUrl": null,
  "files": [
   {
    "name": "الجغرافيا الوظيفة الموضوع الادوات.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/الجغرافيا الوظيفة الموضوع الادوات.pdf",
    "kind": "pdf",
    "bytes": 646305,
    "pages": 3,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "جذاذة درس الجغرافيا الموضوع الوظيفية...pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/جذاذة درس الجغرافيا الموضوع الوظيفية...pdf",
    "kind": "pdf",
    "bytes": 245030,
    "pages": 2,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 2,
  "keywords": [
   "الجغرافيا:",
   "الموضوع،",
   "الوظيفة،",
   "الأدوات",
   "التعريف",
   "بمكونات",
   "الوسط",
   "الطبيعي",
   "الجغرافيا",
   "الدورة الأولى",
   "جذاذة",
   "الجذاذة 01",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "المفاهيم والمصطلحات",
   "الوسائل والوثائق (الدعامات)",
   "أنشطة المتعلم"
  ],
  "componentsMissing": [
   "الأهداف",
   "الكفايات",
   "الإشكالية",
   "مراحل الدرس",
   "أنشطة الأستاذ (التدبير)",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب",
   "التقويم",
   "المنتوج"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-g01",
  "source": "جذاذة درس الجغرافيا الموضوع الوظيفية...pdf",
  "sourceLayout": "pdf",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-g02",
  "title": "الكوارث الطبيعية: تعريفها وأنواعها",
  "level": "جذع مشترك علمي",
  "subject": "الجغرافيا",
  "semester": "الدورة الأولى",
  "semesterKey": "session-1",
  "subjectKey": "geographie",
  "unitTitle": "التعريف بمكونات الوسط الطبيعي",
  "unitId": "tc-g-u1",
  "module": "01",
  "lessonNumber": "02",
  "sessionsCount": null,
  "sessionsSource": null,
  "description": "الكوارث الطبيعية: تعريفها وأنواعها — جذاذة الجغرافيا (الدورة الأولى، التعريف بمكونات الوسط الطبيعي) · لا يتوفر ملف أصلي مستقل في وثائق الأستاذ؛ الجذاذة الرقمية المأخوذة من وثيقته متوفرة للعرض والطباعة داخل الموقع.",
  "pdfUrl": null,
  "docUrl": null,
  "files": [],
  "exactFiles": 0,
  "keywords": [
   "الكوارث",
   "الطبيعية:",
   "تعريفها",
   "وأنواعها",
   "التعريف",
   "بمكونات",
   "الوسط",
   "الطبيعي",
   "الجغرافيا",
   "الدورة الأولى",
   "جذاذة",
   "الجذاذة 02",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "الكفايات",
   "الإشكالية",
   "الوسائل والوثائق (الدعامات)",
   "مراحل الدرس",
   "أنشطة المتعلم",
   "الخلاصة / الاستنتاج / التركيب"
  ],
  "componentsMissing": [
   "الأهداف",
   "المفاهيم والمصطلحات",
   "أنشطة الأستاذ (التدبير)",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "التقويم",
   "المنتوج"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-g02",
  "source": "الكوارث الطبيعية - الزلازل بالمغرب.doc",
  "sourceLayout": "doc",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-g03",
  "title": "المجموعات البنيوية الكبرى وأشكال التضاريس",
  "level": "جذع مشترك علمي",
  "subject": "الجغرافيا",
  "semester": "الدورة الأولى",
  "semesterKey": "session-1",
  "subjectKey": "geographie",
  "unitTitle": "التعريف بمكونات الوسط الطبيعي",
  "unitId": "tc-g-u1",
  "module": "01",
  "lessonNumber": "03",
  "sessionsCount": null,
  "sessionsSource": null,
  "description": "المجموعات البنيوية الكبرى وأشكال التضاريس — جذاذة الجغرافيا (الدورة الأولى، التعريف بمكونات الوسط الطبيعي) · 5 ملفًا أصليًا من وثائق الأستاذ، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/المجموعات البنيوية (1).pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/2المجموعات_البنيوية_الكبرى_وأشكال_التضاريس.docx",
  "files": [
   {
    "name": "المجموعات البنيوية (1).pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/المجموعات البنيوية (1).pdf",
    "kind": "pdf",
    "bytes": 575438,
    "pages": 3,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "جذاذة المجموعات البنيوية جذع علوم .pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/جذاذة المجموعات البنيوية جذع علوم .pdf",
    "kind": "pdf",
    "bytes": 299104,
    "pages": 3,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "2المجموعات_البنيوية_الكبرى_وأشكال_التضاريس.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/2المجموعات_البنيوية_الكبرى_وأشكال_التضاريس.docx",
    "kind": "docx",
    "bytes": 12886,
    "pages": null,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "المجموعات البنيوية.doc",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/المجموعات البنيوية.doc",
    "kind": "doc",
    "bytes": 69120,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "المجموعات البنيوية.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/المجموعات البنيوية.docx",
    "kind": "docx",
    "bytes": 71513,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 5,
  "keywords": [
   "المجموعات",
   "البنيوية",
   "الكبرى",
   "وأشكال",
   "التضاريس",
   "التعريف",
   "بمكونات",
   "الوسط",
   "الطبيعي",
   "الجغرافيا",
   "الدورة الأولى",
   "جذاذة",
   "الجذاذة 03",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "الكفايات",
   "المفاهيم والمصطلحات",
   "الوسائل والوثائق (الدعامات)",
   "مراحل الدرس",
   "أنشطة المتعلم"
  ],
  "componentsMissing": [
   "الأهداف",
   "الإشكالية",
   "أنشطة الأستاذ (التدبير)",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب",
   "التقويم",
   "المنتوج"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-g03",
  "source": "المجموعات البنيوية.docx",
  "sourceLayout": "docx",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-g04",
  "title": "النطاقات المناخية والغطاء النباتي في العالم (مقابلة بين خريطتين)",
  "level": "جذع مشترك علمي",
  "subject": "الجغرافيا",
  "semester": "الدورة الأولى",
  "semesterKey": "session-1",
  "subjectKey": "geographie",
  "unitTitle": "التعريف بمكونات الوسط الطبيعي",
  "unitId": "tc-g-u1",
  "module": "01",
  "lessonNumber": "04",
  "sessionsCount": 4,
  "sessionsSource": "الغلاف الزمني (وارد في الوثيقة الأصلية)",
  "description": "النطاقات المناخية والغطاء النباتي في العالم (مقابلة بين خريطتين) — جذاذة الجغرافيا (الدورة الأولى، التعريف بمكونات الوسط الطبيعي) · 4 ملفًا أصليًا من وثائق الأستاذ، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/جدادة النطاقات (2).pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/النطاقات المناخية.doc",
  "files": [
   {
    "name": "جدادة النطاقات (2).pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/جدادة النطاقات (2).pdf",
    "kind": "pdf",
    "bytes": 446640,
    "pages": 4,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "النطاقات المناخية والغطاء النباتي في العالم.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/النطاقات المناخية والغطاء النباتي في العالم.pdf",
    "kind": "pdf",
    "bytes": 336983,
    "pages": 3,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "النطاقات المناخية.doc",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/النطاقات المناخية.doc",
    "kind": "doc",
    "bytes": 72192,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "جذاذاة  النطاقات المناخية والغطاء النباتي في العالم مقابلة بين خريطتين.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/جذاذاة  النطاقات المناخية والغطاء النباتي في العالم مقابلة بين خريطتين.docx",
    "kind": "docx",
    "bytes": 21227,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 4,
  "keywords": [
   "النطاقات",
   "المناخية",
   "والغطاء",
   "النباتي",
   "العالم",
   "مقابلة",
   "بين",
   "خريطتين",
   "التعريف",
   "بمكونات",
   "الوسط",
   "الطبيعي",
   "الجغرافيا",
   "الدورة الأولى",
   "جذاذة",
   "الجذاذة 04",
   "جذع مشترك علمي",
   "الاجتماعيات",
   "جذاذاة"
  ],
  "components": [
   "الكفايات",
   "الإشكالية",
   "المفاهيم والمصطلحات",
   "الوسائل والوثائق (الدعامات)",
   "أنشطة الأستاذ (التدبير)",
   "أنشطة المتعلم",
   "التقويم"
  ],
  "componentsMissing": [
   "الأهداف",
   "مراحل الدرس",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب",
   "المنتوج"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-g04",
  "source": "جذاذاة  النطاقات المناخية والغطاء النباتي في العالم مقابلة بين خريطتين.docx",
  "sourceLayout": "docx",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-g05",
  "title": "المنظومة البيئية: مفهومها، أسس توازنها والتعريف بأنواعها",
  "level": "جذع مشترك علمي",
  "subject": "الجغرافيا",
  "semester": "الدورة الأولى",
  "semesterKey": "session-1",
  "subjectKey": "geographie",
  "unitTitle": "التعريف بمكونات الوسط الطبيعي",
  "unitId": "tc-g-u1",
  "module": "01",
  "lessonNumber": "05",
  "sessionsCount": null,
  "sessionsSource": null,
  "description": "المنظومة البيئية: مفهومها، أسس توازنها والتعريف بأنواعها — جذاذة الجغرافيا (الدورة الأولى، التعريف بمكونات الوسط الطبيعي) · 2 ملفًا أصليًا من وثائق الأستاذ، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/المنظومة البيئية  مفهومها وأسس توازنها والتعريف بأنواعها.pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/المنظومة البيئية  مفهومها وأسس توازنها والتعريف بأنواعها.docx",
  "files": [
   {
    "name": "المنظومة البيئية  مفهومها وأسس توازنها والتعريف بأنواعها.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/المنظومة البيئية  مفهومها وأسس توازنها والتعريف بأنواعها.pdf",
    "kind": "pdf",
    "bytes": 293871,
    "pages": 3,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "المنظومة البيئية  مفهومها وأسس توازنها والتعريف بأنواعها.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-1/المنظومة البيئية  مفهومها وأسس توازنها والتعريف بأنواعها.docx",
    "kind": "docx",
    "bytes": 150357,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 2,
  "keywords": [
   "المنظومة",
   "البيئية:",
   "مفهومها،",
   "أسس",
   "توازنها",
   "والتعريف",
   "بأنواعها",
   "التعريف",
   "بمكونات",
   "الوسط",
   "الطبيعي",
   "الجغرافيا",
   "الدورة الأولى",
   "جذاذة",
   "الجذاذة 05",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "الإشكالية",
   "الوسائل والوثائق (الدعامات)",
   "مراحل الدرس",
   "أنشطة الأستاذ (التدبير)",
   "أنشطة المتعلم",
   "التقويم",
   "المنتوج"
  ],
  "componentsMissing": [
   "الأهداف",
   "الكفايات",
   "المفاهيم والمصطلحات",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-g05",
  "source": "المنظومة البيئية  مفهومها وأسس توازنها والتعريف بأنواعها.docx",
  "sourceLayout": "docx",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-g06",
  "title": "أشكال استغلال الإنسان للمجال في الأرياف",
  "level": "جذع مشترك علمي",
  "subject": "الجغرافيا",
  "semester": "الدورة الثانية",
  "semesterKey": "session-2",
  "subjectKey": "geographie",
  "unitTitle": "أشكال استغلال الإنسان للمجال وتنظيمه",
  "unitId": "tc-g-u2",
  "module": "02",
  "lessonNumber": "06",
  "sessionsCount": 3,
  "sessionsSource": "الغلاف الزمني (وارد في الوثيقة الأصلية)",
  "description": "أشكال استغلال الإنسان للمجال في الأرياف — جذاذة الجغرافيا (الدورة الثانية، أشكال استغلال الإنسان للمجال وتنظيمه) · 2 ملفًا أصليًا من وثائق الأستاذ، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/توزع السكان 2024 (1).pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/السكان.doc",
  "files": [
   {
    "name": "توزع السكان 2024 (1).pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/توزع السكان 2024 (1).pdf",
    "kind": "pdf",
    "bytes": 471815,
    "pages": 3,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "related"
   },
   {
    "name": "السكان.doc",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/السكان.doc",
    "kind": "doc",
    "bytes": 55808,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "related"
   }
  ],
  "exactFiles": 0,
  "keywords": [
   "أشكال",
   "استغلال",
   "الإنسان",
   "للمجال",
   "الأرياف",
   "وتنظيمه",
   "الجغرافيا",
   "الدورة الثانية",
   "جذاذة",
   "الجذاذة 06",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "المفاهيم والمصطلحات",
   "الوسائل والوثائق (الدعامات)",
   "أنشطة المتعلم",
   "التقويم"
  ],
  "componentsMissing": [
   "الأهداف",
   "الكفايات",
   "الإشكالية",
   "مراحل الدرس",
   "أنشطة الأستاذ (التدبير)",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب",
   "المنتوج"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-g06",
  "source": "الجغرافيا جدع مشترك جذاذات..docx",
  "sourceLayout": "docx",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-g07",
  "title": "أشكال استغلال الإنسان للمجال في المدن",
  "level": "جذع مشترك علمي",
  "subject": "الجغرافيا",
  "semester": "الدورة الثانية",
  "semesterKey": "session-2",
  "subjectKey": "geographie",
  "unitTitle": "أشكال استغلال الإنسان للمجال وتنظيمه",
  "unitId": "tc-g-u2",
  "module": "02",
  "lessonNumber": "07",
  "sessionsCount": null,
  "sessionsSource": null,
  "description": "أشكال استغلال الإنسان للمجال في المدن — جذاذة الجغرافيا (الدورة الثانية، أشكال استغلال الإنسان للمجال وتنظيمه) · 1 ملفًا أصليًا من وثائق الأستاذ (ملفات Word: تحميل فقط).",
  "pdfUrl": null,
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/المدن.doc",
  "files": [
   {
    "name": "المدن.doc",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/المدن.doc",
    "kind": "doc",
    "bytes": 56832,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "related"
   }
  ],
  "exactFiles": 0,
  "keywords": [
   "أشكال",
   "استغلال",
   "الإنسان",
   "للمجال",
   "المدن",
   "وتنظيمه",
   "الجغرافيا",
   "الدورة الثانية",
   "جذاذة",
   "الجذاذة 07",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "المفاهيم والمصطلحات",
   "الوسائل والوثائق (الدعامات)",
   "أنشطة المتعلم",
   "التقويم"
  ],
  "componentsMissing": [
   "الأهداف",
   "الكفايات",
   "الإشكالية",
   "مراحل الدرس",
   "أنشطة الأستاذ (التدبير)",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب",
   "المنتوج"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-g07",
  "source": "الجغرافيا جدع مشترك جذاذات..docx",
  "sourceLayout": "docx",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-g08",
  "title": "تقنيات رسم خرائط المجال الريفي والحضري (تمثيل المعطيات النوعية والكمية)",
  "level": "جذع مشترك علمي",
  "subject": "الجغرافيا",
  "semester": "الدورة الثانية",
  "semesterKey": "session-2",
  "subjectKey": "geographie",
  "unitTitle": "أشكال استغلال الإنسان للمجال وتنظيمه",
  "unitId": "tc-g-u2",
  "module": "02",
  "lessonNumber": "08",
  "sessionsCount": null,
  "sessionsSource": null,
  "description": "تقنيات رسم خرائط المجال الريفي والحضري (تمثيل المعطيات النوعية والكمية) — جذاذة الجغرافيا (الدورة الثانية، أشكال استغلال الإنسان للمجال وتنظيمه) · 1 ملفًا أصليًا من وثائق الأستاذ (ملفات Word: تحميل فقط).",
  "pdfUrl": null,
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/الخرائط.doc",
  "files": [
   {
    "name": "الخرائط.doc",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/الخرائط.doc",
    "kind": "doc",
    "bytes": 359424,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "related"
   }
  ],
  "exactFiles": 0,
  "keywords": [
   "تقنيات",
   "رسم",
   "خرائط",
   "المجال",
   "الريفي",
   "والحضري",
   "تمثيل",
   "المعطيات",
   "النوعية",
   "والكمية",
   "أشكال",
   "استغلال",
   "الإنسان",
   "للمجال",
   "وتنظيمه",
   "الجغرافيا",
   "الدورة الثانية",
   "جذاذة",
   "الجذاذة 08",
   "جذع مشترك علمي",
   "الاجتماعيات",
   "الخرائط"
  ],
  "components": [
   "الأهداف",
   "الكفايات",
   "الوسائل والوثائق (الدعامات)",
   "مراحل الدرس",
   "أنشطة المتعلم"
  ],
  "componentsMissing": [
   "الإشكالية",
   "المفاهيم والمصطلحات",
   "أنشطة الأستاذ (التدبير)",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب",
   "التقويم",
   "المنتوج"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-g08",
  "source": "الخرائط.doc",
  "sourceLayout": "doc",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-g09",
  "title": "الإجراءات والتدابير على مستوى تنظيم المجال (التشريعية والتقنية، التربوية)",
  "level": "جذع مشترك علمي",
  "subject": "الجغرافيا",
  "semester": "الدورة الثانية",
  "semesterKey": "session-2",
  "subjectKey": "geographie",
  "unitTitle": "أشكال استغلال الإنسان للمجال وتنظيمه",
  "unitId": "tc-g-u2",
  "module": "02",
  "lessonNumber": "09",
  "sessionsCount": null,
  "sessionsSource": null,
  "description": "الإجراءات والتدابير على مستوى تنظيم المجال (التشريعية والتقنية، التربوية) — جذاذة الجغرافيا (الدورة الثانية، أشكال استغلال الإنسان للمجال وتنظيمه) · 2 ملفًا أصليًا من وثائق الأستاذ، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/الإجراءات والتدابير التشريعية والتقنية.pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/الإجراءات والتدابير التشريعية والتقنية.docx",
  "files": [
   {
    "name": "الإجراءات والتدابير التشريعية والتقنية.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/الإجراءات والتدابير التشريعية والتقنية.pdf",
    "kind": "pdf",
    "bytes": 284277,
    "pages": 3,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "الإجراءات والتدابير التشريعية والتقنية.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/الإجراءات والتدابير التشريعية والتقنية.docx",
    "kind": "docx",
    "bytes": 139703,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 2,
  "keywords": [
   "الإجراءات",
   "والتدابير",
   "على",
   "مستوى",
   "تنظيم",
   "المجال",
   "التشريعية",
   "والتقنية،",
   "التربوية",
   "أشكال",
   "استغلال",
   "الإنسان",
   "للمجال",
   "وتنظيمه",
   "الجغرافيا",
   "الدورة الثانية",
   "جذاذة",
   "الجذاذة 09",
   "جذع مشترك علمي",
   "الاجتماعيات",
   "الإجراءات"
  ],
  "components": [
   "الأهداف",
   "الإشكالية",
   "الوسائل والوثائق (الدعامات)",
   "مراحل الدرس",
   "أنشطة الأستاذ (التدبير)",
   "أنشطة المتعلم",
   "التقويم",
   "المنتوج"
  ],
  "componentsMissing": [
   "الكفايات",
   "المفاهيم والمصطلحات",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-g09",
  "source": "الإجراءات والتدابير التشريعية والتقنية.docx",
  "sourceLayout": "docx",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-g10",
  "title": "ملف حول كارثة طبيعية: الزلازل في المغرب",
  "level": "جذع مشترك علمي",
  "subject": "الجغرافيا",
  "semester": "الدورة الثانية",
  "semesterKey": "session-2",
  "subjectKey": "geographie",
  "unitTitle": "ملفات التربية على المواطنة البيئية",
  "unitId": "tc-g-u3",
  "module": "03",
  "lessonNumber": "10",
  "sessionsCount": null,
  "sessionsSource": null,
  "description": "ملف حول كارثة طبيعية: الزلازل في المغرب — جذاذة الجغرافيا (الدورة الثانية، ملفات التربية على المواطنة البيئية) · 3 ملفًا أصليًا من وثائق الأستاذ، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/ملف حول كارثة طبيعية.pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/الكوارث الطبيعية - الزلازل بالمغرب.doc",
  "files": [
   {
    "name": "ملف حول كارثة طبيعية.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/ملف حول كارثة طبيعية.pdf",
    "kind": "pdf",
    "bytes": 291266,
    "pages": 3,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "الكوارث الطبيعية - الزلازل بالمغرب.doc",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/الكوارث الطبيعية - الزلازل بالمغرب.doc",
    "kind": "doc",
    "bytes": 46080,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "ملف حول كارثة طبيعية.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/ملف حول كارثة طبيعية.docx",
    "kind": "docx",
    "bytes": 147408,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 3,
  "keywords": [
   "ملف",
   "حول",
   "كارثة",
   "طبيعية:",
   "الزلازل",
   "المغرب",
   "ملفات",
   "التربية",
   "على",
   "المواطنة",
   "البيئية",
   "الجغرافيا",
   "الدورة الثانية",
   "جذاذة",
   "الجذاذة 10",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "الإشكالية",
   "الوسائل والوثائق (الدعامات)",
   "مراحل الدرس",
   "أنشطة الأستاذ (التدبير)",
   "أنشطة المتعلم",
   "التقويم",
   "المنتوج"
  ],
  "componentsMissing": [
   "الأهداف",
   "الكفايات",
   "المفاهيم والمصطلحات",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-g10",
  "source": "ملف حول كارثة طبيعية.docx",
  "sourceLayout": "docx",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-g11",
  "title": "ملف حول كارثة بيئية: الاحتباس الحراري",
  "level": "جذع مشترك علمي",
  "subject": "الجغرافيا",
  "semester": "الدورة الثانية",
  "semesterKey": "session-2",
  "subjectKey": "geographie",
  "unitTitle": "ملفات التربية على المواطنة البيئية",
  "unitId": "tc-g-u3",
  "module": "03",
  "lessonNumber": "11",
  "sessionsCount": null,
  "sessionsSource": null,
  "description": "ملف حول كارثة بيئية: الاحتباس الحراري — جذاذة الجغرافيا (الدورة الثانية، ملفات التربية على المواطنة البيئية) · 3 ملفًا أصليًا من وثائق الأستاذ، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/الاحتباس الحراري.pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/الاحتباس الحراري.docx",
  "files": [
   {
    "name": "الاحتباس الحراري.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/الاحتباس الحراري.pdf",
    "kind": "pdf",
    "bytes": 284724,
    "pages": 3,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "الاحتباس الحراري.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/الاحتباس الحراري.docx",
    "kind": "docx",
    "bytes": 147125,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "المجز2- وحدة3- الإحتباس الحراري- ج م علمي.doc",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/session-2/المجز2- وحدة3- الإحتباس الحراري- ج م علمي.doc",
    "kind": "doc",
    "bytes": 56320,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "exactFiles": 3,
  "keywords": [
   "ملف",
   "حول",
   "كارثة",
   "بيئية:",
   "الاحتباس",
   "الحراري",
   "ملفات",
   "التربية",
   "على",
   "المواطنة",
   "البيئية",
   "الجغرافيا",
   "الدورة الثانية",
   "جذاذة",
   "الجذاذة 11",
   "جذع مشترك علمي",
   "الاجتماعيات"
  ],
  "components": [
   "الإشكالية",
   "الوسائل والوثائق (الدعامات)",
   "مراحل الدرس",
   "أنشطة الأستاذ (التدبير)",
   "أنشطة المتعلم",
   "التقويم",
   "المنتوج"
  ],
  "componentsMissing": [
   "الأهداف",
   "الكفايات",
   "المفاهيم والمصطلحات",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-g11",
  "source": "الاحتباس الحراري.docx",
  "sourceLayout": "docx",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "tc-sci-g12",
  "title": "ملف حول دور الجمعيات والمنظمات غير الحكومية في حماية البيئة",
  "level": "جذع مشترك علمي",
  "subject": "الجغرافيا",
  "semester": "الدورة الثانية",
  "semesterKey": "session-2",
  "subjectKey": "geographie",
  "unitTitle": "ملفات التربية على المواطنة البيئية",
  "unitId": "tc-g-u3",
  "module": "03",
  "lessonNumber": "12",
  "sessionsCount": null,
  "sessionsSource": null,
  "description": "ملف حول دور الجمعيات والمنظمات غير الحكومية في حماية البيئة — جذاذة الجغرافيا (الدورة الثانية، ملفات التربية على المواطنة البيئية) · لا يتوفر ملف أصلي مستقل في وثائق الأستاذ؛ الجذاذة الرقمية المأخوذة من وثيقته متوفرة للعرض والطباعة داخل الموقع.",
  "pdfUrl": null,
  "docUrl": null,
  "files": [],
  "exactFiles": 0,
  "keywords": [
   "ملف",
   "حول",
   "دور",
   "الجمعيات",
   "والمنظمات",
   "غير",
   "الحكومية",
   "حماية",
   "البيئة",
   "ملفات",
   "التربية",
   "على",
   "المواطنة",
   "البيئية",
   "الجغرافيا",
   "الدورة الثانية",
   "جذاذة",
   "الجذاذة 12",
   "جذع مشترك علمي",
   "الاجتماعيات",
   "جدادات"
  ],
  "components": [
   "الكفايات",
   "الإشكالية",
   "المفاهيم والمصطلحات",
   "الوسائل والوثائق (الدعامات)",
   "أنشطة الأستاذ (التدبير)",
   "التقويم"
  ],
  "componentsMissing": [
   "الأهداف",
   "مراحل الدرس",
   "أنشطة المتعلم",
   "الأسئلة",
   "الأجوبة / عناصر الإجابة",
   "الخلاصة / الاستنتاج / التركيب",
   "المنتوج"
  ],
  "ficheUrl": "#/jadadat/tc/tc-sci-g12",
  "source": "جدادات الدورة الثانية جدع مشترك جغرافيا.docx",
  "sourceLayout": "docx",
  "status": "original",
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 }
];

export const FICHES_GENERAL_DOCS: GeneralDoc[] = [
 {
  "id": "gen-taqdim",
  "title": "تقديم عام — جذع مشترك علمي (2024)",
  "level": "جذع مشترك علمي",
  "subject": "عام",
  "semester": "الدورتان",
  "semesterKey": "general",
  "subjectKey": "general",
  "description": "وثائق التقديم العام لمادة الاجتماعيات بالجذع المشترك العلمي كما وردت في ملفات الأستاذ.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/general/general/تقديم عام جذع علمي 2024 (1).pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/general/general/التقديم.doc",
  "files": [
   {
    "name": "تقديم عام جذع علمي 2024 (1).pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/general/general/تقديم عام جذع علمي 2024 (1).pdf",
    "kind": "pdf",
    "bytes": 517087,
    "pages": 3,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "تقديم عام جذع علمي 2024 (3).pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/general/general/تقديم عام جذع علمي 2024 (3).pdf",
    "kind": "pdf",
    "bytes": 446837,
    "pages": 3,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "التقديم.doc",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/general/general/التقديم.doc",
    "kind": "doc",
    "bytes": 49152,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "keywords": [
   "تقديم",
   "عام",
   "جذع",
   "مشترك",
   "علمي",
   "2024",
   "جذع مشترك علمي",
   "وثائق الأستاذ"
  ],
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "gen-madkhal",
  "title": "مدخل: التحولات العامة بالعالم المتوسطي وبناء الحداثة (ق15م – ق18م)",
  "level": "جذع مشترك علمي",
  "subject": "التاريخ",
  "semester": "الدورتان",
  "semesterKey": "general",
  "subjectKey": "histoire",
  "description": "وثيقة التحولات العامة بالعالم المتوسطي وبناء الحداثة، تغطي إطار الوحدتين التاريخيتين.",
  "pdfUrl": null,
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/general/التحولات العامة بالعالم المتوسطي وبناء الحداثة (من ق 15م إلى ق18م.docx",
  "files": [
   {
    "name": "التحولات العامة بالعالم المتوسطي وبناء الحداثة (من ق 15م إلى ق18م.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/general/التحولات العامة بالعالم المتوسطي وبناء الحداثة (من ق 15م إلى ق18م.docx",
    "kind": "docx",
    "bytes": 50381,
    "pages": null,
    "folder": "مسار التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "keywords": [
   "مدخل:",
   "التحولات",
   "العامة",
   "بالعالم",
   "المتوسطي",
   "وبناء",
   "الحداثة",
   "ق15م",
   "ق18م",
   "جذع مشترك علمي",
   "وثائق الأستاذ"
  ],
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "gen-taqwim",
  "title": "تقويم تشخيصي — جذع مشترك علمي",
  "level": "جذع مشترك علمي",
  "subject": "عام",
  "semester": "الدورة الأولى",
  "semesterKey": "session-1",
  "subjectKey": "general",
  "description": "ملف التقويم التشخيصي الأصلي الخاص بالجذع المشترك العلمي.",
  "pdfUrl": null,
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/general/general/تقويم تشخيصي جذع مشترك علميz.docx",
  "files": [
   {
    "name": "تقويم تشخيصي جذع مشترك علميz.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/general/general/تقويم تشخيصي جذع مشترك علميz.docx",
    "kind": "docx",
    "bytes": 51135,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "keywords": [
   "تقويم",
   "تشخيصي",
   "جذع",
   "مشترك",
   "علمي",
   "جذع مشترك علمي",
   "وثائق الأستاذ"
  ],
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "col-hist",
  "title": "مجموعة جذاذات التاريخ — الجذع المشترك العلمي",
  "level": "جذع مشترك علمي",
  "subject": "التاريخ",
  "semester": "الدورتان",
  "semesterKey": "general",
  "subjectKey": "histoire",
  "description": "ملف جامع يضم جذاذات التاريخ للجذع المشترك العلمي في ملف واحد.",
  "pdfUrl": null,
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/general/جدادات جدع م علمي التاريخ.docx",
  "files": [
   {
    "name": "جدادات جدع م علمي التاريخ.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/general/جدادات جدع م علمي التاريخ.docx",
    "kind": "docx",
    "bytes": 118934,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "keywords": [
   "مجموعة",
   "جذاذات",
   "التاريخ",
   "الجذع",
   "المشترك",
   "العلمي",
   "جذع مشترك علمي",
   "وثائق الأستاذ"
  ],
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "col-hist-s2",
  "title": "مجموعة جذاذات التاريخ — الدورة الثانية (المجزوءة الثانية)",
  "level": "جذع مشترك علمي",
  "subject": "التاريخ",
  "semester": "الدورة الثانية",
  "semesterKey": "session-2",
  "subjectKey": "histoire",
  "description": "جذاذات التاريخ المجمّعة الخاصة بالدورة الثانية (المجزوءة الثانية) في ملف واحد.",
  "pdfUrl": null,
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/histoire/general/جدادات التاريخ المجزوءة الثانية للجدع مشترك.doc",
  "files": [
   {
    "name": "جدادات التاريخ المجزوءة الثانية للجدع مشترك.doc",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/general/جدادات التاريخ المجزوءة الثانية للجدع مشترك.doc",
    "kind": "doc",
    "bytes": 84992,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "جذاذات الجذع تاريخ علوم مجزؤة2.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/general/جذاذات الجذع تاريخ علوم مجزؤة2.docx",
    "kind": "docx",
    "bytes": 116818,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "جدادات التاريخ المجزوءة الثانية للجدع مشترك.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/histoire/general/جدادات التاريخ المجزوءة الثانية للجدع مشترك.docx",
    "kind": "docx",
    "bytes": 27002,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "keywords": [
   "مجموعة",
   "جذاذات",
   "التاريخ",
   "الدورة",
   "الثانية",
   "المجزوءة",
   "جذع مشترك علمي",
   "وثائق الأستاذ"
  ],
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "col-geo",
  "title": "مجموعة جذاذات الجغرافيا — الجذع المشترك",
  "level": "جذع مشترك علمي",
  "subject": "الجغرافيا",
  "semester": "الدورتان",
  "semesterKey": "general",
  "subjectKey": "geographie",
  "description": "ملف جامع يضم جذاذات الجغرافيا للجذع المشترك في ملف واحد.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/general/الجغرافيا-جدع-مشترك-جذاذات._054454.pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/general/الجغرافيا جدع مشترك جذاذات..docx",
  "files": [
   {
    "name": "الجغرافيا-جدع-مشترك-جذاذات._054454.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/general/الجغرافيا-جدع-مشترك-جذاذات._054454.pdf",
    "kind": "pdf",
    "bytes": 2202462,
    "pages": 36,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "الجغرافيا جدع مشترك جذاذات..docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/general/الجغرافيا جدع مشترك جذاذات..docx",
    "kind": "docx",
    "bytes": 781135,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "keywords": [
   "مجموعة",
   "جذاذات",
   "الجغرافيا",
   "الجذع",
   "المشترك",
   "جذع مشترك علمي",
   "وثائق الأستاذ"
  ],
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 },
 {
  "id": "col-geo-s2",
  "title": "مجموعة جذاذات الجغرافيا — الدورة الثانية",
  "level": "جذع مشترك علمي",
  "subject": "الجغرافيا",
  "semester": "الدورة الثانية",
  "semesterKey": "session-2",
  "subjectKey": "geographie",
  "description": "جذاذات الجغرافيا المجمّعة الخاصة بالدورة الثانية في ملف واحد.",
  "pdfUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/general/جدادات_الدورة_الثانية_جدع_مشترك_جغرافيا.pdf",
  "docUrl": "/files/jadadat/joth3-mochtrak-scientifique/geographie/general/جدادات الدورة الثانية جدع مشترك جغرافيا.docx",
  "files": [
   {
    "name": "جدادات_الدورة_الثانية_جدع_مشترك_جغرافيا.pdf",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/general/جدادات_الدورة_الثانية_جدع_مشترك_جغرافيا.pdf",
    "kind": "pdf",
    "bytes": 578162,
    "pages": 28,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   },
   {
    "name": "جدادات الدورة الثانية جدع مشترك جغرافيا.docx",
    "url": "/files/jadadat/joth3-mochtrak-scientifique/geographie/general/جدادات الدورة الثانية جدع مشترك جغرافيا.docx",
    "kind": "docx",
    "bytes": 91931,
    "pages": null,
    "folder": "منار في التاريخ والجغرافيا",
    "relation": "exact"
   }
  ],
  "keywords": [
   "مجموعة",
   "جذاذات",
   "الجغرافيا",
   "الدورة",
   "الثانية",
   "جذع مشترك علمي",
   "وثائق الأستاذ"
  ],
  "createdAt": "2026-09-17T18:28:13+01:00",
  "updatedAt": "2026-09-17T18:28:13+01:00"
 }
];

/** مكوّنات الجذاذة المطلوبة في دفتر التحملات (للعرض: موجودة/غير واردة) */
export const FICHE_COMPONENT_LABELS: string[] = [
 "الأهداف",
 "الكفايات",
 "الإشكالية",
 "المفاهيم والمصطلحات",
 "الوسائل والوثائق (الدعامات)",
 "مراحل الدرس",
 "أنشطة الأستاذ (التدبير)",
 "أنشطة المتعلم",
 "الأسئلة",
 "الأجوبة / عناصر الإجابة",
 "الخلاصة / الاستنتاج / التركيب",
 "التقويم",
 "المنتوج"
];

export const getFicheById = (id: string): FichePedagogique | undefined =>
  FICHES_PEDAGOGIQUES.find((f) => f.id === id);

/** ملفات الجذاذة الأصلية حسب معرّفها (مصفوفة فارغة إن لم يكن لها ملف مستقل) */
export const ficheFilesOf = (id: string): FicheFile[] => getFicheById(id)?.files ?? [];

/** عدد الجذاذات التي لها ملف PDF أصلي واحد على الأقل */
export const FICHES_WITH_PDF = FICHES_PEDAGOGIQUES.filter((f) => f.pdfUrl).length;
/** عدد الجذاذات التي لها ملف أصلي (PDF أو Word) */
export const FICHES_WITH_FILE = FICHES_PEDAGOGIQUES.filter((f) => f.files.length > 0).length;

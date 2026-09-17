/* ============================================================
   مولّد «مكتبة جذاذات الجذع المشترك العلمي» (ملفات PDF/Word الأصلية)
   ============================================================
   ماذا يفعل:
     1) يمشي على مجلد وثائق الأستاذ «جذع مسترك شعبة علوم تجريبية»
        (82 ملفًا حقيقيًا: 32 PDF + 50 Word) — لا يُنشئ أي ملف وهمي.
     2) يربط كل ملف بخانة الجذاذة الرسمية المطابقة له (25 خانة) أو
        بمجموعة «وثائق عامة ومجموعات جذاذات»، وفق جدول ربط موثّق أسفل.
     3) ينظم الملفات داخل public/files/jadadat/joth3-mochtrak-scientifique/
        (histoire|geographie)/(session-1|session-2)/ + general/
        بروابط رمزية (symlink) تحافظ على الاسم الأصلي للملف ولا تكرّر
        الوزن في جيت.
     4) يستخرج من نص الوثيقة الأصلية نفسها: عدد الحصص (عدد الحصص /
        الغلاف الزمني / مدة الإنجاز) والمكوّنات الواردة فعلًا
        (الكفايات، الإشكالية، المفاهيم…) — دون أي تأليف.
     5) يكتب:
        • src/data/jadadatFiles.ts   (الفهرس المستعمل في الموقع)
        • supabase/fiches_pedagogiques.sql + .json
          (جدول بنفس الحقول المطلوبة، جاهز إن رُبط الموقع بـ Supabase)

   التشغيل:
     npx esbuild scripts/build-jadadat-files.tsx --bundle --platform=node \
       --format=cjs --loader:.css=empty --outfile=/tmp/build-files.cjs \
       --log-level=error && node /tmp/build-files.cjs
   ============================================================ */
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { TC_SCI_CATALOG, importedText } from "../src/data/jadadat";

const ROOT = process.cwd();
const SRC_DIR = "جذع مسترك شعبة علوم تجريبية";
const PUB_BASE = join("public", "files", "jadadat", "joth3-mochtrak-scientifique");
const URL_BASE = "/files/jadadat/joth3-mochtrak-scientifique";
/** تاريخ إضافة وثائق الأستاذ إلى المستودع (من سجل جيت — لا تاريخ مؤلَّف) */
const ADDED_AT = "2026-09-17T18:28:13+01:00";
const LEVEL = "جذع مشترك علمي";

/* ------------------------------------------------------------------ */
/* 1) جرد الملفات الحقيقية بترتيب ثابت (مجلد ثم اسم)                    */
/* ------------------------------------------------------------------ */
type Row = { folder: string; name: string; rel: string; bytes: number; ext: "pdf" | "doc" | "docx" };

const all: Row[] = [];
for (const folder of readdirSync(join(ROOT, SRC_DIR)).sort()) {
  const dir = join(ROOT, SRC_DIR, folder);
  if (!statSync(dir).isDirectory()) continue;
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (!statSync(p).isFile()) continue;
    const lower = name.toLowerCase();
    const ext: Row["ext"] | null = lower.endsWith(".pdf") ? "pdf" : lower.endsWith(".docx") ? "docx" : lower.endsWith(".doc") ? "doc" : null;
    if (!ext) continue;
    all.push({ folder, name, rel: `${folder}/${name}`, bytes: statSync(p).size, ext });
  }
}
const PDFS = all.filter((f) => f.ext === "pdf");
const WORDS = all.filter((f) => f.ext !== "pdf");

/** عدد صفحات ملف PDF: أكبر قيمة /Count في شجرة الصفحات (من الملف نفسه) */
function pdfPages(relPath: string): number | null {
  try {
    const raw = readFileSync(join(ROOT, SRC_DIR, relPath)).toString("latin1");
    let max = 0;
    for (const m of raw.matchAll(/\/Count\s+(\d{1,4})/g)) max = Math.max(max, Number(m[1]));
    return max >= 1 && max <= 2000 ? max : null;
  } catch {
    return null;
  }
}
const PAGES = new Map<string, number | null>();
for (const f of PDFS) PAGES.set(f.rel, pdfPages(f.rel));
const withPages = PDFS.filter((f) => PAGES.get(f.rel)).length;
console.log(`✓ قُرئ عدد الصفحات من ${withPages}/${PDFS.length} ملف PDF`);

/* ------------------------------------------------------------------ */
/* 2) جدول الربط — بالموضع في اللائحة المرتبة + كلمة تحقّق من الاسم      */
/*    (لا يُعتمد على التخمين الآلي: كل ملف مربوط يدويًا ومُتحقَّق منه)   */
/*    slot = معرف الجذاذة | group = وثائق عامة/مجموعات                   */
/*    relation: exact = عنوان مطابق للدرس · related = وثيقة مرتبطة به    */
/* ------------------------------------------------------------------ */
type Target = { slot?: string; group?: string; relation?: "exact" | "related"; check: string };

const PDF_MAP: Target[] = [
  { slot: "tc-sci-h03", relation: "exact", check: "الاكتشافات الجغرافية 2024" },
  { slot: "tc-sci-h06", relation: "exact", check: "التطورات الاقتصادية" },
  { slot: "tc-sci-h05", relation: "exact", check: "التطورات السياسية والاجتماعية" },
  { slot: "tc-sci-h08", relation: "exact", check: "الثورة الفرنسية" },
  { slot: "tc-sci-g03", relation: "exact", check: "المجموعات البنيوية (1)" },
  { slot: "tc-sci-g04", relation: "exact", check: "النطاقات المناخية والغطاء النباتي" },
  { group: "gen-taqdim", check: "تقديم عام جذع علمي 2024 (1)" },
  { group: "gen-taqdim", check: "تقديم عام جذع علمي 2024 (3)" },
  { slot: "tc-sci-h07", relation: "exact", check: "عصر الأنوار (الفكر الانجليزي" },
  { slot: "tc-sci-g11", relation: "exact", check: "الاحتباس الحراري" },
  { slot: "tc-sci-h10", relation: "exact", check: "الأوضاع العامة في العالم الإسلامي" },
  { slot: "tc-sci-h10", relation: "exact", check: "الأوضاع_العامة_في_العالم_الإسلامي.pdf" },
  { slot: "tc-sci-h10", relation: "exact", check: "الأوضاع_العامة_في_العالم_الإسلامي_1" },
  { slot: "tc-sci-g09", relation: "exact", check: "الإجراءات والتدابير التشريعية" },
  { slot: "tc-sci-h08", relation: "exact", check: "الثورات الاجتماعية والسياسية" },
  { slot: "tc-sci-h09", relation: "exact", check: "الثورة الصناعية .docx.pdf" },
  { slot: "tc-sci-g01", relation: "exact", check: "الجغرافيا الوظيفة الموضوع الادوات" },
  { group: "col-geo", check: "الجغرافيا-جدع-مشترك-جذاذات" },
  { slot: "tc-sci-g05", relation: "exact", check: "المنظومة البيئية" },
  { slot: "tc-sci-h09", relation: "exact", check: "انطلاقة الثورة الصناعي.pdf" },
  { slot: "tc-sci-h12", relation: "exact", check: "بداية محاولات الإصلاح وحدودها.pdf" },
  { slot: "tc-sci-h12", relation: "exact", check: "بداية_محاولات_الإصلاح_وحدودها.pdf" },
  { slot: "tc-sci-h12", relation: "exact", check: "بداية_محاولات_الإصلاح_وحدودها_1" },
  { slot: "tc-sci-h11", relation: "exact", check: "تصاعد الضغوط الأوربية" },
  { slot: "tc-sci-g06", relation: "related", check: "توزع السكان 2024" },
  { group: "col-geo-s2", check: "جدادات_الدورة_الثانية_جدع_مشترك_جغرافيا" },
  { slot: "tc-sci-g04", relation: "exact", check: "جدادة النطاقات" },
  { slot: "tc-sci-h07", relation: "exact", check: "جدادة_عصر_الانوار" },
  { slot: "tc-sci-g03", relation: "exact", check: "جذاذة المجموعات البنيوية" },
  { slot: "tc-sci-g01", relation: "exact", check: "جذاذة درس الجغرافيا الموضوع الوظيفية" },
  { slot: "tc-sci-h07", relation: "exact", check: "عصر الأنوار ( الفكر الانجليزي" },
  { slot: "tc-sci-g10", relation: "exact", check: "ملف حول كارثة طبيعية.pdf" },
];

const WORD_MAP: Target[] = [
  { slot: "tc-sci-g03", relation: "exact", check: "2المجموعات_البنيوية" },
  { slot: "tc-sci-h13", relation: "exact", check: "اختلال التوازن" },
  { slot: "tc-sci-h03", relation: "exact", check: "الاكتشافات الجغرافية  وظاهرة الميركنتيلية" },
  { slot: "tc-sci-h03", relation: "exact", check: "الاكتشافات الجغرافية.docx" },
  { group: "gen-madkhal", check: "التحولات العامة بالعالم المتوسطي" },
  { slot: "tc-sci-h01", relation: "exact", check: "التحولات الفكرية والعلمية والفنية" },
  { slot: "tc-sci-h06", relation: "exact", check: "التطورات الاقتصادية  في العالم الإسلامي" },
  { slot: "tc-sci-h05", relation: "exact", check: "التطورات السياسية والاجتماعية في العالم الإسلامي.docx" },
  { slot: "tc-sci-h08", relation: "related", check: "الثورة الإنجليزية" },
  { slot: "tc-sci-h09", relation: "exact", check: "انطلاق الثورة الصناعية - التطور التقني" },
  { slot: "tc-sci-h09", relation: "exact", check: "انطلاق الثورة الصناعية.docx" },
  { slot: "tc-sci-h12", relation: "exact", check: "بداية محاولات الاصلاح وحدودها" },
  { slot: "tc-sci-h11", relation: "exact", check: "تصاعد الضغوط الاوروبية على العالم الاسلامي" },
  { slot: "tc-sci-h07", relation: "exact", check: "عصر الأنوار الفكر الانجليزي" },
  { slot: "tc-sci-g11", relation: "exact", check: "الاحتباس الحراري.docx" },
  { slot: "tc-sci-h03", relation: "exact", check: "الاكتشافات الجغرافية و ظاهرة الميركنتيلية.doc" },
  { slot: "tc-sci-h10", relation: "exact", check: "الأوضاع العامة في العالم الإسلامي.docx" },
  { slot: "tc-sci-g09", relation: "exact", check: "الإجراءات والتدابير التشريعية والتقنية.docx" },
  { slot: "tc-sci-h02", relation: "exact", check: "التحولات السياسية و الاجتماعية.doc" },
  { slot: "tc-sci-h02", relation: "exact", check: "التحولات السياسية والاجتماعية الدولة الأمة" },
  { slot: "tc-sci-h02", relation: "exact", check: "التحولات السياسية والاجتماعية.docx" },
  { slot: "tc-sci-h06", relation: "exact", check: "التطورات الاق في العالم الاسلامي" },
  { slot: "tc-sci-h05", relation: "exact", check: "التطورات السياسية و الإج" },
  { group: "gen-taqdim", check: "التقديم.doc" },
  { slot: "tc-sci-h08", relation: "exact", check: "الثورات الاجتماعية والسياسية (الثورة الفرنسية الأسباب والنتائج).docx" },
  { group: "col-geo", check: "الجغرافيا جدع مشترك جذاذات" },
  { slot: "tc-sci-h01", relation: "exact", check: "الحركة الإنسية" },
  { slot: "tc-sci-g08", relation: "related", check: "الخرائط" },
  { slot: "tc-sci-g06", relation: "related", check: "السكان.doc" },
  { slot: "tc-sci-h04", relation: "related", check: "العثمانيون" },
  { slot: "tc-sci-g10", relation: "exact", check: "الكوارث الطبيعية - الزلازل بالمغرب" },
  { slot: "tc-sci-g11", relation: "exact", check: "المجز2- وحدة3- الإحتباس الحراري" },
  { slot: "tc-sci-g03", relation: "exact", check: "المجموعات البنيوية.doc" },
  { slot: "tc-sci-g03", relation: "exact", check: "المجموعات البنيوية.docx" },
  { slot: "tc-sci-g07", relation: "related", check: "المدن.doc" },
  { slot: "tc-sci-g05", relation: "exact", check: "المنظومة البيئية" },
  { slot: "tc-sci-g04", relation: "exact", check: "النطاقات المناخية.doc" },
  { slot: "tc-sci-h09", relation: "exact", check: "انطلاقة الثورة الصناعي.docx" },
  { slot: "tc-sci-h12", relation: "exact", check: "بداية محاولات الإصلاح وحدودها.docx" },
  { slot: "tc-sci-h11", relation: "exact", check: "تصاعد الضغوط الأوربية على العالم الإسلامي.docx" },
  { group: "gen-taqwim", check: "تقويم تشخيصي جذع مشترك علمي" },
  { group: "col-hist-s2", check: "جدادات التاريخ المجزوءة الثانية للجدع مشترك.doc" },
  { group: "col-hist-s2", check: "جدادات التاريخ المجزوءة الثانية للجدع مشترك.docx" },
  { group: "col-geo-s2", check: "جدادات الدورة الثانية جدع مشترك جغرافيا.docx" },
  { group: "col-hist", check: "جدادات جدع م علمي التاريخ" },
  { slot: "tc-sci-g04", relation: "exact", check: "جذاذاة  النطاقات المناخية" },
  { group: "col-hist-s2", check: "جذاذات الجذع تاريخ علوم مجزؤة2" },
  { slot: "tc-sci-h07", relation: "exact", check: "عصر الأنوار ( الفكر الانجليزي والفكر الفرنسي).docx" },
  { slot: "tc-sci-h07", relation: "exact", check: "عصر_الأنوار_الفكر_الانجليزي" },
  { slot: "tc-sci-g10", relation: "exact", check: "ملف حول كارثة طبيعية.docx" },
];

/** تعريف مجموعات الوثائق العامة (بأوصاف من أسماء الملفات نفسها) */
const GROUPS: Record<string, { title: string; subject: string; semester: string; description: string }> = {
  "gen-taqdim": {
    title: "تقديم عام — جذع مشترك علمي (2024)",
    subject: "عام",
    semester: "الدورتان",
    description: "وثائق التقديم العام لمادة الاجتماعيات بالجذع المشترك العلمي كما وردت في ملفات الأستاذ.",
  },
  "gen-madkhal": {
    title: "مدخل: التحولات العامة بالعالم المتوسطي وبناء الحداثة (ق15م – ق18م)",
    subject: "التاريخ",
    semester: "الدورتان",
    description: "وثيقة التحولات العامة بالعالم المتوسطي وبناء الحداثة، تغطي إطار الوحدتين التاريخيتين.",
  },
  "gen-taqwim": {
    title: "تقويم تشخيصي — جذع مشترك علمي",
    subject: "عام",
    semester: "الدورة الأولى",
    description: "ملف التقويم التشخيصي الأصلي الخاص بالجذع المشترك العلمي.",
  },
  "col-hist": {
    title: "مجموعة جذاذات التاريخ — الجذع المشترك العلمي",
    subject: "التاريخ",
    semester: "الدورتان",
    description: "ملف جامع يضم جذاذات التاريخ للجذع المشترك العلمي في ملف واحد.",
  },
  "col-hist-s2": {
    title: "مجموعة جذاذات التاريخ — الدورة الثانية (المجزوءة الثانية)",
    subject: "التاريخ",
    semester: "الدورة الثانية",
    description: "جذاذات التاريخ المجمّعة الخاصة بالدورة الثانية (المجزوءة الثانية) في ملف واحد.",
  },
  "col-geo": {
    title: "مجموعة جذاذات الجغرافيا — الجذع المشترك",
    subject: "الجغرافيا",
    semester: "الدورتان",
    description: "ملف جامع يضم جذاذات الجغرافيا للجذع المشترك في ملف واحد.",
  },
  "col-geo-s2": {
    title: "مجموعة جذاذات الجغرافيا — الدورة الثانية",
    subject: "الجغرافيا",
    semester: "الدورة الثانية",
    description: "جذاذات الجغرافيا المجمّعة الخاصة بالدورة الثانية في ملف واحد.",
  },
};

/* ------------------------------------------------------------------ */
/* 3) تحقّق صارم من جدول الربط (لا ملف بلا ربط، ولا ربط بلا ملف)         */
/* ------------------------------------------------------------------ */
/** توحيد عربي للمقارنة فقط: بعض أسماء الملفات تستعمل الهمزة المركّبة (U+0654) */
const normAr = (s: string) =>
  s
    .replace(/[\u064B-\u065F\u0640\u0670]/g, "")
    .replace(/[أإآٱء]/g, "ا")
    .replace(/ئ/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\s_\-.…(),]/g, "")
    .toLowerCase();

function bind(rows: Row[], map: Target[], label: string) {
  if (rows.length !== map.length) {
    console.error(`✗ ${label}: عدد الملفات ${rows.length} ≠ عدد مداخل الربط ${map.length}`);
    process.exit(1);
  }
  const out: { row: Row; target: Target }[] = [];
  rows.forEach((row, i) => {
    const t = map[i];
    if (!normAr(row.name).includes(normAr(t.check))) {
      console.error(`✗ ${label} #${i + 1}: الاسم «${row.name}» لا يحتوي كلمة التحقّق «${t.check}»`);
      process.exit(1);
    }
    out.push({ row, target: t });
  });
  return out;
}

const bound = [...bind(PDFS, PDF_MAP, "PDF"), ...bind(WORDS, WORD_MAP, "WORD")];
console.log(`✓ ربط ${bound.length} ملفًا (${PDFS.length} PDF + ${WORDS.length} Word) بدون أي ملف مجهول`);

/* ------------------------------------------------------------------ */
/* 4) استخراج عدد الحصص والمكوّنات من نص الوثيقة الأصلية                  */
/* ------------------------------------------------------------------ */
const textOf = new Map<string, string>();
for (const e of TC_SCI_CATALOG) {
  textOf.set(e.slot.id, e.imported ? importedText(e.imported) : "");
}

function sessionsOf(text: string): number | null {
  const patterns = [
    /عدد\s*الحصص\s*[:\-]?\s*(\d{1,2})/,
    /الغلاف\s*الزمني\s*[:\-]?\s*(\d{1,2})/,
    /مدة\s*الإن?جاز\s*[:\-]?\s*(\d{1,2})\s*حص/,
    /(?:^|\n|\s)(\d{1,2})\s*حصص(?:\s|$|\n)/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const n = Number(m[1]);
      if (n >= 1 && n <= 12) return n;
    }
  }
  return null;
}

/** المكوّنات المطلوبة في دفتر التحملات ← المرادفات الواردة فعلًا في الوثائق */
const COMPONENTS: { key: string; label: string; needles: string[] }[] = [
  { key: "objectifs", label: "الأهداف", needles: ["الأهداف", "الهدف"] },
  { key: "competences", label: "الكفايات", needles: ["الكفايات"] },
  { key: "problematique", label: "الإشكالية", needles: ["الإشكالية"] },
  { key: "concepts", label: "المفاهيم والمصطلحات", needles: ["المفاهيم", "المصطلحات"] },
  { key: "supports", label: "الوسائل والوثائق (الدعامات)", needles: ["الوسائل", "الوثائق", "الدعامات"] },
  { key: "phases", label: "مراحل الدرس", needles: ["المراحل", "مرحلة", "مدة الانجاز", "مدة الإنجاز"] },
  { key: "teacher", label: "أنشطة الأستاذ (التدبير)", needles: ["التدبير", "الأستاذ"] },
  { key: "learner", label: "أنشطة المتعلم", needles: ["المتعلم", "التلميذ"] },
  { key: "questions", label: "الأسئلة", needles: ["الأسئلة"] },
  { key: "answers", label: "الأجوبة / عناصر الإجابة", needles: ["الأجوبة", "إجابة", "جواب"] },
  { key: "conclusion", label: "الخلاصة / الاستنتاج / التركيب", needles: ["الخلاصة", "الاستنتاج", "التركيب"] },
  { key: "evaluation", label: "التقويم", needles: ["التقويم"] },
  { key: "produit", label: "المنتوج", needles: ["المنتوج"] },
];

function componentsOf(text: string) {
  const present = COMPONENTS.filter((c) => c.needles.some((n) => text.includes(n))).map((c) => c.label);
  const missing = COMPONENTS.filter((c) => !c.needles.some((n) => text.includes(n))).map((c) => c.label);
  return { present, missing };
}

/* ------------------------------------------------------------------ */
/* 5) بناء مسارات النشر (روابط رمزية بأسماء الملفات الأصلية)              */
/* ------------------------------------------------------------------ */
const slotById = new Map(TC_SCI_CATALOG.map((e) => [e.slot.id, e]));
const subjectKey = (subject: string) => (subject === "التاريخ" ? "histoire" : subject === "الجغرافيا" ? "geographie" : "general");
const semesterKey = (cycle: string) => (cycle === "الدورة الأولى" ? "session-1" : cycle === "الدورة الثانية" ? "session-2" : "general");

function targetDirFor(slotId?: string, group?: string) {
  if (slotId) {
    const e = slotById.get(slotId)!;
    return join(subjectKey(e.slot.subject), semesterKey(e.slot.cycle));
  }
  const g = GROUPS[group!];
  return join(subjectKey(g.subject), "general");
}

/* تنظيف المجلد القديم ثم إعادة بنائه (روابط رمزية فقط) */
const absPub = join(ROOT, PUB_BASE);
if (existsSync(absPub)) rmSync(absPub, { recursive: true, force: true });

const usedPaths = new Set<string>();
const linked = bound.map(({ row, target }) => {
  const sub = targetDirFor(target.slot, target.group);
  const url = `${URL_BASE}/${sub}/${row.name}`;
  const linkPath = join(absPub, sub, row.name);
  if (usedPaths.has(linkPath)) {
    console.error(`✗ تصادم في مسار النشر: ${linkPath}`);
    process.exit(1);
  }
  usedPaths.add(linkPath);
  mkdirSync(dirname(linkPath), { recursive: true });
  const absTarget = join(ROOT, SRC_DIR, row.folder, row.name);
  symlinkSync(relative(dirname(linkPath), absTarget), linkPath);
  if (!existsSync(linkPath) || lstatSync(linkPath).isSymbolicLink() === false) {
    console.error(`✗ فشل إنشاء الرابط: ${linkPath}`);
    process.exit(1);
  }
  return { row, target, url, sub };
});
console.log(`✓ نُظّمت ${linked.length} ملفًا داخل ${PUB_BASE}/ (روابط رمزية بأسمائها الأصلية)`);

/* ------------------------------------------------------------------ */
/* 6) تجميع بطاقات الجذاذات (25) + مجموعات الوثائق العامة                 */
/* ------------------------------------------------------------------ */
const norm = (s: string) => s.replace(/[_\-–….,()]/g, " ").replace(/\s+/g, " ").trim();

const ficheRecords = TC_SCI_CATALOG.map((e) => {
  const slot = e.slot;
  const files = linked
    .filter((l) => l.target.slot === slot.id)
    .map((l) => ({
      name: l.row.name,
      url: l.url,
      kind: l.row.ext,
      bytes: l.row.bytes,
      pages: l.row.ext === "pdf" ? (PAGES.get(l.row.rel) ?? null) : null,
      folder: l.row.folder.startsWith("مسار") ? "مسار التاريخ والجغرافيا" : "منار في التاريخ والجغرافيا",
      relation: l.target.relation ?? "exact",
    }))
    .sort((a, b) => (a.kind === b.kind ? b.bytes - a.bytes : a.kind === "pdf" ? -1 : 1));

  const text = textOf.get(slot.id) ?? "";
  const sessions = sessionsOf(text);
  const { present, missing } = componentsOf(text);
  const pdf = files.find((f) => f.kind === "pdf" && f.relation === "exact") ?? files.find((f) => f.kind === "pdf") ?? null;
  const doc = files.find((f) => f.kind !== "pdf" && f.relation === "exact") ?? files.find((f) => f.kind !== "pdf") ?? null;
  const exactCount = files.filter((f) => f.relation === "exact").length;

  const description = files.length
    ? `${slot.title} — جذاذة ${slot.subject} (${slot.cycle}، ${slot.unitTitle}) · ${files.length} ملفًا أصليًا من وثائق الأستاذ${
        pdf ? "، منها نسخة PDF قابلة للمعاينة والتحميل مباشرة" : " (ملفات Word: تحميل فقط)"
      }.`
    : `${slot.title} — جذاذة ${slot.subject} (${slot.cycle}، ${slot.unitTitle}) · لا يتوفر ملف أصلي مستقل في وثائق الأستاذ؛ الجذاذة الرقمية المأخوذة من وثيقته متوفرة للعرض والطباعة داخل الموقع.`;

  const keywords = Array.from(
    new Set(
      [
        ...norm(slot.title).split(" "),
        ...norm(slot.unitTitle).split(" "),
        slot.subject,
        slot.cycle,
        slot.module,
        "جذاذة",
        "الجذاذة " + slot.number,
        LEVEL,
        "الاجتماعيات",
        e.imported ? norm(e.imported.source).split(" ")[0] : "",
      ].filter((w) => w && w.length > 2)
    )
  );

  return {
    id: slot.id,
    title: slot.title,
    level: LEVEL,
    subject: slot.subject,
    semester: slot.cycle,
    semesterKey: semesterKey(slot.cycle),
    subjectKey: subjectKey(slot.subject),
    unitTitle: slot.unitTitle,
    unitId: slot.unitId,
    module: slot.module,
    lessonNumber: slot.number,
    sessionsCount: sessions,
    sessionsSource: sessions
      ? text.match(/عدد\s*الحصص\s*[:\-]?\s*\d{1,2}/)
        ? "عدد الحصص (وارد في الوثيقة الأصلية)"
        : text.match(/الغلاف\s*الزمني\s*[:\-]?\s*\d{1,2}/)
          ? "الغلاف الزمني (وارد في الوثيقة الأصلية)"
          : "مدة الإنجاز (واردة في الوثيقة الأصلية)"
      : null,
    description,
    pdfUrl: pdf?.url ?? null,
    docUrl: doc?.url ?? null,
    files,
    exactFiles: exactCount,
    keywords,
    components: present,
    componentsMissing: missing,
    ficheUrl: `#/jadadat/tc/${slot.id}`,
    source: e.imported?.source ?? null,
    sourceLayout: e.imported?.layout ?? null,
    status: e.status,
    createdAt: ADDED_AT,
    updatedAt: ADDED_AT,
  };
});

const groupRecords = Object.entries(GROUPS).map(([id, g]) => {
  const files = linked
    .filter((l) => l.target.group === id)
    .map((l) => ({
      name: l.row.name,
      url: l.url,
      kind: l.row.ext,
      bytes: l.row.bytes,
      pages: l.row.ext === "pdf" ? (PAGES.get(l.row.rel) ?? null) : null,
      folder: l.row.folder.startsWith("مسار") ? "مسار التاريخ والجغرافيا" : "منار في التاريخ والجغرافيا",
      relation: "exact" as const,
    }))
    .sort((a, b) => (a.kind === b.kind ? b.bytes - a.bytes : a.kind === "pdf" ? -1 : 1));
  const pdf = files.find((f) => f.kind === "pdf") ?? null;
  return {
    id,
    title: g.title,
    level: LEVEL,
    subject: g.subject,
    semester: g.semester,
    semesterKey: semesterKey(g.semester),
    subjectKey: subjectKey(g.subject),
    description: g.description,
    pdfUrl: pdf?.url ?? null,
    docUrl: files.find((f) => f.kind !== "pdf")?.url ?? null,
    files,
    keywords: Array.from(new Set(norm(g.title).split(" ").filter((w) => w.length > 2).concat([LEVEL, "وثائق الأستاذ"]))),
    createdAt: ADDED_AT,
    updatedAt: ADDED_AT,
  };
});

/* ------------------------------------------------------------------ */
/* 7) كتابة ملف البيانات                                                 */
/* ------------------------------------------------------------------ */
const J = (v: unknown) => JSON.stringify(v, null, 1);

const out = `/* ============================================================
   مكتبة جذاذات الجذع المشترك العلمي — فهرس الملفات الأصلية
   ============================================================
   ملف مولَّد آليًا، لا تُحرَّره يدويًا:
     npx esbuild scripts/build-jadadat-files.tsx --bundle --platform=node \\
       --format=cjs --loader:.css=empty --outfile=/tmp/b.cjs && node /tmp/b.cjs

   المصدر: وثائق الأستاذ في «${SRC_DIR}/» (${all.length} ملفًا حقيقيًا).
   كل بطاقة = جذاذة درس من اللائحة الرسمية (${TC_SCI_CATALOG.length} خانة) مرتبطة
   بملفاتها الأصلية؛ وكل حقل هنا مستخرج من الملفات أو من اللائحة الرسمية،
   ولا شيء مُؤلَّف: عدد الحصص والمكوّنات مأخوذة من نص الوثيقة نفسها،
   ومن لا يتوفر له ملف أصلي يبقى بلا ملفات (مع إحالة على الجذاذة الرقمية).

   المسارات: ${URL_BASE}/<histoire|geographie|general>/<session-1|session-2|general>/
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

export const FICHES_LEVEL = ${J(LEVEL)};
export const FICHES_BASE_URL = ${J(URL_BASE)};
export const FICHES_SOURCE_DIR = ${J(SRC_DIR)};
export const FICHES_TOTAL_FILES = ${all.length};
export const FICHES_PDF_COUNT = ${PDFS.length};
export const FICHES_WORD_COUNT = ${WORDS.length};

export const FICHES_PEDAGOGIQUES: FichePedagogique[] = ${J(ficheRecords)};

export const FICHES_GENERAL_DOCS: GeneralDoc[] = ${J(groupRecords)};

/** مكوّنات الجذاذة المطلوبة في دفتر التحملات (للعرض: موجودة/غير واردة) */
export const FICHE_COMPONENT_LABELS: string[] = ${J(COMPONENTS.map((c) => c.label))};

export const getFicheById = (id: string): FichePedagogique | undefined =>
  FICHES_PEDAGOGIQUES.find((f) => f.id === id);

/** ملفات الجذاذة الأصلية حسب معرّفها (مصفوفة فارغة إن لم يكن لها ملف مستقل) */
export const ficheFilesOf = (id: string): FicheFile[] => getFicheById(id)?.files ?? [];

/** عدد الجذاذات التي لها ملف PDF أصلي واحد على الأقل */
export const FICHES_WITH_PDF = FICHES_PEDAGOGIQUES.filter((f) => f.pdfUrl).length;
/** عدد الجذاذات التي لها ملف أصلي (PDF أو Word) */
export const FICHES_WITH_FILE = FICHES_PEDAGOGIQUES.filter((f) => f.files.length > 0).length;
`;

writeFileSync(join(ROOT, "src", "data", "jadadatFiles.ts"), out, "utf8");
console.log(`✓ كُتب src/data/jadadatFiles.ts (${(out.length / 1024).toFixed(1)} ك.ب)`);

/* ------------------------------------------------------------------ */
/* 8) Supabase: جدول بنفس الحقول المطلوبة + البيانات (اختياري)            */
/* ------------------------------------------------------------------ */
const sqlRows = ficheRecords.map((f) => {
  const q = (v: unknown) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
  return `  (${q(f.id)}, ${q(f.title)}, ${q(f.level)}, ${q(f.subject)}, ${q(f.semester)}, ${q(f.lessonNumber)}, ${
    f.sessionsCount ?? "NULL"
  }, ${q(f.description)}, ${q(f.pdfUrl)}, ${q(f.keywords.join(" "))}, ${q(f.createdAt)}, ${q(f.updatedAt)})`;
});

const sql = `-- ============================================================
-- جدول الجذاذات التربوية — مطابق للحقول المطلوبة
-- المشروع الحالي موقع ثابت (بلا خادم)، لذلك هذا الملف «جاهز للتشغيل»
-- إن رُبط الموقع لاحقًا بـ Supabase:  psql -f supabase/fiches_pedagogiques.sql
-- أو الصقه في SQL Editor داخل لوحة Supabase.
-- القيم مولَّدة من وثائق الأستاذ الحقيقية (لا بيانات وهمية).
-- ============================================================

create table if not exists public.fiches_pedagogiques (
  id             text primary key,
  title          text not null,
  level          text not null default 'جذع مشترك علمي',
  subject        text not null check (subject in ('التاريخ','الجغرافيا')),
  semester       text not null,
  lesson_number  text not null,
  sessions_count integer,
  description    text,
  pdf_url        text,
  keywords       text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists fiches_subject_idx  on public.fiches_pedagogiques (subject);
create index if not exists fiches_semester_idx on public.fiches_pedagogiques (semester);

insert into public.fiches_pedagogiques
  (id, title, level, subject, semester, lesson_number, sessions_count, description, pdf_url, keywords, created_at, updated_at)
values
${sqlRows.join(",\n")}
on conflict (id) do update set
  title = excluded.title,
  semester = excluded.semester,
  sessions_count = excluded.sessions_count,
  description = excluded.description,
  pdf_url = excluded.pdf_url,
  keywords = excluded.keywords,
  updated_at = excluded.updated_at;
`;

mkdirSync(join(ROOT, "supabase"), { recursive: true });
writeFileSync(join(ROOT, "supabase", "fiches_pedagogiques.sql"), sql, "utf8");
writeFileSync(
  join(ROOT, "supabase", "fiches_pedagogiques.json"),
  JSON.stringify(
    ficheRecords.map((f) => ({
      id: f.id,
      title: f.title,
      level: f.level,
      subject: f.subject,
      semester: f.semester,
      lesson_number: f.lessonNumber,
      sessions_count: f.sessionsCount,
      description: f.description,
      pdf_url: f.pdfUrl,
      keywords: f.keywords.join(" "),
      created_at: f.createdAt,
      updated_at: f.updatedAt,
    })),
    null,
    2
  ),
  "utf8"
);
console.log("✓ كُتب supabase/fiches_pedagogiques.sql و .json (جدول + 25 سجلًا)");

/* ------------------------------------------------------------------ */
/* 9) تقرير ------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
console.log("\n=== البطاقات (25 جذاذة) ===");
for (const f of ficheRecords) {
  const pdfs = f.files.filter((x) => x.kind === "pdf").length;
  const words = f.files.length - pdfs;
  console.log(
    `  ${f.id}  ${f.subject === "التاريخ" ? "ت" : "ج"}  ${f.semester === "الدورة الأولى" ? "د1" : "د2"}  ` +
      `PDF:${pdfs} Word:${words}  حصص:${f.sessionsCount ?? "—"}  مكوّنات:${f.components.length}  ${f.title.slice(0, 44)}`
  );
}
console.log("\n=== مجموعات الوثائق العامة ===");
for (const g of groupRecords) console.log(`  ${g.id}  ${g.files.length} ملفًا  ${g.title}`);
const noFile = ficheRecords.filter((f) => f.files.length === 0);
console.log(`\nجذاذات بلا ملف أصلي مستقل: ${noFile.length} → ${noFile.map((f) => f.id).join("، ") || "لا شيء"}`);
console.log(`جذاذات بنسخة PDF: ${ficheRecords.filter((f) => f.pdfUrl).length}/25 · بعدد حصص مستخرج: ${ficheRecords.filter((f) => f.sessionsCount).length}/25`);
console.log(`عدد الحصص المستخرجة: ${ficheRecords.filter((f) => f.sessionsCount).map((f) => `${f.id}=${f.sessionsCount}`).join(" ")}`);

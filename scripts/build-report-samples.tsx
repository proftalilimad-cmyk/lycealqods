/* ============================================================
   توليد نماذج تقارير التقويم التشخيصي للعرض
   ------------------------------------------------------------
   يكتب في public/exports/ (مجلد مُتجاهَل في جيت) نماذج جاهزة تُفتح
   من المعاينة الحية على /exports/…، حتى يرى الأستاذ شكل الوثائق قبل
   استعمال الأزرار داخل اللوحة.

   ⚠️ الأسماء هنا مخترعة بالكامل (محمد العربي، فاطمة الزهراوي…):
   لا تُستعمل لوائح التلاميذ الرسمية أبدًا في النماذج، فلا يُنشر أي
   معطى شخصي حقيقي.

   التشغيل:
     ./node_modules/.bin/esbuild scripts/build-report-samples.tsx --bundle \
       --platform=node --format=cjs --loader:.css=empty --outfile=/tmp/s.cjs \
       --log-level=warning && node /tmp/s.cjs
   ============================================================ */
import { mkdirSync, writeFileSync } from "node:fs";
import type { Answer, Submission } from "../src/types";
import { TEST_BANKS } from "../src/data/testBanks";
import { buildSkillsMap, gradeAutoQuestion, gradeWriting, levelOf } from "../src/lib/grading";
import {
  SCHOOL_NAME,
  SUBJECT_NAME,
  TEACHER_NAME,
  TEST_TITLE,
  fileNamePart,
  formatDate,
  groupZipName,
  studentBaseName,
  zipEntryPath,
} from "../src/lib/reportDoc";
import { classReportHtml, studentDocHtml, wordDocument } from "../src/lib/reportHtml";
import { buildXlsx, type Cell, type Sheet } from "../src/lib/xlsx";
import { createZip, zipText } from "../src/lib/zip";
import { scopeOf } from "../src/lib/reportExport";

const CLASS_NAME = "جذع مشترك علوم خ ف 1";
const OUT = "public/exports";

/** أسماء مخترعة للعرض فقط */
const FAKE_NAMES = [
  "محمد العربي",
  "فاطمة الزهراوي",
  "يوسف بن علي",
  "خديجة المريني",
  "أمين العلوي",
  "سلمى بن عمر",
  "رضا القاسمي",
  "نورة الطاهري",
  "ياسين بودلال",
  "مريم الشرايبي",
  "أنس الفيلالي",
  "هدى بن صالح",
  "زكرياء المودن",
  "إيمان البقالي",
  "عثمان الراشدي",
  "أسماء الناصري",
  "حمزة الإدريسي",
  "ليندا الوهابي",
  "أيوب السلاوي",
  "رشيدة بنموسى",
];

const WRITING_SAMPLE =
  "أستنتج أن الثورة الصناعية أدت إلى تحولات اقتصادية واجتماعية عميقة، مما ادى إلى نمو المدن والهجرة القروية، كما ظهرت طبقات اجتماعية جديدة. وبالتالي تغيرت بنية المجتمع الأوروبي. خلاصة: الثورة الصناعية منطلق التحولات المعاصرة.";

/** بناء نتيجة تلميذ(ة) كما يبنيها الموقع فعلًا (تصحيح + مهارات + شبكة كتابة) */
function makeSubmission(bankQuestions: typeof TEST_BANKS[number]["questions"], name: string, seed: number): Submission {
  const answers: Answer[] = bankQuestions.map((q, i) => {
    const r = (seed * 31 + i * 17) % 10;
    switch (q.kind) {
      case "mcq":
      case "doc":
        return r < 6 ? q.answer : (q.answer + 1 + (r % 3)) % q.options.length;
      case "tf":
        return r < 6 ? q.answer : !q.answer;
      case "ordering":
        return r < 5 ? q.items.map((_, x) => x) : q.items.map((_, x) => (x + 2) % q.items.length);
      case "matching": {
        const rec: Record<number, number> = {};
        q.pairs.forEach((_, x) => {
          rec[x] = r < 5 ? x : (x + 1) % q.pairs.length;
        });
        return rec;
      }
      case "writing":
        return WRITING_SAMPLE;
      default:
        return null;
    }
  });

  let history = 0;
  let geography = 0;
  bankQuestions.forEach((q, i) => {
    const got = gradeAutoQuestion(q, answers[i]);
    if (q.subject === "history") history += got;
    else geography += got;
  });
  history = Math.round(history * 100) / 100;
  geography = Math.round(geography * 100) / 100;
  const total = Math.round((history + geography) * 100) / 100;
  const percent = Math.round((total / 20) * 1000) / 10;
  const writing = typeof answers[answers.length - 1] === "string" ? (answers[answers.length - 1] as string) : "";

  return {
    id: `sample-${seed}`,
    name,
    className: CLASS_NAME,
    studentNo: String(seed + 1),
    bankId: "tc-sci",
    bankLabel: bankQuestions.length > 0 ? "الجذع المشترك العلمي والتكنولوجي" : undefined,
    bankLevel: "الجذع المشترك",
    massar: `X1${100000 + seed}`,
    date: new Date(Date.now() - seed * 3600000 - 86400000).toISOString(),
    history,
    geography,
    total,
    percent,
    level: levelOf(percent).label,
    skills: buildSkillsMap(bankQuestions, answers),
    answers,
    rubric: gradeWriting(writing),
    writingText: writing,
    timeUsedSeconds: 1800 + seed * 11,
  };
}

async function main() {
  const bank = TEST_BANKS.find((b) => b.id === "tc-sci") ?? TEST_BANKS[0];
  const subs = FAKE_NAMES.map((name, seed) => makeSubmission(bank.questions, name, seed));
  const scope = scopeOf(subs, CLASS_NAME);

  mkdirSync(OUT, { recursive: true });

  /* وثائق فردية بأنماطها الثلاثة + تقرير القسم */
  writeFileSync(`${OUT}/sample-student-file.html`, studentDocHtml(subs[0], "full"), "utf8");
  writeFileSync(`${OUT}/sample-student-answers.html`, studentDocHtml(subs[2], "answers"), "utf8");
  writeFileSync(`${OUT}/sample-student-report.html`, studentDocHtml(subs[4], "report"), "utf8");
  writeFileSync(`${OUT}/sample-class-report.html`, classReportHtml(subs, scope), "utf8");

  /* جدول النتائج Excel */
  const header: Cell[] = ["ر.ت", "التلميذ(ة)", "القسم", "التاريخ /10", "الجغرافيا /10", "المجموع /20", "النسبة ٪", "المستوى"];
  const sheet: Sheet = {
    name: "النتائج",
    title: `${bank.branch} — ${CLASS_NAME} (نموذج بأسماء مخترعة)`,
    rows: [header, ...subs.map((s) => [s.studentNo ?? "", s.name, s.className, s.history, s.geography, s.total, s.percent, s.level] as Cell[])],
    widths: [8, 26, 24, 12, 14, 12, 10, 18],
  };
  const xlsx = await buildXlsx([sheet]);
  writeFileSync(`${OUT}/sample-results.xlsx`, Buffer.from(xlsx));

  /* أرشيف القسم كما ينزّله الأستاذ من اللوحة */
  const readme = `${SCHOOL_NAME}
${TEST_TITLE} في مادة ${SUBJECT_NAME} — ${scope.label}
إعداد: ${TEACHER_NAME} · تاريخ التصدير: ${formatDate(new Date().toISOString())}

أرشيف نموذجي للعرض (أسماء مخترعة) — ${subs.length} تلميذ(ة).
لكل تلميذ(ة): ملف HTML جاهز للطباعة بنقرة واحدة (Ctrl+P ← حفظ بصيغة PDF) ونسخة Word،
ومعها جدول النتائج Excel والتقرير الشامل وملف «اقرأني».

لتحويل كل الملفات إلى PDF دفعة واحدة على حاسوبك:
  npm i -D playwright && npx playwright install chromium     ← مرة واحدة
  node scripts/html-to-pdf.mjs <اسم_هذا_الأرشيف.zip> --zip
التفاصيل: docs/export-pdf.md
`;
  const entries = [];
  for (const s of subs) {
    const full = studentDocHtml(s, "full");
    entries.push({ path: zipEntryPath(s, "html"), data: zipText(full) });
    entries.push({
      path: zipEntryPath(s, "doc"),
      data: zipText(wordDocument(studentBaseName(s), full.replace(/^[\s\S]*?<body[^>]*>/, "").replace(/<\/body>[\s\S]*$/, ""))),
    });
  }
  entries.push({ path: `جدول_النتائج_${fileNamePart(scope.fileLabel)}.xlsx`, data: xlsx });
  entries.push({ path: `تقرير_شامل_${fileNamePart(scope.fileLabel)}.html`, data: zipText(classReportHtml(subs, scope)) });
  entries.push({ path: "اقرأني.txt", data: zipText(readme) });
  const zip = await createZip(entries);
  writeFileSync(`${OUT}/sample-students.zip`, Buffer.from(zip));

  console.log(`✓ النماذج في ${OUT}/ (تُفتح من المعاينة على /exports/…)`);
  console.log(`  sample-student-file.html      الملف الفردي الكامل لـ«${subs[0].name}» — اسمه: ${studentBaseName(subs[0])}.pdf`);
  console.log(`  sample-student-answers.html   أجوبة «${subs[2].name}»`);
  console.log(`  sample-student-report.html    تقرير نتائج «${subs[4].name}»`);
  console.log(`  sample-class-report.html      التقرير الشامل للقسم (${subs.length} تلميذًا)`);
  console.log(`  sample-results.xlsx           جدول النتائج (${(xlsx.length / 1024).toFixed(0)} ك.ب)`);
  console.log(`  sample-students.zip           أرشيف القسم: ${groupZipName(subs, scope.fileLabel)} — ${entries.length} مدخلًا، ${(zip.length / 1024).toFixed(0)} ك.ب`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

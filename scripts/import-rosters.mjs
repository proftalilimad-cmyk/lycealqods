/* ============================================================
   استخراج اللوائح الاسمية الرسمية 2026-2027 من ملف
   «لوائح الرسمية التلاميذ 2026-2027.XLS» (BIFF/OLE2) إلى
   src/data/rosters.ts — تُستعمل في التقويم التشخيصي
   (اختيار القسم + اختيار الاسم).

   التشغيل:
     npm i --no-save xlsx
     node scripts/import-rosters.mjs

   لا تعديل يدوي على rosters.ts: يُعاد توليدها من الملف الأصلي دائمًا.
   ============================================================ */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const file = readdirSync(".").find((f) => f.toUpperCase().endsWith(".XLS"));
if (!file) {
  console.error("✗ لا يوجد ملف .XLS في جذر المستودع");
  process.exit(1);
}
const wb = XLSX.read(readFileSync(file), { type: "buffer" });
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });

const clean = (s) => String(s ?? "").replace(/[\u200f\u200e\u00a0]/g, "").replace(/\s+/g, " ").trim();

const classes = [];
let current = null;
let seenHeader = false;
for (const r of rows) {
  const joined = r.map(clean).join(" ");
  const m = joined.match(/لائحة بأسماء تلاميذ قسم\s*:\s*(.+)/);
  if (m) {
    current = { label: clean(m[1]), students: [] };
    classes.push(current);
    seenHeader = false;
    continue;
  }
  if (!current) continue;
  if (!seenHeader) {
    if (joined.includes("ر.ت") && joined.includes("الإسم")) seenHeader = true;
    continue;
  }
  const no = clean(r[1]);
  if (/^\d{1,3}$/.test(no)) {
    const family = clean(r[3]);
    const given = clean(r[4]);
    const name = clean(`${family} ${given}`);
    if (!name) continue;
    current.students.push({
      n: Number(no),
      massar: clean(r[2]),
      name,
      birth: clean(r[5]),
    });
  } else if (joined === "") {
    /* سطر فارغ داخل اللائحة: يُتجاهل */
  } else if (!/^\d/.test(no) && no) {
    /* نهاية الكتلة الحالية (عنوان أو ملاحظة) */
    current = null;
  }
}

const withIds = classes
  .filter((c) => c.students.length > 0)
  .map((c, i) => ({ id: `c${String(i + 1).padStart(2, "0")}`, label: c.label, students: c.students }));

const total = withIds.reduce((a, c) => a + c.students.length, 0);
const out = `/* ============================================================
   اللوائح الاسمية الرسمية 2026-2027 — مولَّدة آليًا، لا تُحرَّر يدويًا
   المصدر: «${file}»
   المؤسسة: الثانوية التأهيلية القدس — القنيطرة
   إعادة التوليد: npm i --no-save xlsx && node scripts/import-rosters.mjs
   ============================================================ */
export interface RosterStudent {
  /** الترتيب في لائحة القسم (ر.ت) */
  n: number;
  /** رقم مسار */
  massar: string;
  /** الإسم والنسب */
  name: string;
  /** تاريخ الازدياد */
  birth: string;
}
export interface RosterClass {
  id: string;
  label: string;
  students: RosterStudent[];
}

export const ROSTER_SCHOOL = "الثانوية التأهيلية القدس — القنيطرة";
export const ROSTER_YEAR = "2026-2027";
export const ROSTER_SOURCE = "${file}";

export const ROSTER_CLASSES: RosterClass[] = ${JSON.stringify(withIds, null, 2)};

export const rosterByLabel = (label: string): RosterClass | undefined =>
  ROSTER_CLASSES.find((c) => c.label === label);

export const ROSTER_TOTAL_STUDENTS = ${total};
`;
writeFileSync("src/data/rosters.ts", out, "utf8");
console.log(`✓ src/data/rosters.ts — ${withIds.length} قسمًا · ${total} تلميذ(ة)`);
withIds.forEach((c) => console.log(`   ${c.id} | ${c.label} | ${c.students.length}`));

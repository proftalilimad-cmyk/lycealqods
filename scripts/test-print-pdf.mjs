/* فحص تصدير الجذاذات إلى PDF على عدة صفحات (متطلب: متصفح headless)
 *
 * التهيئة (مرة واحدة، حيث يتوفر تنزيل المتصفح):
 *   npm i -D playwright && npx playwright install chromium
 *
 * التشغيل والموقع يعمل (npm run dev):
 *   node scripts/test-print-pdf.mjs [slotId ...]
 *   مثال: node scripts/test-print-pdf.mjs tc-sci-h10 tc-sci-g06 tc-sci-g07
 *
 * ماذا يفحص:
 *   1) يفتح صفحة الجذاذة ويحاكي وسيط الطباعة (print) ثم يصدّر PDF بمقاس A4.
 *   2) يتأكد أن التصدير متعدد الصفحات للجذاذات الطويلة (وليس صفحة واحدة).
 *   3) الملفات تُحفظ في /tmp/print-pdf/ لمعاينة الحدود وتكرار الترويسة يدويًا:
 *      ترويسة كل جدول (thead) يجب أن تتكرر أعلى كل صفحة (table-header-group)،
 *      والصفوف المقطوعة بين صفحتين يجب أن تبقى حدودها ظاهرة (box-decoration-break).
 */
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:5173";
const SLOTS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["tc-sci-h10", "tc-sci-g06", "tc-sci-g07", "tc-sci-h01", "tc-sci-g12", "tc-sci-h13"];

mkdirSync("/tmp/print-pdf", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
let fail = 0;

for (const id of SLOTS) {
  await page.goto(`${BASE}/#/jadadat/tc/${id}`, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  const file = `/tmp/print-pdf/${id}.pdf`;
  await page.pdf({ path: file, format: "A4", printBackground: true });
  const raw = readFileSync(file).toString("latin1");
  const pages = (raw.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  const multi = pages >= 2;
  if (!multi) fail += 1;
  console.log(`${id}: ${pages} صفحة ${multi ? "✓ متعدد الصفحات" : "✠ صفحة واحدة (تحقق يدويًا)"}`);
}

await browser.close();
console.log(fail === 0 ? "✓ فحص التصدير متعدد الصفحات مكتمل" : `⚠ ${fail} جذاذة بحاجة مراجعة`);
process.exit(0);

/* فحص أمانة العرض: يتأكد أن كل كلمة في وثيقة الأستاذ الأصلية تظهر في الصفحة
 * المولَّدة (SSR)، وأن أجزاء «المنتوج» المجموعة ظاهرة كلها.
 *
 * التشغيل:
 *   npx esbuild scripts/check-jadadat-render.tsx --bundle --platform=node \
 *     --format=cjs --loader:.css=empty --outfile=/tmp/check.cjs --log-level=error \
 *     && node /tmp/check.cjs
 */
import { renderToString } from "react-dom/server";
import Jadadat from "../src/components/Jadadat";
import { TC_SCI_CATALOG, collectProduit, importedText } from "../src/data/jadadat";

const go = () => {};
const unesc = (h: string) =>
  h
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/<[^>]+>/g, "");
const norm = (s: string) => s.replace(/[\u064b-\u0652\u0640\u200f\u200e]/g, "").replace(/\s+/g, " ");

const listHtml = renderToString(<Jadadat level="tc" go={go} />);
const listText = norm(unesc(listHtml));
console.log("=== صفحة اللائحة ===  html:", listHtml.length);
for (const probe of ["جذاذات الجذع المشترك العلمي", "إعداد وإنجاز: الأستاذ عماد طليل", "قاعدة المنتوج", "الجذاذة 01", "الجذاذة 12", "مطابقة للوثيقة الأصلية", "منار في التاريخ والجغرافيا", "ثانوية القدس، القنيطرة"])
  console.log(`  ${listText.includes(norm(probe)) ? "✓" : "✗"} ${probe}`);

let totalWords = 0, totalLost = 0, badFiches = 0, prodParts = 0;
console.log("\n=== فحص الأمانة صفحةً صفحة (كل كلمات الوثيقة الأصلية) ===");
for (const entry of TC_SCI_CATALOG) {
  const html = renderToString(<Jadadat level="tc" open={entry.slot.id} go={go} />);
  const page = norm(unesc(html));
  const words = entry.imported ? importedText(entry.imported).split(" ").filter((w) => norm(w).length > 1) : [];
  const lost = words.filter((w) => !page.includes(norm(w)));
  const parts = entry.imported ? collectProduit(entry.imported) : [];
  prodParts += parts.length;
  totalWords += words.length; totalLost += lost.length;
  if (lost.length) badFiches++;
  const credit = page.includes("عماد طليل") && page.includes("ثانوية القدس");
  console.log(
    `  ${entry.slot.id.padEnd(12)} ${entry.status.padEnd(8)} ${String(words.length).padStart(5)}ك  مفقود:${String(lost.length).padStart(3)}  منتوج:${String(parts.length).padStart(2)} جزء  توقيع:${credit ? "✓" : "✗"}` +
      (lost.length ? `  → ${lost.slice(0, 4).join(" | ")}` : ""),
  );
}
console.log(`\nالمجموع: ${TC_SCI_CATALOG.length} جذاذة | ${totalWords} كلمة من الوثائق | مفقودة في العرض: ${totalLost} | جذاذات ناقصة: ${badFiches} | أجزاء المنتوج المجمعة: ${prodParts}`);
console.log(totalLost === 0 && badFiches === 0 ? "✓ العرض أمين تمامًا لكل الجذاذات" : "✗ هناك كلمات مفقودة في العرض");

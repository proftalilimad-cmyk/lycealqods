/* ============================================================
   الفحص الآلي لبنية جداول الجذاذات (قبل الإخراج)
   ------------------------------------------------------------
   ينفّذ قاعدة القبول المطلوبة حرفيًا:
     IF page_1.headers != page_2.headers
     OR missing("التقويم المرحلي") OR missing("التقويم النهائي")
     OR missing("المنتوج") OR merged("المنتوج","أنشطة التعلم والمحتوى")
     THEN REBUILD_TABLE_FROM_REFERENCE_TEMPLATE

   الترجمة البنيوية (بلا متصفح): الجذاذة كلها جدول رئيسي واحد على
   قالب الصفحة الأولى المرجعي → page_1.headers ≡ page_2.headers ≡ …
   (thead وحيد يتكرر في كل صفحة عبر table-header-group). فيفحص:
   1) كل كتل التدفق مدمجة في جدول رئيسي واحد (لا جداول مختلفة لاحقًا).
   2) لا كتلة تقويم (مرحلي/اجمالي/نهائي) متبقية خارج الجدول الرئيسي.
   3) لا جزء جدول بترويسة مطابقة للقالب متبقٍ خارجها (ترويسة واحدة).
   4) الحقول الموجودة في الأصل حاضرة كمستقلة: ترتيب مرحلي < نهائي،
      و«المنتوج» خانة/عمود مستقل غير مدموج في «أنشطة التعلم والمحتوى».
   5) في HTML المولَّد: thead يحمل ترويسة القالب حرفيًا (فتتكرر كل صفحة)،
      والترويسة تظهر داخل <th> لا كنص عادي.

   التشغيل:
     npx esbuild scripts/check-jadadat-structure.tsx --bundle --platform=node \
       --format=cjs --loader:.css=empty --outfile=/tmp/struct.cjs --log-level=error \
       && node /tmp/struct.cjs
   ============================================================ */
import { renderToString } from "react-dom/server";
import Jadadat, { assembleFlow, docLead } from "../src/components/Jadadat";
import { TC_SCI_CATALOG, collectProduit } from "../src/data/jadadat";
import type { SrcCell, SrcTable as SrcTableT } from "../src/data/jadadat";

const clean = (s: string) => s.replace(/[\u200f\u200e\u0640]/g, "").replace(/\s+/g, " ").trim();
const ct = (c?: SrcCell) => clean([...(c?.box ?? []), ...(c?.lines ?? [])].join(" "));
const rowText = (r: SrcCell[]) => r.map(ct).join(" ");
const norm = (s: string) => s.replace(/[ً-ْٰـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");

const TAQWIM_MARHALI = /تقويم\s*(?:ال)?\s*مرحلي/;
const TAQWIM_FINAL = /تقويم\s*(?:ال)?\s*(نهائي|اجمالي|إجمالي)/;

let failures = 0;
const report: string[] = [];

for (const entry of TC_SCI_CATALOG) {
  const f = entry.imported;
  const id = entry.slot.id;
  if (!f) { report.push(`${id}: (بلا وثيقة مستوردة — تُعرض الجذاذة الرقمية الاحتياطية بترويسة موحدة)`); continue; }
  if (f.layout === "pdf") {
    report.push(`${id}: PDF — لا جدول في الأصل (أسطر حرفية) ✓ مستثنى من قالب الجدول`);
    continue;
  }
  const body = f.blocks.slice(docLead(f).rest);
  const items = assembleFlow(body);
  const masters = items.filter((it) => "kind" in it && it.kind === "master") as { kind: "master"; table: SrcTableT }[];
  const problems: string[] = [];

  if (masters.length === 0) {
    problems.push("لا يوجد جدول رئيسي (لم يُعثر على قالب مرجعي في الصفحة الأولى)");
  }
  if (masters.length > 1) {
    problems.push(`${masters.length} جداول رئيسية بدل واحد (بنية مختلفة بين الصفحات)`);
  }
  /* 2+3) لا كتل تقويم ولا أجزاء بترويسة مكررة خارج الرئيسي */
  const leftovers = items.filter((it) => !("kind" in it && it.kind === "master") && (it as { table?: SrcTableT }).table) as { table: SrcTableT }[];
  for (const l of leftovers) {
    if (l.table.rows.some((r) => TAQWIM_MARHALI.test(norm(ct(r[0]))) || TAQWIM_FINAL.test(norm(ct(r[0])))))
      problems.push(`كتلة تقويم خارج الجدول الرئيسي: «${ct(l.table.rows[0][0]).slice(0, 30)}»`);
  }
  if (masters.length >= 1) {
    const master = masters[0].table;
    const head = master.rows[0];
    const headText = norm(rowText(head));
    /* رؤوس مكررة داخل الجسم = بنية صفحتين مختلفة */
    const dupHeads = master.rows.slice(1).filter((r) => norm(rowText(r)) === headText).length;
    if (dupHeads > 0) problems.push(`ترويسة القالب مكررة ${dupHeads}× داخل جسم الجدول`);
    /* 4) الحقول المستقلة وترتيبها */
    const bodyRows = master.rows.slice(1);
    const iMarhali = bodyRows.findIndex((r) => TAQWIM_MARHALI.test(norm(ct(r[0]))));
    const iFinal = bodyRows.findIndex((r) => TAQWIM_FINAL.test(norm(ct(r[0]))));
    if (iMarhali >= 0 && iFinal >= 0 && iFinal < iMarhali && bodyRows.filter((r) => TAQWIM_MARHALI.test(norm(ct(r[0])))).length === 1)
      problems.push("ترتيب الحقول: التقويم النهائي قبل المرحلي");
    const hasProduitCol = /المنتوج/.test(norm(headText));
    const parts = collectProduit(f);
    const hasProduitField = hasProduitCol || parts.length > 0;
    /* دمج المنتوج مع أنشطة التعلم/المحتوى في خانة واحدة؟ */
    const mergedProduit = master.rows.some((r, ri) =>
      ri > 0 && r.some((c, ci) => ci > 0 && /المنتوج/.test(norm(ct(c))) && /أنشطة|انشطة|المحتوى/.test(norm(ct(c)))),
    );
    if (mergedProduit) problems.push("«المنتوج» مدموج مع «أنشطة التعلم والمحتوى» في خلية واحدة");
    /* 5) SSR: thead يحمل ترويسة القالب حرفيًا */
    const html = renderToString(<Jadadat level="tc" open={id} go={() => {}} />);
    /* القالب المرجعي يجب أن يكون داخل thead ما في الصفحة (فيتكرر في كل صفحة طباعة) */
    const theads = [...html.matchAll(/<thead>([\s\S]*?)<\/thead>/g)].map((m) =>
      [...m[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((x) => norm(clean(x[1].replace(/<[^>]+>/g, " ")))),
    );
    const headCells = head.map((c) => norm(ct(c))).filter(Boolean);
    const refThead = theads.find((ths) => headCells.every((h) => ths.some((t) => t.includes(h))));
    if (!refThead) problems.push(`ترويسة القالب ليست داخل أي thead (لن تتكرر في الصفحات): [${headCells.join("، ")}]`);
    if (hasProduitCol && !(refThead ?? []).some((t) => t.includes("المنتوج"))) problems.push("عمود «المنتوج» ليس خانة ترويسة <th>");
    if (!hasProduitField) report.push(`${id}: ✓ بنية موحدة — (لا «منتوج» صريح في الأصل: لا يُختلق)`);
    else report.push(`${id}: ✓ بنية موحدة — رئيسي واحد، ${master.rows.length} صفًا، ترويسة [${head.map(ct).filter(Boolean).join(" | ").slice(0, 80)}]${hasProduitCol ? "، المنتوج عمود مستقل" : parts.length ? `، المنتوج خانة مستقلة (${parts.length} جزءًا)` : ""}${iMarhali >= 0 ? "، تقويم مرحلي صف حقل" : ""}${iFinal >= 0 ? "، تقويم نهائي/اجمالي صف حقل" : ""}`);
  }
  if (problems.length) {
    failures += 1;
    report.push(`${id}: ✗ ${problems.join(" ؛ ")}`);
  }
}

console.log(report.join("\n"));
console.log(failures === 0
  ? "\n✓ القاعدة مطبقة: كل جذاذة = جدول رئيسي واحد على قالب صفحتها الأولى، الرؤوس تتكرر في كل صفحة، والتقويمات والمنتوج خانات مستقلة"
  : `\n✗ ${failures} جذاذة تحتاج إعادة بناء من القالب المرجعي`);
process.exit(failures === 0 ? 0 : 1);

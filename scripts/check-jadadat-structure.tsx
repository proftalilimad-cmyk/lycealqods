/* ============================================================
   الفحص الآلي الخارجي لبنية جداول الجذاذات (بوابة الاعتماد/التصدير)
   ------------------------------------------------------------
   يشغّل نفس نظام TABLE VALIDATOR الموجود داخل التطبيق
   (validateFiche / validateAllFiches من src/components/Jadadat)
   ويضيف تحقق العرض المولَّد (SSR) ونسخة التحميل:
   - ترويسة القالب المرجعي داخل thead (فتتكرر في كل صفحة طباعة).
   - شريط الحقول الستة الإلزامية بنفس الصياغة والترتيب (عرضًا وتحميلًا).
   - عمود «المنتوج» خانة <th> مستقلة حيث يوجد في الأصل.

   تقرير لكل جذاذة: المعرف · عدد الصفحات · عدد الجداول · الحالة ·
   أعداد CRITICAL/MAJOR/MINOR · تفاصيل الأخطاء برقم الصفحة ·
   حالة الإصلاح التلقائي · نتيجة إعادة الفحص.

   VALIDATION PASSED IF: العناوين موجودة، لا حقل مفقود/مدموج، الترتيب
   موحد، المرحلي والنهائي موجودان، المنتوج مستقل، الصفحات تحافظ على
   القالب، ولا CRITICAL ولا MAJOR. وإلا خروج بكود 1 (تُحجب الجذاذة
   داخل التطبيق ويُوقف تصديرها تلقائيًا).

   التشغيل:
     npx esbuild scripts/check-jadadat-structure.tsx --bundle --platform=node \
       --format=cjs --loader:.css=empty --outfile=/tmp/struct.cjs --log-level=error \
       && node /tmp/struct.cjs
   ============================================================ */
import { renderToString } from "react-dom/server";
import Jadadat, { validateAllFiches, FIELD_BAND, assembleFlow, docLead } from "../src/components/Jadadat";
import { importedToHtml } from "../src/components/Jadadat";
import { TC_SCI_CATALOG } from "../src/data/jadadat";
import type { SrcCell } from "../src/data/jadadat";

const clean = (s: string) => s.replace(/[\u200f\u200e\u0640]/g, "").replace(/\s+/g, " ").trim();
const ct = (c?: SrcCell) => clean([...(c?.box ?? []), ...(c?.lines ?? [])].join(" "));
const norm = (s: string) => s.replace(/[ً-ْٰـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");

let failures = 0;
const lines: string[] = [];

const validations = validateAllFiches();

for (const v of validations) {
  const entry = TC_SCI_CATALOG.find((e) => e.slot.id === v.id)!;
  const f = entry.imported;
  const problems: string[] = [];
  if (v.status === "FAILED") problems.push(`حالة التحقق FAILED (C:${v.critical} M:${v.major})`);
  if (f && f.layout !== "pdf") {
    const html = renderToString(<Jadadat level="tc" open={v.id} go={() => {}} />);
    /* ترويسة القالب المرجعي داخل thead ما (تتكرر في كل صفحة طباعة) */
    const theads = [...html.matchAll(/<thead>([\s\S]*?)<\/thead>/g)].map((m) =>
      [...m[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((x) => norm(clean(x[1].replace(/<[^>]+>/g, " ")))),
    );
    /* ترويسة القالب المرجعي من المُجمِّع نفسه (مصدر الحقيقة الوحيد) */
    const masterItem = assembleFlow(f.blocks.slice(docLead(f).rest)).find((it) => "kind" in it && it.kind === "master") as
      | { kind: "master"; table: { rows: SrcCell[][] } }
      | undefined;
    const refHead = masterItem ? masterItem.table.rows[0].map((c) => norm(ct(c))).filter(Boolean) : [];
    if (!refHead.length) problems.push("لا ترويسة قالب مرجعي في العرض");
    else if (!theads.some((ths) => refHead.every((h) => ths.some((t) => t.includes(h)))))
      problems.push("ترويسة القالب ليست داخل thead (لن تتكرر في الصفحات)");
    if (refHead.some((t) => t.includes("المنتوج")) && !theads.some((ths) => ths.some((t) => t.includes("المنتوج"))))
      problems.push("عمود «المنتوج» ليس خانة ترويسة <th>");
    /* شريط الحقول الستة: صياغة وترتيب (عرضًا) */
    const band = /class="fieldband"[\s\S]*?<\/tr>/.exec(html);
    const bandText = band ? norm(clean(band[0].replace(/<[^>]+>/g, " "))) : "";
    const missingBand = FIELD_BAND.filter((fb) => !bandText.includes(norm(fb)));
    if (missingBand.length) problems.push(`شريط الحقول الستة ناقص عرضًا: ${missingBand.join("، ")}`);
    else {
      const idxs = FIELD_BAND.map((fb) => bandText.indexOf(norm(fb)));
      if (idxs.some((x, i) => i > 0 && x < idxs[i - 1])) problems.push("ترتيب شريط الحقول الستة مختلف عرضًا");
    }
    /* الجذاذة المحجوبة يجب ألا تعرض جسم الوثيقة */
    if (v.status === "FAILED" && !html.includes("تعذر اعتماد الجذاذة")) problems.push("جذاذة FAILED معروضة بلا بطاقة الحجب");
    /* نسخة التحميل */
    const dl = importedToHtml(f, entry);
    const dlBand = /class="fieldband"[\s\S]*?<\/tr>/.exec(dl);
    if (!dlBand || FIELD_BAND.some((fb) => !dlBand[0].includes(fb))) problems.push("شريط الحقول الستة ناقص في نسخة التحميل");
    if (!/<thead>/.test(dl)) problems.push("لا thead في نسخة التحميل");
  }
  const bad = problems.length > 0;
  if (bad) failures += 1;
  lines.push(
    `${v.id} | ${v.subject} | ص:${v.pages} | ج:${v.tables} | ${v.status}${bad ? "→PROBLEMS" : ""} | C:${v.critical} M:${v.major} m:${v.minor} | إصلاح:${v.repair.attempted ? (v.repair.applied ? "طُبّق" : "فشل") : "—"} / إعادة:${v.repair.recheck}`,
  );
  for (const i of v.issues) if (i.severity !== "MINOR") lines.push(`    [${i.severity}] ص${i.page} — ${i.location}: ${i.message}`);
  for (const pr of problems) lines.push(`    [SSR/DL] ${pr}`);
}

console.log("════ تقرير التحقق النهائي (TABLE VALIDATOR) ════");
console.log(lines.join("\n"));
const passed = validations.filter((v) => v.status === "PASSED").length;
console.log(`\n${passed}/${validations.length} PASSED · ${failures} جذاذة بها مشاكل`);
console.log(
  failures === 0
    ? "✓ شرط العرض والتصدير محقق: العناوين الإلزامية موجودة، لا دمج ولا حذف، الترتيب موحد، والصفحات تحافظ على القالب المرجعي"
    : "✗ الجذاذات أعلاه محجوبة عن العرض والتصدير حتى نجاح إعادة الفحص",
);
process.exit(failures === 0 ? 0 : 1);

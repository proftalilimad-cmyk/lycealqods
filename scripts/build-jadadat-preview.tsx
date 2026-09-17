/* ============================================================
   لقطة ثابتة (Snapshot) لقسم «جذاذات الجذع المشترك العلمي»
   ============================================================
   لماذا: لمعاينة شكل القسم بصريًا دون تشغيل الموقع كاملًا، ولمشاركة
   صورة ساكنة معه (في العروض أو مع الزملاء) — بلا أي تفاعلية.

   ماذا يفعل:
     • يصيّر القائمة الرئيسية وصفحة تفاصيل جذاذة واحدة (tc-sci-h07)
       بـ react-dom/server (نفس المكوّن المستعمل في الموقع حرفيًا).
     • يأخذ CSS الموقع الحقيقي من dist/index.html (بناء singlefile)
       فلا يختلف الشكل عن الموقع الحي.
     • يكتب public/exports/jadadat-lib-preview.html
       (مجلد مُتجاهَل في جيت — انظر .gitignore).

   شرط: نفّذ البناء أولًا لأن CSS يُقرأ منه:
     npm run build

   التشغيل (لا يوجد tsx في المشروع، لذا نُجمِّع بـ esbuild المضمّن مع vite):
     ./node_modules/.bin/esbuild scripts/build-jadadat-preview.tsx --bundle \
       --platform=node --format=cjs --loader:.css=empty --jsx=automatic \
       --outfile=/tmp/snap.cjs && node /tmp/snap.cjs

   الفتح من المعاينة الحية:  /exports/jadadat-lib-preview.html
   ============================================================ */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import JadadatLibrary from "../src/components/JadadatLibrary";
import JadadatPrepared from "../src/components/JadadatPrepared";
import type { Route } from "../src/routes";

/** الجذاذة التي تُلتقط صفحة تفاصيلها (يمكن تغييرها) */
const DETAILS_ID = "tc-sci-h07";

const go = (r: Route) => void r;
const dist = readFileSync("dist/index.html", "utf8");
const styles = (dist.match(/<style[^>]*>[\s\S]*?<\/style>/g) ?? []).join("\n");
const fonts = (dist.match(/<link[^>]*(?:fonts\.googleapis|fonts\.gstatic)[^>]*>/g) ?? []).join("\n");

const banner = (title: string, hash: string) => `
<div style="position:sticky;top:0;z-index:99;background:#04241A;color:#fff;padding:14px 20px;font-family:system-ui,'Noto Kufi Arabic',sans-serif">
  <p style="margin:0;font-size:15px;font-weight:800">📸 لقطة ثابتة (بلا تفاعلية) — ${title}</p>
  <p style="margin:6px 0 0;font-size:12px;opacity:.85;line-height:1.9">
    للعرض البصري فقط: البحث والفلاتر ومعاينة PDF تعمل في الموقع الحي على
    <span dir="ltr" style="background:#ffffff22;padding:2px 8px;border-radius:8px;margin-inline-start:6px">${hash}</span>
  </p>
</div>`;

const list = renderToStaticMarkup(<JadadatLibrary go={go} />);
const details = renderToStaticMarkup(<JadadatLibrary open={DETAILS_ID} go={go} />);
const prepList = renderToStaticMarkup(<JadadatPrepared go={go} />);
const prepDoc = renderToStaticMarkup(<JadadatPrepared open={DETAILS_ID} go={go} />);

const page = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex" />
<title>لقطة — جذاذات الجذع المشترك العلمي</title>
${fonts}
${styles}
</head>
<body style="background:#F7F4EC">
${banner("القائمة الرئيسية للقسم", "#/jadadat/joth3-mochtrak-scientifique")}
${list}
<div style="height:60px"></div>
${banner(`صفحة تفاصيل جذاذة: ${DETAILS_ID}`, `#/jadadat/joth3-mochtrak-scientifique/${DETAILS_ID}`)}
${details}
<div style="height:60px"></div>
${banner("قسم «جذاذات مُعدَّة» — القائمة الرئيسية (25 جذاذة)", "#/jadadat-prepared")}
${prepList}
<div style="height:60px"></div>
${banner(`وثيقة جذاذة مُعدَّة: ${DETAILS_ID}`, `#/jadadat-prepared/${DETAILS_ID}`)}
${prepDoc}
</body>
</html>`;

mkdirSync("public/exports", { recursive: true });
writeFileSync("public/exports/jadadat-lib-preview.html", page, "utf8");
console.log(`✓ كُتبت public/exports/jadadat-lib-preview.html (${(page.length / 1024).toFixed(0)} ك.ب)`);
console.log(`  مكتبة الملفات: قائمة ${(list.length / 1024).toFixed(0)} ك.ب · تفاصيل ${(details.length / 1024).toFixed(0)} ك.ب`);
console.log(`  الجذاذات المُعدَّة: قائمة ${(prepList.length / 1024).toFixed(0)} ك.ب · وثيقة ${(prepDoc.length / 1024).toFixed(0)} ك.ب · CSS الموقع ${(styles.length / 1024).toFixed(0)} ك.ب`);
console.log(`  تُفتح من المعاينة الحية على: /exports/jadadat-lib-preview.html`);

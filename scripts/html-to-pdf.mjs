#!/usr/bin/env node
/* ============================================================
   تحويل ملفات التلاميذ إلى PDF حقيقي — دفعة واحدة
   ============================================================
   لماذا هذا السكربت؟
     الموقع ثابت (بلا خادم)، وتوليد PDF عربي سليم داخل المتصفح يحتاج
     محرك طباعة وخطوطًا؛ لذلك أزرار PDF في الموقع تفتح نافذة الطباعة
     باسم الملف جاهزًا. هذا السكربت يُكمل العمل على حاسوبك: يأخذ
     الأرشيف (أو المجلد) الذي نزّلته من لوحة الأستاذ ويحوّل كل ملف
     تلميذ إلى PDF حقيقي بالاسم نفسه والمكان نفسه:

       الجذع_المشترك/جذع_مشترك_علوم_خ_ف_1/001_محمد_العربي.html
                                     ↓
       الجذع_المشترك/جذع_مشترك_علوم_خ_ف_1/001_محمد_العربي.pdf

     ثم يعيد أرشفة الكل في ZIP واحد إن طلبت ذلك.

   التهيئة (مرة واحدة على حاسوبك):
     npm i -D playwright
     npx playwright install chromium
     (أو استعمل متصفحًا مثبّتًا لديك: --channel chrome  /  --channel msedge)

   الاستعمال:
     node scripts/html-to-pdf.mjs <مجلد أو أرشيف zip أو ملف html>  [خيارات]
     npm run pdf:batch -- <المسار> [خيارات]

   أمثلة:
     node scripts/html-to-pdf.mjs ~/Downloads/التقويم_التشخيصي_جذع_مشترك_علوم_خ_ف_1.zip --zip
     node scripts/html-to-pdf.mjs ./ملفات-القسم --out ./pdf --channel chrome
     node scripts/html-to-pdf.mjs ./ملفات-القسم --dry-run      # بلا متصفح: يعرض الخطة

   الخيارات:
     --out <مجلد>          مجلد الإخراج (افتراضيًا: <المدخل>-pdf بجانبه)
     --zip                 إنشاء أرشيف ZIP من النتيجة النهائية
     --keep-html           الإبقاء على نسخ HTML بجانب PDF
     --concurrency <n>     عدد التحويلات المتوازية (افتراضيًا 3)
     --channel <chrome|msedge>   استعمال متصفح مثبّت بدل تنزيل Chromium
     --executable-path <مسار>    مسار متصفح محدّد
     --dry-run             عرض ما سيُنفَّذ دون تحويل (لا يحتاج متصفحًا)
     -h, --help            هذه المساعدة

   ملاحظات:
     • بقية الملفات (xlsx، doc، txt) تُنسخ كما هي إلى مجلد الإخراج حتى يبقى
       الأرشيف النهائي كاملًا.
     • الطباعة A4 بهوامش 12–14 مم مع الألوان والخلفيات (printBackground).
     • الأسماء العربية تُحفظ بترميز UTF-8.
   ============================================================ */
import { spawn, spawnSync } from "node:child_process";
import { inflateRawSync } from "node:zlib";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";

const HELP = readFileSync(new URL(import.meta.url), "utf8")
  .split("*/")[0]
  .split("\n")
  .filter((l) => l.startsWith("   ") || l.startsWith("     "))
  .join("\n")
  .replace(/^   /gm, "");

/* ------------------------- قراءة الوسائط ------------------------- */
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const value = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const positional = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--out" && argv[i - 1] !== "--concurrency" && argv[i - 1] !== "--channel" && argv[i - 1] !== "--executable-path");

if (flag("--help") || flag("-h") || positional.length === 0) {
  console.log(HELP);
  process.exit(positional.length === 0 ? 1 : 0);
}

const INPUT = resolve(positional[0]);
const DRY = flag("--dry-run");
const KEEP_HTML = flag("--keep-html");
const MAKE_ZIP = flag("--zip");
const CONCURRENCY = Math.max(1, Number(value("--concurrency", "3")) || 3);
const CHANNEL = value("--channel", undefined);
const EXECUTABLE = value("--executable-path", undefined);

if (!existsSync(INPUT)) {
  console.error(`✗ المسار غير موجود: ${INPUT}`);
  process.exit(1);
}

const isDir = (p) => statSync(p).isDirectory();
const OUT = resolve(value("--out", isDir(INPUT) ? `${INPUT.replace(/[/\\]+$/, "")}-pdf` : `${dirname(INPUT)}/${basename(INPUT, extname(INPUT))}-pdf`));

/* ------------------------- فك الأرشيف إن لزم ------------------------- */
/* قارئ ZIP ذاتي: يضمن سلامة الأسماء العربية (UTF-8) على كل الأنظمة،
   بدل الاعتماد على unzip/tar التي تُعطّب الأسماء غير اللاتينية أحيانًا. */
function readZipEntries(buf) {
  let eocd = -1;
  const lowest = Math.max(0, buf.length - 22 - 65536);
  for (let i = buf.length - 22; i >= lowest; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("أرشيف غير صالح: لم يُعثر على سجل نهاية الدليل");
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const entries = [];
  for (let i = 0; i < count; i++) {
    if (off + 46 > buf.length || buf.readUInt32LE(off) !== 0x02014b50) break;
    const method = buf.readUInt16LE(off + 10);
    const csize = buf.readUInt32LE(off + 20);
    const usize = buf.readUInt32LE(off + 24);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.subarray(off + 46, off + 46 + nameLen).toString("utf8");
    entries.push({ name, method, csize, usize, localOff });
    off += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function extractZip(zipPath, target) {
  mkdirSync(target, { recursive: true });
  /* المحاولة الأولى: القراءة الذاتية (أدقّ مع العربية) */
  try {
    const buf = readFileSync(zipPath);
    const entries = readZipEntries(buf);
    let written = 0;
    for (const e of entries) {
      const name = e.name.replace(/\\/g, "/");
      if (name.split("/").includes("..")) continue; // حماية من المسارات الخارجة
      if (name.endsWith("/")) {
        mkdirSync(join(target, name), { recursive: true });
        continue;
      }
      const lo = e.localOff;
      if (lo + 30 > buf.length || buf.readUInt32LE(lo) !== 0x04034b50) throw new Error(`ترويسة محلية تالفة: ${name}`);
      const start = lo + 30 + buf.readUInt16LE(lo + 26) + buf.readUInt16LE(lo + 28);
      const raw = buf.subarray(start, start + e.csize);
      let data;
      if (e.method === 0) data = Buffer.from(raw);
      else if (e.method === 8) data = inflateRawSync(raw);
      else {
        console.log(`  ⚠ تخطّي «${name}» — طريقة ضغط غير مدعومة (${e.method})`);
        continue;
      }
      const dest = join(target, name);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, data);
      written++;
    }
    if (written > 0) return written;
    throw new Error("لا ملفات داخل الأرشيف");
  } catch (err) {
    console.log(`  ⚠ القراءة الذاتية فشلت (${err.message}) — تجربة أدوات النظام…`);
  }
  /* المحاولة الثانية: أدوات النظام */
  const attempts = [
    ["unzip", ["-q", zipPath, "-d", target]],
    ["tar", ["-xf", zipPath, "-C", target]],
  ];
  for (const [cmd, args] of attempts) {
    const r = spawnSync(cmd, args, { stdio: "ignore" });
    if (r.status === 0) return walk(target).length;
  }
  return 0;
}

let workDir = INPUT;
let tempDir = null;
if (!isDir(INPUT) && /\.zip$/i.test(INPUT)) {
  tempDir = mkdtempSync(join(tmpdir(), "talil-pdf-"));
  console.log(`→ فك الأرشيف: ${basename(INPUT)}`);
  const extracted = extractZip(INPUT, tempDir);
  if (!extracted) {
    console.error("✗ تعذّر فك الأرشيف آليًا (لا يوجد unzip ولا tar).");
    console.error("  فكّ الأرشيف يدويًا ثم أعد التشغيل على المجلد الناتج.");
    process.exit(1);
  }
  workDir = tempDir;
} else if (!isDir(INPUT)) {
  workDir = dirname(INPUT); // ملف واحد
}

/* ------------------------- جرد الملفات ------------------------- */
function walk(dir, list = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (isDir(p)) walk(p, list);
    else list.push(p);
  }
  return list;
}

/* ملف HTML واحد؟ أم مجلد/أرشيف كامل؟ */
const singleFile = !isDir(INPUT) && /\.html?$/i.test(INPUT);
const allFiles = singleFile ? [INPUT] : walk(workDir);
const targets = allFiles.filter((p) => /\.html?$/i.test(p));
const others = allFiles.filter((p) => !/\.html?$/i.test(p));

if (targets.length === 0) {
  console.error("✗ لا توجد ملفات HTML في المدخل المحدد.");
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  process.exit(1);
}

const outPathFor = (src) => {
  const rel = relative(workDir, src);
  const pdfRel = rel.replace(/\.html?$/i, ".pdf");
  return join(OUT, pdfRel);
};

console.log(`\nالمدخل : ${INPUT}`);
console.log(`الإخراج: ${OUT}`);
console.log(`الملفات: ${targets.length} وثيقة HTML للتحويل · ${others.length} ملفًا آخر سيُنسخ`);
console.log(`الخيارات: ${DRY ? "dry-run (بلا تحويل)" : `تحويل متوازٍ ×${CONCURRENCY}${CHANNEL ? ` · متصفح: ${CHANNEL}` : ""}${EXECUTABLE ? ` · ${EXECUTABLE}` : ""}${MAKE_ZIP ? " · إنشاء ZIP" : ""}${KEEP_HTML ? " · إبقاء HTML" : ""}`}\n`);

/* ------------------------- نسخ بقية الملفات ------------------------- */
mkdirSync(OUT, { recursive: true });
for (const src of others) {
  const rel = relative(workDir, src);
  if (!rel || rel.startsWith("..")) continue;
  const dest = join(OUT, rel);
  if (DRY) {
    console.log(`  [نسخ] ${rel}`);
    continue;
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

/* ------------------------- خطة التحويل ------------------------- */
if (DRY) {
  for (const src of targets) {
    const rel = relative(workDir, src);
    const size = statSync(src).size;
    console.log(`  [PDF] ${rel.replace(/\.html?$/i, ".pdf")}  ←  ${rel} (${(size / 1024).toFixed(0)} ك.ب)`);
  }
  console.log(`\n✓ dry-run: ${targets.length} ملف PDF ستُنشأ في ${OUT}`);
  console.log("  للتحويل الفعلي: ثبّت playwright ثم أعد الأمر بدون --dry-run");
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  process.exit(0);
}

/* ------------------------- التحويل الفعلي ------------------------- */
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("✗ مكتبة playwright غير مثبّتة في هذا المشروع.");
  console.error("  نفّذ مرة واحدة:");
  console.error("    npm i -D playwright");
  console.error("    npx playwright install chromium");
  console.error("  أو استعمل متصفحًا مثبّتًا لديك:  --channel chrome   (أو msedge)");
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  process.exit(2);
}

const browser = await chromium.launch({
  channel: CHANNEL,
  executablePath: EXECUTABLE,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--lang=ar"],
});

const ok = [];
const failed = [];
let done = 0;

async function convert(src) {
  const rel = relative(workDir, src);
  const dest = outPathFor(src);
  const page = await browser.newPage();
  try {
    mkdirSync(dirname(dest), { recursive: true });
    await page.goto(`file://${src.split(sep).join("/")}`, { waitUntil: "load", timeout: 60000 });
    await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve())).catch(() => {});
    await page.waitForTimeout(250);
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: dest,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" },
    });
    ok.push(dest);
    done++;
    console.log(`  ✓ [${done}/${targets.length}] ${rel.replace(/\.html?$/i, ".pdf")} (${(statSync(dest).size / 1024).toFixed(0)} ك.ب)`);
    if (KEEP_HTML) {
      const htmlDest = join(OUT, rel);
      mkdirSync(dirname(htmlDest), { recursive: true });
      copyFileSync(src, htmlDest);
    }
  } catch (e) {
    failed.push({ rel, error: e.message.split("\n")[0] });
    done++;
    console.log(`  ✗ [${done}/${targets.length}] ${rel}: ${e.message.split("\n")[0]}`);
  } finally {
    await page.close();
  }
}

/* تنفيذ متوازٍ محدود */
const queue = [...targets];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (next) await convert(next);
    }
  }),
);

await browser.close();

/* ------------------------- أرشفة النتيجة ------------------------- */
let zipPath = null;
if (MAKE_ZIP && ok.length > 0) {
  zipPath = `${OUT.replace(/[/\\]+$/, "")}.zip`;
  if (existsSync(zipPath)) rmSync(zipPath);
  const r = spawnSync("zip", ["-qrX", zipPath, "."], { cwd: OUT, stdio: "ignore" });
  if (r.status !== 0) {
    console.log("\n⚠ تعذّر إنشاء الأرشيف آليًا (لا يوجد أمر zip) — المجلد جاهز:", OUT);
    zipPath = null;
  }
}

if (tempDir) rmSync(tempDir, { recursive: true, force: true });

console.log(`\n================ النتيجة ================`);
console.log(`نجح التحويل: ${ok.length} / ${targets.length}`);
if (failed.length > 0) {
  console.log(`فشل: ${failed.length}`);
  for (const f of failed.slice(0, 10)) console.log(`   • ${f.rel}: ${f.error}`);
}
console.log(`مجلد الإخراج: ${OUT}`);
if (zipPath) console.log(`الأرشيف: ${zipPath} (${(statSync(zipPath).size / 1024 / 1024).toFixed(1)} م.ب)`);
process.exit(failed.length > 0 ? 1 : 0);

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { APPLICATIONS } from "../src/data/applications";
import { DECKS } from "../src/data/decks";
import { TEST_BANKS } from "../src/data/testBanks";
import { LEVELS } from "../src/data/curriculum";
import { METHODOLOGIES } from "../src/data/methodologies";
import { RESOURCES, RESOURCE_TYPES } from "../src/data/resources";
import { getJadadatCatalog } from "../src/lib/jadadatLessons";
import { resolveLesson } from "../src/data/lessonContent";
import { routeToPath, type Route } from "../src/routes";

const SITE_ORIGIN = (process.env.SITE_URL ?? "https://courstalil.netlify.app").replace(/\/+$/, "");
const LASTMOD = process.env.SEO_LASTMOD ?? new Date().toISOString().slice(0, 10);

interface SitemapEntry {
  path: string;
  priority: string;
  changefreq: "weekly" | "monthly" | "yearly";
}

const entries = new Map<string, SitemapEntry>();

function add(route: Route, priority = "0.6", changefreq: SitemapEntry["changefreq"] = "monthly"): void {
  const path = routeToPath(route);
  entries.set(path, { path, priority, changefreq });
}

add({ view: "home" }, "1.0", "weekly");
add({ view: "about" }, "0.6", "yearly");
add({ view: "diagnostic" }, "0.9", "weekly");
for (const level of ["jad3-moshtarak", "1bac", "2bac"] as const) add({ view: "diagnostic", level }, "0.8", "monthly");
add({ view: "lessons" }, "0.9", "weekly");
for (const level of LEVELS) add({ view: "lessons", level: level.id }, "0.8", "monthly");
add({ view: "jadadat" }, "0.8", "weekly");
add({ view: "methods" }, "0.7", "monthly");
add({ view: "apps" }, "0.8", "monthly");
add({ view: "resources" }, "0.8", "weekly");
add({ view: "decks" }, "0.8", "monthly");
add({ view: "test" }, "0.7", "monthly");
add({ view: "battle" }, "0.5", "monthly");

for (const type of RESOURCE_TYPES) add({ view: "resources", type: type.id }, "0.6", "monthly");
for (const bank of TEST_BANKS) {
  add({ view: "test", bank: bank.id }, "0.6", "monthly");
  add({ view: "battle", bank: bank.id }, "0.4", "monthly");
}
for (const method of METHODOLOGIES) add({ view: "methods", id: method.id }, "0.6", "yearly");
for (const application of APPLICATIONS) add({ view: "apps", id: application.id }, "0.6", "monthly");
for (const deck of DECKS) add({ view: "decks", id: deck.id }, "0.6", "monthly");

const lessonKeys = new Set<string>();
for (const level of LEVELS) {
  for (const branch of level.branches) {
    for (const [subjectId, units] of Object.entries(branch.units)) {
      units.forEach((unit, unitIndex) => {
        unit.lessons.forEach((lesson, lessonIndex) => {
          if (lesson.soon) return;
          const key = `${branch.id}.${subjectId}.${unitIndex}.${lessonIndex}`;
          if (resolveLesson(key)) lessonKeys.add(key);
        });
      });
    }
  }
}
for (const key of lessonKeys) {
  add({ view: "lesson", id: key }, "0.7", "monthly");
  add({ view: "jadadat", id: key }, "0.6", "monthly");
}

/* كل مورد له شاشة عامة داخل مكتبة الموارد؛ لا نضيف هنا أي مسار خاص بلوحة الأستاذ. */
for (const resource of RESOURCES) add({ view: "resources", type: resource.type, open: resource.id }, "0.5", "monthly");

/* تحقق خفيف من أن فهرس الجذاذات يطابق مفاتيح الدروس المنشورة. */
for (const fiche of getJadadatCatalog()) {
  if (!lessonKeys.has(fiche.key)) add({ view: "jadadat", id: fiche.key }, "0.6", "monthly");
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

const urls = [...entries.values()]
  .sort((a, b) => a.path.localeCompare(b.path, "en"))
  .map(
    ({ path, priority, changefreq }) => `  <url>\n    <loc>${xmlEscape(`${SITE_ORIGIN}${path}`)}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const output = resolve(process.cwd(), "public/sitemap.xml");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, xml, "utf8");
console.log(`SEO sitemap: ${entries.size} public URLs → ${output}`);

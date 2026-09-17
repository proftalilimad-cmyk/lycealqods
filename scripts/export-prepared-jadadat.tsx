/* ============================================================
   تصدير «الجذاذات المُعدَّة» إلى Supabase / PostgreSQL
   ============================================================
   الموقع ثابت (بلا خادم): الجذاذات المُعدَّة تُركَّب في زمن التشغيل من
   دروس الموقع + مرجعية التوجيهات التربوية (src/lib/preparedJadadat.ts).
   هذا المصدِّر يكتب نفس الجذاذات كجدول SQL و JSON جاهزين إن رُبط الموقع
   لاحقًا بقاعدة بيانات، حتى تبقى الجذاذات المُعدَّة قابلة للاستعلام
   جنبًا إلى جنب مع جدول fiches_pedagogiques (ملفات الأستاذ الأصلية).

   القيم كلها مشتقة من مصادر حقيقية:
     • المضامين من دروس الموقع المنشورة (LESSON_CONTENT).
     • عدد الحصص من وثيقة الأستاذ حيثما ورد (وإلا NULL).
     • pdf_url من مكتبة الملفات الأصلية حيثما وُجدت نسخة PDF.

   التشغيل:
     ./node_modules/.bin/esbuild scripts/export-prepared-jadadat.tsx --bundle \
       --platform=node --format=cjs --loader:.css=empty --outfile=/tmp/x.cjs \
       --log-level=warning && node /tmp/x.cjs
   ============================================================ */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { PREPARED_META, getPreparedCatalog, getPreparedStats } from "../src/lib/preparedJadadat";

const ROOT = process.cwd();
const q = (s: string | null | undefined) => (s === null || s === undefined ? "NULL" : `'${String(s).replace(/'/g, "''")}'`);

const list = getPreparedCatalog();
const stats = getPreparedStats();

const rows = list.map(({ fiche, extra }) => ({
  id: fiche.id,
  title: fiche.title,
  level: PREPARED_META.level,
  subject: fiche.subject,
  semester: fiche.cycle,
  unit_title: fiche.unitTitle,
  module: fiche.module,
  lesson_number: fiche.number,
  sessions_count: extra.sessionsCount,
  total_minutes: extra.totalMinutes,
  book: fiche.book,
  description: `جذاذة مُعدَّة وفق التوجيهات التربوية وديداكتيك المادة لدرس «${fiche.title}» (${fiche.subject} — ${fiche.cycle}، مجزوءة ${fiche.module}: ${fiche.unitTitle}). مضامينها منقولة من درس الموقع المنشور، وصياغتها الديداكتيكية من مرجعية المادة. ${fiche.segments.length} مقاطع، ${extra.glossary.length} مفاهيم، ${extra.quiz.length} أسئلة تقويم بعناصر إجابتها.`,
  problematic: fiche.problematic ?? null,
  kifaya_markaziya: fiche.kifayaMarkaziya,
  kifaya_mihwariya: fiche.kifayaMihwariya,
  pdf_url: extra.originalFiles.find((f) => f.kind === "pdf")?.url ?? null,
  lesson_url: extra.lessonUrl,
  library_url: extra.libraryUrl,
  keywords: extra.keywords.join(" "),
  stages: fiche.segments.map((s) => ({ phase: s.phase, objectives: s.objectives, management: s.management, supports: s.supports, content: s.content })),
  status: "prepared",
  content_source: `درس الموقع: ${extra.lessonTitle} (${extra.lessonKey})`,
  didactic_source: "التوجيهات التربوية والبرامج الخاصة بتدريس مادة الاجتماعيات بالتعليم الثانوي التأهيلي + ديداكتيك المادة",
  created_at: extra.preparedAt,
  updated_at: extra.preparedAt,
}));

/* ---------------- JSON ---------------- */
writeFileSync(join(ROOT, "supabase", "jadadat_prepared.json"), JSON.stringify(rows, null, 1), "utf8");

/* ---------------- SQL ---------------- */
const cols = Object.keys(rows[0]);
const sql = `-- ============================================================
-- جدول الجذاذات المُعدَّة — الجذع المشترك العلمي (اجتماعيات)
-- ${stats.total} جذاذة (${stats.history} تاريخ + ${stats.geography} جغرافيا) · ${stats.segments} مقطعًا · ${stats.concepts} مفهومًا · ${stats.quiz} سؤال تقويم
--
-- المشروع الحالي موقع ثابت (بلا خادم): هذه الجذاذات تُركَّب داخل الموقع في
-- زمن التشغيل من دروس الموقع المنشورة + مرجعية التوجيهات التربوية
-- (src/lib/preparedJadadat.ts). هذا الملف نسخة قابلة للاستعلام إن رُبط
-- الموقع بـ Supabase/PostgreSQL:
--   psql -f supabase/jadadat_prepared.sql
-- أو الصقه في SQL Editor داخل لوحة Supabase.
--
-- الأمانة: المضامين من دروس الموقع (لا معلومة مؤلَّفة)، وعدد الحصص و pdf_url
-- من وثائق الأستاذ حيثما وُجدت (وإلا NULL)، وحالة السجل 'prepared' تميّزه عن
-- جذاذات الأستاذ الأصلية في جدول fiches_pedagogiques.
-- ============================================================

create table if not exists public.jadadat_prepared (
  id                text primary key,
  title             text not null,
  level             text not null default '${PREPARED_META.level}',
  subject           text not null check (subject in ('التاريخ','الجغرافيا')),
  semester          text not null,
  unit_title        text,
  module            text,
  lesson_number     text not null,
  sessions_count    integer,
  total_minutes     integer,
  book              text,
  description       text,
  problematic       text,
  kifaya_markaziya  text,
  kifaya_mihwariya  text,
  pdf_url           text,
  lesson_url        text,
  library_url       text,
  keywords          text,
  stages            jsonb,
  status            text not null default 'prepared',
  content_source    text,
  didactic_source   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists jadadat_prepared_subject_idx  on public.jadadat_prepared (subject);
create index if not exists jadadat_prepared_semester_idx on public.jadadat_prepared (semester);
create index if not exists jadadat_prepared_unit_idx     on public.jadadat_prepared (unit_title);

insert into public.jadadat_prepared
  (${cols.join(", ")})
values
${rows
  .map(
    (r) =>
      `  (${cols
        .map((c) => {
          const v = (r as unknown as Record<string, unknown>)[c];
          if (c === "stages") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
          if (typeof v === "number") return String(v);
          if (v === null || v === undefined) return "NULL";
          return q(String(v));
        })
        .join(", ")})`,
  )
  .join(",\n")}
on conflict (id) do nothing;

-- للتأكد:
--   select subject, semester, count(*) from public.jadadat_prepared group by 1,2 order by 1,2;
`;
writeFileSync(join(ROOT, "supabase", "jadadat_prepared.sql"), sql, "utf8");

console.log(`✓ كُتب supabase/jadadat_prepared.sql (${(sql.length / 1024).toFixed(1)} ك.ب) — جدول + ${rows.length} سجلًا`);
console.log(`✓ كُتب supabase/jadadat_prepared.json (${(JSON.stringify(rows, null, 1).length / 1024).toFixed(1)} ك.ب)`);
console.log(`  ${stats.total} جذاذة (${stats.history} تاريخ + ${stats.geography} جغرافيا) · ${stats.segments} مقطعًا · منها ${stats.withPdf} لها pdf_url و${stats.withSessions} لها عدد حصص من الوثيقة الأصلية`);

-- التقويم والبيانات المركزية — Supabase PostgreSQL
-- نفّذ هذا الملف في Supabase SQL Editor قبل نشر النسخة.
-- لا تستعمل service_role داخل Vite أو داخل المتصفح.
--
-- مبدأ الخصوصية:
-- * التلميذ يملك مسار RPC للإرسال فقط، مع مفتاح موقع عام لا يسمح بالقراءة.
-- * الأستاذ المصادق عليه يرى فقط الصفوف التي تحمل teacher_id الخاص بحسابه.
-- * تقارير المفتش وملفاتها مرتبطة بمالكها عبر auth.uid() وRLS.

create extension if not exists pgcrypto;

create table if not exists public.teacher_public_keys (
  site_key text primary key check (length(site_key) >= 24),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- جدول النتائج المركزي. ALTER يجعل الملف قابلًا للتطبيق على النسخة القديمة أيضًا.
create table if not exists public.student_submissions (
  id text primary key,
  teacher_id uuid references auth.users(id) on delete cascade,
  class_name text not null,
  level text,
  bank_id text,
  massar text,
  assessment_type text not null default 'diagnostic' check (assessment_type in ('diagnostic', 'personal')),
  submitted_at timestamptz not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.student_submissions add column if not exists teacher_id uuid references auth.users(id) on delete cascade;
create index if not exists student_submissions_teacher_date_idx on public.student_submissions (teacher_id, submitted_at desc);
create index if not exists student_submissions_class_idx on public.student_submissions (teacher_id, class_name);

create table if not exists public.inspector_reports (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  institution text not null default '',
  academy text not null default '',
  directorate text not null default '',
  class_name text not null,
  level text not null,
  subject text not null,
  school_year text not null,
  assessment_type text not null check (assessment_type in ('diagnostic', 'personal')),
  status text not null default 'draft' check (status in ('draft', 'approved', 'archived')),
  submission_ids text[] not null default '{}',
  html_snapshot text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inspector_reports add column if not exists institution text not null default '';
alter table public.inspector_reports add column if not exists academy text not null default '';
alter table public.inspector_reports add column if not exists directorate text not null default '';
alter table public.inspector_reports add column if not exists updated_at timestamptz not null default now();
create index if not exists inspector_reports_owner_idx on public.inspector_reports (owner_id, updated_at desc);

alter table public.teacher_public_keys enable row level security;
alter table public.student_submissions enable row level security;
alter table public.inspector_reports enable row level security;

-- لا تمنح anon أو PUBLIC أي صلاحية مباشرة على جداول النتائج أو المفاتيح.
revoke all on table public.teacher_public_keys from public, anon, authenticated;
revoke all on table public.student_submissions from public, anon;
revoke insert, update on table public.student_submissions from authenticated;
grant select, delete on public.student_submissions to authenticated;

-- لا توجد سياسة SELECT للدور anon؛ الأستاذ يرى صفوفه فقط.
drop policy if exists "students can submit non-demo result" on public.student_submissions;
drop policy if exists "authenticated teacher reads submissions" on public.student_submissions;
drop policy if exists "authenticated teacher deletes submissions" on public.student_submissions;

create policy "authenticated teacher reads own submissions"
on public.student_submissions for select
to authenticated
using (teacher_id = auth.uid());

create policy "authenticated teacher deletes own submissions"
on public.student_submissions for delete
to authenticated
using (teacher_id = auth.uid());

-- Anonymous/student write-only endpoint. The function itself is the only path
-- that can insert a submission and it derives teacher_id from the site key.
create or replace function public.submit_assessment_result(p_site_key text, p_submission jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid;
  v_id text;
  v_name text;
  v_class text;
  v_type text;
  v_total numeric;
  v_percentage numeric;
begin
  select teacher_id into v_teacher_id
  from public.teacher_public_keys
  where site_key = trim(p_site_key) and active = true
  limit 1;

  if v_teacher_id is null then
    raise exception 'مفتاح الموقع غير صالح أو غير نشط';
  end if;

  v_id := nullif(trim(p_submission->>'id'), '');
  v_name := nullif(trim(p_submission->>'name'), '');
  v_class := nullif(trim(p_submission->>'className'), '');
  v_type := coalesce(p_submission->>'assessmentType', 'diagnostic');
  v_total := (p_submission->>'total')::numeric;
  v_percentage := (p_submission->>'percent')::numeric;

  if v_id is null or v_name is null or char_length(v_name) < 3 or v_class is null then
    raise exception 'بيانات التلميذ أو القسم غير صالحة';
  end if;
  if coalesce(p_submission->>'isDemo', 'false') = 'true' or coalesce(p_submission->>'dataSource', 'real') <> 'real' then
    raise exception 'لا يسمح بإرسال بيانات Demo';
  end if;
  if v_type not in ('diagnostic', 'personal') then
    raise exception 'نوع التقويم غير صالح';
  end if;
  if v_total is null or v_total < 0 or v_total > 20 or v_percentage is null or v_percentage < 0 or v_percentage > 100 then
    raise exception 'النتيجة خارج النطاق';
  end if;

  insert into public.student_submissions (
    id, teacher_id, class_name, level, bank_id, massar,
    assessment_type, submitted_at, payload
  ) values (
    v_id,
    v_teacher_id,
    v_class,
    nullif(trim(p_submission->>'bankLevel'), ''),
    nullif(trim(p_submission->>'bankId'), ''),
    nullif(trim(p_submission->>'massar'), ''),
    v_type,
    coalesce((p_submission->>'date')::timestamptz, now()),
    p_submission || jsonb_build_object('teacherId', v_teacher_id::text, 'dataSource', 'real', 'isDemo', false)
  )
  on conflict (id) do nothing;

  return v_id;
end;
$$;

revoke all on function public.submit_assessment_result(text, jsonb) from public;
grant execute on function public.submit_assessment_result(text, jsonb) to anon, authenticated;

-- التقارير ملك للحساب الذي أنشأها. لا تسمح RLS بحذف أو تعديل تقرير أستاذ آخر.
revoke all on table public.inspector_reports from public, anon;
grant select, insert, update, delete on public.inspector_reports to authenticated;

drop policy if exists "teacher reads own inspector reports" on public.inspector_reports;
drop policy if exists "teacher creates own inspector reports" on public.inspector_reports;
drop policy if exists "teacher updates own inspector reports" on public.inspector_reports;
drop policy if exists "teacher deletes own inspector reports" on public.inspector_reports;

create policy "teacher reads own inspector reports"
on public.inspector_reports for select
to authenticated
using (owner_id = auth.uid());

create policy "teacher creates own inspector reports"
on public.inspector_reports for insert
to authenticated
with check (owner_id = auth.uid());

create policy "teacher updates own inspector reports"
on public.inspector_reports for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "teacher deletes own inspector reports"
on public.inspector_reports for delete
to authenticated
using (owner_id = auth.uid());

create or replace function public.validate_inspector_report_submissions()
returns trigger
language plpgsql
security invoker
as $$
begin
  if exists (
    select 1
    from unnest(coalesce(new.submission_ids, '{}'::text[])) as requested(submission_id)
    left join public.student_submissions submission
      on submission.id = requested.submission_id
      and submission.teacher_id = new.owner_id
      and submission.class_name = new.class_name
      and submission.assessment_type = new.assessment_type
    where submission.id is null
  ) then
    raise exception 'نتائج التقرير لا تنتمي إلى الأستاذ أو القسم أو نوع التقويم المحدد';
  end if;
  return new;
end;
$$;

drop trigger if exists inspector_reports_submission_owner on public.inspector_reports;
create trigger inspector_reports_submission_owner
before insert or update on public.inspector_reports
for each row execute function public.validate_inspector_report_submissions();

create or replace function public.touch_inspector_report_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists inspector_reports_updated_at on public.inspector_reports;
create trigger inspector_reports_updated_at
before update on public.inspector_reports
for each row execute function public.touch_inspector_report_updated_at();

-- بعد إنشاء حساب الأستاذ في Authentication نفّذ مرة واحدة:
-- insert into public.teacher_public_keys(site_key, teacher_id)
-- values ('مفتاح_عشوائي_طويل_32_حرفًا_على_الأقل', 'UUID-حساب-الأستاذ');
--
-- تحقق من عدم وجود قراءة عامة:
-- set role anon;
-- select * from public.student_submissions; -- يجب أن يفشل

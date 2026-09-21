-- التقويم والبيانات المركزية — Supabase PostgreSQL
-- نفّذ هذا الملف في Supabase SQL Editor قبل نشر النسخة.
-- لا تستعمل service_role داخل Vite أو داخل المتصفح.

create table if not exists public.student_submissions (
  id text primary key,
  class_name text not null,
  level text,
  bank_id text,
  massar text,
  assessment_type text not null default 'diagnostic' check (assessment_type in ('diagnostic', 'personal')),
  submitted_at timestamptz not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists student_submissions_class_idx on public.student_submissions (class_name);
create index if not exists student_submissions_date_idx on public.student_submissions (submitted_at desc);

create table if not exists public.inspector_reports (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
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

create index if not exists inspector_reports_owner_idx on public.inspector_reports (owner_id, updated_at desc);

alter table public.student_submissions enable row level security;
alter table public.inspector_reports enable row level security;

-- التلميذ يرسل نتيجة فقط. لا توجد سياسة SELECT للدور anon، لذلك لا يستطيع
-- التلميذ أو الزائر قراءة اسم أو نقطة أي تلميذ من قاعدة البيانات.
grant insert on public.student_submissions to anon, authenticated;
grant select, delete on public.student_submissions to authenticated;

drop policy if exists "students can submit non-demo result" on public.student_submissions;
create policy "students can submit non-demo result"
on public.student_submissions for insert
to anon, authenticated
with check (
  id = payload->>'id'
  and class_name = payload->>'className'
  and coalesce(payload->>'isDemo', 'false') <> 'true'
  and coalesce(payload->>'dataSource', 'real') = 'real'
);

drop policy if exists "authenticated teacher reads submissions" on public.student_submissions;
create policy "authenticated teacher reads submissions"
on public.student_submissions for select
to authenticated
using (true);

drop policy if exists "authenticated teacher deletes submissions" on public.student_submissions;
create policy "authenticated teacher deletes submissions"
on public.student_submissions for delete
to authenticated
using (true);

-- التقارير ملك للحساب الذي أنشأها. لا تسمح RLS بحذف أو تعديل تقرير أستاذ آخر.
grant select, insert, update, delete on public.inspector_reports to authenticated;

drop policy if exists "teacher reads own inspector reports" on public.inspector_reports;
create policy "teacher reads own inspector reports"
on public.inspector_reports for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "teacher creates own inspector reports" on public.inspector_reports;
create policy "teacher creates own inspector reports"
on public.inspector_reports for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "teacher updates own inspector reports" on public.inspector_reports;
create policy "teacher updates own inspector reports"
on public.inspector_reports for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "teacher deletes own inspector reports" on public.inspector_reports;
create policy "teacher deletes own inspector reports"
on public.inspector_reports for delete
to authenticated
using (owner_id = auth.uid());

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

-- تحقق سريع بعد التنفيذ:
-- select tablename, rowsecurity from pg_tables where schemaname = 'public'
--   and tablename in ('student_submissions', 'inspector_reports');

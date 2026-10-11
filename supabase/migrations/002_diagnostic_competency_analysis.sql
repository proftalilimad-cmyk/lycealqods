-- نموذج التحليل التربوي التركيبي
-- هذه Migration مستقلة عن student_submissions وinspector_reports.
-- لا تُنشئ نتائج تجريبية ولا تنقل أي نتيجة إلى localStorage.
-- طبقة الواجهة الحالية تستعمل إعدادًا محليًا قابلًا للتحرير، ويمكن نقل الإعداد
-- إلى هذه الجداول بعد تطبيقها دون تغيير بنية النتائج المركزية.

create table if not exists public.diagnostic_competencies (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  subject text not null check (subject in ('history', 'geography')),
  active boolean not null default true,
  sort_order integer not null default 0,
  source text not null default 'teacher' check (source in ('draft', 'teacher')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

create table if not exists public.diagnostic_abilities (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  competency_id text not null,
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  subject text not null check (subject in ('history', 'geography')),
  active boolean not null default true,
  sort_order integer not null default 0,
  weight numeric not null default 1 check (weight > 0 and weight <= 100),
  source text not null default 'teacher' check (source in ('imported-skill', 'teacher')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id),
  constraint diagnostic_abilities_competency_fk
    foreign key (owner_id, competency_id)
    references public.diagnostic_competencies(owner_id, id)
    on update cascade on delete restrict
);

create table if not exists public.diagnostic_question_abilities (
  owner_id uuid not null references auth.users(id) on delete cascade,
  bank_id text not null,
  question_id integer not null check (question_id > 0),
  ability_id text,
  updated_at timestamptz not null default now(),
  primary key (owner_id, bank_id, question_id),
  constraint diagnostic_question_ability_fk
    foreign key (owner_id, ability_id)
    references public.diagnostic_abilities(owner_id, id)
    on update cascade on delete restrict
);

create index if not exists diagnostic_competencies_owner_order_idx
  on public.diagnostic_competencies(owner_id, sort_order, name);
create index if not exists diagnostic_abilities_owner_competency_idx
  on public.diagnostic_abilities(owner_id, competency_id, sort_order, name);
create index if not exists diagnostic_question_abilities_owner_bank_idx
  on public.diagnostic_question_abilities(owner_id, bank_id, question_id);

alter table public.diagnostic_competencies enable row level security;
alter table public.diagnostic_abilities enable row level security;
alter table public.diagnostic_question_abilities enable row level security;

revoke all on table public.diagnostic_competencies from public, anon;
revoke all on table public.diagnostic_abilities from public, anon;
revoke all on table public.diagnostic_question_abilities from public, anon;
grant select, insert, update, delete on public.diagnostic_competencies to authenticated;
grant select, insert, update, delete on public.diagnostic_abilities to authenticated;
grant select, insert, update, delete on public.diagnostic_question_abilities to authenticated;

drop policy if exists "teacher reads own diagnostic competencies" on public.diagnostic_competencies;
drop policy if exists "teacher manages own diagnostic competencies" on public.diagnostic_competencies;
create policy "teacher reads own diagnostic competencies"
on public.diagnostic_competencies for select to authenticated
using (owner_id = auth.uid());
create policy "teacher manages own diagnostic competencies"
on public.diagnostic_competencies for all to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "teacher reads own diagnostic abilities" on public.diagnostic_abilities;
drop policy if exists "teacher manages own diagnostic abilities" on public.diagnostic_abilities;
create policy "teacher reads own diagnostic abilities"
on public.diagnostic_abilities for select to authenticated
using (owner_id = auth.uid());
create policy "teacher manages own diagnostic abilities"
on public.diagnostic_abilities for all to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "teacher reads own diagnostic question mappings" on public.diagnostic_question_abilities;
drop policy if exists "teacher manages own diagnostic question mappings" on public.diagnostic_question_abilities;
create policy "teacher reads own diagnostic question mappings"
on public.diagnostic_question_abilities for select to authenticated
using (owner_id = auth.uid());
create policy "teacher manages own diagnostic question mappings"
on public.diagnostic_question_abilities for all to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create or replace function public.touch_diagnostic_model_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists diagnostic_competencies_updated_at on public.diagnostic_competencies;
create trigger diagnostic_competencies_updated_at
before update on public.diagnostic_competencies
for each row execute function public.touch_diagnostic_model_updated_at();

drop trigger if exists diagnostic_abilities_updated_at on public.diagnostic_abilities;
create trigger diagnostic_abilities_updated_at
before update on public.diagnostic_abilities
for each row execute function public.touch_diagnostic_model_updated_at();

drop trigger if exists diagnostic_question_abilities_updated_at on public.diagnostic_question_abilities;
create trigger diagnostic_question_abilities_updated_at
before update on public.diagnostic_question_abilities
for each row execute function public.touch_diagnostic_model_updated_at();

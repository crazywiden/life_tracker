create extension if not exists pgcrypto;

create table if not exists public.days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  timezone text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, local_date)
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  schema_version integer not null,
  source_json jsonb not null,
  normalized_payload jsonb not null,
  is_active boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists templates_one_active_per_user
  on public.templates (user_id)
  where is_active = true and archived_at is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists days_set_updated_at on public.days;
create trigger days_set_updated_at
before update on public.days
for each row
execute function public.set_updated_at();

drop trigger if exists templates_set_updated_at on public.templates;
create trigger templates_set_updated_at
before update on public.templates
for each row
execute function public.set_updated_at();

alter table public.days enable row level security;
alter table public.templates enable row level security;

drop policy if exists "days_select_own" on public.days;
create policy "days_select_own"
on public.days
for select
using (auth.uid() = user_id);

drop policy if exists "days_insert_own" on public.days;
create policy "days_insert_own"
on public.days
for insert
with check (auth.uid() = user_id);

drop policy if exists "days_update_own" on public.days;
create policy "days_update_own"
on public.days
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "templates_select_own" on public.templates;
create policy "templates_select_own"
on public.templates
for select
using (auth.uid() = user_id);

drop policy if exists "templates_insert_own" on public.templates;
create policy "templates_insert_own"
on public.templates
for insert
with check (auth.uid() = user_id);

drop policy if exists "templates_update_own" on public.templates;
create policy "templates_update_own"
on public.templates
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.patch_day_module(
  p_local_date date,
  p_timezone text,
  p_module text,
  p_value jsonb
)
returns public.days
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_day public.days;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_module not in ('diary', 'reading', 'gym') then
    raise exception 'Unsupported module';
  end if;

  insert into public.days (user_id, local_date, timezone, payload)
  values (v_user_id, p_local_date, p_timezone, jsonb_build_object(p_module, p_value))
  on conflict (user_id, local_date)
  do update
    set timezone = excluded.timezone,
        payload = coalesce(public.days.payload, '{}'::jsonb) || jsonb_build_object(p_module, p_value),
        updated_at = timezone('utc', now())
  returning * into v_day;

  return v_day;
end;
$$;

grant execute on function public.patch_day_module(date, text, text, jsonb) to authenticated;

create or replace function public.activate_template(p_template_id uuid)
returns public.templates
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_template public.templates;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.templates
  set is_active = false
  where user_id = v_user_id;

  update public.templates
  set is_active = true,
      archived_at = null,
      updated_at = timezone('utc', now())
  where id = p_template_id and user_id = v_user_id
  returning * into v_template;

  if v_template.id is null then
    raise exception 'Template not found';
  end if;

  return v_template;
end;
$$;

grant execute on function public.activate_template(uuid) to authenticated;

-- ============================================================
-- Car Insurance Admin Dashboard - Full Schema Migration
-- ============================================================

-- 1. Insurance Companies
create table if not exists public.insurance_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Car Makes
create table if not exists public.car_makes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_chinese boolean not null default false,
  chinese_tier text not null default 'non_chinese',
  created_at timestamptz not null default now()
);

-- 3. Car Models
create table if not exists public.car_models (
  id uuid primary key default gen_random_uuid(),
  make_id uuid not null references public.car_makes(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique(make_id, name)
);

-- 4. Quote Rules (Policy Pricing Engine)
create table if not exists public.quote_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.insurance_companies(id) on delete cascade,
  policy_type text not null default 'private',       -- 'private' | 'gold'
  fuel_type text not null default 'gasoline',         -- 'gasoline' | 'electric'
  car_condition text,                                  -- 'new' | 'used' | null (any)
  chinese_tier text not null default 'non_chinese',
  price_min bigint not null default 0,
  price_max bigint,
  age_min_years int not null default 0,
  age_max_years int,
  max_car_age_years int,                               -- Hard company cutoff age
  electric_agency_status text,                         -- 'agency' | 'no_agency' | null
  rate_percentage numeric(6,4) not null,
  conditions text[] default '{}',                     -- Arabic conditions
  conditions_en text[] default '{}',                  -- English conditions
  label text,
  applicable_make_ids uuid[],                         -- Optional: restrict to specific makes
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 5. Enable Row Level Security
alter table public.insurance_companies enable row level security;
alter table public.car_makes enable row level security;
alter table public.car_models enable row level security;
alter table public.quote_rules enable row level security;

-- 6. RLS Policies — Public Read Access (no auth required per spec)
create policy "public read companies" on public.insurance_companies for select to anon using (true);
create policy "public write companies" on public.insurance_companies for all to anon using (true) with check (true);

create policy "public read makes" on public.car_makes for select to anon using (true);
create policy "public write makes" on public.car_makes for all to anon using (true) with check (true);

create policy "public read models" on public.car_models for select to anon using (true);
create policy "public write models" on public.car_models for all to anon using (true) with check (true);

create policy "public read rules" on public.quote_rules for select to anon using (true);
create policy "public write rules" on public.quote_rules for all to anon using (true) with check (true);

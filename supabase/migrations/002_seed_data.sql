-- ============================================================
-- Seed Data for Car Insurance Admin Dashboard
-- ============================================================

-- Companies
insert into public.insurance_companies (name, name_ar, is_active) values
  ('MADA Insurance', 'مدى للتأمين', true),
  ('Bupa Arabia', 'بوبا العربية', true),
  ('Tawuniya', 'التعاونية للتأمين', true),
  ('GIG Insurance', 'مجموعة الخليج للتأمين', true),
  ('Wataniya Insurance', 'الوطنية للتأمين', true)
on conflict do nothing;

-- Car Makes
insert into public.car_makes (name, is_chinese, chinese_tier) values
  ('BMW', false, 'non_chinese'),
  ('Mercedes-Benz', false, 'non_chinese'),
  ('Toyota', false, 'non_chinese'),
  ('Honda', false, 'non_chinese'),
  ('Hyundai', false, 'non_chinese'),
  ('Kia', false, 'non_chinese'),
  ('BYD', true, 'byd'),
  ('Chery', true, 'cherry_geely'),
  ('Geely', true, 'cherry_geely'),
  ('Haval', true, 'haval_jac_gac'),
  ('JAC', true, 'haval_jac_gac'),
  ('Jetour', true, 'baic_jetour'),
  ('BAIC', true, 'baic_jetour')
on conflict (name) do nothing;

-- Car Models (BMW)
insert into public.car_models (make_id, name)
select id, unnest(array['X5','X3','3 Series','5 Series','7 Series','M4']) from public.car_makes where name = 'BMW'
on conflict do nothing;

-- Car Models (Mercedes-Benz)
insert into public.car_models (make_id, name)
select id, unnest(array['C-Class','E-Class','S-Class','GLE','GLC','A-Class']) from public.car_makes where name = 'Mercedes-Benz'
on conflict do nothing;

-- Car Models (Toyota)
insert into public.car_models (make_id, name)
select id, unnest(array['Camry','Corolla','Land Cruiser','Prado','RAV4','Fortuner','Hilux']) from public.car_makes where name = 'Toyota'
on conflict do nothing;

-- Car Models (Honda)
insert into public.car_models (make_id, name)
select id, unnest(array['Civic','CR-V','Accord','HR-V','Pilot']) from public.car_makes where name = 'Honda'
on conflict do nothing;

-- Car Models (Hyundai)
insert into public.car_models (make_id, name)
select id, unnest(array['Elantra','Tucson','Santa Fe','Sonata','Creta']) from public.car_makes where name = 'Hyundai'
on conflict do nothing;

-- Car Models (Kia)
insert into public.car_models (make_id, name)
select id, unnest(array['Sportage','Sorento','Cerato','Stinger','Telluride']) from public.car_makes where name = 'Kia'
on conflict do nothing;

-- Car Models (BYD)
insert into public.car_models (make_id, name)
select id, unnest(array['Seal','Atto 3','Han','Dolphin','Tang']) from public.car_makes where name = 'BYD'
on conflict do nothing;

-- Car Models (Chery)
insert into public.car_models (make_id, name)
select id, unnest(array['Tiggo 4','Tiggo 7','Tiggo 8']) from public.car_makes where name = 'Chery'
on conflict do nothing;

-- Car Models (Geely)
insert into public.car_models (make_id, name)
select id, unnest(array['Emgrand','Tugella','Coolray']) from public.car_makes where name = 'Geely'
on conflict do nothing;

-- Quote Rules
-- MADA Insurance — Gasoline, any condition, 0-5 years
insert into public.quote_rules (company_id, policy_type, fuel_type, car_condition, chinese_tier, price_min, price_max, age_min_years, age_max_years, max_car_age_years, rate_percentage, label, is_active)
select id, 'private', 'gasoline', null, 'non_chinese', 100000, null, 0, 5, 5, 2.75, 'MADA Standard (0-5 yrs)', true
from public.insurance_companies where name = 'MADA Insurance';

-- MADA Insurance — Gasoline, 5-10 years
insert into public.quote_rules (company_id, policy_type, fuel_type, car_condition, chinese_tier, price_min, price_max, age_min_years, age_max_years, max_car_age_years, rate_percentage, label, is_active)
select id, 'private', 'gasoline', 'used', 'non_chinese', 100000, null, 5, 10, 5, 3.25, 'MADA Used (5-10 yrs)', true
from public.insurance_companies where name = 'MADA Insurance';

-- Bupa Arabia — Gold Policy Premium Gasoline
insert into public.quote_rules (company_id, policy_type, fuel_type, car_condition, chinese_tier, price_min, price_max, age_min_years, age_max_years, rate_percentage, label, is_active)
select id, 'gold', 'gasoline', null, 'non_chinese', 500000, null, 0, 7, 3.10, 'Bupa Gold Premium', true
from public.insurance_companies where name = 'Bupa Arabia';

-- Tawuniya — Private Gasoline Standard
insert into public.quote_rules (company_id, policy_type, fuel_type, car_condition, chinese_tier, price_min, price_max, age_min_years, age_max_years, rate_percentage, label, is_active)
select id, 'private', 'gasoline', null, 'non_chinese', 100000, 5000000, 0, 10, 2.60, 'Tawuniya Standard', true
from public.insurance_companies where name = 'Tawuniya';

-- GIG Insurance — Gold Program
insert into public.quote_rules (company_id, policy_type, fuel_type, car_condition, chinese_tier, price_min, price_max, age_min_years, age_max_years, rate_percentage, label, is_active)
select id, 'gold', 'gasoline', 'new', 'non_chinese', 300000, null, 0, 3, 3.50, 'GIG Gold New Cars Only', true
from public.insurance_companies where name = 'GIG Insurance';

-- MADA Insurance — Electric with Agency
insert into public.quote_rules (company_id, policy_type, fuel_type, car_condition, chinese_tier, price_min, age_min_years, electric_agency_status, rate_percentage, label, is_active)
select id, 'private', 'electric', null, 'non_chinese', 200000, 0, 'agency', 2.90, 'MADA Electric (Agency)', true
from public.insurance_companies where name = 'MADA Insurance';

-- Wataniya — BYD electric
insert into public.quote_rules (company_id, policy_type, fuel_type, car_condition, chinese_tier, price_min, age_min_years, age_max_years, rate_percentage, label, is_active)
select id, 'private', 'electric', null, 'byd', 150000, 0, 5, 3.20, 'Wataniya BYD Electric', true
from public.insurance_companies where name = 'Wataniya Insurance';

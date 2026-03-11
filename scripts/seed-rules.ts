#!/usr/bin/env bun
/**
 * Seed script - inserts quote rules directly via Supabase REST API.
 * Usage: bun run scripts/seed-rules.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !KEY) {
  console.error("Missing SUPABASE_URL or ANON_KEY environment variables.");
  process.exit(1);
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

async function getCompanies() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/insurance_companies?select=id,name`,
    {
      headers,
    },
  );
  return (await res.json()) as { id: string; name: string }[];
}

async function insertRules(rules: Record<string, any>[]) {
  // Insert one at a time to avoid key mismatch error
  let count = 0;
  for (const rule of rules) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/quote_rules`, {
      method: "POST",
      headers,
      body: JSON.stringify(rule),
    });
    if (res.ok || res.status === 201) {
      count++;
    } else {
      const err = await res.json();
      console.error(`❌ Insert failed for ${rule.label}:`, err);
    }
  }
  console.log(`✅ Inserted ${count} / ${rules.length} quote rules`);
}

async function main() {
  const companies = await getCompanies();
  const get = (name: string) => companies.find((c) => c.name === name)?.id;

  // Build rules with all keys present (use null for optional fields)
  const rules: Record<string, any>[] = [
    {
      company_id: get("Tawuniya"),
      policy_type: "private",
      fuel_type: "gasoline",
      car_condition: null,
      chinese_tier: "non_chinese",
      price_min: 100000,
      price_max: null,
      age_min_years: 0,
      age_max_years: 5,
      max_car_age_years: null,
      electric_agency_status: null,
      rate_percentage: 2.6,
      label: "Tawuniya Standard (0-5 yrs)",
      excluded_make_ids: null,
      is_active: true,
    },
    {
      company_id: get("Tawuniya"),
      policy_type: "private",
      fuel_type: "gasoline",
      car_condition: "used",
      chinese_tier: "non_chinese",
      price_min: 100000,
      price_max: null,
      age_min_years: 5,
      age_max_years: 10,
      max_car_age_years: null,
      electric_agency_status: null,
      rate_percentage: 3.1,
      label: "Tawuniya Used (5-10 yrs)",
      excluded_make_ids: null,
      is_active: true,
    },
    {
      company_id: get("Bupa"),
      policy_type: "gold",
      fuel_type: "gasoline",
      car_condition: null,
      chinese_tier: "non_chinese",
      price_min: 500000,
      price_max: null,
      age_min_years: 0,
      age_max_years: 7,
      max_car_age_years: null,
      electric_agency_status: null,
      rate_percentage: 3.25,
      label: "Bupa Gold Premium",
      excluded_make_ids: null,
      is_active: true,
    },
    {
      company_id: get("Malath"),
      policy_type: "private",
      fuel_type: "gasoline",
      car_condition: null,
      chinese_tier: "non_chinese",
      price_min: 100000,
      price_max: 5000000,
      age_min_years: 0,
      age_max_years: 10,
      max_car_age_years: null,
      electric_agency_status: null,
      rate_percentage: 2.5,
      label: "Malath Standard",
      excluded_make_ids: null,
      is_active: true,
    },
    {
      company_id: get("Al-Rajhi"),
      policy_type: "gold",
      fuel_type: "gasoline",
      car_condition: "new",
      chinese_tier: "non_chinese",
      price_min: 300000,
      price_max: null,
      age_min_years: 0,
      age_max_years: 3,
      max_car_age_years: null,
      electric_agency_status: null,
      rate_percentage: 3.5,
      label: "Al-Rajhi Gold New Cars",
      excluded_make_ids: null,
      is_active: true,
    },
    {
      company_id: get("Tawuniya"),
      policy_type: "private",
      fuel_type: "electric",
      car_condition: null,
      chinese_tier: "non_chinese",
      price_min: 200000,
      price_max: null,
      age_min_years: 0,
      age_max_years: null,
      max_car_age_years: null,
      electric_agency_status: "agency",
      rate_percentage: 2.9,
      label: "Tawuniya Electric (Agency)",
      excluded_make_ids: null,
      is_active: true,
    },
    {
      company_id: get("Wataniya"),
      policy_type: "private",
      fuel_type: "electric",
      car_condition: null,
      chinese_tier: "byd",
      price_min: 150000,
      price_max: null,
      age_min_years: 0,
      age_max_years: 5,
      max_car_age_years: null,
      electric_agency_status: null,
      rate_percentage: 3.2,
      label: "Wataniya BYD Electric",
      excluded_make_ids: null,
      is_active: true,
    },
    {
      company_id: get("Arabian Shield"),
      policy_type: "private",
      fuel_type: "gasoline",
      car_condition: null,
      chinese_tier: "non_chinese",
      price_min: 100000,
      price_max: 3000000,
      age_min_years: 0,
      age_max_years: 8,
      max_car_age_years: null,
      electric_agency_status: null,
      rate_percentage: 2.75,
      label: "Arabian Shield Standard",
      excluded_make_ids: null,
      is_active: true,
    },
    {
      company_id: get("Allianz"),
      policy_type: "private",
      fuel_type: "gasoline",
      car_condition: null,
      chinese_tier: "non_chinese",
      price_min: 200000,
      price_max: null,
      age_min_years: 0,
      age_max_years: 6,
      max_car_age_years: null,
      electric_agency_status: null,
      rate_percentage: 2.85,
      label: "Allianz Comprehensive",
      excluded_make_ids: null,
      is_active: true,
    },
    {
      company_id: get("Gulf Union"),
      policy_type: "private",
      fuel_type: "gasoline",
      car_condition: "used",
      chinese_tier: "haval_jac_gac",
      price_min: 80000,
      price_max: 2000000,
      age_min_years: 0,
      age_max_years: 7,
      max_car_age_years: null,
      electric_agency_status: null,
      rate_percentage: 2.95,
      label: "Gulf Union Chinese-Tier Haval/JAC",
      excluded_make_ids: null,
      is_active: true,
    },
    {
      company_id: get("Salama"),
      policy_type: "private",
      fuel_type: "gasoline",
      car_condition: null,
      chinese_tier: "non_chinese",
      price_min: 50000,
      price_max: 2000000,
      age_min_years: 0,
      age_max_years: 10,
      max_car_age_years: null,
      electric_agency_status: null,
      rate_percentage: 2.4,
      label: "Salama Economy",
      is_active: true,
    },
  ].filter((r) => r.company_id); // guard against missing companies

  await insertRules(rules);
}

main().catch(console.error);

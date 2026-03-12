import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Using anon key for simple seed if RLS is disabled, or service role if needed
// Assuming for demo RLS is disabled or anon can insert.

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Seeding companies...");
  const { data: companies, error: cErr } = await supabase
    .from("insurance_companies")
    .insert([
      { name: "MADA Insurance", is_active: true },
      { name: "Bupa Arabia", is_active: true },
      { name: "Tawuniya", is_active: true },
    ])
    .select();

  if (cErr) console.error("Companies Error:", cErr);

  console.log("Seeding makes and models...");
  const { data: makes, error: mErr } = await supabase
    .from("car_makes")
    .insert([
      { name: "BMW", is_chinese: false, chinese_tier: "non_chinese" },
      { name: "Mercedes-Benz", is_chinese: false, chinese_tier: "non_chinese" },
      { name: "BYD", is_chinese: true, chinese_tier: "byd" },
    ])
    .select();

  if (mErr) console.error("Makes Error:", mErr);

  if (makes && makes.length > 0) {
    const bmwId = makes.find((m) => m.name === "BMW")?.id;
    const mbId = makes.find((m) => m.name === "Mercedes-Benz")?.id;
    const bydId = makes.find((m) => m.name === "BYD")?.id;

    const modelsToInsert = [];
    if (bmwId)
      modelsToInsert.push(
        { make_id: bmwId, name: "X5" },
        { make_id: bmwId, name: "3 Series" },
      );
    if (mbId)
      modelsToInsert.push(
        { make_id: mbId, name: "C-Class" },
        { make_id: mbId, name: "GLE" },
      );
    if (bydId)
      modelsToInsert.push(
        { make_id: bydId, name: "Seal" },
        { make_id: bydId, name: "Atto 3" },
      );

    const { error: modErr } = await supabase
      .from("car_models")
      .insert(modelsToInsert);
    if (modErr) console.error("Models Error:", modErr);
  }

  if (companies && companies.length > 0) {
    console.log("Seeding Quote Rules...");
    const mada = companies.find((c) => c.name.includes("MADA"))?.id;
    const bupa = companies.find((c) => c.name.includes("Bupa"))?.id;

    const rulesBase = [
      {
        company_id: mada,
        policy_type: "private",
        fuel_type: "gasoline",
        car_condition: "used",
        chinese_tier: "non_chinese",
        price_min: 500000,
        price_max: 5000000,
        age_min_years: 0,
        age_max_years: 10,
        rate_percentage: 2.75,
        label: "MADA Standard Gasoline Used",
        is_active: true,
      },
      {
        company_id: bupa,
        policy_type: "gold",
        fuel_type: "gasoline",
        car_condition: "used",
        chinese_tier: "non_chinese",
        price_min: 1000000,
        price_max: null,
        age_min_years: 0,
        age_max_years: 5,
        rate_percentage: 3.1,
        label: "Bupa Gold Premium",
        is_active: true,
      },
    ];

    const { error: rErr } = await supabase
      .from("quote_rules")
      .insert(rulesBase as any);
    if (rErr) console.error("Rules Error:", rErr);
  }

  console.log("Seeding complete!");
}

seed();

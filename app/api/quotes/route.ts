import { createServerClient } from "@/lib/supabase/server";
import { calculateQuotes } from "@/lib/quote-engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      makeId,
      carValue,
      fuelType,
      carCondition,
      manufacturingYear,
      electricAgencyStatus,
    } = body;

    const supabase = await createServerClient();

    // Fetch car make info
    const { data: make, error: makeError } = await supabase
      .from("car_makes")
      .select("*")
      .eq("id", makeId)
      .single();

    if (makeError || !make) {
      return Response.json({ error: "Car make not found" }, { status: 404 });
    }

    // Fetch all active quote rules with company info
    const { data: rules, error: rulesError } = await supabase
      .from("quote_rules")
      .select(
        `
        *,
        insurance_companies (
          id, name
        )
      `,
      )
      .eq("is_active", true);

    if (rulesError || !rules) {
      return Response.json({ error: "Failed to fetch rules" }, { status: 500 });
    }

    // Normalize rules to QuoteRule[]
    // NextSupabase returns joined tables as an object or array of objects.
    // In our case it is a single object linked by company_id
    const normalizedRules = rules.map((r) => ({
      id: r.id,
      companyId: r.insurance_companies.id,
      companyName: r.insurance_companies.name,
      policyType: r.policy_type,
      fuelType: r.fuel_type,
      carCondition: r.car_condition,
      chineseTier: r.chinese_tier,
      priceMin: r.price_min,
      priceMax: r.price_max,
      ageMinYears: r.age_min_years ?? 0,
      ageMaxYears: r.age_max_years,
      maxCarAgeYears: r.max_car_age_years,
      electricAgencyStatus: r.electric_agency_status,
      ratePercentage: r.rate_percentage,
      conditions: r.conditions ?? [],
      conditionsEn: r.conditions_en ?? [],
      label: r.label,
      applicableMakeIds: r.applicable_make_ids,
      excludedMakeIds: r.excluded_make_ids,
    }));

    const carInput = {
      makeId,
      makeName: make.name,
      isChinese: make.is_chinese,
      chineseTier: make.chinese_tier,
      carValue,
      fuelType,
      carCondition,
      manufacturingYear,
      electricAgencyStatus,
    };

    const quotes = calculateQuotes(carInput, normalizedRules);

    return Response.json({
      quotes,
      carAge: new Date().getFullYear() - manufacturingYear,
      meta: {
        totalRulesEvaluated: normalizedRules.length,
        eligibleCount: quotes.length,
      },
    });
  } catch (error) {
    console.error("Quotes API Error:", error);
    return Response.json(
      { error: "Internal server error calculating quotes" },
      { status: 500 },
    );
  }
}

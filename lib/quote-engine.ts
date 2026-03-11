export type FuelType = "gasoline" | "electric" | "any";
export type CarCondition = "new" | "used" | "any";
export type CarOrigin = "non_chinese" | "chinese" | "any";
export type PolicyType = string;
export type ElectricAgencyStatus = "agency" | "no_agency";

export interface CarInput {
  makeId: string;
  makeName: string;
  isChinese: boolean;
  carValue: number; // EGP
  fuelType: FuelType;
  carCondition: CarCondition;
  manufacturingYear: number;
  electricAgencyStatus?: ElectricAgencyStatus;
}

export interface QuoteRule {
  id: string;
  companyId: string;
  companyName: string;
  companyNameAr: string;
  policyType: PolicyType;
  fuelType: FuelType;
  carCondition: CarCondition | null; // null represents "any" for legacy data compatibility
  chineseTier: CarOrigin | string; // mapped from DB, string for backwards compatibility
  priceMin: number;
  priceMax: number | null;
  ageMinYears: number;
  ageMaxYears: number | null;
  maxCarAgeYears: number | null;
  electricAgencyStatus: ElectricAgencyStatus | null;
  ratePercentage: number;
  conditions: string[];
  conditionsEn: string[];
  label?: string;
  applicableMakeIds?: string[]; // newly added restriction for GIG
  excludedMakeIds?: string[]; // newly added exclusion list
  is_active?: boolean;
}

export interface QuoteResult {
  ruleId: string;
  companyId: string;
  companyName: string;
  companyNameAr: string;
  policyType: PolicyType;
  label?: string;
  ratePercentage: number;
  annualPremium: number;
  conditions: string[];
  conditionsEn: string[];
  isEligible: true;
}

export interface IneligibleResult {
  ruleId: string;
  companyName: string;
  isEligible: false;
  reason: string;
}

export function getCarAge(manufacturingYear: number): number {
  return new Date().getFullYear() - manufacturingYear;
}

export function formatEGP(amount: number): string {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateQuotes(
  car: CarInput,
  rules: QuoteRule[],
): QuoteResult[] {
  const carAge = getCarAge(car.manufacturingYear);
  const eligible: QuoteResult[] = [];

  for (const rule of rules) {
    const result = evaluateRule(car, carAge, rule);
    if (result.isEligible) eligible.push(result);
  }

  return eligible.sort((a, b) => a.annualPremium - b.annualPremium);
}

function evaluateRule(
  car: CarInput,
  carAge: number,
  rule: QuoteRule,
): QuoteResult | IneligibleResult {
  const ineligible = (reason: string): IneligibleResult => ({
    ruleId: rule.id,
    companyName: rule.companyName,
    isEligible: false,
    reason,
  });

  // 1. Fuel type
  if (
    rule.fuelType &&
    rule.fuelType !== "any" &&
    rule.fuelType !== car.fuelType
  )
    return ineligible("Fuel type mismatch");

  // 2. Price range
  if (car.carValue < rule.priceMin) return ineligible("Below minimum price");
  if (rule.priceMax !== null && car.carValue > rule.priceMax)
    return ineligible("Above maximum price");

  // 3. Hard max car age cutoff
  if (rule.maxCarAgeYears !== null && carAge > rule.maxCarAgeYears)
    return ineligible(
      `Car exceeds ${rule.maxCarAgeYears} year maximum age for this company`,
    );

  // 4. Rule age range
  if (carAge < rule.ageMinYears) return ineligible("Car too new for this rule");
  if (rule.ageMaxYears !== null && carAge > rule.ageMaxYears)
    return ineligible("Car too old for this rule");

  // 5. Car Origin (simplified from DB chinese_tier)
  if (rule.chineseTier === "non_chinese") {
    if (car.isChinese)
      return ineligible("Rule applies to non-Chinese brands only");
  } else if (rule.chineseTier === "any") {
    // any matches both chinese and non-chinese
  } else if (rule.chineseTier && rule.chineseTier !== "non_chinese") {
    // Treat legacy tiers or "chinese" as Chinese Only
    if (!car.isChinese) return ineligible("Rule applies to Chinese brand only");
  }

  // 6. Electric agency status
  if (car.fuelType === "electric" && rule.electricAgencyStatus) {
    if (rule.electricAgencyStatus !== car.electricAgencyStatus)
      return ineligible("Electric dealership status mismatch");
  }

  // 7. Car condition (if rule restricts it)
  const ruleCondition = rule.carCondition || "any";
  if (ruleCondition !== "any" && ruleCondition !== car.carCondition)
    return ineligible(`Rule applies to ${ruleCondition} cars only`);

  // 8. Specific make exclusions
  if (rule.excludedMakeIds && rule.excludedMakeIds.length > 0) {
    if (rule.excludedMakeIds.includes(car.makeId)) {
      return ineligible("This brand is excluded from this policy");
    }
  }

  // 9. Specific make restrictions (e.g. GIG Gold Opel/Mg/Chevrolet)
  if (rule.applicableMakeIds && rule.applicableMakeIds.length > 0) {
    if (!rule.applicableMakeIds.includes(car.makeId)) {
      return ineligible("Rule is restricted to specific car makes");
    }
  }

  const annualPremium = Math.round((car.carValue * rule.ratePercentage) / 100);

  return {
    ruleId: rule.id,
    companyId: rule.companyId,
    companyName: rule.companyName,
    companyNameAr: rule.companyNameAr,
    policyType: rule.policyType,
    label: rule.label,
    ratePercentage: rule.ratePercentage,
    annualPremium,
    conditions: rule.conditions,
    conditionsEn: rule.conditionsEn,
    isEligible: true,
  };
}

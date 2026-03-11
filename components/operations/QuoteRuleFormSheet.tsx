"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2, Plus, Minus } from "lucide-react";
import type { QuoteRule } from "@/lib/quote-engine";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCarMakes } from "@/hooks/useCarMakes";

const FormattedNumberInput = ({
  value,
  onChange,
  placeholder,
  className,
  isDecimal = false,
  required = false,
}: {
  value: number | null | undefined;
  onChange: (val: number | null) => void;
  placeholder?: string;
  className?: string;
  isDecimal?: boolean;
  required?: boolean;
}) => {
  const [displayValue, setDisplayValue] = useState(
    value !== null && value !== undefined
      ? value.toLocaleString("en-US", { maximumFractionDigits: 4 })
      : "",
  );

  return (
    <Input
      type="text"
      required={required}
      value={displayValue}
      onChange={(e) => {
        let val = e.target.value.replace(/,/g, "");
        if (isDecimal) {
          val = val.replace(/[^0-9.]/g, "");
          const parts = val.split(".");
          if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");

          // Format the integer part with commas
          const [intPart, decPart] = val.split(".");
          if (intPart) {
            val =
              parseInt(intPart, 10).toLocaleString("en-US") +
              (decPart !== undefined ? "." + decPart : "");
          }
        } else {
          val = val.replace(/[^0-9]/g, "");
          if (val) {
            val = parseInt(val, 10).toLocaleString("en-US");
          }
        }
        setDisplayValue(val);
        const rawNum = parseFloat(val.replace(/,/g, ""));
        if (val === "") {
          onChange(null);
        } else if (!isNaN(rawNum) && rawNum >= 0) {
          onChange(rawNum);
        }
      }}
      onBlur={() => {
        const rawNum = parseFloat(displayValue.replace(/,/g, ""));
        if (!isNaN(rawNum) && rawNum >= 0) {
          setDisplayValue(
            rawNum.toLocaleString("en-US", { maximumFractionDigits: 4 }),
          );
          onChange(rawNum);
        } else {
          setDisplayValue("");
          onChange(null);
        }
      }}
      placeholder={placeholder}
      className={className}
    />
  );
};

type QuoteRuleFormProps = {
  rule?: QuoteRule;
  companies: { id: string; name: string }[];
  onClose: () => void;
  onSuccess: () => void;
};

export function QuoteRuleFormSheet({
  rule,
  companies,
  onClose,
  onSuccess,
}: QuoteRuleFormProps) {
  const makesAnchor = useComboboxAnchor();
  const excludedMakesAnchor = useComboboxAnchor();
  const { makes, isLoading: isLoadingMakes } = useCarMakes();
  const [formData, setFormData] = useState<Partial<QuoteRule>>({
    companyId: rule?.companyId || (companies.length > 0 ? companies[0].id : ""),
    policyType: rule?.policyType || "any",
    fuelType: rule?.fuelType || "any",
    carCondition: rule?.carCondition || "any",
    chineseTier: rule?.chineseTier || "any",
    priceMin: rule?.priceMin || 10000,
    priceMax: rule?.priceMax || null,
    ageMinYears: rule?.ageMinYears || 0,
    ageMaxYears: rule?.ageMaxYears || null,
    maxCarAgeYears: rule?.maxCarAgeYears || null,
    electricAgencyStatus: rule?.electricAgencyStatus || null,
    ratePercentage: rule?.ratePercentage || 2.5,
    conditions: rule?.conditions || [],
    applicableMakeIds: rule?.applicableMakeIds || [],
    excludedMakeIds: rule?.excludedMakeIds || [],
    label: rule?.label || "",
    is_active: rule ? (rule as any).is_active : true, // Type escape
  } as any);

  const [specifyPolicyType, setSpecifyPolicyType] = useState(
    rule ? !!rule.policyType && rule.policyType !== "any" : false,
  );
  const [enableFuelType, setEnableFuelType] = useState(
    rule ? rule.fuelType !== "any" : false,
  );
  const [enableCondition, setEnableCondition] = useState(
    rule ? !!rule.carCondition && rule.carCondition !== "any" : false,
  );
  const [enableMakes, setEnableMakes] = useState(
    rule
      ? !!rule.applicableMakeIds && rule.applicableMakeIds.length > 0
      : false,
  );
  const [enableExcludedMakes, setEnableExcludedMakes] = useState(
    rule
      ? !!rule.excludedMakeIds && rule.excludedMakeIds.length > 0
      : false,
  );
  const [enablePriceMin, setEnablePriceMin] = useState(
    rule ? !!rule.priceMin : false,
  );
  const [enablePriceMax, setEnablePriceMax] = useState(
    rule ? rule.priceMax !== null && rule.priceMax !== undefined : false,
  );
  const [enableAgeMin, setEnableAgeMin] = useState(
    rule ? !!rule.ageMinYears : false,
  );
  const [enableAgeMax, setEnableAgeMax] = useState(
    rule ? rule.ageMaxYears !== null && rule.ageMaxYears !== undefined : false,
  );
  const [enableCutoff, setEnableCutoff] = useState(
    rule
      ? rule.maxCarAgeYears !== null && rule.maxCarAgeYears !== undefined
      : false,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof QuoteRule | "is_active", value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConditionChange = (idx: number, value: string) => {
    const newConditions = [...(formData.conditions || [])];
    newConditions[idx] = value;
    updateField("conditions", newConditions);
  };

  const addCondition = () => {
    updateField("conditions", [...(formData.conditions || []), ""]);
  };

  const removeCondition = (idx: number) => {
    const newConditions = [...(formData.conditions || [])];
    newConditions.splice(idx, 1);
    updateField("conditions", newConditions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const supabase = createClient();

    // Convert to DB payload format (snake_case mappings)
    const payload = {
      company_id: formData.companyId,
      policy_type: specifyPolicyType ? formData.policyType : "any",
      fuel_type: enableFuelType ? formData.fuelType : "any",
      car_condition: enableCondition ? formData.carCondition : null,
      chinese_tier: "any",
      price_min: enablePriceMin ? formData.priceMin || 0 : 0,
      price_max: enablePriceMax ? formData.priceMax : null,
      age_min_years: enableAgeMin ? formData.ageMinYears || 0 : 0,
      age_max_years: enableAgeMax ? formData.ageMaxYears : null,
      max_car_age_years: enableCutoff ? formData.maxCarAgeYears : null,
      electric_agency_status:
        enableFuelType && formData.fuelType === "electric"
          ? formData.electricAgencyStatus
          : null,
      rate_percentage: formData.ratePercentage,
      conditions: formData.conditions,
      label: formData.label,
      applicable_make_ids:
        enableMakes && formData.applicableMakeIds?.length
          ? formData.applicableMakeIds
          : null,
      excluded_make_ids:
        enableExcludedMakes && formData.excludedMakeIds?.length
          ? formData.excludedMakeIds
          : null,
      is_active: (formData as any).is_active,
    };

    if (rule) {
      await supabase.from("quote_rules").update(payload).eq("id", rule.id);
    } else {
      await supabase.from("quote_rules").insert(payload);
    }

    setIsSubmitting(false);
    onSuccess();
  };

  const currentPremiumExample = Math.round(
    (1000000 * (formData.ratePercentage || 0)) / 100,
  );

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-[95vw] sm:max-w-4xl lg:max-w-5xl h-full bg-slate-900 border-l border-slate-700 p-0 rounded-none flex flex-col pt-safe"
      >
        {/* Header */}
        <SheetHeader className="flex flex-row items-center justify-between p-6 border-b border-slate-800 bg-slate-900/80 shrink-0 text-left">
          <div>
            <SheetTitle className="text-xl font-syne font-semibold text-white">
              {rule ? "Edit Pricing Rule" : "Create Pricing Rule"}
            </SheetTitle>
            <p className="text-sm text-slate-400 mt-1">
              {rule
                ? "Modify the rules for quotes."
                : "Add a new pricing engine rule."}
            </p>
          </div>
        </SheetHeader>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form
            id="rule-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-8"
          >
            {/* Sec 1: Company & Policy */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-400 border-b border-slate-800 pb-2">
                1. Company & Policy
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400">
                    Insurance Company
                  </label>
                  <Combobox
                    items={companies}
                    itemToStringLabel={(item: any) => (item ? item.name : "")}
                    value={
                      companies.find((c) => c.id === formData.companyId) || null
                    }
                    onValueChange={(val: any) => {
                      updateField("companyId", val ? val.id : null);
                    }}
                  >
                    <ComboboxInput
                      placeholder="Select company..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg h-[38px] text-sm text-white focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none"
                    />
                    <ComboboxContent className="border-slate-800 bg-slate-900 text-white z-100">
                      <ComboboxEmpty>No companies found</ComboboxEmpty>
                      <ComboboxList>
                        {(c: any) => (
                          <ComboboxItem
                            key={c.id}
                            value={c}
                            className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                          >
                            {c.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
                <div className="col-span-2 flex flex-col gap-3 mt-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="specify-policy"
                      checked={specifyPolicyType}
                      onCheckedChange={(checked) => {
                        setSpecifyPolicyType(!!checked);
                        if (!checked) updateField("policyType", "any");
                        if (checked && formData.policyType === "any")
                          updateField("policyType", "");
                      }}
                    />
                    <label
                      htmlFor="specify-policy"
                      className="text-sm font-medium text-slate-300 cursor-pointer select-none"
                    >
                      Specify Policy Type
                    </label>
                  </div>

                  {specifyPolicyType && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                        Policy Name
                      </label>
                      <Input
                        type="text"
                        value={
                          formData.policyType === "any"
                            ? ""
                            : formData.policyType
                        }
                        onChange={(e) =>
                          updateField("policyType", e.target.value)
                        }
                        placeholder="e.g. Gold, Private, Platinum"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg h-[38px] text-sm text-white focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none"
                        required
                        maxLength={60}
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Sec 2: Vehicle Criteria */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-400 border-b border-slate-800 pb-2">
                2. Vehicle Matching Criteria
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-400">
                      Fuel Type
                    </label>
                    <Switch
                      checked={enableFuelType}
                      onCheckedChange={setEnableFuelType}
                    />
                  </div>
                  {enableFuelType ? (
                    <Select
                      value={formData.fuelType || "any"}
                      onValueChange={(val: string) =>
                        updateField("fuelType", val)
                      }
                    >
                      <SelectTrigger className="w-full bg-slate-950 border border-slate-700 rounded-lg h-[38px] text-sm text-white focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none data-placeholder:text-slate-400">
                        <SelectValue placeholder="Any Fuel" />
                      </SelectTrigger>
                      <SelectContent className="border-slate-800 bg-slate-900 text-white z-60">
                        <SelectItem
                          value="any"
                          className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer text-teal-400"
                        >
                          Any Fuel Type
                        </SelectItem>
                        <SelectItem
                          value="gasoline"
                          className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                        >
                          Gasoline
                        </SelectItem>
                        <SelectItem
                          value="electric"
                          className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                        >
                          Electric
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="w-full bg-slate-950/50 border border-slate-800 rounded-lg h-[38px] flex items-center px-3 text-sm text-slate-600 italic cursor-not-allowed">
                      Any Fuel
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-400">
                      Car Condition
                    </label>
                    <Switch
                      checked={enableCondition}
                      onCheckedChange={setEnableCondition}
                    />
                  </div>
                  {enableCondition ? (
                    <Select
                      value={formData.carCondition || "any"}
                      onValueChange={(val: string) =>
                        updateField("carCondition", val)
                      }
                    >
                      <SelectTrigger className="w-full bg-slate-950 border border-slate-700 rounded-lg h-[38px] text-sm text-white focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none data-placeholder:text-slate-400">
                        <SelectValue placeholder="Any Condition" />
                      </SelectTrigger>
                      <SelectContent className="border-slate-800 bg-slate-900 text-white z-60">
                        <SelectItem
                          value="any"
                          className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer text-teal-400"
                        >
                          Any Condition
                        </SelectItem>
                        <SelectItem
                          value="new"
                          className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                        >
                          Zero Mileage (New)
                        </SelectItem>
                        <SelectItem
                          value="used"
                          className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                        >
                          Used
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="w-full bg-slate-950/50 border border-slate-800 rounded-lg h-[38px] flex items-center px-3 text-sm text-slate-600 italic cursor-not-allowed">
                      Any Condition
                    </div>
                  )}
                </div>

                <div className="col-span-2 flex flex-col gap-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-400">
                      Car Make
                    </label>
                    <Switch
                      checked={enableMakes}
                      onCheckedChange={setEnableMakes}
                    />
                  </div>
                  {enableMakes ? (
                    <>
                      <Combobox
                        multiple
                        items={makes}
                        itemToStringLabel={(item: any) =>
                          item ? item.name : ""
                        }
                        value={(formData.applicableMakeIds || [])
                          .map((id) => makes.find((m) => m.id === id))
                          .filter(Boolean)}
                        onValueChange={(selectedItems: any[]) => {
                          updateField(
                            "applicableMakeIds",
                            selectedItems.map((m) => m.id),
                          );
                        }}
                      >
                        <ComboboxChips 
                          ref={makesAnchor} 
                          className="w-full min-h-[38px] bg-slate-950 border-slate-700 rounded-lg text-sm text-white focus-within:ring-1 focus-within:ring-teal-500 focus-within:border-teal-500"
                        >
                          <ComboboxValue>
                            {(values: any[]) => (
                              <React.Fragment>
                                {(!values || values.length === 0) && (
                                  <Badge
                                    variant="outline"
                                    className="bg-slate-800/50 text-slate-400 border-slate-700 pointer-events-none mr-2 font-normal"
                                  >
                                    All Brands
                                  </Badge>
                                )}
                                {values.map((value: any) => (
                                  <ComboboxChip 
                                    key={value.id} 
                                    className="bg-teal-500/10 text-teal-400 border border-teal-500/20"
                                  >
                                    {value.name}
                                  </ComboboxChip>
                                ))}
                                <ComboboxChipsInput 
                                  placeholder={(!values || values.length === 0) ? "Search and add makes..." : ""}
                                  className="placeholder:text-slate-400 bg-transparent text-white w-full" 
                                />
                              </React.Fragment>
                            )}
                          </ComboboxValue>
                        </ComboboxChips>
                        <ComboboxContent 
                          anchor={makesAnchor} 
                          className="border-slate-800 bg-slate-900 text-white z-100"
                        >
                          <ComboboxEmpty>No makes found</ComboboxEmpty>
                          <ComboboxList>
                            {(m: any) => (
                              <ComboboxItem
                                key={m.id}
                                value={m}
                                className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                              >
                                {m.name}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </>
                  ) : (
                    <div className="w-full bg-slate-950/50 border border-slate-800 rounded-lg h-[38px] flex items-center px-3 text-sm text-slate-600 italic cursor-not-allowed">
                      All Brands
                    </div>
                  )}
                </div>

                <div className="col-span-2 flex flex-col gap-1.5 animate-in fade-in mt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-red-400">
                      Excluded Car Makes (Blacklist)
                    </label>
                    <Switch
                      checked={enableExcludedMakes}
                      onCheckedChange={setEnableExcludedMakes}
                      className="data-[state=checked]:bg-red-500"
                    />
                  </div>
                  {enableExcludedMakes ? (
                    <>
                      <Combobox
                        multiple
                        items={makes}
                        itemToStringLabel={(item: any) =>
                          item ? item.name : ""
                        }
                        value={(formData.excludedMakeIds || [])
                          .map((id) => makes.find((m) => m.id === id))
                          .filter(Boolean)}
                        onValueChange={(selectedItems: any[]) => {
                          updateField(
                            "excludedMakeIds",
                            selectedItems.map((m) => m.id),
                          );
                        }}
                      >
                        <ComboboxChips 
                          ref={excludedMakesAnchor} 
                          className="w-full min-h-[38px] bg-slate-950 border-red-500/30 rounded-lg text-sm text-white focus-within:ring-1 focus-within:ring-red-500/50 focus-within:border-red-500/50"
                        >
                          <ComboboxValue>
                            {(values: any[]) => (
                              <React.Fragment>
                                {(!values || values.length === 0) && (
                                  <Badge
                                    variant="outline"
                                    className="bg-slate-800/50 text-slate-400 border-slate-700 pointer-events-none mr-2 font-normal"
                                  >
                                    None (No Brands Excluded)
                                  </Badge>
                                )}
                                {values.map((value: any) => (
                                  <ComboboxChip 
                                    key={value.id} 
                                    className="bg-red-500/10 text-red-400 border border-red-500/20"
                                  >
                                    {value.name}
                                  </ComboboxChip>
                                ))}
                                <ComboboxChipsInput 
                                  placeholder={(!values || values.length === 0) ? "Search makes to exclude..." : ""}
                                  className="placeholder:text-slate-400 bg-transparent text-white w-full" 
                                />
                              </React.Fragment>
                            )}
                          </ComboboxValue>
                        </ComboboxChips>
                        <ComboboxContent 
                          anchor={excludedMakesAnchor} 
                          className="border-slate-800 bg-slate-900 text-white z-100"
                        >
                          <ComboboxEmpty>No makes found</ComboboxEmpty>
                          <ComboboxList>
                            {(m: any) => (
                              <ComboboxItem
                                key={m.id}
                                value={m}
                                className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                              >
                                {m.name}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </>
                  ) : (
                    <div className="w-full bg-slate-950/50 border border-slate-800 rounded-lg h-[38px] flex items-center px-3 text-sm text-slate-600 italic cursor-not-allowed">
                      None (No Brands Excluded)
                    </div>
                  )}
                </div>

                {formData.fuelType === "electric" && (
                  <div className="col-span-2 flex flex-col gap-1.5 animate-in fade-in bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                    <label className="text-xs font-medium text-amber-500">
                      Electric Agency Requirement
                    </label>
                    <Select
                      value={formData.electricAgencyStatus || "none"}
                      onValueChange={(val: string) =>
                        updateField(
                          "electricAgencyStatus",
                          val === "none" ? null : val,
                        )
                      }
                    >
                      <SelectTrigger className="w-full bg-slate-900 border border-amber-500/30 rounded-lg h-[38px] text-sm text-white focus-visible:ring-1 focus-visible:ring-amber-500 focus-visible:outline-none data-placeholder:text-amber-500/50">
                        <SelectValue placeholder="Any (Applies to all Electric)" />
                      </SelectTrigger>
                      <SelectContent className="border-amber-500/30 bg-slate-900 text-white z-60">
                        <SelectItem
                          value="none"
                          className="hover:bg-slate-800 text-amber-500 focus:bg-slate-800 cursor-pointer"
                        >
                          Any
                        </SelectItem>
                        <SelectItem
                          value="agency"
                          className="hover:bg-slate-800 text-amber-500 focus:bg-slate-800 cursor-pointer"
                        >
                          Must have Official Agency
                        </SelectItem>
                        <SelectItem
                          value="no_agency"
                          className="hover:bg-slate-800 text-amber-500 focus:bg-slate-800 cursor-pointer"
                        >
                          No Official Agency
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </section>

            {/* Sec 3: Price & Age */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-400 border-b border-slate-800 pb-2">
                3. Limits (Price & Age)
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-400">
                      Min Price (EGP)
                    </label>
                    <Switch
                      checked={enablePriceMin}
                      onCheckedChange={setEnablePriceMin}
                    />
                  </div>
                  {enablePriceMin ? (
                    <FormattedNumberInput
                      required
                      value={formData.priceMin}
                      onChange={(val) => updateField("priceMin", val || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg h-[38px] text-sm text-white font-ibm-mono focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none"
                    />
                  ) : (
                    <div className="w-full bg-slate-950/50 border border-slate-800 rounded-lg h-[38px] flex items-center px-3 text-sm text-slate-600 italic cursor-not-allowed">
                      No Minimum
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-400">
                      Max Price (Leave empty for none)
                    </label>
                    <Switch
                      checked={enablePriceMax}
                      onCheckedChange={setEnablePriceMax}
                    />
                  </div>
                  {enablePriceMax ? (
                    <FormattedNumberInput
                      value={formData.priceMax}
                      onChange={(val) => updateField("priceMax", val)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg h-[38px] text-sm text-white font-ibm-mono focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none"
                      placeholder="Unlimited"
                    />
                  ) : (
                    <div className="w-full bg-slate-950/50 border border-slate-800 rounded-lg h-[38px] flex items-center px-3 text-sm text-slate-600 italic cursor-not-allowed">
                      Unlimited
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-400">
                      Min Vehicle Age (Years)
                    </label>
                    <Switch
                      checked={enableAgeMin}
                      onCheckedChange={setEnableAgeMin}
                    />
                  </div>
                  {enableAgeMin ? (
                    <FormattedNumberInput
                      required
                      value={formData.ageMinYears}
                      onChange={(val) => updateField("ageMinYears", val || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg h-[38px] text-sm text-white font-ibm-mono focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none"
                    />
                  ) : (
                    <div className="w-full bg-slate-950/50 border border-slate-800 rounded-lg h-[38px] flex items-center px-3 text-sm text-slate-600 italic cursor-not-allowed">
                      0 Years (New)
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-400">
                      Max Vehicle Age (Applies to Rule)
                    </label>
                    <Switch
                      checked={enableAgeMax}
                      onCheckedChange={setEnableAgeMax}
                    />
                  </div>
                  {enableAgeMax ? (
                    <FormattedNumberInput
                      value={formData.ageMaxYears}
                      onChange={(val) => updateField("ageMaxYears", val)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg h-[38px] text-sm text-white font-ibm-mono focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none"
                      placeholder="Unlimited"
                    />
                  ) : (
                    <div className="w-full bg-slate-950/50 border border-slate-800 rounded-lg h-[38px] flex items-center px-3 text-sm text-slate-600 italic cursor-not-allowed">
                      Unlimited
                    </div>
                  )}
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-xs font-medium text-red-400"
                      title="This completely disqualifies any car older than this age from ANY rule within this company."
                    >
                      Hard Company Cutoff Age{" "}
                      <span className="text-slate-500 font-normal">
                        (Disqualifies old cars globally for this company)
                      </span>
                    </label>
                    <Switch
                      checked={enableCutoff}
                      onCheckedChange={setEnableCutoff}
                    />
                  </div>
                  {enableCutoff ? (
                    <FormattedNumberInput
                      value={formData.maxCarAgeYears}
                      onChange={(val) => updateField("maxCarAgeYears", val)}
                      className="w-full bg-slate-950 border border-red-500/30 rounded-lg h-[38px] text-sm text-white font-ibm-mono focus-visible:ring-1 focus-visible:ring-red-500/50 focus-visible:border-red-500/50"
                      placeholder="None"
                    />
                  ) : (
                    <div className="w-full bg-slate-950/50 border border-slate-800 rounded-lg h-[38px] flex items-center px-3 text-sm text-slate-600 italic cursor-not-allowed">
                      None
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Sec 4: Rating */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-400 border-b border-slate-800 pb-2">
                4. Calculation & Rating
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-400">
                  Rate Percentage (%)
                </label>
                <FormattedNumberInput
                  isDecimal
                  required
                  value={formData.ratePercentage}
                  onChange={(val) => updateField("ratePercentage", val || 0)}
                  className="w-full max-w-xs bg-slate-950 border border-teal-500/50 rounded-lg h-[46px] text-lg text-teal-400 font-ibm-mono focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none"
                />
              </div>

              <div className="bg-teal-500/10 border border-teal-500/20 p-4 rounded-lg flex items-center justify-between">
                <span className="text-sm text-teal-400 font-medium">
                  Example Calculation (1,000,000 EGP)
                </span>
                <span className="text-xl font-bold font-ibm-mono text-white">
                  EGP {currentPremiumExample.toLocaleString()}
                </span>
              </div>
            </section>

            {/* Sec 5: Conditions */}
            <section className="space-y-4 mb-10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-400">
                  5. Arabic Conditions
                </h3>
                <button
                  type="button"
                  onClick={addCondition}
                  className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-white flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              <div className="space-y-3">
                {formData.conditions?.map((cond, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 animate-in fade-in slide-in-from-top-1"
                  >
                    <button
                      type="button"
                      onClick={() => removeCondition(idx)}
                      className="mt-1 p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 shrink-0"
                      aria-label={`Remove condition ${idx + 1}`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <textarea
                      value={cond}
                      onChange={(e) =>
                        handleConditionChange(idx, e.target.value)
                      }
                      placeholder="شرط بوليصة التأمين..."
                      dir="rtl"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-sans outline-none min-h-[60px] resize-y"
                    />
                  </div>
                ))}
                {formData.conditions?.length === 0 && (
                  <div className="text-center p-4 border border-dashed border-slate-700 rounded-lg text-slate-500 text-sm">
                    No conditions added.
                  </div>
                )}
              </div>
            </section>
          </form>
        </div>

        {/* Footer actions */}
        <SheetFooter className="flex-row p-4 border-t border-slate-800 bg-slate-900 shrink-0 gap-3">
          <label className="flex items-center gap-3 cursor-pointer flex-1 px-4 border border-slate-800 rounded-lg bg-slate-800/50 justify-center h-12">
            <span className="text-sm font-medium text-slate-300">
              Rule is Active
            </span>
            <Switch
              checked={(formData as any).is_active}
              onCheckedChange={(checked) => updateField("is_active", checked)}
              className="data-[state=checked]:bg-teal-500 data-[state=unchecked]:bg-slate-700"
            />
          </label>
          <div className="flex-1"></div>

          <button
            type="submit"
            form="rule-form"
            disabled={isSubmitting}
            className="flex-2 px-8 h-12 rounded-lg bg-teal-500 text-slate-950 font-bold flex items-center justify-center gap-2 hover:bg-teal-400 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Save Rule"
            )}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

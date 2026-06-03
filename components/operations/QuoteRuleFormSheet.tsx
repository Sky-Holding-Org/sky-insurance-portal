"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2, Plus, Minus } from "lucide-react";
import {
  type QuoteRule,
  parseConditionLink,
  serializeConditionLink,
  type ParsedConditionLink,
  type RuleAttachment,
} from "@/lib/quote-engine";
import { logAction } from "@/lib/audit-logger";
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
  disableCommas = false,
}: {
  value: number | null | undefined;
  onChange: (val: number | null) => void;
  placeholder?: string;
  className?: string;
  isDecimal?: boolean;
  required?: boolean;
  disableCommas?: boolean;
}) => {
  const [displayValue, setDisplayValue] = useState(
    value !== null && value !== undefined
      ? disableCommas
        ? value.toString()
        : value.toLocaleString("en-US", { maximumFractionDigits: 4 })
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
            val = disableCommas
              ? parseInt(val, 10).toString()
              : parseInt(val, 10).toLocaleString("en-US");
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
            disableCommas
              ? rawNum.toString()
              : rawNum.toLocaleString("en-US", { maximumFractionDigits: 4 }),
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
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState<
    Partial<
      QuoteRule & {
        minYear: number;
        maxYear: number | null;
        cutoffYear: number | null;
      }
    >
  >({
    companyId: rule?.companyId || (companies.length > 0 ? companies[0].id : ""),
    policyType: rule?.policyType || "any",
    fuelType: rule?.fuelType || "any",
    carCondition: rule?.carCondition || "any",
    chineseTier: rule?.chineseTier || "any",
    priceMin: rule?.priceMin || 10000,
    priceMax: rule?.priceMax || null,
    minYear:
      rule?.ageMinYears !== undefined
        ? currentYear - rule.ageMinYears
        : currentYear + 1,
    maxYear:
      rule?.ageMaxYears !== undefined && rule.ageMaxYears !== null
        ? currentYear - rule.ageMaxYears
        : null,
    cutoffYear:
      rule?.maxCarAgeYears !== undefined && rule.maxCarAgeYears !== null
        ? currentYear - rule.maxCarAgeYears
        : null,
    electricAgencyStatus: rule?.electricAgencyStatus || null,
    ratePercentage: rule?.ratePercentage || 2.5,
    conditions: rule?.conditions || [],
    conditionLinks: rule?.conditionLinks || [],
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
    rule ? !!rule.excludedMakeIds && rule.excludedMakeIds.length > 0 : false,
  );
  const [enablePriceMin, setEnablePriceMin] = useState(
    rule ? !!rule.priceMin : false,
  );
  const [enablePriceMax, setEnablePriceMax] = useState(
    rule ? rule.priceMax !== null && rule.priceMax !== undefined : false,
  );
  const [enableAgeMin, setEnableAgeMin] = useState(
    rule ? rule.ageMinYears !== undefined && rule.ageMinYears !== null : false,
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

  const [localLinks, setLocalLinks] = useState<ParsedConditionLink[]>(() => {
    return (rule?.conditionLinks || []).map(parseConditionLink);
  });

  const [localAttachments, setLocalAttachments] = useState<RuleAttachment[]>(() => {
    return rule?.attachments || [];
  });

  const [filesMap, setFilesMap] = useState<Record<string, File>>({});

  const retryUpload = (tempUid: string) => {
    const file = filesMap[tempUid];
    if (!file) return;

    setLocalAttachments((prev) =>
      prev.map((att) =>
        att.uid === tempUid
          ? {
              ...att,
              isUploading: true,
              error: undefined,
            }
          : att
      )
    );

    uploadFile(file, tempUid);
  };

  const uploadFile = async (file: File, tempUid: string) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/attachments/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setLocalAttachments((prev) =>
        prev.map((att) =>
          att.uid === tempUid
            ? {
                ...att,
                publicId: data.publicId,
                secureUrl: data.secureUrl,
                resourceType: data.resourceType,
                fileSize: data.fileSize,
                isUploading: false,
              }
            : att
        )
      );
    } catch (err: any) {
      console.error("Upload error:", err);
      setLocalAttachments((prev) =>
        prev.map((att) =>
          att.uid === tempUid
            ? {
                ...att,
                isUploading: false,
                error: err.message || "Upload failed",
              }
            : att
        )
      );
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".webp"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const newAttachments: RuleAttachment[] = [];
    const newFilesMap = { ...filesMap };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

      if (!validExtensions.includes(ext)) {
        alert(`File "${file.name}" has an unsupported format. Supported formats: PDF, Word, Excel, Images.`);
        continue;
      }
      if (file.size > maxSize) {
        alert(`File "${file.name}" exceeds the 10MB limit.`);
        continue;
      }

      const tempUid = Math.random().toString(36).substring(2, 9);
      const tempAttachment: RuleAttachment = {
        uid: tempUid,
        label: file.name.substring(0, file.name.lastIndexOf(".")),
        originalFileName: file.name,
        publicId: "",
        secureUrl: "",
        resourceType: "",
        fileSize: file.size,
        isUploading: true,
      } as any;

      newAttachments.push(tempAttachment);
      newFilesMap[tempUid] = file;
      uploadFile(file, tempUid);
    }

    setFilesMap(newFilesMap);
    setLocalAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const handleAttachmentLabelChange = (idx: number, value: string) => {
    const newAttachments = [...localAttachments];
    newAttachments[idx] = { ...newAttachments[idx], label: value };
    setLocalAttachments(newAttachments);
  };

  const removeAttachment = async (idx: number) => {
    const att = localAttachments[idx];

    if (att.publicId) {
      const confirmed = window.confirm(
        `Are you sure you want to permanently delete the attachment "${att.label || att.originalFileName}"? This will delete the file from Cloudinary.`
      );
      if (!confirmed) return;

      try {
        fetch("/api/attachments/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicId: att.publicId,
            resourceType: att.resourceType,
          }),
        });
      } catch (err) {
        console.error("Failed to delete attachment from Cloudinary:", err);
      }
    }

    const newAttachments = [...localAttachments];
    newAttachments.splice(idx, 1);
    setLocalAttachments(newAttachments);
  };

  const updateField = (
    field: keyof QuoteRule | "is_active" | "minYear" | "maxYear" | "cutoffYear",
    value: any,
  ) => {
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

  const handleConditionLinkChange = (
    idx: number,
    field: "label" | "url",
    value: string,
  ) => {
    const newLinks = [...localLinks];
    newLinks[idx] = { ...newLinks[idx], [field]: value };
    setLocalLinks(newLinks);
  };

  const addConditionLink = () => {
    setLocalLinks([...localLinks, { label: "", url: "" }]);
  };

  const removeConditionLink = (idx: number) => {
    const newLinks = [...localLinks];
    newLinks.splice(idx, 1);
    setLocalLinks(newLinks);
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
      age_min_years: enableAgeMin
        ? currentYear - (formData.minYear || currentYear + 1)
        : -1, // defaults to next year
      age_max_years:
        enableAgeMax && formData.maxYear
          ? currentYear - formData.maxYear
          : null,
      max_car_age_years:
        enableCutoff && formData.cutoffYear
          ? currentYear - formData.cutoffYear
          : null,
      electric_agency_status:
        enableFuelType && formData.fuelType === "electric"
          ? formData.electricAgencyStatus
          : null,
      rate_percentage: formData.ratePercentage,
      conditions: formData.conditions,
      condition_links: localLinks
        .filter((l) => l.url.trim() !== "")
        .map((l) => serializeConditionLink(l.label, l.url)),
      attachments: localAttachments
        .filter((att) => !att.isUploading && !att.error && att.secureUrl)
        .map((att) => ({
          uid: att.uid,
          label: att.label,
          originalFileName: att.originalFileName,
          publicId: att.publicId,
          secureUrl: att.secureUrl,
          resourceType: att.resourceType,
          fileSize: att.fileSize,
        })),
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

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || "";
    const userEmail = userData?.user?.email || "unknown@system";

    const companyName =
      companies.find((c) => c.id === formData.companyId)?.name ||
      "Unknown Company";

    if (rule) {
      await supabase.from("quote_rules").update(payload).eq("id", rule.id);
      logAction({
        userId,
        userEmail,
        action: "rule_updated",
        entityType: "quote_rule",
        entityId: rule.id,
        metadata: {
          companyName,
          ruleName: formData.label,
        },
      });
    } else {
      const { data: newRule } = await supabase
        .from("quote_rules")
        .insert(payload)
        .select("id")
        .single();

      if (newRule) {
        logAction({
          userId,
          userEmail,
          action: "rule_created",
          entityType: "quote_rule",
          entityId: newRule.id,
          metadata: {
            companyName,
            ruleName: formData.label,
          },
        });
      }
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
        className="w-[95vw] sm:max-w-4xl lg:max-w-5xl h-full bg-card border-l border-border p-0 rounded-none flex flex-col pt-safe"
      >
        {/* Header */}
        <SheetHeader className="flex flex-row items-center justify-between p-6 border-b border-border bg-card/80 shrink-0 text-left">
          <div>
            <SheetTitle className="text-xl font-syne font-semibold text-foreground">
              {rule ? "Edit Pricing Rule" : "Create Pricing Rule"}
            </SheetTitle>
            <p className="text-sm text-muted-foreground mt-1">
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
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground border-b border-border pb-2">
                1. Company & Policy
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
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
                      className="w-full bg-background border border-border rounded-lg h-[38px] text-sm text-foreground focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none"
                    />
                    <ComboboxContent className="border-border bg-card text-foreground z-100">
                      <ComboboxEmpty>No companies found</ComboboxEmpty>
                      <ComboboxList>
                        {(c: any) => (
                          <ComboboxItem
                            key={c.id}
                            value={c}
                            className="hover:bg-muted focus:bg-muted cursor-pointer"
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
                      className="text-sm font-medium text-foreground cursor-pointer select-none"
                    >
                      Specify Policy Type
                    </label>
                  </div>

                  {specifyPolicyType && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
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
                        className="w-full bg-background border border-border rounded-lg h-[38px] text-sm text-foreground focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none"
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
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground border-b border-border pb-2">
                2. Vehicle Matching Criteria
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">
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
                      <SelectTrigger className="w-full bg-background border border-border rounded-lg h-[38px] text-sm text-foreground focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none data-placeholder:text-muted-foreground">
                        <SelectValue placeholder="Any Fuel" />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card text-foreground z-60">
                        <SelectItem
                          value="any"
                          className="hover:bg-muted focus:bg-muted cursor-pointer text-foreground"
                        >
                          Any Fuel Type
                        </SelectItem>
                        <SelectItem
                          value="gasoline"
                          className="hover:bg-muted focus:bg-muted cursor-pointer"
                        >
                          Gasoline
                        </SelectItem>
                        <SelectItem
                          value="electric"
                          className="hover:bg-muted focus:bg-muted cursor-pointer"
                        >
                          Electric
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="w-full bg-background/50 border border-border rounded-lg h-[38px] flex items-center px-3 text-sm text-muted-foreground italic cursor-not-allowed">
                      Any Fuel
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">
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
                      <SelectTrigger className="w-full bg-background border border-border rounded-lg h-[38px] text-sm text-foreground focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none data-placeholder:text-muted-foreground">
                        <SelectValue placeholder="Any Condition" />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card text-foreground z-60">
                        <SelectItem
                          value="any"
                          className="hover:bg-muted focus:bg-muted cursor-pointer text-foreground"
                        >
                          Any Condition
                        </SelectItem>
                        <SelectItem
                          value="new"
                          className="hover:bg-muted focus:bg-muted cursor-pointer"
                        >
                          Zero Mileage (New)
                        </SelectItem>
                        <SelectItem
                          value="used"
                          className="hover:bg-muted focus:bg-muted cursor-pointer"
                        >
                          Used
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="w-full bg-background/50 border border-border rounded-lg h-[38px] flex items-center px-3 text-sm text-muted-foreground italic cursor-not-allowed">
                      Any Condition
                    </div>
                  )}
                </div>

                <div className="col-span-2 flex flex-col gap-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">
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
                          className="w-full min-h-[38px] bg-background border-border rounded-lg text-sm text-foreground focus-within:ring-1 focus-within:ring-teal-500 focus-within:border-teal-500"
                        >
                          <ComboboxValue>
                            {(values: any[]) => (
                              <React.Fragment>
                                {(!values || values.length === 0) && (
                                  <Badge
                                    variant="outline"
                                    className="bg-muted/50 text-muted-foreground border-border pointer-events-none mr-2 font-normal"
                                  >
                                    All Brands
                                  </Badge>
                                )}
                                {values.map((value: any) => (
                                  <ComboboxChip
                                    key={value.id}
                                    className="bg-teal-500/10 text-foreground border border-teal-500/20"
                                  >
                                    {value.name}
                                  </ComboboxChip>
                                ))}
                                <ComboboxChipsInput
                                  placeholder={
                                    !values || values.length === 0
                                      ? "Search and add makes..."
                                      : ""
                                  }
                                  className="placeholder:text-muted-foreground bg-transparent text-foreground w-full"
                                />
                              </React.Fragment>
                            )}
                          </ComboboxValue>
                        </ComboboxChips>
                        <ComboboxContent
                          anchor={makesAnchor}
                          className="border-border bg-card text-foreground z-100"
                        >
                          <ComboboxEmpty>No makes found</ComboboxEmpty>
                          <ComboboxList>
                            {(m: any) => (
                              <ComboboxItem
                                key={m.id}
                                value={m}
                                className="hover:bg-muted focus:bg-muted cursor-pointer"
                              >
                                {m.name}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </>
                  ) : (
                    <div className="w-full bg-background/50 border border-border rounded-lg h-[38px] flex items-center px-3 text-sm text-muted-foreground italic cursor-not-allowed">
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
                          className="w-full min-h-[38px] bg-background border-red-500/30 rounded-lg text-sm text-foreground focus-within:ring-1 focus-within:ring-red-500/50 focus-within:border-red-500/50"
                        >
                          <ComboboxValue>
                            {(values: any[]) => (
                              <React.Fragment>
                                {(!values || values.length === 0) && (
                                  <Badge
                                    variant="outline"
                                    className="bg-muted/50 text-muted-foreground border-border pointer-events-none mr-2 font-normal"
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
                                  placeholder={
                                    !values || values.length === 0
                                      ? "Search makes to exclude..."
                                      : ""
                                  }
                                  className="placeholder:text-muted-foreground bg-transparent text-foreground w-full"
                                />
                              </React.Fragment>
                            )}
                          </ComboboxValue>
                        </ComboboxChips>
                        <ComboboxContent
                          anchor={excludedMakesAnchor}
                          className="border-border bg-card text-foreground z-100"
                        >
                          <ComboboxEmpty>No makes found</ComboboxEmpty>
                          <ComboboxList>
                            {(m: any) => (
                              <ComboboxItem
                                key={m.id}
                                value={m}
                                className="hover:bg-muted focus:bg-muted cursor-pointer"
                              >
                                {m.name}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </>
                  ) : (
                    <div className="w-full bg-background/50 border border-border rounded-lg h-[38px] flex items-center px-3 text-sm text-muted-foreground italic cursor-not-allowed">
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
                      <SelectTrigger className="w-full bg-card border border-amber-500/30 rounded-lg h-[38px] text-sm text-foreground focus-visible:ring-1 focus-visible:ring-amber-500 focus-visible:outline-none data-placeholder:text-amber-500/50">
                        <SelectValue placeholder="Any (Applies to all Electric)" />
                      </SelectTrigger>
                      <SelectContent className="border-amber-500/30 bg-card text-foreground z-60">
                        <SelectItem
                          value="none"
                          className="hover:bg-muted text-amber-500 focus:bg-muted cursor-pointer"
                        >
                          Any
                        </SelectItem>
                        <SelectItem
                          value="agency"
                          className="hover:bg-muted text-amber-500 focus:bg-muted cursor-pointer"
                        >
                          Must have Official Agency
                        </SelectItem>
                        <SelectItem
                          value="no_agency"
                          className="hover:bg-muted text-amber-500 focus:bg-muted cursor-pointer"
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
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground border-b border-border pb-2">
                3. Limits (Price & Age)
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">
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
                      className="w-full bg-background border border-border rounded-lg h-[38px] text-sm text-foreground font-ibm-mono focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none"
                    />
                  ) : (
                    <div className="w-full bg-background/50 border border-border rounded-lg h-[38px] flex items-center px-3 text-sm text-muted-foreground italic cursor-not-allowed">
                      No Minimum
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">
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
                      className="w-full bg-background border border-border rounded-lg h-[38px] text-sm text-foreground font-ibm-mono focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none"
                      placeholder="Unlimited"
                    />
                  ) : (
                    <div className="w-full bg-background/50 border border-border rounded-lg h-[38px] flex items-center px-3 text-sm text-muted-foreground italic cursor-not-allowed">
                      Unlimited
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">
                      Latest Vehicle Year Allowed
                    </label>
                    <Switch
                      checked={enableAgeMin}
                      onCheckedChange={setEnableAgeMin}
                    />
                  </div>
                  {enableAgeMin ? (
                    <FormattedNumberInput
                      required
                      disableCommas
                      value={formData.minYear}
                      onChange={(val) => {
                        if (val && val >= 1900 && val <= 2100)
                          updateField("minYear", val);
                        else updateField("minYear", val);
                      }}
                      className="w-full bg-background border border-border rounded-lg h-[38px] text-sm text-foreground font-ibm-mono focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none"
                      placeholder={`e.g. ${currentYear + 1}`}
                    />
                  ) : (
                    <div className="w-full bg-background/50 border border-border rounded-lg h-[38px] flex items-center px-3 text-sm text-muted-foreground italic cursor-not-allowed">
                      Any (Current default: {currentYear + 1})
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">
                      Oldest Vehicle Year Allowed
                    </label>
                    <Switch
                      checked={enableAgeMax}
                      onCheckedChange={setEnableAgeMax}
                    />
                  </div>
                  {enableAgeMax ? (
                    <FormattedNumberInput
                      disableCommas
                      value={formData.maxYear}
                      onChange={(val) => {
                        if (val && val >= 1900 && val <= 2100)
                          updateField("maxYear", val);
                        else updateField("maxYear", val);
                      }}
                      className="w-full bg-background border border-border rounded-lg h-[38px] text-sm text-foreground font-ibm-mono focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none"
                      placeholder="e.g. 2015"
                    />
                  ) : (
                    <div className="w-full bg-background/50 border border-border rounded-lg h-[38px] flex items-center px-3 text-sm text-muted-foreground italic cursor-not-allowed">
                      Unlimited
                    </div>
                  )}
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-xs font-medium text-red-400"
                      title="This completely disqualifies any car older than this year from ANY rule within this company."
                    >
                      Hard Company Cutoff Year{" "}
                      <span className="text-muted-foreground font-normal">
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
                      disableCommas
                      value={formData.cutoffYear}
                      onChange={(val) => {
                        if (val && val >= 1900 && val <= 2100)
                          updateField("cutoffYear", val);
                        else updateField("cutoffYear", val);
                      }}
                      className="w-full bg-background border border-red-500/30 rounded-lg h-[38px] text-sm text-foreground font-ibm-mono focus-visible:ring-1 focus-visible:ring-red-500/50 focus-visible:border-red-500/50"
                      placeholder="e.g. 2010"
                    />
                  ) : (
                    <div className="w-full bg-background/50 border border-border rounded-lg h-[38px] flex items-center px-3 text-sm text-muted-foreground italic cursor-not-allowed">
                      None
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Sec 4: Rating */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground border-b border-border pb-2">
                4. Calculation & Rating
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Rate Percentage (%)
                </label>
                <FormattedNumberInput
                  isDecimal
                  required
                  value={formData.ratePercentage}
                  onChange={(val) => updateField("ratePercentage", val || 0)}
                  className="w-full max-w-xs bg-background border border-teal-500/50 rounded-lg h-[46px] text-lg text-foreground font-ibm-mono focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none"
                />
              </div>

              <div className="bg-teal-500/10 border border-teal-500/20 p-4 rounded-lg flex items-center justify-between">
                <span className="text-sm text-foreground font-medium">
                  Example Calculation (1,000,000 EGP)
                </span>
                <span className="text-xl font-bold font-ibm-mono text-foreground">
                  EGP {currentPremiumExample.toLocaleString()}
                </span>
              </div>
            </section>

            {/* Sec 5: Conditions */}
            <section className="space-y-4 mb-10">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  5. Arabic Conditions
                </h3>
                <button
                  type="button"
                  onClick={addCondition}
                  className="text-xs bg-muted hover:bg-accent px-2 py-1 rounded text-foreground flex items-center gap-1 transition-colors"
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
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground font-sans outline-none min-h-[60px] resize-y"
                    />
                  </div>
                ))}
                {formData.conditions?.length === 0 && (
                  <div className="text-center p-4 border border-dashed border-border rounded-lg text-muted-foreground text-sm">
                    No conditions added.
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Condition Links (URLs)
                </h3>
                <button
                  type="button"
                  onClick={addConditionLink}
                  className="text-xs bg-muted hover:bg-accent px-2 py-1 rounded text-foreground flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Link
                </button>
              </div>

              <div className="space-y-3 mt-4">
                {localLinks.map((link, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 animate-in fade-in slide-in-from-top-1"
                  >
                    <button
                      type="button"
                      onClick={() => removeConditionLink(idx)}
                      className="mt-1.5 p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 shrink-0"
                      aria-label={`Remove condition link ${idx + 1}`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input
                        type="text"
                        value={link.label}
                        onChange={(e) =>
                          handleConditionLinkChange(
                            idx,
                            "label",
                            e.target.value,
                          )
                        }
                        placeholder="Link Label (e.g. Terms PDF, Guidelines)"
                        className="sm:col-span-1 bg-background border border-border rounded-lg h-10 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none"
                      />
                      <Input
                        type="url"
                        value={link.url}
                        onChange={(e) =>
                          handleConditionLinkChange(idx, "url", e.target.value)
                        }
                        placeholder="https://example.com/condition"
                        className="sm:col-span-2 bg-background border border-border rounded-lg h-10 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none"
                        required
                      />
                    </div>
                  </div>
                ))}
                {localLinks.length === 0 && (
                  <div className="text-center p-4 border border-dashed border-border rounded-lg text-muted-foreground text-sm">
                    No condition links added.
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Attachments
                </h3>
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="attachment-upload-input"
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("attachment-upload-input")?.click()}
                    className="text-xs bg-muted hover:bg-accent px-2 py-1 rounded text-foreground flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Attachment
                  </button>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                {localAttachments.map((att, idx) => (
                  <div
                    key={att.uid || idx}
                    className="flex items-start gap-2 animate-in fade-in slide-in-from-top-1"
                  >
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="mt-1.5 p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 shrink-0"
                      aria-label={`Remove attachment ${idx + 1}`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input
                        type="text"
                        value={att.label}
                        onChange={(e) =>
                          handleAttachmentLabelChange(idx, e.target.value)
                        }
                        placeholder="File Label (e.g. Terms PDF, Guidelines)"
                        className="sm:col-span-1 bg-background border border-border rounded-lg h-10 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:outline-none"
                        disabled={att.isUploading}
                      />
                      <div className="sm:col-span-2 flex items-center justify-between border border-border rounded-lg h-10 px-3 bg-muted/30 text-xs text-foreground">
                        {att.isUploading ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                            <span>Uploading {att.originalFileName}...</span>
                          </div>
                        ) : att.error ? (
                          <div className="flex items-center justify-between w-full bg-red-500/5 p-1 rounded">
                            <span className="text-red-400 font-medium truncate max-w-[70%]" title={att.error}>
                              Error: {att.error}
                            </span>
                            <button
                              type="button"
                              onClick={() => retryUpload(att.uid)}
                              className="text-teal-500 hover:text-teal-400 font-medium hover:underline transition-colors shrink-0 text-[11px]"
                            >
                              Retry
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="truncate max-w-[75%] font-ibm-mono text-muted-foreground" title={att.originalFileName}>
                              {att.originalFileName} ({Math.round(att.fileSize / 1024)} KB)
                            </span>
                            <a
                              href={`/api/attachments/download?url=${encodeURIComponent(att.secureUrl)}&filename=${encodeURIComponent(att.originalFileName)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-500 hover:text-teal-400 font-medium hover:underline transition-colors shrink-0"
                            >
                              Download
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {localAttachments.length === 0 && (
                  <div className="text-center p-4 border border-dashed border-border rounded-lg text-muted-foreground text-sm">
                    No attachments uploaded.
                  </div>
                )}
              </div>
            </section>
          </form>
        </div>

        {/* Footer actions */}
        <SheetFooter className="flex-row p-4 border-t border-border bg-card shrink-0 gap-3">
          <label className="flex items-center gap-3 cursor-pointer flex-1 px-4 border border-border rounded-lg bg-muted/50 justify-center h-12">
            <span className="text-sm font-medium text-foreground">
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
            className="flex-2 px-8 h-12 rounded-lg bg-teal-500 text-slate-950 font-bold flex items-center justify-center gap-2 hover:bg-foreground transition-colors disabled:opacity-50"
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

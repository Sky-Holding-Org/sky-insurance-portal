"use client";

import { QuoteResult, formatEGP, parseConditionLink } from "@/lib/quote-engine";
import { cn } from "@/lib/utils";
import { Copy, ChevronDown, Check } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  quote: QuoteResult;
  rank: number;
}

export function QuoteResultCard({ quote, rank }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isBest = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;

  const handleCopy = () => {
    const linksSection =
      quote.conditionLinks && quote.conditionLinks.length > 0
        ? `\nCondition Links:\n${quote.conditionLinks.map((l, i) => {
            const parsed = parseConditionLink(l);
            return `${i + 1}. ${parsed.label ? `${parsed.label}: ` : ""}${parsed.url}`;
          }).join("\n")}`
        : "";

    const text = `Insurance Quote 🚘
Company: ${quote.companyName}
Policy: ${quote.policyType === "private" ? "Private" : "Gold"}
Rate: ${quote.ratePercentage}%
Annual Premium: ${formatEGP(quote.annualPremium)}

Conditions:
${quote.conditions.map((c) => `- ${c}`).join("\n")}${linksSection}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.05 }}
      className={cn(
        "relative rounded-xl border bg-card/80 backdrop-blur-md overflow-hidden transition-all duration-300",
        isBest
          ? "border-accent/50 shadow-[0_8px_30px_rgb(0,0,0,0.04),0_0_20px_var(--accent-dim)] ring-1 ring-accent/20"
          : "border-border shadow-sm",
        "hover:border-accent/30 hover:shadow-md",
      )}
    >
      {/* Top Banner for Best Rate */}
      {isBest && (
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-accent to-emerald-400" />
      )}

      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full font-ibm-mono text-sm font-bold border",
                isBest
                  ? "bg-teal-500/10 text-teal-500 border-teal-500/30"
                  : isSecond
                    ? "bg-muted text-muted-foreground border-border"
                    : isThird
                      ? "bg-orange-500/10 text-orange-500 border-orange-500/30"
                      : "bg-muted text-muted-foreground border-border",
              )}
            >
              {rank}
            </div>
            <div>
              <h4 className="font-syne font-bold text-lg text-foreground flex items-center gap-2">
                {quote.companyName}
                {isBest && (
                  <span className="text-xs bg-teal-500/20 text-teal-500 px-2 py-0.5 rounded font-sans tracking-wide">
                    BEST RATE ⭐
                  </span>
                )}
              </h4>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded border capitalize",
                quote.policyType === "gold"
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : "bg-muted text-muted-foreground border-border",
              )}
            >
              {quote.policyType}
            </span>
          </div>
        </div>

        <div className="flex flex-col mb-5">
          <div className="flex justify-between items-end mb-1">
             <span className="text-xs text-muted-foreground font-medium">
               Annual Premium
             </span>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-3 flex-wrap">
              <span className="font-ibm-mono text-3xl font-bold text-foreground tracking-tight">
                {formatEGP(quote.annualPremium).replace("EGP", "").trim()}{" "}
                <span className="text-lg text-muted-foreground font-medium">EGP</span>
              </span>
              <span className="text-sm text-teal-500 mb-1 font-medium bg-teal-500/10 px-2 py-0.5 rounded">
                Rate: {quote.ratePercentage.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group py-1"
          >
            <span className="font-medium">
              {quote.conditions.length} Conditions applied
              {quote.conditionLinks && quote.conditionLinks.length > 0 && (
                <span className="ml-1.5 text-xs text-teal-500/70">
                  · {quote.conditionLinks.length} link{quote.conditionLinks.length !== 1 ? "s" : ""}
                </span>
              )}
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>
          
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted hover:bg-accent hover:text-accent-foreground px-3 py-1.5 rounded transition-colors shrink-0"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-teal-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-2 border-t border-border/50 space-y-4">
                {/* Conditions list */}
                <ul
                  className="space-y-2 text-right text-sm text-foreground leading-relaxed font-sans"
                  dir="rtl"
                >
                  {quote.conditions.map((condition, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 justify-start"
                    >
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500/50 shrink-0" />
                      <span>{condition}</span>
                    </li>
                  ))}
                  {quote.conditions.length === 0 && (
                    <li className="text-muted-foreground text-center">
                      No special conditions
                    </li>
                  )}
                </ul>

                {/* Condition Links */}
                {quote.conditionLinks && quote.conditionLinks.length > 0 && (
                  <div className="border-t border-border/50 pt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Condition Links
                    </p>
                    <div className="space-y-1.5 bg-muted/40 rounded-lg p-3">
                      {quote.conditionLinks.map((link, idx) => (
                        <ConditionLinkRow key={idx} link={link} index={idx} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ConditionLinkRow({ link, index }: { link: string; index: number }) {
  const [copied, setCopied] = useState(false);
  const parsed = parseConditionLink(link);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(parsed.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayUrl = (() => {
    try {
      const url = new URL(parsed.url);
      return url.hostname + (url.pathname !== "/" ? url.pathname : "");
    } catch {
      return parsed.url;
    }
  })();

  return (
    <div className="flex items-center gap-2 group">
      <span className="text-xs text-muted-foreground/60 font-ibm-mono shrink-0 w-4 text-right">
        {index + 1}.
      </span>
      <a
        href={parsed.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-xs text-teal-500 hover:text-teal-400 font-ibm-mono truncate hover:underline transition-colors flex items-center gap-1.5"
        title={parsed.url}
      >
        {parsed.label ? (
          <>
            <span className="font-sans font-medium text-foreground hover:text-teal-400">
              {parsed.label}
            </span>
            <span className="text-[10px] text-muted-foreground font-ibm-mono">
              ({displayUrl})
            </span>
          </>
        ) : (
          displayUrl
        )}
      </a>
      <button
        onClick={handleCopy}
        className="shrink-0 p-1 rounded text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
        title="Copy link"
      >
        {copied ? (
          <Check className="w-3 h-3 text-teal-500" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </button>
    </div>
  );
}

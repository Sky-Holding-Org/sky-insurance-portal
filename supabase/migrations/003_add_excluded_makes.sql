-- ============================================================
-- Add Excluded Make IDs to Quote Rules
-- ============================================================

-- 1. Add `excluded_make_ids` array column to `quote_rules`
ALTER TABLE public.quote_rules 
ADD COLUMN IF NOT EXISTS excluded_make_ids uuid[] DEFAULT '{}';

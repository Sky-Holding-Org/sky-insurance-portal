-- ============================================================
-- Add Condition Links to Quote Rules
-- ============================================================

ALTER TABLE public.quote_rules 
ADD COLUMN IF NOT EXISTS condition_links text[] DEFAULT '{}';

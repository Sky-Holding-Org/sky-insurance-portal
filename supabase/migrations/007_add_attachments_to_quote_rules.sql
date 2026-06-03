-- ============================================================
-- Add Attachments to Quote Rules
-- ============================================================

ALTER TABLE public.quote_rules 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

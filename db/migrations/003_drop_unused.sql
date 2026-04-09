-- ============================================================
-- Migration : 003_drop_unused
-- Description: Remove tables and columns never used by the app
-- Applied on : 2026-04-09
-- How to run : Supabase Dashboard → SQL Editor → paste → RUN
-- ============================================================

-- Drop unused tables (cascade removes their FK references)
DROP TABLE IF EXISTS budgets         CASCADE;
DROP TABLE IF EXISTS category_memory CASCADE;
DROP TABLE IF EXISTS cards           CASCADE;
DROP TABLE IF EXISTS family_members  CASCADE;

-- Drop unused columns from transactions
ALTER TABLE transactions
  DROP COLUMN IF EXISTS raw_description,
  DROP COLUMN IF EXISTS member_id,
  DROP COLUMN IF EXISTS card_id;

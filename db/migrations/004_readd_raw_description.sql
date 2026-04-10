-- ============================================================
-- Migration : 004_readd_raw_description
-- Description: Re-add raw_description to transactions for reliable
--              duplicate detection on import (AI-cleaned descriptions
--              are non-deterministic and cannot be used as dedup keys)
-- Applied on : 2026-04-09
-- How to run : Supabase Dashboard → SQL Editor → paste → RUN
-- Note       : Run AFTER 003_drop_unused if not yet applied,
--              or run standalone if 003 was already applied.
-- ============================================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS raw_description TEXT;

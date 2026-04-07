-- ============================================================
-- Migration : 002_dashboard_rpcs
-- Description: Server-side aggregation for Dashboard
-- How to run : Supabase Dashboard → SQL Editor → paste → RUN
-- ============================================================

-- Drop previous versions
DROP FUNCTION IF EXISTS dashboard_summary(TEXT);
DROP FUNCTION IF EXISTS monthly_evolution();

-- Returns SUM(amount) and COUNT(*) grouped by category for a given period,
-- with category details joined in so the Dashboard needs no separate fetch.
CREATE OR REPLACE FUNCTION dashboard_summary(p_period TEXT)
RETURNS TABLE (
  category_id    UUID,
  category_name  TEXT,
  category_emoji TEXT,
  category_color TEXT,
  total          NUMERIC,
  count          BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    t.category_id,
    c.name   AS category_name,
    c.emoji  AS category_emoji,
    c.color  AS category_color,
    SUM(t.amount)  AS total,
    COUNT(*)       AS count
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.category_id
  WHERE t.user_id = auth.uid()
    AND t.billing_period = p_period
  GROUP BY t.category_id, c.name, c.emoji, c.color;
$$;

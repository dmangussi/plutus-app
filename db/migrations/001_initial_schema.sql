-- ============================================================
-- Migration : 001_initial_schema
-- Description: Initial plutus-db schema
-- Applied on : 2026-03-11
-- How to run : Supabase Dashboard → SQL Editor → paste → RUN
-- ============================================================

CREATE TABLE IF NOT EXISTS family_members (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  emoji      TEXT NOT NULL DEFAULT '👤',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cards (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  bank         TEXT NOT NULL,
  credit_limit NUMERIC(12,2),
  closing_day  INT CHECK (closing_day BETWEEN 1 AND 31),
  due_day      INT CHECK (due_day BETWEEN 1 AND 31),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  emoji      TEXT NOT NULL DEFAULT '📦',
  color      TEXT NOT NULL DEFAULT '#C0C0C0',
  is_default BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS transactions (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description        TEXT NOT NULL,
  raw_description    TEXT,
  amount             NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  date               DATE NOT NULL,
  billing_period     TEXT NOT NULL,
  category_id        UUID REFERENCES categories(id) ON DELETE SET NULL,
  member_id          UUID REFERENCES family_members(id) ON DELETE SET NULL,
  card_id            UUID REFERENCES cards(id) ON DELETE SET NULL,
  installments       INT NOT NULL DEFAULT 1,
  installment_number INT NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS category_memory (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  raw_description TEXT NOT NULL,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  UNIQUE (user_id, raw_description)
);

CREATE TABLE IF NOT EXISTS budgets (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id    UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  billing_period TEXT NOT NULL,
  limit_amount   NUMERIC(12,2) NOT NULL CHECK (limit_amount > 0),
  UNIQUE (user_id, category_id, billing_period)
);

-- Row-Level Security
ALTER TABLE family_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards            ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_memory  ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets          ENABLE ROW LEVEL SECURITY;

CREATE POLICY members_isolation      ON family_members  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY cards_isolation        ON cards           USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY transactions_isolation ON transactions    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY memory_isolation       ON category_memory USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY budgets_isolation      ON budgets         USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY categories_isolation   ON categories
  USING (user_id = auth.uid() OR is_default = true)
  WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_transactions_period ON transactions (user_id, billing_period);
CREATE INDEX idx_transactions_date   ON transactions (user_id, date);
CREATE INDEX idx_memory_raw          ON category_memory (user_id, raw_description);

-- Default categories
INSERT INTO categories (user_id, name, emoji, color, is_default) VALUES
  (NULL, 'Food',          '🍽️', '#FF6B6B', true),
  (NULL, 'Transport',     '🚗',  '#4ECDC4', true),
  (NULL, 'Health',        '💊',  '#45B7D1', true),
  (NULL, 'Education',     '📚',  '#96CEB4', true),
  (NULL, 'Entertainment', '🎮',  '#FFEAA7', true),
  (NULL, 'Clothing',      '👗',  '#DDA0DD', true),
  (NULL, 'Housing',       '🏠',  '#F0A500', true),
  (NULL, 'Groceries',     '🛒',  '#98D8C8', true),
  (NULL, 'Subscriptions', '📱',  '#B8B8FF', true),
  (NULL, 'Restaurants',   '🍕',  '#FFB347', true),
  (NULL, 'Beauty',        '💇',  '#F4A0C0', true),
  (NULL, 'Other',         '📦',  '#C0C0C0', true);

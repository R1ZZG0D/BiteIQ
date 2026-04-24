CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  preference TEXT NOT NULL,
  sugar_goal_g NUMERIC NOT NULL,
  protein_goal_g NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_history (
  id UUID PRIMARY KEY,
  product_name TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  parsed JSONB NOT NULL,
  result JSONB NOT NULL,
  nutrition JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scan_history_created_at_idx
  ON scan_history (created_at DESC);

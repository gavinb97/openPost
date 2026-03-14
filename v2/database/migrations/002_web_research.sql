-- ============================================================
-- Migration 002: Web Research Capability
-- Adds research-powered posting to agents
-- ============================================================

-- Add 'research_post' to the action_type enum
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'research_post';

-- Add web research columns to agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS auto_web_research BOOLEAN DEFAULT false;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS web_research_config JSONB DEFAULT '{}';

-- Research cache table — stores fetched results to avoid redundant API calls.
-- Stale rows are overwritten via ON CONFLICT upsert (no separate cleanup job).
CREATE TABLE IF NOT EXISTS research_cache (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash  VARCHAR(64) NOT NULL,
  source      VARCHAR(50) NOT NULL,
  query       TEXT NOT NULL,
  results     JSONB NOT NULL DEFAULT '[]',
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '2 hours'),
  UNIQUE(query_hash, source)
);

CREATE INDEX IF NOT EXISTS idx_research_cache_expires ON research_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_research_cache_lookup ON research_cache(query_hash, source, expires_at);

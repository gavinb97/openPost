-- OnlyPosts v2 — Scheduling Improvements
-- Adds next_action_at tracking so the scheduler doesn't stack duplicate jobs

-- Track when each agent should next act (prevents duplicate job piling)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS next_action_at TIMESTAMPTZ;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS schedule_timezone VARCHAR(100) DEFAULT 'America/New_York';

-- Index for efficient scheduler queries
CREATE INDEX IF NOT EXISTS idx_agents_next_action ON agents(next_action_at)
  WHERE enabled = true;

-- Add research_post to action_type enum if not already there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'research_post'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'action_type')
  ) THEN
    ALTER TYPE action_type ADD VALUE 'research_post';
  END IF;
END$$;

-- Extend schedule_type enum with new types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'peak_hours'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'schedule_type')
  ) THEN
    ALTER TYPE schedule_type ADD VALUE 'peak_hours';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'burst'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'schedule_type')
  ) THEN
    ALTER TYPE schedule_type ADD VALUE 'burst';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'business_hours'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'schedule_type')
  ) THEN
    ALTER TYPE schedule_type ADD VALUE 'business_hours';
  END IF;
END$$;

-- Add scheduled_at to agent_actions if missing (it exists already but ensure index is correct)
CREATE INDEX IF NOT EXISTS idx_agent_actions_agent_queued
  ON agent_actions(agent_id, status)
  WHERE status IN ('queued', 'processing');

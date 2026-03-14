-- OnlyPosts v2 - Initial Schema
-- Comprehensive database for AI-powered social media automation

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE platform_type AS ENUM (
  'twitter', 'reddit', 'youtube', 'tiktok', 'facebook', 'instagram'
);

CREATE TYPE schedule_type AS ENUM (
  'random',    -- random intervals between min/max minutes
  'interval',  -- fixed interval in minutes
  'cron',      -- cron expression
  'set_times'  -- specific days/times
);

CREATE TYPE approval_mode AS ENUM (
  'auto',                -- publish immediately
  'review',              -- queue for human review
  'auto_with_guardrails' -- auto-publish unless guardrail flags
);

CREATE TYPE action_type AS ENUM (
  'post', 'reply', 'dm', 'like', 'follow', 'retweet',
  'comment', 'subscribe', 'scrape'
);

CREATE TYPE action_status AS ENUM (
  'queued', 'processing', 'published', 'failed',
  'review', 'rejected', 'expired'
);

CREATE TYPE job_status AS ENUM (
  'active', 'paused', 'completed', 'failed', 'cancelled'
);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    VARCHAR(64) UNIQUE NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  pro         BOOLEAN DEFAULT false,
  stripe_customer_id    VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- PLATFORM ACCOUNTS (connected social media accounts)
-- ============================================================

CREATE TABLE platform_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform        platform_type NOT NULL,
  platform_user_id VARCHAR(255),        -- platform-specific user ID
  handle          VARCHAR(255),          -- @username or display handle
  display_name    VARCHAR(255),
  avatar_url      TEXT,
  metadata        JSONB DEFAULT '{}',    -- platform-specific profile data
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform, platform_user_id)
);

CREATE INDEX idx_platform_accounts_user ON platform_accounts(user_id);
CREATE INDEX idx_platform_accounts_platform ON platform_accounts(platform);

-- ============================================================
-- OAUTH TOKENS
-- ============================================================

CREATE TABLE oauth_tokens (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_account_id UUID NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  access_token        TEXT NOT NULL,
  refresh_token       TEXT,
  token_secret        TEXT,              -- for Twitter OAuth 1.0a
  expires_at          TIMESTAMPTZ,
  scopes              TEXT[],
  code_verifier       VARCHAR(255),      -- for PKCE flows
  raw_response        JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_oauth_tokens_account ON oauth_tokens(platform_account_id);

-- ============================================================
-- MEDIA FILES (S3-backed)
-- ============================================================

CREATE TABLE media_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  s3_key          TEXT NOT NULL,
  s3_bucket       VARCHAR(255) NOT NULL,
  original_name   VARCHAR(500),
  mime_type       VARCHAR(100),
  size_bytes      BIGINT,
  width           INT,
  height          INT,
  duration_seconds FLOAT,             -- for video/audio
  description     TEXT,
  categories      TEXT[] DEFAULT '{}',
  nsfw            BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_media_files_user ON media_files(user_id);

-- ============================================================
-- AGENTS (AI-powered social media agents)
-- ============================================================

CREATE TABLE agents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              VARCHAR(100) NOT NULL,
  description       TEXT,

  -- AI personality
  personality_prompt TEXT DEFAULT 'You are a witty, engaging social media personality.',
  model             VARCHAR(50) DEFAULT 'gpt-4o',

  -- Scheduling
  schedule_type     schedule_type DEFAULT 'random',
  schedule_config   JSONB DEFAULT '{"min_minutes": 30, "max_minutes": 480}',

  -- Control
  enabled           BOOLEAN DEFAULT false,
  approval_mode     approval_mode DEFAULT 'auto_with_guardrails',

  -- Capabilities (which actions this agent can perform)
  auto_post         BOOLEAN DEFAULT true,
  auto_reply        BOOLEAN DEFAULT false,
  auto_dm           BOOLEAN DEFAULT false,
  auto_like         BOOLEAN DEFAULT false,
  auto_follow       BOOLEAN DEFAULT false,
  auto_retweet      BOOLEAN DEFAULT false,
  auto_comment      BOOLEAN DEFAULT false,

  -- Targeting
  platform_account_ids UUID[] DEFAULT '{}',   -- which accounts to act on
  subreddit_targets    TEXT[] DEFAULT '{}',
  hashtag_targets      TEXT[] DEFAULT '{}',
  topic_keywords       TEXT[] DEFAULT '{}',

  -- DM configuration
  dm_template       TEXT,
  dm_max_per_day    INT DEFAULT 50,

  -- Media pool
  media_pool_ids    UUID[] DEFAULT '{}',       -- media_file IDs to cycle through
  remaining_media   UUID[] DEFAULT '{}',       -- depleting pool, replenishes from media_pool_ids

  -- Stats
  posts_made        INT DEFAULT 0,
  replies_sent      INT DEFAULT 0,
  dms_sent          INT DEFAULT 0,
  likes_given       INT DEFAULT 0,
  follows_made      INT DEFAULT 0,

  -- Timestamps
  last_active_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agents_user ON agents(user_id);
CREATE INDEX idx_agents_enabled ON agents(enabled) WHERE enabled = true;

-- ============================================================
-- AGENT ACTIONS (individual action queue + history)
-- ============================================================

CREATE TABLE agent_actions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id            UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  platform_account_id UUID REFERENCES platform_accounts(id) ON DELETE SET NULL,
  action_type         action_type NOT NULL,
  status              action_status DEFAULT 'queued',

  -- Content
  content_text        TEXT,
  media_file_id       UUID REFERENCES media_files(id) ON DELETE SET NULL,
  target_post_id      TEXT,              -- platform post/comment ID to reply to
  target_user         VARCHAR(255),      -- target username for DMs/follows
  target_subreddit    VARCHAR(255),

  -- Platform response
  platform_post_id    TEXT,              -- returned ID after publish
  platform_url        TEXT,              -- direct link to published content

  -- Error handling
  error_message       TEXT,
  retry_count         INT DEFAULT 0,
  max_retries         INT DEFAULT 3,

  -- Review
  guardrail_score     FLOAT,            -- 0-1 safety score
  guardrail_notes     TEXT,
  reviewed_at         TIMESTAMPTZ,
  reviewed_by         UUID REFERENCES users(id),

  -- Timing
  scheduled_at        TIMESTAMPTZ,
  executed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agent_actions_agent ON agent_actions(agent_id);
CREATE INDEX idx_agent_actions_status ON agent_actions(status);
CREATE INDEX idx_agent_actions_scheduled ON agent_actions(scheduled_at)
  WHERE status = 'queued';
CREATE INDEX idx_agent_actions_review ON agent_actions(status)
  WHERE status = 'review';

-- ============================================================
-- AGENT CONVERSATIONS (memory for contextual interactions)
-- ============================================================

CREATE TABLE agent_conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id          UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  platform          platform_type NOT NULL,
  platform_account_id UUID REFERENCES platform_accounts(id) ON DELETE SET NULL,
  target_user       VARCHAR(255) NOT NULL,
  thread_id         TEXT,                -- platform thread/conversation ID

  -- Context
  context_summary   TEXT,                -- AI-generated summary of conversation so far
  messages          JSONB DEFAULT '[]',  -- [{role, content, timestamp, platform_id}]
  sentiment         VARCHAR(20),         -- positive, neutral, negative
  topics            TEXT[] DEFAULT '{}',

  -- Stats
  interaction_count INT DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agent_convos_agent ON agent_conversations(agent_id);
CREATE INDEX idx_agent_convos_target ON agent_conversations(agent_id, platform, target_user);

-- ============================================================
-- JOBS (legacy-compatible batch operations)
-- ============================================================

CREATE TABLE jobs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id            UUID REFERENCES agents(id) ON DELETE SET NULL,
  type                VARCHAR(50) NOT NULL,       -- media_post, text_post, dm_campaign, scrape
  status              job_status DEFAULT 'active',
  platform            platform_type NOT NULL,
  platform_account_id UUID REFERENCES platform_accounts(id) ON DELETE SET NULL,

  -- Schedule
  schedule_type       schedule_type DEFAULT 'random',
  schedule_config     JSONB DEFAULT '{}',

  -- Content configuration
  content_config      JSONB DEFAULT '{}',         -- AI prompt, static text, templates, etc.
  media_config        JSONB DEFAULT '{}',         -- image pool, rotation, original_images, remaining_images
  subreddit_config    JSONB DEFAULT '{}',         -- selected, remaining, original subreddits

  -- Progress
  duration            INT DEFAULT 0,              -- 0 = forever
  iterations_completed INT DEFAULT 0,
  iterations_total     INT,

  -- Timestamps
  last_execution_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_jobs_user ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status) WHERE status = 'active';

-- ============================================================
-- JOB EXECUTIONS (individual run records)
-- ============================================================

CREATE TABLE job_executions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id              UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  platform_account_id UUID REFERENCES platform_accounts(id) ON DELETE SET NULL,
  status              action_status DEFAULT 'queued',
  platform_post_id    TEXT,
  content_text        TEXT,
  media_url           TEXT,
  error_message       TEXT,
  retry_count         INT DEFAULT 0,
  scheduled_at        TIMESTAMPTZ,
  executed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_job_executions_job ON job_executions(job_id);
CREATE INDEX idx_job_executions_scheduled ON job_executions(scheduled_at)
  WHERE status = 'queued';

-- ============================================================
-- DM TARGETS (scraped users to message)
-- ============================================================

CREATE TABLE dm_targets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id        UUID REFERENCES agents(id) ON DELETE SET NULL,
  platform        platform_type NOT NULL,
  target_username VARCHAR(255) NOT NULL,
  source_community VARCHAR(255),         -- subreddit, hashtag, etc.
  messaged        BOOLEAN DEFAULT false,
  messaged_at     TIMESTAMPTZ,
  response_received BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform, target_username)
);

CREATE INDEX idx_dm_targets_user ON dm_targets(user_id);
CREATE INDEX idx_dm_targets_unmessaged ON dm_targets(messaged)
  WHERE messaged = false;

-- ============================================================
-- SCRAPED COMMUNITIES
-- ============================================================

CREATE TABLE scraped_communities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform          platform_type NOT NULL,
  community_name    VARCHAR(255) NOT NULL,
  member_count      INT,
  active_posters    TEXT[] DEFAULT '{}',
  active_commenters TEXT[] DEFAULT '{}',
  metadata          JSONB DEFAULT '{}',
  last_scraped_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform, community_name)
);

CREATE INDEX idx_scraped_communities_user ON scraped_communities(user_id);

-- ============================================================
-- CONTENT TEMPLATES (reusable AI prompt templates)
-- ============================================================

CREATE TABLE content_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  platform        platform_type,          -- NULL = cross-platform
  template_type   VARCHAR(50) NOT NULL,   -- post, reply, dm, comment
  system_prompt   TEXT,
  user_prompt     TEXT NOT NULL,
  model           VARCHAR(50) DEFAULT 'gpt-4o',
  temperature     FLOAT DEFAULT 0.8,
  max_tokens      INT DEFAULT 500,
  example_output  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_content_templates_user ON content_templates(user_id);

-- ============================================================
-- RATE LIMIT LOG (sliding window tracking)
-- ============================================================

CREATE TABLE rate_limit_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform            platform_type NOT NULL,
  platform_account_id UUID REFERENCES platform_accounts(id) ON DELETE CASCADE,
  action_type         action_type NOT NULL,
  window_start        TIMESTAMPTZ NOT NULL,
  request_count       INT DEFAULT 1,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rate_limit_log_window ON rate_limit_log(platform, platform_account_id, action_type, window_start);

-- ============================================================
-- OAUTH STATE (temporary state tokens for OAuth flows)
-- ============================================================

CREATE TABLE oauth_state (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform        platform_type NOT NULL,
  state_token     VARCHAR(255) UNIQUE NOT NULL,
  code_verifier   VARCHAR(255),
  oauth_token     VARCHAR(255),          -- for Twitter OAuth 1.0a request token
  oauth_token_secret VARCHAR(255),       -- for Twitter OAuth 1.0a request token secret
  redirect_after  TEXT,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_oauth_state_token ON oauth_state(state_token);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_platform_accounts_updated BEFORE UPDATE ON platform_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_oauth_tokens_updated BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_agents_updated BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_agent_conversations_updated BEFORE UPDATE ON agent_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_jobs_updated BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_scraped_communities_updated BEFORE UPDATE ON scraped_communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_content_templates_updated BEFORE UPDATE ON content_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

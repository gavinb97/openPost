-- OnlyPosts v2 — Campaign Manager + Content Calendar
-- Campaigns let you create one piece of content and blast it to every platform simultaneously

-- ============================================================
-- CAMPAIGNS
-- ============================================================

CREATE TYPE campaign_status AS ENUM (
  'draft',      -- being configured
  'scheduled',  -- queued for future launch
  'active',     -- currently dispatching posts
  'completed',  -- all posts published
  'paused',     -- manually paused mid-dispatch
  'failed'      -- one or more critical failures
);

CREATE TYPE campaign_type AS ENUM (
  'blast',      -- same content across all platforms simultaneously
  'drip',       -- spread posts out over time
  'thread',     -- Twitter/Reddit long-form thread
  'video',      -- video post (TikTok/YouTube/Reels)
  'airdrop'     -- DM campaign to target lists
);

CREATE TABLE campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  status              campaign_status DEFAULT 'draft',
  campaign_type       campaign_type DEFAULT 'blast',

  -- Core content (shared across platforms before adaptation)
  base_content        TEXT,
  base_media_id       UUID REFERENCES media_files(id) ON DELETE SET NULL,

  -- AI adaptation settings
  use_ai_adaptation   BOOLEAN DEFAULT true,  -- AI rewrites content for each platform's style
  ai_personality      TEXT,                  -- optional custom persona for the AI

  -- Topic/context for AI content generation
  topic               VARCHAR(500),          -- "My app WalletVote just launched on iOS"
  target_audience     VARCHAR(500),          -- "people who care about corporate transparency"
  call_to_action      VARCHAR(255),          -- "Download WalletVote from the App Store"
  hashtags            TEXT[] DEFAULT '{}',   -- cross-platform hashtag pool

  -- Schedule
  schedule_mode       VARCHAR(50) DEFAULT 'immediate',  -- immediate, scheduled, drip
  scheduled_at        TIMESTAMPTZ,           -- when to start (for scheduled/drip)
  drip_interval_hours INT DEFAULT 24,        -- hours between posts in drip mode

  -- Stats (denormalized for fast dashboard reads)
  posts_total         INT DEFAULT 0,
  posts_published     INT DEFAULT 0,
  posts_failed        INT DEFAULT 0,
  posts_pending       INT DEFAULT 0,

  -- Engagement totals (updated async)
  total_impressions   BIGINT DEFAULT 0,
  total_likes         BIGINT DEFAULT 0,
  total_comments      BIGINT DEFAULT 0,
  total_shares        BIGINT DEFAULT 0,

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaigns_user ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_scheduled ON campaigns(scheduled_at) WHERE status = 'scheduled';

-- ============================================================
-- CAMPAIGN POSTS (one per platform account)
-- ============================================================

CREATE TYPE campaign_post_status AS ENUM (
  'pending',    -- waiting to be dispatched
  'queued',     -- in BullMQ queue
  'published',  -- live on platform
  'failed',     -- error during publish
  'skipped'     -- manually excluded or no account
);

CREATE TABLE campaign_posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  platform_account_id UUID REFERENCES platform_accounts(id) ON DELETE SET NULL,
  platform            platform_type NOT NULL,

  -- Content (AI-adapted or manually overridden)
  content_text        TEXT,
  adapted_content     TEXT,           -- AI-adapted version for this platform
  use_adapted         BOOLEAN DEFAULT true,
  media_file_id       UUID REFERENCES media_files(id) ON DELETE SET NULL,

  -- Thread support (Twitter threads, Reddit long posts)
  thread_posts        JSONB DEFAULT '[]',  -- [{text: string, order: number}]
  is_thread           BOOLEAN DEFAULT false,

  -- Status
  status              campaign_post_status DEFAULT 'pending',
  platform_post_id    TEXT,          -- returned ID after publish
  platform_url        TEXT,          -- direct link to the published post

  -- Error handling
  error_message       TEXT,
  retry_count         INT DEFAULT 0,

  -- Timing
  scheduled_at        TIMESTAMPTZ,
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaign_posts_campaign ON campaign_posts(campaign_id);
CREATE INDEX idx_campaign_posts_status ON campaign_posts(status);
CREATE INDEX idx_campaign_posts_scheduled ON campaign_posts(scheduled_at) WHERE status = 'queued';

-- ============================================================
-- SCHEDULED POSTS (standalone one-off scheduled posts)
-- For the Content Calendar — manual posts outside of campaigns
-- ============================================================

CREATE TABLE scheduled_posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform_account_id UUID REFERENCES platform_accounts(id) ON DELETE SET NULL,
  platform            platform_type NOT NULL,

  content_text        TEXT NOT NULL,
  media_file_id       UUID REFERENCES media_files(id) ON DELETE SET NULL,
  thread_posts        JSONB DEFAULT '[]',
  is_thread           BOOLEAN DEFAULT false,

  -- Linking (optional — can belong to a campaign)
  campaign_id         UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  agent_action_id     UUID REFERENCES agent_actions(id) ON DELETE SET NULL,

  status              VARCHAR(50) DEFAULT 'scheduled',  -- scheduled, published, failed, cancelled
  platform_post_id    TEXT,
  platform_url        TEXT,
  error_message       TEXT,

  scheduled_at        TIMESTAMPTZ NOT NULL,
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scheduled_posts_user ON scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_scheduled ON scheduled_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_scheduled_posts_platform ON scheduled_posts(platform);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER tr_campaigns_updated BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_scheduled_posts_updated BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

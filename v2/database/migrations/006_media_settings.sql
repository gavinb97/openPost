-- ============================================================
-- Migration 006: Media Settings & Sequential Playback
-- ============================================================

-- media_settings: controls how the agent uses its media folder
-- media_last_file_id: tracks position in sequential mode
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS media_settings JSONB NOT NULL DEFAULT '{
    "order": "random",
    "frequency": "always",
    "frequency_pct": 100,
    "include_body_text": true,
    "caption_source": "ai_generated",
    "caption_prefix": ""
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS media_last_file_id UUID REFERENCES media_files(id) ON DELETE SET NULL;

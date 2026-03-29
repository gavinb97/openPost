-- ============================================================
-- Migration 007: Media Context & Talking Points
-- Adds metadata fields so agents can write relevant captions
-- ============================================================

-- description: what this file is about (e.g. "Apple donated $2.3M to GOP PACs in 2024")
-- context_notes: bullet-point talking points for the AI to draw from
ALTER TABLE media_files
  ADD COLUMN IF NOT EXISTS context_notes TEXT;

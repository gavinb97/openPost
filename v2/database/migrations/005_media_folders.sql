-- ============================================================
-- Migration 005: Media Folders
-- ============================================================

-- Folders table
CREATE TABLE IF NOT EXISTS media_folders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  label       VARCHAR(100),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Add folder_id and original_name columns to media_files
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES media_folders(id) ON DELETE SET NULL;
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS original_name VARCHAR(500);
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill original_name from original_filename if that column exists
UPDATE media_files SET original_name = original_filename WHERE original_name IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_folders_user ON media_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_folder  ON media_files(folder_id);

-- Add media_folder_id to agents so an agent can use a folder as its media pool
ALTER TABLE agents ADD COLUMN IF NOT EXISTS media_folder_id UUID REFERENCES media_folders(id) ON DELETE SET NULL;

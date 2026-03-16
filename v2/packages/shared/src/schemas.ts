// ============================================================
// Zod Validation Schemas for API requests
// ============================================================

import { z } from 'zod';

// ---------- Auth ----------

export const RegisterSchema = z.object({
  username: z.string().min(3).max(64).regex(/^[a-zA-Z0-9_]+$/, 'Alphanumeric and underscores only'),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ---------- Agent ----------

export const CreateAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  personality_prompt: z.string().max(2000).optional(),
  model: z.enum(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo']).optional(),
  schedule_type: z.enum(['random', 'interval', 'cron', 'set_times', 'peak_hours', 'burst', 'business_hours']).optional(),
  schedule_config: z.record(z.unknown()).optional(),
  approval_mode: z.enum(['auto', 'review', 'auto_with_guardrails']).optional(),
  auto_post: z.boolean().optional(),
  auto_reply: z.boolean().optional(),
  auto_dm: z.boolean().optional(),
  auto_like: z.boolean().optional(),
  auto_follow: z.boolean().optional(),
  auto_retweet: z.boolean().optional(),
  auto_comment: z.boolean().optional(),
  auto_web_research: z.boolean().optional(),
  web_research_config: z.object({
    search_queries: z.array(z.string()).optional(),
    rss_feeds: z.array(z.string().url()).optional(),
    sources: z.object({
      reddit: z.boolean().optional(),
      duckduckgo: z.boolean().optional(),
      hackernews: z.boolean().optional(),
      rss: z.boolean().optional(),
    }).optional(),
    research_depth: z.enum(['basic', 'deep']).optional(),
  }).optional(),
  platform_account_ids: z.array(z.string().uuid()).optional(),
  subreddit_targets: z.array(z.string()).optional(),
  hashtag_targets: z.array(z.string()).optional(),
  topic_keywords: z.array(z.string()).optional(),
  dm_template: z.string().max(5000).nullable().optional(),
  dm_max_per_day: z.number().int().min(1).max(500).optional(),
  media_pool_ids: z.array(z.string().uuid()).optional(),
  media_folder_id: z.string().uuid().nullable().optional(),
  media_settings: z.object({
    order: z.enum(['random', 'sequential']).optional(),
    frequency: z.enum(['always', 'sometimes', 'never']).optional(),
    frequency_pct: z.number().int().min(1).max(100).optional(),
    include_body_text: z.boolean().optional(),
    caption_source: z.enum(['ai_generated', 'file_description', 'none']).optional(),
    caption_prefix_mode: z.enum(['static', 'hashtags', 'ai']).optional(),
    caption_prefix: z.string().max(500).optional(),
    caption_hashtags: z.array(z.string().max(100)).max(30).optional(),
  }).optional(),
});

export const UpdateAgentSchema = CreateAgentSchema.partial();

// ---------- Job ----------

export const CreateJobSchema = z.object({
  type: z.string(),
  platform: z.enum(['twitter', 'reddit', 'youtube', 'tiktok', 'facebook', 'instagram']),
  platform_account_id: z.string().uuid(),
  agent_id: z.string().uuid().optional(),
  schedule_type: z.enum(['random', 'interval', 'cron', 'set_times', 'peak_hours', 'burst', 'business_hours']).optional(),
  schedule_config: z.record(z.unknown()).optional(),
  content_config: z.record(z.unknown()).optional(),
  media_config: z.record(z.unknown()).optional(),
  subreddit_config: z.record(z.unknown()).optional(),
  duration: z.number().int().min(0).optional(),
});

// ---------- Content Generation ----------

export const GenerateContentSchema = z.object({
  platform: z.enum(['twitter', 'reddit', 'youtube', 'tiktok', 'facebook', 'instagram']),
  action_type: z.enum(['post', 'reply', 'dm', 'comment']),
  prompt: z.string().max(2000).optional(),
  system_prompt: z.string().max(2000).optional(),
  context: z.string().max(5000).optional(), // what we're replying to
  personality: z.string().max(2000).optional(),
  max_length: z.number().int().optional(),
  template_id: z.string().uuid().optional(),
});

// ---------- Content Template ----------

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  platform: z.enum(['twitter', 'reddit', 'youtube', 'tiktok', 'facebook', 'instagram']).nullable().optional(),
  template_type: z.enum(['post', 'reply', 'dm', 'comment']),
  system_prompt: z.string().max(2000).optional(),
  user_prompt: z.string().min(1).max(2000),
  model: z.enum(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo']).optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().min(50).max(4000).optional(),
  example_output: z.string().max(5000).optional(),
});

// ---------- Review ----------

export const ReviewActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  edited_content: z.string().optional(), // allow editing before approve
});

export const BulkReviewSchema = z.object({
  action_ids: z.array(z.string().uuid()),
  action: z.enum(['approve', 'reject']),
});

// ---------- Scrape ----------

export const ScrapeSchema = z.object({
  platform: z.enum(['twitter', 'reddit', 'youtube', 'tiktok']),
  community: z.string().min(1),
  agent_id: z.string().uuid().optional(),
});

// ---------- Media ----------

export const PresignUploadSchema = z.object({
  filename: z.string().min(1),
  mime_type: z.string().min(1),
  size_bytes: z.number().int().positive(),
  folder_id: z.string().uuid().optional(),
});

export const RegisterMediaSchema = z.object({
  s3_key: z.string().min(1),
  original_name: z.string(),
  mime_type: z.string(),
  size_bytes: z.number().int().positive(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  duration_seconds: z.number().optional(),
  description: z.string().optional(),
  categories: z.array(z.string()).optional(),
  nsfw: z.boolean().optional(),
  folder_id: z.string().uuid().optional(),
});

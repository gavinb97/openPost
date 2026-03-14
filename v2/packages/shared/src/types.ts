// ============================================================
// Core Type Definitions
// ============================================================

// ---------- Enums ----------

export type Platform = 'twitter' | 'reddit' | 'youtube' | 'tiktok' | 'facebook' | 'instagram';

export type ScheduleType = 'random' | 'interval' | 'cron' | 'set_times';

export type ApprovalMode = 'auto' | 'review' | 'auto_with_guardrails';

export type ActionType =
  | 'post' | 'reply' | 'dm' | 'like' | 'follow'
  | 'retweet' | 'comment' | 'subscribe' | 'scrape'
  | 'research_post';

export type ActionStatus =
  | 'queued' | 'processing' | 'published' | 'failed'
  | 'review' | 'rejected' | 'expired';

export type JobStatus = 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';

// ---------- User ----------

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // omitted in API responses
  pro: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- Platform Account ----------

export interface PlatformAccount {
  id: string;
  user_id: string;
  platform: Platform;
  platform_user_id: string | null;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---------- OAuth Token ----------

export interface OAuthToken {
  id: string;
  platform_account_id: string;
  access_token: string;
  refresh_token: string | null;
  token_secret: string | null;
  expires_at: string | null;
  scopes: string[] | null;
  code_verifier: string | null;
  raw_response: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---------- Media File ----------

export interface MediaFile {
  id: string;
  user_id: string;
  s3_key: string;
  s3_bucket: string;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  description: string | null;
  categories: string[];
  nsfw: boolean;
  created_at: string;
  // presigned URL (added at runtime, not in DB)
  url?: string;
}

// ---------- Agent ----------

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  personality_prompt: string;
  model: string;
  schedule_type: ScheduleType;
  schedule_config: ScheduleConfig;
  enabled: boolean;
  approval_mode: ApprovalMode;
  auto_post: boolean;
  auto_reply: boolean;
  auto_dm: boolean;
  auto_like: boolean;
  auto_follow: boolean;
  auto_retweet: boolean;
  auto_comment: boolean;
  auto_web_research: boolean;
  web_research_config: WebResearchConfig;
  platform_account_ids: string[];
  subreddit_targets: string[];
  hashtag_targets: string[];
  topic_keywords: string[];
  dm_template: string | null;
  dm_max_per_day: number;
  media_pool_ids: string[];
  remaining_media: string[];
  posts_made: number;
  replies_sent: number;
  dms_sent: number;
  likes_given: number;
  follows_made: number;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleConfig {
  min_minutes?: number;
  max_minutes?: number;
  interval_minutes?: number;
  cron_expression?: string;
  days?: number[];     // 0=Sun..6=Sat
  times?: string[];    // HH:mm
}

// ---------- Agent Action ----------

export interface AgentAction {
  id: string;
  agent_id: string;
  platform_account_id: string | null;
  action_type: ActionType;
  status: ActionStatus;
  content_text: string | null;
  media_file_id: string | null;
  target_post_id: string | null;
  target_user: string | null;
  target_subreddit: string | null;
  platform_post_id: string | null;
  platform_url: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  guardrail_score: number | null;
  guardrail_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  scheduled_at: string | null;
  executed_at: string | null;
  created_at: string;
}

// ---------- Agent Conversation (memory) ----------

export interface AgentConversation {
  id: string;
  agent_id: string;
  platform: Platform;
  platform_account_id: string | null;
  target_user: string;
  thread_id: string | null;
  context_summary: string | null;
  messages: ConversationMessage[];
  sentiment: string | null;
  topics: string[];
  interaction_count: number;
  last_interaction_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  role: 'agent' | 'user';
  content: string;
  timestamp: string;
  platform_id?: string;
}

// ---------- Job ----------

export interface Job {
  id: string;
  user_id: string;
  agent_id: string | null;
  type: string;
  status: JobStatus;
  platform: Platform;
  platform_account_id: string | null;
  schedule_type: ScheduleType;
  schedule_config: Record<string, unknown>;
  content_config: Record<string, unknown>;
  media_config: Record<string, unknown>;
  subreddit_config: Record<string, unknown>;
  duration: number;
  iterations_completed: number;
  iterations_total: number | null;
  last_execution_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- Job Execution ----------

export interface JobExecution {
  id: string;
  job_id: string;
  platform_account_id: string | null;
  status: ActionStatus;
  platform_post_id: string | null;
  content_text: string | null;
  media_url: string | null;
  error_message: string | null;
  retry_count: number;
  scheduled_at: string | null;
  executed_at: string | null;
  created_at: string;
}

// ---------- DM Target ----------

export interface DMTarget {
  id: string;
  user_id: string;
  agent_id: string | null;
  platform: Platform;
  target_username: string;
  source_community: string | null;
  messaged: boolean;
  messaged_at: string | null;
  response_received: boolean;
  created_at: string;
}

// ---------- Content Template ----------

export interface ContentTemplate {
  id: string;
  user_id: string;
  name: string;
  platform: Platform | null;
  template_type: string;
  system_prompt: string | null;
  user_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  example_output: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- API Response Wrappers ----------

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// ---------- Auth ----------

export interface AuthPayload {
  userId: string;
  username: string;
  email: string;
  pro: boolean;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'password'>;
}

// ---------- Queue Job Payloads ----------

export interface PostJobPayload {
  agent_id: string;
  platform_account_id: string;
  action_id: string;
  platform: Platform;
}

export interface ReplyJobPayload {
  agent_id: string;
  platform_account_id: string;
  action_id: string;
  platform: Platform;
  target_post_id: string;
  target_user: string;
}

export interface DMJobPayload {
  agent_id: string;
  platform_account_id: string;
  action_id: string;
  platform: Platform;
  target_user: string;
}

export interface EngageJobPayload {
  agent_id: string;
  platform_account_id: string;
  action_id: string;
  platform: Platform;
  action_type: 'like' | 'follow' | 'retweet' | 'subscribe';
  target_post_id?: string;
  target_user?: string;
}

export interface ScrapeJobPayload {
  agent_id: string;
  platform: Platform;
  community: string;
  user_id: string;
}

export interface WebResearchJobPayload {
  agent_id: string;
  platform_account_id: string;
  action_id: string;
  platform: Platform;
}

export interface WebResearchConfig {
  search_queries?: string[];
  rss_feeds?: string[];
  sources?: {
    reddit?: boolean;
    duckduckgo?: boolean;
    hackernews?: boolean;
    rss?: boolean;
  };
  research_depth?: 'basic' | 'deep';
}

export interface ResearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  timestamp?: string;
}

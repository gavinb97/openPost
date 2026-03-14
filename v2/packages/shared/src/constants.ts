// ============================================================
// Constants & Platform Configuration
// ============================================================

import type { Platform } from './types';

/** Platforms that are fully implemented */
export const ACTIVE_PLATFORMS: Platform[] = ['twitter', 'reddit', 'youtube', 'tiktok'];

/** Platforms stubbed as "Coming Soon" */
export const COMING_SOON_PLATFORMS: Platform[] = ['facebook', 'instagram'];

/** All platforms */
export const ALL_PLATFORMS: Platform[] = [...ACTIVE_PLATFORMS, ...COMING_SOON_PLATFORMS];

/** Queue names for BullMQ */
export const QUEUES = {
  POST: 'agent:post',
  REPLY: 'agent:reply',
  DM: 'agent:dm',
  ENGAGE: 'agent:engage',
  SCRAPE: 'agent:scrape',
  RESEARCH: 'agent:research',
  SCHEDULER: 'scheduler',
  TOKEN_REFRESH: 'token:refresh',
} as const;

/** Platform-specific rate limits (requests per window) */
export const RATE_LIMITS: Record<Platform, {
  posts_per_day: number;
  dms_per_day: number;
  likes_per_day: number;
  follows_per_day: number;
  replies_per_day: number;
  min_interval_seconds: number;
}> = {
  twitter: {
    posts_per_day: 50,
    dms_per_day: 500,
    likes_per_day: 1000,
    follows_per_day: 400,
    replies_per_day: 100,
    min_interval_seconds: 30,
  },
  reddit: {
    posts_per_day: 30,
    dms_per_day: 100,
    likes_per_day: 1000,
    follows_per_day: 0, // N/A
    replies_per_day: 100,
    min_interval_seconds: 60,
  },
  youtube: {
    posts_per_day: 6,     // video uploads
    dms_per_day: 0,       // N/A
    likes_per_day: 500,
    follows_per_day: 200, // subscribe
    replies_per_day: 200, // comments
    min_interval_seconds: 60,
  },
  tiktok: {
    posts_per_day: 10,
    dms_per_day: 0,       // Limited API access
    likes_per_day: 500,
    follows_per_day: 200,
    replies_per_day: 100,
    min_interval_seconds: 60,
  },
  facebook: {
    posts_per_day: 25,
    dms_per_day: 0,
    likes_per_day: 0,
    follows_per_day: 0,
    replies_per_day: 0,
    min_interval_seconds: 120,
  },
  instagram: {
    posts_per_day: 25,
    dms_per_day: 0,
    likes_per_day: 0,
    follows_per_day: 0,
    replies_per_day: 0,
    min_interval_seconds: 120,
  },
};

/** Default AI system prompts per action type */
export const DEFAULT_PROMPTS = {
  tweet: `You are a witty Gen Z / Millennial social media personality. 
Write a tweet that is engaging, authentic, and concise. 
Keep it under 280 characters. Do NOT use emojis unless specifically requested. 
Do NOT use hashtags unless specifically requested.`,

  reddit_title: `You are a witty social media user writing a Reddit post title.
Make it intriguing, clickable, and authentic. Keep it under 100 characters.
Match the tone of the target subreddit.`,

  reddit_body: `You are a master storyteller writing a Reddit post body.
Be authentic, engaging, and match the community's culture.
Use proper Reddit formatting (markdown). Be conversational.`,

  reply: `You are replying to a social media post or comment.
Be conversational, witty, and relevant to what they said.
Keep it natural — don't be overly enthusiastic or salesy.`,

  dm: `You are sending a direct message to someone.
Be friendly, casual, and genuine. Don't be spammy.
Reference shared interests when possible.`,

  comment: `You are commenting on a social media post.
Be insightful, add value to the conversation.
Keep it concise and natural.`,

  research_post: `You are creating a social media post based on recent news and trending topics.
Synthesize the research into an engaging, informative post in your unique voice.
Reference specific facts or developments naturally — don't just summarize headlines.
Add your own take, insight, or hot take to make it compelling.
Do NOT include URLs or links in the post itself.`,
} as const;

/** Guardrail keywords that trigger review in auto_with_guardrails mode */
export const GUARDRAIL_FLAGS = [
  // Violence/harm
  'kill', 'murder', 'suicide', 'harm', 'attack', 'bomb', 'weapon',
  // Hate speech markers
  'hate', 'slur', 'racist', 'sexist',
  // Spam markers
  'buy now', 'limited offer', 'click here', 'act fast', 'dm me',
  // NSFW
  'nsfw', 'explicit', 'nude',
  // Legal risk
  'guarantee', 'investment advice', 'not financial advice',
] as const;

/** Max character limits per platform */
export const CHAR_LIMITS: Record<Platform, { post: number; reply: number; dm: number }> = {
  twitter: { post: 280, reply: 280, dm: 10000 },
  reddit: { post: 40000, reply: 10000, dm: 10000 },
  youtube: { post: 5000, reply: 10000, dm: 0 },
  tiktok: { post: 2200, reply: 150, dm: 0 },
  facebook: { post: 63206, reply: 8000, dm: 0 },
  instagram: { post: 2200, reply: 2200, dm: 0 },
};

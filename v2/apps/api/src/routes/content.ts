// ============================================================
// Content Routes — AI generation + templates
// ============================================================

import { Router } from 'express';
import OpenAI from 'openai';
import { config } from '../config';
import { query, queryOne } from '../db';
import { requireAuth } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { GenerateContentSchema, CreateTemplateSchema } from '@onlyposts/shared';
import { DEFAULT_PROMPTS, CHAR_LIMITS, GUARDRAIL_FLAGS } from '@onlyposts/shared';
import type { ContentTemplate, Platform } from '@onlyposts/shared';

export const contentRouter = Router();
contentRouter.use(requireAuth);

const openai = new OpenAI({ apiKey: config.openai.apiKey });

// ---------- Generate content ----------

contentRouter.post('/generate', asyncHandler(async (req, res) => {
  const data = GenerateContentSchema.parse(req.body);

  // Build system prompt
  let systemPrompt = data.system_prompt || '';
  if (data.template_id) {
    const template = await queryOne<ContentTemplate>(
      'SELECT * FROM content_templates WHERE id = $1 AND user_id = $2',
      [data.template_id, req.user!.userId],
    );
    if (template) {
      systemPrompt = template.system_prompt || '';
    }
  }
  if (!systemPrompt) {
    // Default prompts based on action type
    const key = data.action_type as keyof typeof DEFAULT_PROMPTS;
    systemPrompt = DEFAULT_PROMPTS[key] || DEFAULT_PROMPTS.tweet;
  }

  // Add personality
  if (data.personality) {
    systemPrompt += `\n\nYour personality: ${data.personality}`;
  }

  // Add platform constraints
  const charLimit = CHAR_LIMITS[data.platform]?.[data.action_type as 'post' | 'reply' | 'dm'] || 1000;
  systemPrompt += `\n\nMax length: ${data.max_length || charLimit} characters.`;

  // Build user prompt
  let userPrompt = data.prompt || 'Create an engaging social media post.';
  if (data.context) {
    userPrompt = `Context (what you're replying to): ${data.context}\n\n${userPrompt}`;
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 500,
    temperature: 0.8,
  });

  const content = completion.choices[0]?.message?.content?.trim() || '';

  // Run guardrail check
  const flagged = GUARDRAIL_FLAGS.filter((flag) =>
    content.toLowerCase().includes(flag.toLowerCase()),
  );
  const guardrailScore = flagged.length === 0 ? 1.0 : Math.max(0, 1 - flagged.length * 0.2);

  res.json({
    ok: true,
    data: {
      content,
      guardrail_score: guardrailScore,
      flagged_terms: flagged,
      model: 'gpt-4o',
      tokens_used: completion.usage?.total_tokens || 0,
    },
  });
}));

// ---------- Preview content (no DB storage) ----------

contentRouter.post('/preview', asyncHandler(async (req, res) => {
  const { platform, text } = req.body;
  if (!text) throw new AppError(400, 'Text required');

  const charLimit = CHAR_LIMITS[platform as Platform]?.post || 1000;
  const flagged = GUARDRAIL_FLAGS.filter((flag) =>
    text.toLowerCase().includes(flag.toLowerCase()),
  );

  res.json({
    ok: true,
    data: {
      length: text.length,
      max_length: charLimit,
      over_limit: text.length > charLimit,
      guardrail_score: flagged.length === 0 ? 1.0 : Math.max(0, 1 - flagged.length * 0.2),
      flagged_terms: flagged,
    },
  });
}));

// ============================================================
// CONTENT TEMPLATES
// ============================================================

// ---------- List templates ----------

contentRouter.get('/templates', asyncHandler(async (req, res) => {
  const templates = await query<ContentTemplate>(
    'SELECT * FROM content_templates WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user!.userId],
  );
  res.json({ ok: true, data: templates });
}));

// ---------- Create template ----------

contentRouter.post('/templates', asyncHandler(async (req, res) => {
  const data = CreateTemplateSchema.parse(req.body);

  const template = await queryOne<ContentTemplate>(
    `INSERT INTO content_templates (
      user_id, name, platform, template_type, system_prompt,
      user_prompt, model, temperature, max_tokens, example_output
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      req.user!.userId, data.name, data.platform || null, data.template_type,
      data.system_prompt || null, data.user_prompt, data.model || 'gpt-4o',
      data.temperature || 0.8, data.max_tokens || 500, data.example_output || null,
    ],
  );

  res.status(201).json({ ok: true, data: template });
}));

// ---------- Update template ----------

contentRouter.put('/templates/:id', asyncHandler(async (req, res) => {
  const data = CreateTemplateSchema.partial().parse(req.body);

  const setClauses: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      setClauses.push(`${key} = $${idx++}`);
      values.push(val);
    }
  }

  if (setClauses.length === 0) throw new AppError(400, 'Nothing to update');

  values.push(req.params.id);
  values.push(req.user!.userId);

  const template = await queryOne<ContentTemplate>(
    `UPDATE content_templates SET ${setClauses.join(', ')}
     WHERE id = $${idx++} AND user_id = $${idx}
     RETURNING *`,
    values,
  );

  if (!template) throw new AppError(404, 'Template not found');
  res.json({ ok: true, data: template });
}));

// ---------- Delete template ----------

contentRouter.delete('/templates/:id', asyncHandler(async (req, res) => {
  const result = await queryOne(
    'DELETE FROM content_templates WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user!.userId],
  );
  if (!result) throw new AppError(404, 'Template not found');
  res.json({ ok: true, message: 'Template deleted' });
}));

// ============================================================
// VIRAL HOOK GENERATOR
// Generate 5 punchy opening hooks to maximize engagement
// ============================================================

contentRouter.post('/hooks', asyncHandler(async (req, res) => {
  const { topic, platform = 'twitter', count = 5, style } = req.body;
  if (!topic) throw new AppError(400, 'Topic is required');

  const styleGuide = {
    twitter: 'Punchy 1-sentence hooks, max 100 chars each. No hashtags.',
    tiktok: 'First-person, energetic, trend-aware. Must make someone stop scrolling.',
    reddit: 'Curiosity-driven. Reads like a compelling post title. Authentic, not clickbait.',
    youtube: 'Question or bold statement that makes viewers want to watch. SEO-friendly.',
    general: 'Attention-grabbing opening lines that make people stop and read more.',
  };

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a viral social media expert who specializes in writing hooks that stop the scroll.
Platform: ${platform}. Style: ${styleGuide[platform as keyof typeof styleGuide] || styleGuide.general}
${style ? `Tone/style: ${style}` : ''}
Generate exactly ${count} different hooks for the given topic.
Return ONLY a JSON array of strings: ["hook1", "hook2", ...]
No explanation, no numbering, just the JSON array.`,
      },
      { role: 'user', content: `Topic: ${topic}` },
    ],
    max_tokens: 600,
    temperature: 0.9,
    response_format: { type: 'json_object' },
  });

  let hooks: string[] = [];
  try {
    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    hooks = Array.isArray(parsed) ? parsed : (parsed.hooks || parsed.items || Object.values(parsed).flat());
  } catch {
    hooks = (completion.choices[0]?.message?.content || '').split('\n').filter((l: string) => l.trim());
  }

  res.json({
    ok: true,
    data: {
      hooks: hooks.slice(0, count),
      platform,
      topic,
      tokens_used: completion.usage?.total_tokens || 0,
    },
  });
}));

// ============================================================
// HASHTAG RECOMMENDER
// Generate platform-optimized hashtags for a topic
// ============================================================

contentRouter.post('/hashtags', asyncHandler(async (req, res) => {
  const { topic, platform = 'twitter', count = 10, niche } = req.body;
  if (!topic) throw new AppError(400, 'Topic is required');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a social media hashtag expert.
Generate exactly ${count} hashtags for ${platform} about the given topic.
${niche ? `Niche context: ${niche}` : ''}
Mix viral/popular hashtags with niche-specific ones for maximum reach.
For Twitter: include 2-3 trending + 3-4 niche. For TikTok/Instagram: 5-7 niche + 3-4 trending.
Return ONLY a JSON object: {"hashtags": ["#tag1", "#tag2", ...], "trending": ["#tag1"], "niche": ["#tag2"]}`,
      },
      { role: 'user', content: `Topic: ${topic}` },
    ],
    max_tokens: 300,
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  let result = { hashtags: [], trending: [], niche: [] };
  try {
    result = JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch {
    // fallback
  }

  res.json({ ok: true, data: result });
}));

// ============================================================
// TWITTER THREAD BUILDER
// Generate a multi-tweet thread from a topic or base content
// ============================================================

contentRouter.post('/thread', asyncHandler(async (req, res) => {
  const { topic, base_content, tweet_count = 6, personality, include_hook = true, include_cta } = req.body;
  if (!topic && !base_content) throw new AppError(400, 'topic or base_content required');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a viral Twitter/X thread writer. Create a ${tweet_count}-tweet thread.
Rules:
- Each tweet: max 280 characters
- Tweet 1 MUST be a scroll-stopping hook
- Build tension/interest throughout — don't give everything away at once
- Last tweet: strong CTA or memorable takeaway${include_cta ? `: "${include_cta}"` : ''}
- Number each tweet naturally (1/ 2/ 3/ etc.)
- Make each tweet standalone-readable but better in sequence
${personality ? `Voice/personality: ${personality}` : 'Voice: authoritative but conversational, like a knowledgeable friend'}
Return ONLY a JSON array of tweet strings: ["tweet1", "tweet2", ...]`,
      },
      {
        role: 'user',
        content: [
          topic ? `Topic: ${topic}` : '',
          base_content ? `Content to thread-ify: ${base_content}` : '',
        ].filter(Boolean).join('\n'),
      },
    ],
    max_tokens: 1200,
    temperature: 0.8,
    response_format: { type: 'json_object' },
  });

  let tweets: string[] = [];
  try {
    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    tweets = Array.isArray(parsed) ? parsed : (parsed.tweets || parsed.thread || Object.values(parsed).flat());
  } catch {
    tweets = [];
  }

  res.json({
    ok: true,
    data: {
      tweets: tweets.slice(0, tweet_count),
      tweet_count: tweets.length,
      total_chars: tweets.reduce((sum: number, t: string) => sum + t.length, 0),
      tokens_used: completion.usage?.total_tokens || 0,
    },
  });
}));

// ============================================================
// VIRAL SCORE — analyze content virality potential
// ============================================================

contentRouter.post('/viral-score', asyncHandler(async (req, res) => {
  const { content, platform = 'twitter' } = req.body;
  if (!content) throw new AppError(400, 'Content is required');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a social media virality expert. Analyze content and score its viral potential.
Return a JSON object with:
{
  "score": <0-100 overall virality score>,
  "hook_strength": <0-10>,
  "clarity": <0-10>,
  "emotion": <0-10>,
  "shareability": <0-10>,
  "platform_fit": <0-10>,
  "weaknesses": ["specific issue 1", "specific issue 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "rewrite": "optional improved version under 280 chars if platform is twitter"
}`,
      },
      { role: 'user', content: `Platform: ${platform}\nContent: "${content}"` },
    ],
    max_tokens: 500,
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  let analysis = {};
  try {
    analysis = JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch {
    analysis = { score: 50, error: 'Analysis failed' };
  }

  res.json({ ok: true, data: analysis });
}));

// ============================================================
// BEST TIME TO POST recommendation
// ============================================================

contentRouter.get('/best-times', asyncHandler(async (req, res) => {
  const { platform = 'twitter', timezone = 'America/New_York' } = req.query;

  // Research-backed optimal posting times per platform
  const BEST_TIMES: Record<string, { times: string[]; note: string }> = {
    twitter: {
      times: ['Mon 9am', 'Wed 9am', 'Fri 9am', 'Tue 12pm', 'Thu 3pm'],
      note: 'Highest engagement: Tue-Thu 9am-3pm ET. Avoid weekends for B2B, they work for B2C.',
    },
    reddit: {
      times: ['Mon 6am', 'Sat 8am', 'Sun 8am', 'Tue 6am', 'Fri 6am'],
      note: 'Peak Reddit traffic: early morning (6-9am ET) and weekends. Earlier = more upvote runway.',
    },
    youtube: {
      times: ['Thu 3pm', 'Fri 3pm', 'Sat 9am', 'Sun 9am', 'Tue 2pm'],
      note: 'YouTube peaks Thu-Sat. Upload 2-3 hours before peak viewing time in your audience TZ.',
    },
    tiktok: {
      times: ['Tue 9am', 'Thu 12pm', 'Fri 5am', 'Sat 11am', 'Sun 7pm'],
      note: 'TikTok is 24/7 but early morning and after 5pm ET drive most views within first 2 hours.',
    },
    facebook: {
      times: ['Wed 11am', 'Wed 1pm', 'Tue 12pm', 'Mon 3pm', 'Thu 11am'],
      note: 'Facebook engagement peaks mid-week. Avoid evenings and early mornings.',
    },
    instagram: {
      times: ['Mon 11am', 'Wed 11am', 'Fri 10am', 'Tue 11am', 'Thu 11am'],
      note: 'Instagram peaks weekdays 11am-2pm. Reels discovery happens 24+ hours after posting.',
    },
  };

  const data = BEST_TIMES[platform as string] || BEST_TIMES.twitter;
  res.json({ ok: true, data: { platform, timezone, ...data } });
}));

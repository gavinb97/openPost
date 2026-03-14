// ============================================================
// Campaign Routes — Multi-platform blast campaigns
// ============================================================
// A Campaign lets you write content once, then dispatch it to
// every connected platform simultaneously (or on a schedule).
// The AI adapts the base content for each platform's style,
// tone, and character limits automatically.

import { Router } from 'express';
import OpenAI from 'openai';
import { config } from '../config';
import { query, queryOne } from '../db';
import { requireAuth } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { CHAR_LIMITS } from '@onlyposts/shared';
import type { Platform } from '@onlyposts/shared';

export const campaignsRouter = Router();
campaignsRouter.use(requireAuth);

const openai = new OpenAI({ apiKey: config.openai.apiKey });

// Platform-specific style guidance for AI adaptation
const PLATFORM_STYLE: Record<Platform, string> = {
  twitter: 'Twitter/X post: max 280 chars, punchy hook, no hashtag spam (0-2 max), conversational, can end with a question to drive replies. Do NOT use em-dashes.',
  reddit: 'Reddit post: authentic, storytelling tone, match community culture, can be longer (up to 500 chars for body), no overt selling, provide genuine value first.',
  youtube: 'YouTube community post or video description: engaging, keyword-rich, calls to action ("Watch now", "Subscribe"), include relevant hashtags (3-5).',
  tiktok: 'TikTok caption: max 220 chars, trend-aware, energetic, use 3-5 viral hashtags relevant to the content, hook people in first 2 words.',
  facebook: 'Facebook post: conversational, slightly longer okay (1-3 sentences), community-focused, good for sharing stories, include a question to drive comments.',
  instagram: 'Instagram caption: visually descriptive, lifestyle-oriented, 2-3 sentences max then hashtags on new lines, use 5-10 relevant hashtags.',
};

// ============================================================
// LIST CAMPAIGNS
// ============================================================

campaignsRouter.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;
  const status = req.query.status as string | undefined;

  const statusClause = status ? `AND c.status = $3` : '';
  const params: any[] = [req.user!.userId, limit];
  if (status) params.push(status);

  const campaigns = await query(
    `SELECT c.*,
            COUNT(cp.id)::int as post_count,
            COUNT(cp.id) FILTER (WHERE cp.status = 'published')::int as published_count,
            COUNT(cp.id) FILTER (WHERE cp.status = 'failed')::int as failed_count
     FROM campaigns c
     LEFT JOIN campaign_posts cp ON cp.campaign_id = c.id
     WHERE c.user_id = $1
     ${statusClause}
     GROUP BY c.id
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET ${offset}`,
    params,
  );

  const [{ count }] = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM campaigns WHERE user_id = $1`,
    [req.user!.userId],
  );

  res.json({ ok: true, data: { campaigns, total: parseInt(count), page, limit } });
}));

// ============================================================
// GET SINGLE CAMPAIGN
// ============================================================

campaignsRouter.get('/:id', asyncHandler(async (req, res) => {
  const campaign = await queryOne(
    `SELECT c.*, mf.s3_key as media_s3_key, mf.mime_type as media_type
     FROM campaigns c
     LEFT JOIN media_files mf ON mf.id = c.base_media_id
     WHERE c.id = $1 AND c.user_id = $2`,
    [req.params.id, req.user!.userId],
  );
  if (!campaign) throw new AppError(404, 'Campaign not found');

  const posts = await query(
    `SELECT cp.*, pa.handle as account_handle, pa.display_name as account_name
     FROM campaign_posts cp
     LEFT JOIN platform_accounts pa ON pa.id = cp.platform_account_id
     WHERE cp.campaign_id = $1
     ORDER BY cp.platform, cp.created_at`,
    [req.params.id],
  );

  res.json({ ok: true, data: { campaign, posts } });
}));

// ============================================================
// CREATE CAMPAIGN
// ============================================================

campaignsRouter.post('/', asyncHandler(async (req, res) => {
  const {
    name,
    campaign_type = 'blast',
    base_content,
    base_media_id,
    use_ai_adaptation = true,
    ai_personality,
    topic,
    target_audience,
    call_to_action,
    hashtags = [],
    schedule_mode = 'immediate',
    scheduled_at,
    drip_interval_hours = 24,
    platform_account_ids = [],  // [{platform_account_id, platform, content_override?, thread_posts?}]
  } = req.body;

  if (!name) throw new AppError(400, 'Campaign name is required');
  if (!base_content && !topic) throw new AppError(400, 'Either base_content or topic is required');

  // Validate platform accounts belong to user
  if (platform_account_ids.length > 0) {
    const accountIds = platform_account_ids.map((p: any) => p.platform_account_id).filter(Boolean);
    if (accountIds.length > 0) {
      const owned = await query(
        `SELECT id FROM platform_accounts WHERE id = ANY($1::uuid[]) AND user_id = $2`,
        [accountIds, req.user!.userId],
      );
      if (owned.length !== accountIds.length) {
        throw new AppError(403, 'One or more platform accounts do not belong to you');
      }
    }
  }

  // Create the campaign
  const campaign = await queryOne(
    `INSERT INTO campaigns (
       user_id, name, campaign_type, base_content, base_media_id,
       use_ai_adaptation, ai_personality, topic, target_audience, call_to_action,
       hashtags, schedule_mode, scheduled_at, drip_interval_hours,
       posts_total, posts_pending, status
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     RETURNING *`,
    [
      req.user!.userId, name, campaign_type, base_content || null, base_media_id || null,
      use_ai_adaptation, ai_personality || null, topic || null, target_audience || null,
      call_to_action || null, hashtags, schedule_mode,
      scheduled_at || null, drip_interval_hours,
      platform_account_ids.length, platform_account_ids.length,
      schedule_mode === 'immediate' ? 'active' : 'scheduled',
    ],
  );

  // Create campaign posts for each target account
  if (platform_account_ids.length > 0) {
    for (const target of platform_account_ids) {
      const scheduleAt = schedule_mode === 'immediate' ? new Date() : new Date(scheduled_at);
      await query(
        `INSERT INTO campaign_posts (
           campaign_id, platform_account_id, platform,
           content_text, media_file_id, thread_posts, is_thread,
           status, scheduled_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          campaign!.id,
          target.platform_account_id || null,
          target.platform,
          target.content_override || base_content || null,
          target.media_file_id || base_media_id || null,
          JSON.stringify(target.thread_posts || []),
          target.is_thread || false,
          'pending',
          scheduleAt.toISOString(),
        ],
      );
    }
  }

  res.status(201).json({ ok: true, data: { campaign } });
}));

// ============================================================
// UPDATE CAMPAIGN
// ============================================================

campaignsRouter.put('/:id', asyncHandler(async (req, res) => {
  const existing = await queryOne(
    `SELECT id, status FROM campaigns WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user!.userId],
  );
  if (!existing) throw new AppError(404, 'Campaign not found');
  if (['completed', 'active'].includes(existing.status)) {
    throw new AppError(409, 'Cannot edit a campaign that is active or completed. Pause it first.');
  }

  const allowed = ['name', 'base_content', 'base_media_id', 'topic', 'target_audience',
    'call_to_action', 'hashtags', 'ai_personality', 'schedule_mode', 'scheduled_at',
    'drip_interval_hours', 'use_ai_adaptation'];

  const setClauses: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      setClauses.push(`${key} = $${idx++}`);
      values.push(req.body[key]);
    }
  }

  if (setClauses.length === 0) throw new AppError(400, 'Nothing to update');
  values.push(req.params.id);
  values.push(req.user!.userId);

  const campaign = await queryOne(
    `UPDATE campaigns SET ${setClauses.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
    values,
  );

  res.json({ ok: true, data: { campaign } });
}));

// ============================================================
// DELETE CAMPAIGN
// ============================================================

campaignsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const result = await queryOne(
    `DELETE FROM campaigns WHERE id = $1 AND user_id = $2 AND status NOT IN ('active') RETURNING id`,
    [req.params.id, req.user!.userId],
  );
  if (!result) throw new AppError(404, 'Campaign not found or is currently active (pause it first)');
  res.json({ ok: true, message: 'Campaign deleted' });
}));

// ============================================================
// PAUSE / RESUME
// ============================================================

campaignsRouter.post('/:id/pause', asyncHandler(async (req, res) => {
  const campaign = await queryOne(
    `UPDATE campaigns SET status = 'paused' WHERE id = $1 AND user_id = $2 AND status = 'active' RETURNING id, status`,
    [req.params.id, req.user!.userId],
  );
  if (!campaign) throw new AppError(404, 'Campaign not found or not active');
  res.json({ ok: true, data: { campaign } });
}));

campaignsRouter.post('/:id/resume', asyncHandler(async (req, res) => {
  const campaign = await queryOne(
    `UPDATE campaigns SET status = 'active' WHERE id = $1 AND user_id = $2 AND status = 'paused' RETURNING id, status`,
    [req.params.id, req.user!.userId],
  );
  if (!campaign) throw new AppError(404, 'Campaign not found or not paused');
  res.json({ ok: true, data: { campaign } });
}));

// ============================================================
// AI-ADAPT CONTENT FOR A SPECIFIC PLATFORM
// Generates platform-optimized content from base content/topic
// ============================================================

campaignsRouter.post('/:id/adapt', asyncHandler(async (req, res) => {
  const { platform, platform_post_id } = req.body;
  if (!platform) throw new AppError(400, 'Platform required');

  const campaign = await queryOne(
    `SELECT * FROM campaigns WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user!.userId],
  );
  if (!campaign) throw new AppError(404, 'Campaign not found');

  const baseText = campaign.base_content || '';
  const platformStyle = PLATFORM_STYLE[platform as Platform] || 'Write a good social media post.';
  const charLimit = CHAR_LIMITS[platform as Platform]?.post || 1000;

  const systemPrompt = [
    `You are an expert social media marketer specializing in app growth and viral content.`,
    `Adapt the following content for ${platform.toUpperCase()}.`,
    `Style guide: ${platformStyle}`,
    campaign.ai_personality ? `Your personality/voice: ${campaign.ai_personality}` : '',
    campaign.target_audience ? `Target audience: ${campaign.target_audience}` : '',
    campaign.call_to_action ? `Include this call to action naturally: "${campaign.call_to_action}"` : '',
    `Max length: ${charLimit} characters. Return ONLY the post text, nothing else.`,
  ].filter(Boolean).join('\n');

  const userPrompt = [
    campaign.topic ? `Topic: ${campaign.topic}` : '',
    baseText ? `Base content to adapt: "${baseText}"` : '',
    campaign.hashtags?.length ? `Hashtag pool (use relevant ones): ${campaign.hashtags.join(' ')}` : '',
  ].filter(Boolean).join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt || 'Create an engaging social media post.' },
    ],
    max_tokens: 600,
    temperature: 0.85,
  });

  const adaptedContent = completion.choices[0]?.message?.content?.trim() || '';

  // If a specific campaign_post id was provided, update it
  if (platform_post_id) {
    await query(
      `UPDATE campaign_posts SET adapted_content = $1 WHERE id = $2 AND campaign_id = $3`,
      [adaptedContent, platform_post_id, req.params.id],
    );
  }

  res.json({
    ok: true,
    data: {
      platform,
      adapted_content: adaptedContent,
      char_count: adaptedContent.length,
      char_limit: charLimit,
    },
  });
}));

// ============================================================
// BULK AI ADAPT — adapt content for ALL platforms in one shot
// ============================================================

campaignsRouter.post('/:id/adapt-all', asyncHandler(async (req, res) => {
  const campaign = await queryOne(
    `SELECT * FROM campaigns WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user!.userId],
  );
  if (!campaign) throw new AppError(404, 'Campaign not found');

  const posts = await query(
    `SELECT id, platform FROM campaign_posts WHERE campaign_id = $1`,
    [req.params.id],
  );

  const results: Record<string, string> = {};

  // Generate adaptations for each unique platform in parallel
  const uniquePlatforms = [...new Set(posts.map((p: any) => p.platform as Platform))];

  await Promise.all(uniquePlatforms.map(async (platform) => {
    const platformStyle = PLATFORM_STYLE[platform] || '';
    const charLimit = CHAR_LIMITS[platform]?.post || 1000;

    const systemPrompt = [
      `You are an expert social media marketer specializing in app growth and viral content.`,
      `Adapt the following content for ${platform.toUpperCase()}.`,
      `Style guide: ${platformStyle}`,
      campaign.ai_personality ? `Your personality/voice: ${campaign.ai_personality}` : '',
      campaign.target_audience ? `Target audience: ${campaign.target_audience}` : '',
      campaign.call_to_action ? `Include this call to action naturally: "${campaign.call_to_action}"` : '',
      `Max length: ${charLimit} characters. Return ONLY the post text, nothing else.`,
    ].filter(Boolean).join('\n');

    const userPrompt = [
      campaign.topic ? `Topic: ${campaign.topic}` : '',
      campaign.base_content ? `Base content to adapt: "${campaign.base_content}"` : '',
      campaign.hashtags?.length ? `Hashtag pool (use relevant ones): ${campaign.hashtags.join(' ')}` : '',
    ].filter(Boolean).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt || 'Create an engaging social media post.' },
      ],
      max_tokens: 600,
      temperature: 0.85,
    });

    const adapted = completion.choices[0]?.message?.content?.trim() || '';
    results[platform] = adapted;

    // Update all posts for this platform
    const platformPosts = posts.filter((p: any) => p.platform === platform);
    for (const post of platformPosts) {
      await query(
        `UPDATE campaign_posts SET adapted_content = $1, use_adapted = true WHERE id = $2`,
        [adapted, post.id],
      );
    }
  }));

  res.json({ ok: true, data: { adaptations: results } });
}));

// ============================================================
// LAUNCH CAMPAIGN — dispatch pending posts to queue
// ============================================================

campaignsRouter.post('/:id/launch', asyncHandler(async (req, res) => {
  const campaign = await queryOne(
    `SELECT * FROM campaigns WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user!.userId],
  );
  if (!campaign) throw new AppError(404, 'Campaign not found');
  if (campaign.status === 'completed') throw new AppError(409, 'Campaign already completed');

  // Get pending posts
  const pendingPosts = await query(
    `SELECT cp.*, pa.platform_user_id, pa.handle
     FROM campaign_posts cp
     LEFT JOIN platform_accounts pa ON pa.id = cp.platform_account_id
     WHERE cp.campaign_id = $1 AND cp.status = 'pending'`,
    [req.params.id],
  );

  if (pendingPosts.length === 0) {
    throw new AppError(409, 'No pending posts to launch');
  }

  // Mark posts as queued
  await query(
    `UPDATE campaign_posts SET status = 'queued' WHERE campaign_id = $1 AND status = 'pending'`,
    [req.params.id],
  );

  // Update campaign status
  await query(
    `UPDATE campaigns SET status = 'active', posts_pending = 0 WHERE id = $1`,
    [req.params.id],
  );

  // NOTE: In production, push to BullMQ here.
  // For now the worker polls for queued campaign posts.
  // await campaignQueue.addBulk(pendingPosts.map(post => ({ name: 'campaign-post', data: post })));

  res.json({
    ok: true,
    data: {
      queued: pendingPosts.length,
      campaign_id: campaign.id,
    },
    message: `${pendingPosts.length} posts queued for publishing`,
  });
}));

// ============================================================
// UPDATE SINGLE CAMPAIGN POST (edit content before launch)
// ============================================================

campaignsRouter.put('/:id/posts/:postId', asyncHandler(async (req, res) => {
  const { content_text, adapted_content, use_adapted, thread_posts, is_thread, media_file_id } = req.body;

  // Verify ownership via campaign
  const campaign = await queryOne(
    `SELECT id FROM campaigns WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user!.userId],
  );
  if (!campaign) throw new AppError(404, 'Campaign not found');

  const post = await queryOne(
    `UPDATE campaign_posts SET
       content_text = COALESCE($1, content_text),
       adapted_content = COALESCE($2, adapted_content),
       use_adapted = COALESCE($3, use_adapted),
       thread_posts = COALESCE($4, thread_posts),
       is_thread = COALESCE($5, is_thread),
       media_file_id = COALESCE($6, media_file_id)
     WHERE id = $7 AND campaign_id = $8
     RETURNING *`,
    [
      content_text ?? null, adapted_content ?? null, use_adapted ?? null,
      thread_posts ? JSON.stringify(thread_posts) : null, is_thread ?? null,
      media_file_id ?? null, req.params.postId, req.params.id,
    ],
  );
  if (!post) throw new AppError(404, 'Campaign post not found');
  res.json({ ok: true, data: { post } });
}));

// ============================================================
// CALENDAR — get all scheduled posts (campaigns + standalone)
// ============================================================

campaignsRouter.get('/calendar/upcoming', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const start = req.query.start ? new Date(req.query.start as string) : new Date();
  const end = req.query.end
    ? new Date(req.query.end as string)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days out

  // Campaign posts
  const campaignPosts = await query(
    `SELECT
       cp.id, cp.platform, cp.status, cp.scheduled_at, cp.published_at,
       cp.content_text, cp.adapted_content, cp.use_adapted, cp.platform_url,
       pa.handle as account_handle,
       c.name as campaign_name, c.id as campaign_id,
       'campaign' as source_type
     FROM campaign_posts cp
     JOIN campaigns c ON c.id = cp.campaign_id
     LEFT JOIN platform_accounts pa ON pa.id = cp.platform_account_id
     WHERE c.user_id = $1
       AND cp.scheduled_at BETWEEN $2 AND $3
     ORDER BY cp.scheduled_at`,
    [userId, start.toISOString(), end.toISOString()],
  );

  // Standalone scheduled posts
  const scheduledPosts = await query(
    `SELECT
       sp.id, sp.platform, sp.status, sp.scheduled_at, sp.published_at,
       sp.content_text, sp.platform_url,
       pa.handle as account_handle,
       NULL as campaign_name, NULL as campaign_id,
       'standalone' as source_type
     FROM scheduled_posts sp
     LEFT JOIN platform_accounts pa ON pa.id = sp.platform_account_id
     WHERE sp.user_id = $1
       AND sp.scheduled_at BETWEEN $2 AND $3
     ORDER BY sp.scheduled_at`,
    [userId, start.toISOString(), end.toISOString()],
  );

  // Agent queued actions
  const agentActions = await query(
    `SELECT
       aa.id, aa.action_type as platform, aa.status, aa.scheduled_at,
       aa.executed_at as published_at, aa.content_text, aa.platform_url,
       pa.handle as account_handle, pa.platform,
       a.name as campaign_name, aa.agent_id as campaign_id,
       'agent' as source_type
     FROM agent_actions aa
     JOIN agents a ON a.id = aa.agent_id
     LEFT JOIN platform_accounts pa ON pa.id = aa.platform_account_id
     WHERE a.user_id = $1
       AND aa.scheduled_at BETWEEN $2 AND $3
       AND aa.action_type = 'post'
     ORDER BY aa.scheduled_at`,
    [userId, start.toISOString(), end.toISOString()],
  );

  const allEvents = [...campaignPosts, ...scheduledPosts, ...agentActions].sort(
    (a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
  );

  res.json({ ok: true, data: { events: allEvents, total: allEvents.length } });
}));

// ============================================================
// CREATE STANDALONE SCHEDULED POST (for calendar)
// ============================================================

campaignsRouter.post('/calendar/post', asyncHandler(async (req, res) => {
  const {
    platform_account_id,
    platform,
    content_text,
    media_file_id,
    thread_posts,
    is_thread,
    scheduled_at,
  } = req.body;

  if (!platform) throw new AppError(400, 'Platform is required');
  if (!content_text) throw new AppError(400, 'Content is required');
  if (!scheduled_at) throw new AppError(400, 'scheduled_at is required');

  if (platform_account_id) {
    const owned = await queryOne(
      `SELECT id FROM platform_accounts WHERE id = $1 AND user_id = $2`,
      [platform_account_id, req.user!.userId],
    );
    if (!owned) throw new AppError(403, 'Platform account does not belong to you');
  }

  const post = await queryOne(
    `INSERT INTO scheduled_posts (
       user_id, platform_account_id, platform,
       content_text, media_file_id, thread_posts, is_thread, scheduled_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      req.user!.userId, platform_account_id || null, platform,
      content_text, media_file_id || null,
      JSON.stringify(thread_posts || []), is_thread || false,
      new Date(scheduled_at).toISOString(),
    ],
  );

  res.status(201).json({ ok: true, data: { post } });
}));

campaignsRouter.delete('/calendar/post/:id', asyncHandler(async (req, res) => {
  const result = await queryOne(
    `DELETE FROM scheduled_posts WHERE id = $1 AND user_id = $2 AND status = 'scheduled' RETURNING id`,
    [req.params.id, req.user!.userId],
  );
  if (!result) throw new AppError(404, 'Scheduled post not found');
  res.json({ ok: true, message: 'Scheduled post deleted' });
}));

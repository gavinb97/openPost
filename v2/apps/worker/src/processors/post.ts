// ============================================================
// Post Processor — Handles post creation across platforms
// ============================================================

import { Worker, type Job as BullJob } from 'bullmq';
import { redis } from '../queues';
import { query, queryOne } from '../db';
import { generatePostContent } from '../ai';
import { QUEUES } from '@onlyposts/shared';
import type { Agent, OAuthToken, PlatformAccount, PostJobPayload, Platform, MediaFile, MediaSettings } from '@onlyposts/shared';

import crypto from 'crypto';
import { config } from '../config';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3 = new S3Client({
  region: config.s3.region,
  credentials: { accessKeyId: config.s3.accessKey, secretAccessKey: config.s3.secretKey },
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

// ============================================================
// Inline platform helpers
// ============================================================

async function getTokens(accountId: string): Promise<{ account: PlatformAccount; token: OAuthToken }> {
  const account = await queryOne<PlatformAccount>('SELECT * FROM platform_accounts WHERE id = $1', [accountId]);
  const token = await queryOne<OAuthToken>('SELECT * FROM oauth_tokens WHERE platform_account_id = $1', [accountId]);
  if (!account || !token) throw new Error(`Missing account/token for ${accountId}`);
  return { account, token };
}

// ============================================================
// S3 download helper
// ============================================================

async function downloadFromS3(bucket: string, key: string): Promise<Buffer> {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const res = await s3.send(cmd);
  if (!res.Body) throw new Error('Empty S3 response body');
  const chunks: Buffer[] = [];
  for await (const chunk of res.Body as Readable) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

// ============================================================
// Twitter helpers (OAuth 1.0a)
// ============================================================

async function twitterOAuthHeader(
  token: OAuthToken,
  url: string,
  method: string,
  extraParams: Record<string, string> = {},
): Promise<Record<string, string>> {
  const OAuth = (await import('oauth-1.0a')).default;
  const oauth = new OAuth({
    consumer: { key: config.twitter.appKey, secret: config.twitter.appSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(bs: string, k: string) { return crypto.createHmac('sha1', k).update(bs).digest('base64'); },
  });
  const tok = { key: token.access_token, secret: token.token_secret! };
  return oauth.toHeader(oauth.authorize({ url, method, data: extraParams }, tok));
}

/** Upload media buffer to Twitter and return media_id_string */
async function uploadToTwitter(
  token: OAuthToken,
  buffer: Buffer,
  mimeType: string,
  totalBytes: number,
): Promise<string> {
  // Determine media_category for Twitter
  const isVideo = mimeType.startsWith('video/');
  const isGif = mimeType === 'image/gif';
  const mediaCategory = isVideo ? 'tweet_video' : isGif ? 'tweet_gif' : 'tweet_image';
  const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';

  // ── INIT ──
  const initParams = { command: 'INIT', total_bytes: String(totalBytes), media_type: mimeType, media_category: mediaCategory };
  const initForm = new URLSearchParams(initParams);
  const initHeader = await twitterOAuthHeader(token, uploadUrl, 'POST', initParams);
  const initRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: { ...initHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: initForm.toString(),
  });
  const initData = await initRes.json() as any;
  if (!initRes.ok) throw new Error(`Twitter media INIT failed: ${JSON.stringify(initData)}`);
  const mediaId: string = initData.media_id_string;

  // ── APPEND (5 MB chunks) ──
  const CHUNK_SIZE = 5 * 1024 * 1024;
  let segmentIndex = 0;
  for (let offset = 0; offset < buffer.length; offset += CHUNK_SIZE) {
    const chunk = buffer.subarray(offset, offset + CHUNK_SIZE);

    // Build multipart body manually
    const boundary = `----TwitterUpload${crypto.randomBytes(8).toString('hex')}`;
    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="command"\r\n\r\nAPPEND\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="media_id"\r\n\r\n${mediaId}\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="segment_index"\r\n\r\n${segmentIndex}\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="media"\r\nContent-Type: application/octet-stream\r\n\r\n`,
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, chunk, footer]);

    const appendHeader = await twitterOAuthHeader(token, uploadUrl, 'POST');
    const appendRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: { ...appendHeader, 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body,
    });
    if (!appendRes.ok) {
      const txt = await appendRes.text();
      throw new Error(`Twitter media APPEND failed (segment ${segmentIndex}): ${txt}`);
    }
    segmentIndex++;
  }

  // ── FINALIZE ──
  const finalizeParams = { command: 'FINALIZE', media_id: mediaId };
  const finalizeForm = new URLSearchParams(finalizeParams);
  const finalizeHeader = await twitterOAuthHeader(token, uploadUrl, 'POST', finalizeParams);
  const finalizeRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: { ...finalizeHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: finalizeForm.toString(),
  });
  const finalizeData = await finalizeRes.json() as any;
  if (!finalizeRes.ok) throw new Error(`Twitter media FINALIZE failed: ${JSON.stringify(finalizeData)}`);

  // ── POLL for video processing ──
  if (finalizeData.processing_info) {
    await pollTwitterMediaProcessing(token, mediaId, uploadUrl);
  }

  return mediaId;
}

async function pollTwitterMediaProcessing(
  token: OAuthToken,
  mediaId: string,
  uploadUrl: string,
  maxWaitMs = 120_000,
): Promise<void> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const statusParams = { command: 'STATUS', media_id: mediaId };
    const statusHeader = await twitterOAuthHeader(token, uploadUrl, 'GET', statusParams);
    const statusRes = await fetch(
      `${uploadUrl}?command=STATUS&media_id=${mediaId}`,
      { headers: statusHeader },
    );
    const statusData = await statusRes.json() as any;
    const state: string = statusData.processing_info?.state ?? 'succeeded';

    if (state === 'succeeded') return;
    if (state === 'failed') throw new Error(`Twitter media processing failed: ${JSON.stringify(statusData.processing_info?.error)}`);

    const waitMs = (statusData.processing_info?.check_after_secs ?? 5) * 1000;
    await new Promise((r) => setTimeout(r, waitMs));
  }
  throw new Error('Twitter media processing timed out');
}

async function postToTwitter(
  token: OAuthToken,
  text: string,
  mediaId?: string,
): Promise<{ id: string; url: string }> {
  const OAuth = (await import('oauth-1.0a')).default;
  const oauth = new OAuth({
    consumer: { key: config.twitter.appKey, secret: config.twitter.appSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(bs: string, k: string) { return crypto.createHmac('sha1', k).update(bs).digest('base64'); },
  });

  const url = 'https://api.twitter.com/2/tweets';
  const tok = { key: token.access_token, secret: token.token_secret! };
  const header = oauth.toHeader(oauth.authorize({ url, method: 'POST' }, tok));

  const body: Record<string, any> = { text };
  if (mediaId) body.media = { media_ids: [mediaId] };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { ...header, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json() as any;
  if (!resp.ok) throw new Error(`Twitter post failed: ${JSON.stringify(data)}`);
  return { id: data.data.id, url: `https://twitter.com/i/status/${data.data.id}` };
}

async function postToReddit(
  token: OAuthToken,
  subreddit: string,
  title: string,
  text: string,
): Promise<{ id: string; url: string }> {
  const resp = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'User-Agent': config.reddit.userAgent,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ api_type: 'json', kind: 'self', sr: subreddit, title, text }),
  });
  const data = await resp.json() as any;
  const postData = data?.json?.data;
  if (!postData?.id) throw new Error(`Reddit post failed: ${JSON.stringify(data?.json?.errors)}`);
  return { id: postData.id, url: postData.url || `https://reddit.com${postData.permalink}` };
}

// ============================================================
// Media resolution — fetch file record, download, upload to platform
// ============================================================

async function resolveTwitterMedia(
  token: OAuthToken,
  mediaFileId: string,
): Promise<string | null> {
  const file = await queryOne<MediaFile>(
    'SELECT * FROM media_files WHERE id = $1',
    [mediaFileId],
  );
  if (!file) {
    console.warn(`[Post] media_file_id ${mediaFileId} not found in DB`);
    return null;
  }

  console.log(`[Post] Downloading media from S3: ${file.s3_key}`);
  const buffer = await downloadFromS3(file.s3_bucket, file.s3_key);
  const mimeType = file.mime_type ?? 'application/octet-stream';
  console.log(`[Post] Uploading ${buffer.length} bytes (${mimeType}) to Twitter media API`);
  return uploadToTwitter(token, buffer, mimeType, buffer.length);
}

// ============================================================
// Resolve caption prefix based on prefix mode
// ============================================================

async function resolveCaptionPrefix(
  ms: MediaSettings,
  agent: Agent,
  platform: Platform,
): Promise<string> {
  const mode = ms.caption_prefix_mode ?? 'static';

  if (mode === 'hashtags') {
    const tags = (ms.caption_hashtags ?? []).map((t) => (t.startsWith('#') ? t : `#${t}`));
    return tags.join(' ');
  }

  if (mode === 'ai') {
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: config.openai.apiKey });
      const resp = await openai.chat.completions.create({
        model: agent.model ?? 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: agent.personality_prompt
              ? `${agent.personality_prompt}\n\nYou are writing a short, punchy opening hook for a social media post.`
              : 'You are writing a short, punchy opening hook for a social media post.',
          },
          {
            role: 'user',
            content: `Write a short, engaging opener/hook to prepend to a ${platform} post. It should be 1–2 sentences, energetic, and fit naturally before the main caption. No hashtags. No quotes around it.`,
          },
        ],
        max_tokens: 80,
        temperature: 0.9,
      });
      return (resp.choices[0]?.message?.content ?? '').trim();
    } catch (err: any) {
      console.warn('[Post] AI prefix generation failed, skipping:', err.message);
      return '';
    }
  }

  // 'static' — use literal prefix text
  return (ms.caption_prefix ?? '').trim();
}

// ============================================================
// Build post text based on media_settings
// ============================================================

async function buildPostText(
  generated: string,
  mediaSettings: MediaSettings,
  agent: Agent,
  platform: Platform,
  fileDescription?: string | null,
): Promise<string> {
  const cs = mediaSettings.caption_source ?? 'ai_generated';

  let text: string;
  if (cs === 'none') {
    text = '';
  } else if (cs === 'file_description' && fileDescription) {
    text = fileDescription;
  } else {
    text = generated;
  }

  const prefix = await resolveCaptionPrefix(mediaSettings, agent, platform);
  if (prefix) text = prefix + (text ? '\n\n' + text : '');
  return text;
}

// ============================================================
// PROCESSOR
// ============================================================

export function startPostProcessor() {
  const worker = new Worker<PostJobPayload>(
    QUEUES.POST,
    async (job: BullJob<PostJobPayload>) => {
      const { agent_id, platform_account_id, action_id, platform } = job.data;
      console.log(`[Post] Processing action ${action_id} for ${platform}`);

      try {
        const agent = await queryOne<Agent>('SELECT * FROM agents WHERE id = $1', [agent_id]);
        if (!agent) throw new Error(`Agent ${agent_id} not found`);
        const { token } = await getTokens(platform_account_id);

        const existingAction = await queryOne<any>(
          'SELECT content_text, media_file_id FROM agent_actions WHERE id = $1',
          [action_id],
        );
        const preApprovedText = (job.data as any).override_content || existingAction?.content_text;
        let mediaFileId: string | null = (job.data as any).media_file_id ?? existingAction?.media_file_id ?? null;

        // Validate mediaFileId still exists — file may have been deleted after scheduling
        if (mediaFileId) {
          const fileExists = await queryOne<{ id: string }>('SELECT id FROM media_files WHERE id = $1', [mediaFileId]);
          if (!fileExists) {
            console.warn(`[Post] media_file_id ${mediaFileId} no longer exists in DB, posting without media`);
            mediaFileId = null;
          }
        }

        const ms: MediaSettings = (agent as any).media_settings ?? {
          order: 'random', frequency: 'always', frequency_pct: 100,
          include_body_text: true, caption_source: 'ai_generated', caption_prefix: '',
        };

        let postText: string;

        if (preApprovedText) {
          postText = preApprovedText;
          console.log(`[Post] Action ${action_id} using pre-approved content`);
        } else {
          const generated = await generatePostContent(agent, platform as Platform);

          if (generated.needsReview || agent.approval_mode === 'review') {
            await query(
              `UPDATE agent_actions SET status = 'review', content_text = $1,
               guardrail_score = $2, guardrail_notes = $3, media_file_id = $4 WHERE id = $5`,
              [generated.text, generated.guardrailScore, generated.flaggedTerms.join(', '), mediaFileId, action_id],
            );
            console.log(`[Post] Action ${action_id} sent to review (score: ${generated.guardrailScore})`);
            return;
          }

          // Resolve file description for caption_source='file_description'
          let fileDesc: string | null = null;
          if (mediaFileId && ms.caption_source === 'file_description') {
            const f = await queryOne<MediaFile>('SELECT description FROM media_files WHERE id = $1', [mediaFileId]);
            fileDesc = f?.description ?? null;
          }

          postText = await buildPostText(
            generated.text,
            ms,
            agent,
            platform as Platform,
            fileDesc,
          );
        }

        // Post to platform
        let result: { id: string; url: string };
        let resolvedMediaId: string | undefined;

        switch (platform) {
          case 'twitter': {
            if (mediaFileId) {
              try {
                resolvedMediaId = await resolveTwitterMedia(token, mediaFileId) ?? undefined;
              } catch (mediaErr: any) {
                console.error(`[Post] Media upload failed, posting text-only: ${mediaErr.message}`);
              }
            }

            // If caption_source='none' and no body text, need at least an empty string
            // Twitter requires text unless media_id is present; send empty string if media-only
            const finalText = ms.include_body_text ? postText : (resolvedMediaId ? '' : postText);
            result = await postToTwitter(token, finalText || postText, resolvedMediaId);
            break;
          }

          case 'reddit': {
            const subreddit = agent.subreddit_targets[Math.floor(Math.random() * agent.subreddit_targets.length)] || 'test';
            const lines = postText.split('\n');
            const title = lines[0].substring(0, 100);
            const body = lines.slice(1).join('\n') || postText;
            result = await postToReddit(token, subreddit, title, body);
            break;
          }

          default:
            throw new Error(`Posting to ${platform} not yet implemented`);
        }

        await query(
          `UPDATE agent_actions SET status = 'published', content_text = $1,
           platform_post_id = $2, platform_url = $3, media_file_id = $4, executed_at = now() WHERE id = $5`,
          [postText, result.id, result.url, mediaFileId, action_id],
        );

        await query(
          `UPDATE agents SET posts_made = posts_made + 1, last_active_at = now() WHERE id = $1`,
          [agent_id],
        );

        // Record against rate limit only on actual publish (not at schedule time)
        const rlKey = `prl:${platform}:${platform_account_id}:post`;
        const rlNow = Date.now();
        await redis.zadd(rlKey, rlNow.toString(), `${rlNow}:${Math.random()}`);
        await redis.expire(rlKey, 86_400);

        console.log(`[Post] Published to ${platform}: ${result.url}${resolvedMediaId ? ' (with media)' : mediaFileId ? ' (media upload failed, text-only)' : ''}`);

      } catch (err: any) {
        console.error(`[Post] Failed action ${action_id}:`, err.message);
        await query(
          `UPDATE agent_actions SET status = 'failed', error_message = $1,
           retry_count = retry_count + 1, executed_at = now() WHERE id = $2`,
          [err.message, action_id],
        );
        // Don't retry on permission/auth errors — they won't resolve with more attempts
        const msg = err.message ?? '';
        if (msg.includes('403') || msg.includes('not permitted') || msg.includes('Forbidden') || msg.includes('401') || msg.includes('Could not authenticate')) {
          console.warn(`[Post] Non-retriable error for action ${action_id}, skipping retries`);
          return;
        }
        throw err;
      }
    },
    {
      connection: redis,
      concurrency: 3,
      limiter: { max: 5, duration: 60_000 },
    },
  );

  console.log('[Post Processor] Started');
  return worker;
}

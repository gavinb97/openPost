// ============================================================
// DM Processor — Handles direct messages across platforms
// ============================================================

import { Worker, type Job as BullJob } from 'bullmq';
import crypto from 'crypto';
import { redis } from './queues';
import { query, queryOne } from './db';
import { generateDMContent, updateConversationMemory } from './ai';
import { config } from './config';
import { QUEUES } from '@onlyposts/shared';
import type { Agent, OAuthToken, PlatformAccount, DMJobPayload, Platform, AgentConversation } from '@onlyposts/shared';

async function getTokens(accountId: string) {
  const account = await queryOne<PlatformAccount>('SELECT * FROM platform_accounts WHERE id = $1', [accountId]);
  const token = await queryOne<OAuthToken>('SELECT * FROM oauth_tokens WHERE platform_account_id = $1', [accountId]);
  if (!account || !token) throw new Error(`Missing account/token for ${accountId}`);
  return { account, token };
}

export function startDMProcessor() {
  const worker = new Worker<DMJobPayload>(
    QUEUES.DM,
    async (job: BullJob<DMJobPayload>) => {
      const { agent_id, platform_account_id, action_id, platform, target_user } = job.data;
      console.log(`[DM] Processing action ${action_id} → ${target_user} on ${platform}`);

      try {
        const agent = await queryOne<Agent>('SELECT * FROM agents WHERE id = $1', [agent_id]);
        if (!agent) throw new Error(`Agent ${agent_id} not found`);
        const { account, token } = await getTokens(platform_account_id);

        // Get conversation context
        const conversation = await queryOne<AgentConversation>(
          'SELECT * FROM agent_conversations WHERE agent_id = $1 AND platform = $2 AND target_user = $3',
          [agent_id, platform, target_user],
        );

        // Generate DM content
        const generated = await generateDMContent(agent, platform as Platform, target_user, conversation);

        if (generated.needsReview) {
          await query(
            `UPDATE agent_actions SET status = 'review', content_text = $1,
             guardrail_score = $2, guardrail_notes = $3 WHERE id = $4`,
            [generated.text, generated.guardrailScore, generated.flaggedTerms.join(', '), action_id],
          );
          return;
        }

        // Send DM
        switch (platform) {
          case 'twitter': {
            // Need to resolve username to user ID first
            // Twitter DMs require user ID, not username
            const OAuth = (await import('oauth-1.0a')).default;
            const oauth = new OAuth({
              consumer: { key: config.twitter.appKey, secret: config.twitter.appSecret },
              signature_method: 'HMAC-SHA1',
              hash_function(bs: string, k: string) { return crypto.createHmac('sha1', k).update(bs).digest('base64'); },
            });
            const tok = { key: token.access_token, secret: token.token_secret! };

            // Look up user
            const lookupUrl = `https://api.twitter.com/2/users/by/username/${target_user}`;
            const header1 = oauth.toHeader(oauth.authorize({ url: lookupUrl, method: 'GET' }, tok));
            const lookupResp = await fetch(lookupUrl, { headers: header1 });
            const lookupData = await lookupResp.json() as any;
            const targetId = lookupData?.data?.id;
            if (!targetId) throw new Error(`Could not find Twitter user: ${target_user}`);

            // Send DM
            const dmUrl = `https://api.twitter.com/2/dm_conversations/with/${targetId}/messages`;
            const header2 = oauth.toHeader(oauth.authorize({ url: dmUrl, method: 'POST' }, tok));
            const dmResp = await fetch(dmUrl, {
              method: 'POST',
              headers: { ...header2, 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: generated.text }),
            });
            if (!dmResp.ok) throw new Error(`Twitter DM failed: ${await dmResp.text()}`);
            break;
          }

          case 'reddit': {
            const resp = await fetch('https://oauth.reddit.com/api/compose', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token.access_token}`,
                'User-Agent': config.reddit.userAgent,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                api_type: 'json',
                to: target_user,
                subject: 'Hey!',
                text: generated.text,
              }),
            });
            const data = await resp.json() as any;
            if (data?.json?.errors?.length) {
              throw new Error(`Reddit DM failed: ${JSON.stringify(data.json.errors)}`);
            }
            break;
          }

          default:
            throw new Error(`DMs not supported on ${platform}`);
        }

        // Update action
        await query(
          `UPDATE agent_actions SET status = 'published', content_text = $1,
           executed_at = now(), guardrail_score = $2 WHERE id = $3`,
          [generated.text, generated.guardrailScore, action_id],
        );

        // Mark DM target as messaged
        await query(
          `UPDATE dm_targets SET messaged = true, messaged_at = now()
           WHERE agent_id = $1 AND platform = $2 AND target_username = $3`,
          [agent_id, platform, target_user],
        );

        // Update stats
        await query('UPDATE agents SET dms_sent = dms_sent + 1, last_active_at = now() WHERE id = $1', [agent_id]);

        // Update conversation memory
        await updateConversationMemory(agent_id, platform as Platform, platform_account_id, target_user, 'agent', generated.text);

        console.log(`[DM] Sent to ${target_user} on ${platform}`);

      } catch (err: any) {
        console.error(`[DM] Failed action ${action_id}:`, err.message);
        await query(
          `UPDATE agent_actions SET status = 'failed', error_message = $1,
           retry_count = retry_count + 1, executed_at = now() WHERE id = $2`,
          [err.message, action_id],
        );
        throw err;
      }
    },
    {
      connection: redis,
      concurrency: 1,
      limiter: { max: 2, duration: 61_000 }, // Match v1's 61-second interval for DMs
    },
  );

  console.log('[DM Processor] Started');
  return worker;
}

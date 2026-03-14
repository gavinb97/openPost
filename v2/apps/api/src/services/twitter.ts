// ============================================================
// Twitter Service — Post, Reply, DM, Like, Follow, Retweet
// ============================================================

import crypto from 'crypto';
import { config } from '../config';
import { queryOne } from '../db';
import type { OAuthToken, PlatformAccount } from '@onlyposts/shared';

interface TwitterAuth {
  accessToken: string;
  tokenSecret: string;
}

async function getAuth(accountId: string): Promise<TwitterAuth> {
  const token = await queryOne<OAuthToken>(
    'SELECT * FROM oauth_tokens WHERE platform_account_id = $1',
    [accountId],
  );
  if (!token) throw new Error(`No token found for account ${accountId}`);
  return { accessToken: token.access_token, tokenSecret: token.token_secret! };
}

/** Create OAuth 1.0a signature header */
function createOAuth1Header(method: string, url: string, auth: TwitterAuth, body?: Record<string, string>): string {
  const OAuth = require('oauth-1.0a');
  const oauth = new OAuth({
    consumer: { key: config.twitter.appKey, secret: config.twitter.appSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(baseString: string, key: string) {
      return crypto.createHmac('sha1', key).update(baseString).digest('base64');
    },
  });

  const token = { key: auth.accessToken, secret: auth.tokenSecret };
  const requestData = { url, method, data: body };
  const header = oauth.toHeader(oauth.authorize(requestData, token));
  return header.Authorization;
}

/** Make authenticated Twitter API v2 request */
async function twitterRequest(method: string, url: string, auth: TwitterAuth, body?: any): Promise<any> {
  const fullUrl = url.startsWith('http') ? url : `https://api.twitter.com/2${url}`;
  const authorization = createOAuth1Header(method, fullUrl, auth);

  const options: RequestInit = {
    method,
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(fullUrl, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Twitter API error ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

// ============================================================
// PUBLIC API
// ============================================================

export const twitterService = {
  /** Post a tweet */
  async post(accountId: string, text: string, mediaId?: string): Promise<{ id: string; text: string }> {
    const auth = await getAuth(accountId);
    const body: any = { text };
    if (mediaId) {
      body.media = { media_ids: [mediaId] };
    }
    const result = await twitterRequest('POST', '/tweets', auth, body);
    return result.data;
  },

  /** Reply to a tweet */
  async reply(accountId: string, text: string, inReplyToId: string): Promise<{ id: string; text: string }> {
    const auth = await getAuth(accountId);
    const result = await twitterRequest('POST', '/tweets', auth, {
      text,
      reply: { in_reply_to_tweet_id: inReplyToId },
    });
    return result.data;
  },

  /** Send a DM */
  async dm(accountId: string, recipientId: string, text: string): Promise<any> {
    const auth = await getAuth(accountId);
    return twitterRequest('POST', `/dm_conversations/with/${recipientId}/messages`, auth, {
      text,
    });
  },

  /** Like a tweet */
  async like(accountId: string, tweetId: string): Promise<void> {
    const auth = await getAuth(accountId);
    const account = await queryOne<PlatformAccount>(
      'SELECT * FROM platform_accounts WHERE id = $1',
      [accountId],
    );
    await twitterRequest('POST', `/users/${account!.platform_user_id}/likes`, auth, {
      tweet_id: tweetId,
    });
  },

  /** Follow a user */
  async follow(accountId: string, targetUserId: string): Promise<void> {
    const auth = await getAuth(accountId);
    const account = await queryOne<PlatformAccount>(
      'SELECT * FROM platform_accounts WHERE id = $1',
      [accountId],
    );
    await twitterRequest('POST', `/users/${account!.platform_user_id}/following`, auth, {
      target_user_id: targetUserId,
    });
  },

  /** Retweet */
  async retweet(accountId: string, tweetId: string): Promise<void> {
    const auth = await getAuth(accountId);
    const account = await queryOne<PlatformAccount>(
      'SELECT * FROM platform_accounts WHERE id = $1',
      [accountId],
    );
    await twitterRequest('POST', `/users/${account!.platform_user_id}/retweets`, auth, {
      tweet_id: tweetId,
    });
  },

  /** Search recent tweets */
  async searchTweets(accountId: string, queryStr: string, maxResults: number = 10): Promise<any[]> {
    const auth = await getAuth(accountId);
    const encodedQuery = encodeURIComponent(queryStr);
    const result = await twitterRequest(
      'GET',
      `https://api.twitter.com/2/tweets/search/recent?query=${encodedQuery}&max_results=${maxResults}&tweet.fields=author_id,created_at`,
      auth,
    );
    return result.data || [];
  },

  /** Upload media (v1.1 API) */
  async uploadMedia(accountId: string, mediaBuffer: Buffer, mimeType: string): Promise<string> {
    const auth = await getAuth(accountId);
    const authorization = createOAuth1Header('POST', 'https://upload.twitter.com/1.1/media/upload.json', auth);

    const formData = new FormData();
    formData.append('media_data', mediaBuffer.toString('base64'));
    formData.append('media_category', mimeType.startsWith('video') ? 'tweet_video' : 'tweet_image');

    const response = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: { Authorization: authorization },
      body: formData,
    });

    const data = await response.json() as any;
    if (!response.ok) throw new Error(`Twitter media upload failed: ${JSON.stringify(data)}`);
    return data.media_id_string;
  },
};

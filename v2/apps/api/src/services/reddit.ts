// ============================================================
// Reddit Service — Post, Comment, DM, Vote, Subscribe, Scrape
// ============================================================

import { config } from '../config';
import { query, queryOne } from '../db';
import type { OAuthToken } from '@onlyposts/shared';

interface RedditAuth {
  accessToken: string;
}

async function getAuth(accountId: string): Promise<RedditAuth> {
  const token = await queryOne<OAuthToken>(
    'SELECT * FROM oauth_tokens WHERE platform_account_id = $1',
    [accountId],
  );
  if (!token) throw new Error(`No token found for account ${accountId}`);

  // Check expiry and refresh if needed
  if (token.expires_at && new Date(token.expires_at) < new Date()) {
    const newToken = await refreshToken(accountId, token.refresh_token!);
    return { accessToken: newToken };
  }

  return { accessToken: token.access_token };
}

async function refreshToken(accountId: string, refreshToken: string): Promise<string> {
  const credentials = Buffer.from(`${config.reddit.appId}:${config.reddit.secret}`).toString('base64');
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': config.reddit.userAgent,
    },
    body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
  });

  const data = await response.json() as any;
  if (data.error) throw new Error(`Reddit token refresh failed: ${data.error}`);

  // Update token in DB
  await query(
    `UPDATE oauth_tokens SET access_token = $1, expires_at = $2, updated_at = now()
     WHERE platform_account_id = $3`,
    [data.access_token, new Date(Date.now() + data.expires_in * 1000), accountId],
  );

  return data.access_token;
}

/** Make authenticated Reddit API request */
async function redditRequest(method: string, endpoint: string, auth: RedditAuth, body?: any): Promise<any> {
  const url = `https://oauth.reddit.com${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'User-Agent': config.reddit.userAgent,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  if (body && method !== 'GET') {
    options.body = typeof body === 'string' ? body : new URLSearchParams(body).toString();
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Reddit API error ${response.status}: ${text}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

// ============================================================
// PUBLIC API
// ============================================================

export const redditService = {
  /** Submit a text post */
  async submitText(accountId: string, subreddit: string, title: string, text: string): Promise<any> {
    const auth = await getAuth(accountId);
    return redditRequest('POST', '/api/submit', auth, {
      api_type: 'json',
      kind: 'self',
      sr: subreddit,
      title,
      text,
    });
  },

  /** Submit a link/image post */
  async submitLink(accountId: string, subreddit: string, title: string, url: string): Promise<any> {
    const auth = await getAuth(accountId);
    return redditRequest('POST', '/api/submit', auth, {
      api_type: 'json',
      kind: 'link',
      sr: subreddit,
      title,
      url,
    });
  },

  /** Post a comment / reply */
  async comment(accountId: string, parentFullname: string, text: string): Promise<any> {
    const auth = await getAuth(accountId);
    return redditRequest('POST', '/api/comment', auth, {
      api_type: 'json',
      thing_id: parentFullname,
      text,
    });
  },

  /** Send a private message */
  async dm(accountId: string, toUser: string, subject: string, body: string): Promise<any> {
    const auth = await getAuth(accountId);
    return redditRequest('POST', '/api/compose', auth, {
      api_type: 'json',
      to: toUser,
      subject,
      text: body,
    });
  },

  /** Upvote a post/comment */
  async upvote(accountId: string, fullname: string): Promise<void> {
    const auth = await getAuth(accountId);
    await redditRequest('POST', '/api/vote', auth, { id: fullname, dir: '1' });
  },

  /** Downvote a post/comment */
  async downvote(accountId: string, fullname: string): Promise<void> {
    const auth = await getAuth(accountId);
    await redditRequest('POST', '/api/vote', auth, { id: fullname, dir: '-1' });
  },

  /** Subscribe to a subreddit */
  async subscribe(accountId: string, subreddit: string): Promise<void> {
    const auth = await getAuth(accountId);
    await redditRequest('POST', '/api/subscribe', auth, {
      action: 'sub',
      sr_name: subreddit,
    });
  },

  /** Get subreddit posts (for scraping) */
  async getSubredditPosts(accountId: string, subreddit: string, sort: string = 'hot', limit: number = 25): Promise<any[]> {
    const auth = await getAuth(accountId);
    const data = await redditRequest('GET', `/r/${subreddit}/${sort}.json?limit=${limit}`, auth);
    return data?.data?.children?.map((c: any) => c.data) || [];
  },

  /** Get post comments */
  async getComments(accountId: string, subreddit: string, postId: string): Promise<any[]> {
    const auth = await getAuth(accountId);
    const data = await redditRequest('GET', `/r/${subreddit}/comments/${postId}.json`, auth);
    return data?.[1]?.data?.children?.map((c: any) => c.data) || [];
  },

  /** Scrape active users from a subreddit */
  async scrapeActiveUsers(accountId: string, subreddit: string): Promise<string[]> {
    const posts = await redditService.getSubredditPosts(accountId, subreddit, 'new', 100);
    const users = new Set<string>();

    for (const post of posts) {
      if (post.author && post.author !== '[deleted]' && post.author !== 'AutoModerator') {
        users.add(post.author);
      }
    }

    return Array.from(users);
  },

  /** Read inbox messages */
  async getInbox(accountId: string, limit: number = 25): Promise<any[]> {
    const auth = await getAuth(accountId);
    const data = await redditRequest('GET', `/message/inbox.json?limit=${limit}`, auth);
    return data?.data?.children?.map((c: any) => c.data) || [];
  },

  /** Get user info */
  async getUserInfo(accountId: string): Promise<any> {
    const auth = await getAuth(accountId);
    return redditRequest('GET', '/api/v1/me', auth);
  },
};

// ============================================================
// YouTube Service — Upload, Comment, Like, Subscribe
// ============================================================

import { config } from '../config';
import { query, queryOne } from '../db';
import type { OAuthToken } from '@onlyposts/shared';

interface YouTubeAuth {
  accessToken: string;
}

async function getAuth(accountId: string): Promise<YouTubeAuth> {
  const token = await queryOne<OAuthToken>(
    'SELECT * FROM oauth_tokens WHERE platform_account_id = $1',
    [accountId],
  );
  if (!token) throw new Error(`No token found for account ${accountId}`);

  // Refresh if expired
  if (token.expires_at && new Date(token.expires_at) < new Date()) {
    const newToken = await refreshToken(accountId, token.refresh_token!);
    return { accessToken: newToken };
  }

  return { accessToken: token.access_token };
}

async function refreshToken(accountId: string, refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.youtube.clientId,
      client_secret: config.youtube.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json() as any;
  if (data.error) throw new Error(`YouTube token refresh failed: ${data.error}`);

  await query(
    `UPDATE oauth_tokens SET access_token = $1, expires_at = $2, updated_at = now()
     WHERE platform_account_id = $3`,
    [data.access_token, new Date(Date.now() + data.expires_in * 1000), accountId],
  );

  return data.access_token;
}

async function youtubeRequest(method: string, endpoint: string, auth: YouTubeAuth, body?: any): Promise<any> {
  const url = endpoint.startsWith('http') ? endpoint : `https://www.googleapis.com/youtube/v3${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`YouTube API error ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

// ============================================================
// PUBLIC API
// ============================================================

export const youtubeService = {
  /** Post a comment on a video */
  async comment(accountId: string, videoId: string, text: string): Promise<any> {
    const auth = await getAuth(accountId);
    return youtubeRequest('POST', '/commentThreads?part=snippet', auth, {
      snippet: {
        videoId,
        topLevelComment: {
          snippet: { textOriginal: text },
        },
      },
    });
  },

  /** Reply to a comment */
  async reply(accountId: string, parentCommentId: string, text: string): Promise<any> {
    const auth = await getAuth(accountId);
    return youtubeRequest('POST', '/comments?part=snippet', auth, {
      snippet: {
        parentId: parentCommentId,
        textOriginal: text,
      },
    });
  },

  /** Like a video */
  async like(accountId: string, videoId: string): Promise<void> {
    const auth = await getAuth(accountId);
    await youtubeRequest('POST', `/videos/rate?id=${videoId}&rating=like`, auth);
  },

  /** Subscribe to a channel */
  async subscribe(accountId: string, channelId: string): Promise<any> {
    const auth = await getAuth(accountId);
    return youtubeRequest('POST', '/subscriptions?part=snippet', auth, {
      snippet: {
        resourceId: { kind: 'youtube#channel', channelId },
      },
    });
  },

  /** Search videos */
  async searchVideos(accountId: string, queryStr: string, maxResults: number = 10): Promise<any[]> {
    const auth = await getAuth(accountId);
    const encoded = encodeURIComponent(queryStr);
    const data = await youtubeRequest(
      'GET',
      `/search?part=snippet&q=${encoded}&maxResults=${maxResults}&type=video`,
      auth,
    );
    return data.items || [];
  },

  /** Get video comments (for scraping/engagement) */
  async getVideoComments(accountId: string, videoId: string, maxResults: number = 20): Promise<any[]> {
    const auth = await getAuth(accountId);
    const data = await youtubeRequest(
      'GET',
      `/commentThreads?part=snippet&videoId=${videoId}&maxResults=${maxResults}&order=relevance`,
      auth,
    );
    return data.items || [];
  },

  /** Upload video via resumable upload */
  async uploadVideo(
    accountId: string,
    title: string,
    description: string,
    videoBuffer: Buffer,
    mimeType: string = 'video/mp4',
    tags: string[] = [],
    privacyStatus: string = 'public',
  ): Promise<any> {
    const auth = await getAuth(accountId);

    // Step 1: Initiate resumable upload
    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': mimeType,
          'X-Upload-Content-Length': videoBuffer.length.toString(),
        },
        body: JSON.stringify({
          snippet: { title, description, tags },
          status: { privacyStatus },
        }),
      },
    );

    const uploadUrl = initResponse.headers.get('Location');
    if (!uploadUrl) throw new Error('Failed to initiate YouTube upload');

    // Step 2: Upload the video data
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        'Content-Length': videoBuffer.length.toString(),
      },
      body: videoBuffer,
    });

    return uploadResponse.json();
  },

  /** Get channel info */
  async getChannelInfo(accountId: string): Promise<any> {
    const auth = await getAuth(accountId);
    const data = await youtubeRequest('GET', '/channels?part=snippet,statistics&mine=true', auth);
    return data.items?.[0];
  },
};

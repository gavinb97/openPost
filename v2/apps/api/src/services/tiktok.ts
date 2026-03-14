// ============================================================
// TikTok Service — Upload, Post
// ============================================================

import { config } from '../config';
import { query, queryOne } from '../db';
import type { OAuthToken } from '@onlyposts/shared';

interface TikTokAuth {
  accessToken: string;
}

async function getAuth(accountId: string): Promise<TikTokAuth> {
  const token = await queryOne<OAuthToken>(
    'SELECT * FROM oauth_tokens WHERE platform_account_id = $1',
    [accountId],
  );
  if (!token) throw new Error(`No token found for account ${accountId}`);

  if (token.expires_at && new Date(token.expires_at) < new Date()) {
    const newToken = await refreshToken(accountId, token.refresh_token!);
    return { accessToken: newToken };
  }

  return { accessToken: token.access_token };
}

async function refreshToken(accountId: string, refreshToken: string): Promise<string> {
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: config.tiktok.clientKey,
      client_secret: config.tiktok.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json() as any;
  if (data.error) throw new Error(`TikTok token refresh failed: ${data.error}`);

  await query(
    `UPDATE oauth_tokens SET access_token = $1, refresh_token = COALESCE($2, refresh_token),
     expires_at = $3, updated_at = now() WHERE platform_account_id = $4`,
    [data.access_token, data.refresh_token, new Date(Date.now() + data.expires_in * 1000), accountId],
  );

  return data.access_token;
}

// ============================================================
// PUBLIC API
// ============================================================

export const tiktokService = {
  /** Initialize a video upload (returns upload URL) */
  async initVideoUpload(
    accountId: string,
    title: string,
    videoSize: number,
    privacyLevel: string = 'PUBLIC_TO_EVERYONE',
  ): Promise<{ publish_id: string; upload_url: string }> {
    const auth = await getAuth(accountId);

    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title,
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_stitch: false,
          disable_comment: false,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoSize,
          chunk_size: videoSize,
          total_chunk_count: 1,
        },
      }),
    });

    const data = await response.json() as any;
    if (data.error?.code !== 'ok') {
      throw new Error(`TikTok upload init failed: ${JSON.stringify(data.error)}`);
    }

    return data.data;
  },

  /** Upload video chunk to the upload URL */
  async uploadVideoChunk(uploadUrl: string, videoBuffer: Buffer): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes 0-${videoBuffer.length - 1}/${videoBuffer.length}`,
      },
      body: videoBuffer,
    });

    if (!response.ok) {
      throw new Error(`TikTok video upload failed: ${response.status}`);
    }
  },

  /** Check publish status */
  async checkPublishStatus(accountId: string, publishId: string): Promise<any> {
    const auth = await getAuth(accountId);
    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publish_id: publishId }),
    });

    return response.json();
  },

  /** Initialize a photo post */
  async initPhotoPost(
    accountId: string,
    title: string,
    photoCount: number,
    privacyLevel: string = 'PUBLIC_TO_EVERYONE',
  ): Promise<{ publish_id: string; upload_urls: string[] }> {
    const auth = await getAuth(accountId);

    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title,
          privacy_level: privacyLevel,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_cover_index: 0,
          photo_images: Array.from({ length: photoCount }, () => ''), // will be filled
        },
        post_mode: 'DIRECT_POST',
        media_type: 'PHOTO',
      }),
    });

    const data = await response.json() as any;
    if (data.error?.code !== 'ok') {
      throw new Error(`TikTok photo init failed: ${JSON.stringify(data.error)}`);
    }

    return data.data;
  },

  /** Get user info */
  async getUserInfo(accountId: string): Promise<any> {
    const auth = await getAuth(accountId);
    const response = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name',
      { headers: { Authorization: `Bearer ${auth.accessToken}` } },
    );
    const data = await response.json() as any;
    return data.data?.user;
  },
};

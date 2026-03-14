// ============================================================
// OAuth Routes — Twitter, Reddit, YouTube, TikTok + stubs
// ============================================================

import { Router } from 'express';
import crypto from 'crypto';
import { config } from '../config';
import { query, queryOne, transaction } from '../db';
import { requireAuth } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import type { PlatformAccount, OAuthToken } from '@onlyposts/shared';

export const oauthRouter = Router();

// ============================================================
// CONNECTED ACCOUNTS
// ============================================================

/** List all connected platform accounts for the current user */
oauthRouter.get('/accounts', requireAuth, asyncHandler(async (req, res) => {
  const accounts = await query<PlatformAccount & { platform_username: string | null }>(
    `SELECT *, handle AS platform_username, display_name AS platform_display_name
     FROM platform_accounts WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.user!.userId],
  );
  res.json({ ok: true, data: { accounts } });
}));

/** Disconnect a platform account */
oauthRouter.delete('/accounts/:id', requireAuth, asyncHandler(async (req, res) => {
  const result = await queryOne(
    'DELETE FROM platform_accounts WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user!.userId],
  );
  if (!result) throw new AppError(404, 'Account not found');
  res.json({ ok: true, message: 'Account disconnected' });
}));

// ============================================================
// HELPER: Save or update OAuth state
// ============================================================

async function saveOAuthState(userId: string, platform: string, stateToken: string, extra: Record<string, any> = {}) {
  await query(
    `INSERT INTO oauth_state (user_id, platform, state_token, code_verifier, oauth_token, oauth_token_secret, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, now() + interval '10 minutes')`,
    [userId, platform, stateToken, extra.code_verifier || null, extra.oauth_token || null, extra.oauth_token_secret || null],
  );
}

async function consumeOAuthState(stateToken: string) {
  const state = await queryOne<any>(
    'DELETE FROM oauth_state WHERE state_token = $1 AND expires_at > now() RETURNING *',
    [stateToken],
  );
  return state;
}

async function upsertPlatformAccount(
  userId: string,
  platform: string,
  platformUserId: string,
  handle: string | null,
  displayName: string | null,
  avatarUrl: string | null,
  metadata: Record<string, any>,
  tokens: { access_token: string; refresh_token?: string; token_secret?: string; expires_at?: Date; scopes?: string[]; raw_response?: any },
) {
  return transaction(async (client) => {
    // Upsert platform account
    const accountResult = await client.query(
      `INSERT INTO platform_accounts (user_id, platform, platform_user_id, handle, display_name, avatar_url, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, platform, platform_user_id)
       DO UPDATE SET handle = $4, display_name = $5, avatar_url = $6, metadata = $7, updated_at = now()
       RETURNING *`,
      [userId, platform, platformUserId, handle, displayName, avatarUrl, JSON.stringify(metadata)],
    );
    const account = accountResult.rows[0];

    // Upsert oauth tokens
    await client.query(
      `INSERT INTO oauth_tokens (platform_account_id, access_token, refresh_token, token_secret, expires_at, scopes, raw_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (platform_account_id)
       DO UPDATE SET access_token = $2, refresh_token = $3, token_secret = $4, expires_at = $5, scopes = $6, raw_response = $7, updated_at = now()`,
      [
        account.id,
        tokens.access_token,
        tokens.refresh_token || null,
        tokens.token_secret || null,
        tokens.expires_at || null,
        tokens.scopes || null,
        JSON.stringify(tokens.raw_response || {}),
      ],
    );

    return account;
  });
}

// ============================================================
// TWITTER (OAuth 1.0a)
// ============================================================

oauthRouter.get('/twitter/start', requireAuth, asyncHandler(async (req, res) => {
  const OAuth = (await import('oauth-1.0a')).default;
  const oauthLib = new OAuth({
    consumer: { key: config.twitter.appKey, secret: config.twitter.appSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(baseString, key) {
      return crypto.createHmac('sha1', key).update(baseString).digest('base64');
    },
  });

  // Step 1: Get request token
  const requestData = {
    url: 'https://api.twitter.com/oauth/request_token',
    method: 'POST',
    data: { oauth_callback: config.twitter.callbackUrl },
  };

  const headers = oauthLib.toHeader(oauthLib.authorize(requestData));
  const response = await fetch(requestData.url, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `oauth_callback=${encodeURIComponent(config.twitter.callbackUrl)}`,
  });

  const text = await response.text();
  console.error(`[Twitter OAuth] request_token response (${response.status}):`, text);
  const params = new URLSearchParams(text);
  const oauthToken = params.get('oauth_token');
  const oauthTokenSecret = params.get('oauth_token_secret');

  if (!oauthToken) throw new AppError(502, `Failed to get Twitter request token: ${text}`);

  // Save state
  await saveOAuthState(req.user!.userId, 'twitter', oauthToken, {
    oauth_token: oauthToken,
    oauth_token_secret: oauthTokenSecret,
  });

  res.json({
    ok: true,
    data: { url: `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}` },
  });
}));

oauthRouter.get('/twitter/callback', asyncHandler(async (req, res) => {
  const { oauth_token, oauth_verifier } = req.query as { oauth_token: string; oauth_verifier: string };
  if (!oauth_token || !oauth_verifier) throw new AppError(400, 'Missing OAuth parameters');

  // Retrieve state
  const state = await consumeOAuthState(oauth_token);
  if (!state) throw new AppError(400, 'Invalid or expired OAuth state');

  const OAuth = (await import('oauth-1.0a')).default;
  const oauthLib = new OAuth({
    consumer: { key: config.twitter.appKey, secret: config.twitter.appSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(baseString, key) {
      return crypto.createHmac('sha1', key).update(baseString).digest('base64');
    },
  });

  // Step 3: Exchange for access token
  const requestData = {
    url: 'https://api.twitter.com/oauth/access_token',
    method: 'POST',
    data: { oauth_verifier },
  };

  const token = { key: oauth_token, secret: state.oauth_token_secret };
  const headers = oauthLib.toHeader(oauthLib.authorize(requestData, token));

  const response = await fetch(requestData.url, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `oauth_verifier=${oauth_verifier}`,
  });

  const text = await response.text();
  const params = new URLSearchParams(text);
  const accessToken = params.get('oauth_token')!;
  const accessSecret = params.get('oauth_token_secret')!;
  let twitterUserId = params.get('user_id') || '';
  let screenName = params.get('screen_name') || '';

  // If screen_name wasn't in the token response, fetch profile
  if (!screenName) {
    const OAuth2 = (await import('oauth-1.0a')).default;
    const lib2 = new OAuth2({
      consumer: { key: config.twitter.appKey, secret: config.twitter.appSecret },
      signature_method: 'HMAC-SHA1',
      hash_function(bs: string, k: string) { return crypto.createHmac('sha1', k).update(bs).digest('base64'); },
    });
    const verifyReq = { url: 'https://api.twitter.com/1.1/account/verify_credentials.json', method: 'GET' };
    const userToken = { key: accessToken, secret: accessSecret };
    const verifyHeaders = lib2.toHeader(lib2.authorize(verifyReq, userToken));
    const profileResp = await fetch(verifyReq.url, { headers: { ...verifyHeaders } });
    if (profileResp.ok) {
      const profile = await profileResp.json() as { screen_name?: string; id_str?: string };
      screenName = profile.screen_name || '';
      if (!twitterUserId && profile.id_str) twitterUserId = profile.id_str;
    }
  }

  await upsertPlatformAccount(
    state.user_id, 'twitter', twitterUserId,
    screenName, screenName, null, { screen_name: screenName },
    { access_token: accessToken, token_secret: accessSecret, raw_response: Object.fromEntries(params) },
  );

  // Redirect back to frontend
  res.redirect(`${config.frontendUrl}/dashboard/accounts?connected=twitter`);
}));

// ============================================================
// REDDIT (OAuth 2.0)
// ============================================================

oauthRouter.get('/reddit/start', requireAuth, asyncHandler(async (req, res) => {
  const state = crypto.randomBytes(32).toString('hex');
  await saveOAuthState(req.user!.userId, 'reddit', state);

  const scopes = [
    'identity', 'submit', 'read', 'privatemessages', 'subscribe',
    'vote', 'save', 'edit', 'flair', 'history', 'mysubreddits',
  ];

  const url = `https://www.reddit.com/api/v1/authorize?` +
    `client_id=${config.reddit.appId}` +
    `&response_type=code` +
    `&state=${state}` +
    `&redirect_uri=${encodeURIComponent(config.reddit.callbackUrl)}` +
    `&duration=permanent` +
    `&scope=${scopes.join('+')}`;

  res.json({ ok: true, data: { url } });
}));

oauthRouter.get('/reddit/callback', asyncHandler(async (req, res) => {
  const { code, state: stateToken } = req.query as { code: string; state: string };
  if (!code || !stateToken) throw new AppError(400, 'Missing OAuth parameters');

  const state = await consumeOAuthState(stateToken);
  if (!state) throw new AppError(400, 'Invalid or expired OAuth state');

  // Exchange code for token
  const credentials = Buffer.from(`${config.reddit.appId}:${config.reddit.secret}`).toString('base64');
  const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': config.reddit.userAgent,
    },
    body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(config.reddit.callbackUrl)}`,
  });

  const tokenData = await tokenResponse.json() as any;
  if (tokenData.error) throw new AppError(502, `Reddit OAuth error: ${tokenData.error}`);

  // Get user info
  const meResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'User-Agent': config.reddit.userAgent,
    },
  });
  const me = await meResponse.json() as any;

  await upsertPlatformAccount(
    state.user_id, 'reddit', me.id,
    `/u/${me.name}`, me.name, me.icon_img || null,
    { subreddit: me.subreddit, total_karma: me.total_karma },
    {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000),
      scopes: tokenData.scope?.split(' ') || [],
      raw_response: tokenData,
    },
  );

  res.redirect(`${config.frontendUrl}/dashboard/accounts?connected=reddit`);
}));

// ============================================================
// YOUTUBE (Google OAuth 2.0)
// ============================================================

oauthRouter.get('/youtube/start', requireAuth, asyncHandler(async (req, res) => {
  const state = crypto.randomBytes(32).toString('hex');
  await saveOAuthState(req.user!.userId, 'youtube', state);

  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${config.youtube.clientId}` +
    `&redirect_uri=${encodeURIComponent(config.youtube.callbackUrl)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes.join(' '))}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${state}`;

  res.json({ ok: true, data: { url } });
}));

oauthRouter.get('/youtube/callback', asyncHandler(async (req, res) => {
  const { code, state: stateToken } = req.query as { code: string; state: string };
  if (!code || !stateToken) throw new AppError(400, 'Missing OAuth parameters');

  const state = await consumeOAuthState(stateToken);
  if (!state) throw new AppError(400, 'Invalid or expired OAuth state');

  // Exchange code for token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.youtube.clientId,
      client_secret: config.youtube.clientSecret,
      redirect_uri: config.youtube.callbackUrl,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenResponse.json() as any;
  if (tokenData.error) throw new AppError(502, `YouTube OAuth error: ${tokenData.error}`);

  // Get channel info
  const channelResponse = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
  );
  const channelData = await channelResponse.json() as any;
  const channel = channelData.items?.[0];

  const rawHandle = channel?.snippet?.customUrl || channel?.snippet?.title || null;
  // YouTube customUrl already includes @ — strip it so the frontend can add its own
  const handle = rawHandle?.replace(/^@/, '') || null;

  await upsertPlatformAccount(
    state.user_id, 'youtube', channel?.id || 'unknown',
    handle,
    channel?.snippet?.title || null,
    channel?.snippet?.thumbnails?.default?.url || null,
    { channelId: channel?.id, subscriberCount: channel?.statistics?.subscriberCount },
    {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000),
      raw_response: tokenData,
    },
  );

  res.redirect(`${config.frontendUrl}/dashboard/accounts?connected=youtube`);
}));

// ============================================================
// TIKTOK (OAuth 2.0 + PKCE)
// ============================================================

oauthRouter.get('/tiktok/start', requireAuth, asyncHandler(async (req, res) => {
  const state = crypto.randomBytes(32).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  await saveOAuthState(req.user!.userId, 'tiktok', state, { code_verifier: codeVerifier });

  const scopes = ['user.info.basic', 'video.publish', 'video.upload'];

  const url = `https://www.tiktok.com/v2/auth/authorize/?` +
    `client_key=${config.tiktok.clientKey}` +
    `&scope=${scopes.join(',')}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(config.tiktok.callbackUrl)}` +
    `&state=${state}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256`;

  res.json({ ok: true, data: { url } });
}));

oauthRouter.get('/tiktok/callback', asyncHandler(async (req, res) => {
  const { code, state: stateToken } = req.query as { code: string; state: string };
  if (!code || !stateToken) throw new AppError(400, 'Missing OAuth parameters');

  const state = await consumeOAuthState(stateToken);
  if (!state) throw new AppError(400, 'Invalid or expired OAuth state');

  // Exchange code for token
  const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: config.tiktok.clientKey,
      client_secret: config.tiktok.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.tiktok.callbackUrl,
      code_verifier: state.code_verifier || '',
    }),
  });

  const tokenData = await tokenResponse.json() as any;
  if (tokenData.error) throw new AppError(502, `TikTok OAuth error: ${tokenData.error}`);

  // Get user info
  const userResponse = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name',
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
  );
  const userData = await userResponse.json() as any;
  const user = userData.data?.user;

  await upsertPlatformAccount(
    state.user_id, 'tiktok', tokenData.open_id || user?.open_id || 'unknown',
    user?.display_name || null,
    user?.display_name || null,
    user?.avatar_url || null,
    { union_id: user?.union_id },
    {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
      raw_response: tokenData,
    },
  );

  res.redirect(`${config.frontendUrl}/dashboard/accounts?connected=tiktok`);
}));

// ============================================================
// FACEBOOK (Coming Soon)
// ============================================================

oauthRouter.get('/facebook/start', requireAuth, (_req, res) => {
  res.json({ ok: false, error: 'Facebook integration coming soon!' });
});

// ============================================================
// INSTAGRAM (Coming Soon)
// ============================================================

oauthRouter.get('/instagram/start', requireAuth, (_req, res) => {
  res.json({ ok: false, error: 'Instagram integration coming soon!' });
});

// ============================================================
// TOKEN REFRESH (used by workers)
// ============================================================

oauthRouter.post('/refresh/:accountId', requireAuth, asyncHandler(async (req, res) => {
  const token = await queryOne<OAuthToken>(
    `SELECT ot.* FROM oauth_tokens ot
     JOIN platform_accounts pa ON pa.id = ot.platform_account_id
     WHERE pa.id = $1 AND pa.user_id = $2`,
    [req.params.accountId, req.user!.userId],
  );
  if (!token) throw new AppError(404, 'Token not found');

  const account = await queryOne<PlatformAccount>(
    'SELECT * FROM platform_accounts WHERE id = $1',
    [req.params.accountId],
  );
  if (!account) throw new AppError(404, 'Account not found');

  // Platform-specific refresh
  let newToken: any;

  switch (account.platform) {
    case 'twitter': {
      // OAuth 1.0a tokens don't expire — verify the token is still valid
      const OAuth = (await import('oauth-1.0a')).default;
      const oauthLib = new OAuth({
        consumer: { key: config.twitter.appKey, secret: config.twitter.appSecret },
        signature_method: 'HMAC-SHA1',
        hash_function(baseString: string, key: string) {
          return crypto.createHmac('sha1', key).update(baseString).digest('base64');
        },
      });
      const verifyRequest = {
        url: 'https://api.twitter.com/1.1/account/verify_credentials.json',
        method: 'GET',
      };
      const oauthToken = { key: token.access_token, secret: token.token_secret! };
      const authHeader = oauthLib.toHeader(oauthLib.authorize(verifyRequest, oauthToken));
      const resp = await fetch(verifyRequest.url, { headers: { ...authHeader } });
      if (!resp.ok) {
        const text = await resp.text();
        throw new AppError(502, `Twitter token no longer valid: ${text}`);
      }
      const profile = await resp.json() as { screen_name?: string; name?: string; profile_image_url_https?: string };
      // Update handle/display_name if they were missing or stale
      if (profile.screen_name) {
        await query(
          `UPDATE platform_accounts SET handle = $1, display_name = $2, avatar_url = COALESCE($3, avatar_url), updated_at = now()
           WHERE id = $4`,
          [profile.screen_name, profile.name || profile.screen_name, profile.profile_image_url_https || null, account.id],
        );
      }
      // Token is still good — nothing to refresh for OAuth 1.0a
      newToken = { access_token: token.access_token, still_valid: true };
      break;
    }

    case 'reddit': {
      const credentials = Buffer.from(`${config.reddit.appId}:${config.reddit.secret}`).toString('base64');
      const resp = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': config.reddit.userAgent,
        },
        body: `grant_type=refresh_token&refresh_token=${token.refresh_token}`,
      });
      newToken = await resp.json();
      break;
    }

    case 'youtube': {
      const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.youtube.clientId,
          client_secret: config.youtube.clientSecret,
          refresh_token: token.refresh_token!,
          grant_type: 'refresh_token',
        }),
      });
      newToken = await resp.json();
      break;
    }

    case 'tiktok': {
      const resp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: config.tiktok.clientKey,
          client_secret: config.tiktok.clientSecret,
          refresh_token: token.refresh_token!,
          grant_type: 'refresh_token',
        }),
      });
      newToken = await resp.json();
      break;
    }

    default:
      throw new AppError(400, `Token refresh not supported for ${account.platform}`);
  }

  if (newToken.error) throw new AppError(502, `Token refresh failed: ${newToken.error}`);

  await query(
    `UPDATE oauth_tokens SET access_token = $1, refresh_token = COALESCE($2, refresh_token),
     expires_at = $3, raw_response = $4, updated_at = now()
     WHERE platform_account_id = $5`,
    [
      newToken.access_token,
      newToken.refresh_token || null,
      newToken.expires_in ? new Date(Date.now() + newToken.expires_in * 1000) : null,
      JSON.stringify(newToken),
      account.id,
    ],
  );

  res.json({ ok: true, message: 'Token refreshed' });
}));

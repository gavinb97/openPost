// ============================================================
// Platform Service Index — Unified interface
// ============================================================

export { twitterService } from './twitter';
export { redditService } from './reddit';
export { youtubeService } from './youtube';
export { tiktokService } from './tiktok';

// Coming Soon stubs
export const facebookService = {
  async post() { throw new Error('Facebook integration coming soon'); },
  async reply() { throw new Error('Facebook integration coming soon'); },
  async dm() { throw new Error('Facebook integration coming soon'); },
};

export const instagramService = {
  async post() { throw new Error('Instagram integration coming soon'); },
  async reply() { throw new Error('Instagram integration coming soon'); },
  async dm() { throw new Error('Instagram integration coming soon'); },
};

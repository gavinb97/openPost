// ============================================================
// Web Research Service — Gathers intel from free sources
// Sources: Reddit, DuckDuckGo, Hacker News, RSS/Google News
// Results are cached in research_cache table (2h TTL)
// ============================================================

import crypto from 'crypto';
import RSSParser from 'rss-parser';
import { query, queryOne } from './db';
import { config } from './config';
import type { Agent, OAuthToken, PlatformAccount, WebResearchConfig, ResearchResult } from '@onlyposts/shared';

const rssParser = new RSSParser({ timeout: 10_000 });

// ============================================================
// Helpers
// ============================================================

function hashQuery(q: string, source: string): string {
  return crypto.createHash('md5').update(`${source}:${q.toLowerCase().trim()}`).digest('hex');
}

/** Check cache for a query+source combo. Returns null if expired/missing. */
async function getCached(queryText: string, source: string): Promise<ResearchResult[] | null> {
  const hash = hashQuery(queryText, source);
  const row = await queryOne<{ results: ResearchResult[] }>(
    `SELECT results FROM research_cache
     WHERE query_hash = $1 AND source = $2 AND expires_at > now()`,
    [hash, source],
  );
  return row ? row.results : null;
}

/** Upsert results into cache with 2-hour TTL */
async function setCache(queryText: string, source: string, results: ResearchResult[]): Promise<void> {
  const hash = hashQuery(queryText, source);
  await query(
    `INSERT INTO research_cache (query_hash, source, query, results, fetched_at, expires_at)
     VALUES ($1, $2, $3, $4, now(), now() + INTERVAL '2 hours')
     ON CONFLICT (query_hash, source)
     DO UPDATE SET results = $4, fetched_at = now(), expires_at = now() + INTERVAL '2 hours'`,
    [hash, source, queryText, JSON.stringify(results)],
  );
}

// ============================================================
// Source: Reddit (uses existing OAuth tokens)
// ============================================================

export async function searchReddit(
  accessToken: string,
  queries: string[],
  depth: 'basic' | 'deep' = 'basic',
): Promise<ResearchResult[]> {
  const results: ResearchResult[] = [];
  const limit = depth === 'deep' ? 10 : 5;

  for (const q of queries.slice(0, 3)) {
    // Check cache first
    const cached = await getCached(q, 'reddit');
    if (cached) {
      results.push(...cached);
      continue;
    }

    try {
      const resp = await fetch(
        `https://oauth.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=hot&t=day&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'OnlyPosts/2.0',
          },
        },
      );
      if (!resp.ok) {
        console.warn(`[Research/Reddit] Search failed for "${q}": ${resp.status}`);
        continue;
      }

      const data = (await resp.json()) as any;
      const posts = data?.data?.children || [];
      const sourceResults: ResearchResult[] = [];

      for (const child of posts) {
        const post = child.data;
        if (!post || post.over_18) continue;

        sourceResults.push({
          title: post.title || '',
          snippet: (post.selftext || '').substring(0, 300) || post.title,
          url: `https://reddit.com${post.permalink}`,
          source: 'reddit',
          timestamp: new Date(post.created_utc * 1000).toISOString(),
        });
      }

      await setCache(q, 'reddit', sourceResults);
      results.push(...sourceResults);

      // Rate limit between queries
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err: any) {
      console.error(`[Research/Reddit] Error searching "${q}":`, err.message);
    }
  }

  return results;
}

// ============================================================
// Source: DuckDuckGo Instant Answer API (free, no key)
// Also does site:twitter.com searches for tweet discovery
// ============================================================

export async function searchDuckDuckGo(
  queries: string[],
  depth: 'basic' | 'deep' = 'basic',
): Promise<ResearchResult[]> {
  const results: ResearchResult[] = [];

  for (const q of queries.slice(0, 3)) {
    // --- General web search ---
    const cachedGeneral = await getCached(q, 'duckduckgo');
    if (cachedGeneral) {
      results.push(...cachedGeneral);
    } else {
      try {
        const resp = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`,
          { headers: { 'User-Agent': 'OnlyPosts/2.0' } },
        );
        if (resp.ok) {
          const data = (await resp.json()) as any;
          const sourceResults: ResearchResult[] = [];

          // Abstract (main topic summary)
          if (data.Abstract) {
            sourceResults.push({
              title: data.Heading || q,
              snippet: data.Abstract,
              url: data.AbstractURL || '',
              source: 'duckduckgo',
              timestamp: new Date().toISOString(),
            });
          }

          // Related topics
          const relatedTopics = data.RelatedTopics || [];
          for (const topic of relatedTopics.slice(0, depth === 'deep' ? 8 : 4)) {
            if (topic.Text && topic.FirstURL) {
              sourceResults.push({
                title: topic.Text.substring(0, 100),
                snippet: topic.Text,
                url: topic.FirstURL,
                source: 'duckduckgo',
                timestamp: new Date().toISOString(),
              });
            }
          }

          // News results from DuckDuckGo
          if (data.Results) {
            for (const r of data.Results.slice(0, 3)) {
              if (r.Text && r.FirstURL) {
                sourceResults.push({
                  title: r.Text.substring(0, 100),
                  snippet: r.Text,
                  url: r.FirstURL,
                  source: 'duckduckgo',
                  timestamp: new Date().toISOString(),
                });
              }
            }
          }

          await setCache(q, 'duckduckgo', sourceResults);
          results.push(...sourceResults);
        }
      } catch (err: any) {
        console.error(`[Research/DDG] Error searching "${q}":`, err.message);
      }
    }

    // --- Twitter-specific search via site:twitter.com ---
    const twitterQuery = `site:twitter.com ${q}`;
    const cachedTwitter = await getCached(twitterQuery, 'duckduckgo_twitter');
    if (cachedTwitter) {
      results.push(...cachedTwitter);
    } else {
      try {
        const resp = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(twitterQuery)}&format=json&no_html=1`,
          { headers: { 'User-Agent': 'OnlyPosts/2.0' } },
        );
        if (resp.ok) {
          const data = (await resp.json()) as any;
          const twitterResults: ResearchResult[] = [];

          const allTopics = [...(data.RelatedTopics || []), ...(data.Results || [])];
          for (const topic of allTopics.slice(0, 5)) {
            if (topic.Text && topic.FirstURL) {
              twitterResults.push({
                title: topic.Text.substring(0, 100),
                snippet: topic.Text,
                url: topic.FirstURL,
                source: 'twitter_via_ddg',
                timestamp: new Date().toISOString(),
              });
            }
          }

          await setCache(twitterQuery, 'duckduckgo_twitter', twitterResults);
          results.push(...twitterResults);
        }
      } catch (err: any) {
        console.error(`[Research/DDG-Twitter] Error searching "${q}":`, err.message);
      }
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  return results;
}

// ============================================================
// Source: RSS Feeds (Google News, any custom feed)
// ============================================================

export async function fetchRSSFeeds(
  queries: string[],
  customFeeds: string[] = [],
  depth: 'basic' | 'deep' = 'basic',
): Promise<ResearchResult[]> {
  const results: ResearchResult[] = [];
  const limit = depth === 'deep' ? 8 : 4;

  // Build list of feed URLs:
  // 1. Google News RSS for each search query
  // 2. Any custom RSS feeds the user configured
  const feedUrls: Array<{ url: string; cacheKey: string }> = [];

  for (const q of queries.slice(0, 3)) {
    feedUrls.push({
      url: `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`,
      cacheKey: `gnews:${q}`,
    });
  }

  for (const feedUrl of customFeeds.slice(0, 5)) {
    feedUrls.push({ url: feedUrl, cacheKey: `rss:${feedUrl}` });
  }

  for (const { url, cacheKey } of feedUrls) {
    const cached = await getCached(cacheKey, 'rss');
    if (cached) {
      results.push(...cached);
      continue;
    }

    try {
      const feed = await rssParser.parseURL(url);
      const sourceResults: ResearchResult[] = [];

      for (const item of (feed.items || []).slice(0, limit)) {
        sourceResults.push({
          title: item.title || '',
          snippet: (item.contentSnippet || item.content || item.title || '').substring(0, 300),
          url: item.link || '',
          source: 'rss',
          timestamp: item.isoDate || item.pubDate || new Date().toISOString(),
        });
      }

      await setCache(cacheKey, 'rss', sourceResults);
      results.push(...sourceResults);
    } catch (err: any) {
      console.error(`[Research/RSS] Error fetching "${url}":`, err.message);
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  return results;
}

// ============================================================
// Source: Hacker News (Algolia API — free, no key)
// ============================================================

export async function fetchHackerNews(
  queries: string[],
  depth: 'basic' | 'deep' = 'basic',
): Promise<ResearchResult[]> {
  const results: ResearchResult[] = [];
  const limit = depth === 'deep' ? 8 : 5;

  for (const q of queries.slice(0, 3)) {
    const cached = await getCached(q, 'hackernews');
    if (cached) {
      results.push(...cached);
      continue;
    }

    try {
      const resp = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=${limit}`,
      );
      if (!resp.ok) {
        console.warn(`[Research/HN] Search failed for "${q}": ${resp.status}`);
        continue;
      }

      const data = (await resp.json()) as any;
      const sourceResults: ResearchResult[] = [];

      for (const hit of data.hits || []) {
        sourceResults.push({
          title: hit.title || '',
          snippet: hit.title || '',
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          source: 'hackernews',
          timestamp: hit.created_at || new Date().toISOString(),
        });
      }

      await setCache(q, 'hackernews', sourceResults);
      results.push(...sourceResults);
    } catch (err: any) {
      console.error(`[Research/HN] Error searching "${q}":`, err.message);
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  return results;
}

// ============================================================
// Orchestrator — Runs all enabled sources, deduplicates, ranks
// ============================================================

export async function gatherResearch(
  agent: Agent,
  redditAccessToken?: string,
): Promise<ResearchResult[]> {
  const cfg: WebResearchConfig = agent.web_research_config || {};
  const queries = cfg.search_queries?.length ? cfg.search_queries : agent.topic_keywords;
  const depth = cfg.research_depth || 'basic';
  const sources = cfg.sources || { reddit: true, duckduckgo: true, hackernews: true, rss: true };

  if (!queries || queries.length === 0) {
    console.warn(`[Research] Agent "${agent.name}" has no search queries or topic keywords`);
    return [];
  }

  console.log(`[Research] Gathering research for "${agent.name}" — queries: [${queries.join(', ')}], depth: ${depth}`);

  // Run all enabled sources in parallel
  const fetchers: Promise<ResearchResult[]>[] = [];

  if (sources.reddit !== false && redditAccessToken) {
    fetchers.push(searchReddit(redditAccessToken, queries, depth));
  }

  if (sources.duckduckgo !== false) {
    fetchers.push(searchDuckDuckGo(queries, depth));
  }

  if (sources.hackernews !== false) {
    fetchers.push(fetchHackerNews(queries, depth));
  }

  if (sources.rss !== false) {
    fetchers.push(fetchRSSFeeds(queries, cfg.rss_feeds || [], depth));
  }

  const allResults = (await Promise.allSettled(fetchers))
    .filter((r): r is PromiseFulfilledResult<ResearchResult[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  // Deduplicate by URL
  const seen = new Set<string>();
  const deduped = allResults.filter((r) => {
    if (!r.url || seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  // Sort by timestamp (most recent first), then limit to top 15
  deduped.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });

  const final = deduped.slice(0, 15);
  console.log(`[Research] Found ${allResults.length} raw → ${deduped.length} unique → returning top ${final.length} results`);

  return final;
}

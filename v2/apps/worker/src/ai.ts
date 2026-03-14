// ============================================================
// AI Content Generation Service (used by processors)
// ============================================================

import OpenAI from 'openai';
import { config } from './config';
import { queryOne } from './db';
import { DEFAULT_PROMPTS, CHAR_LIMITS, GUARDRAIL_FLAGS } from '@onlyposts/shared';
import type { Agent, Platform, AgentConversation, ResearchResult } from '@onlyposts/shared';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export interface GeneratedContent {
  text: string;
  guardrailScore: number;
  flaggedTerms: string[];
  tokensUsed: number;
  needsReview: boolean;
}

/** Generate post content */
export async function generatePostContent(
  agent: Agent,
  platform: Platform,
  context?: string,
): Promise<GeneratedContent> {
  const charLimit = CHAR_LIMITS[platform]?.post || 280;

  let systemPrompt = agent.personality_prompt;
  if (platform === 'twitter') {
    systemPrompt += `\n${DEFAULT_PROMPTS.tweet}`;
  } else if (platform === 'reddit') {
    systemPrompt += `\n${DEFAULT_PROMPTS.reddit_title}`;
  }
  systemPrompt += `\nMax length: ${charLimit} characters.`;

  const userPrompt = context
    ? `Topic/context: ${context}\n\nWrite an engaging post.`
    : `Write an engaging social media post for ${platform}. Topic hints: ${agent.topic_keywords.join(', ') || 'general'}`;

  return generateWithGuardrails(agent, systemPrompt, userPrompt);
}

/** Generate reply content */
export async function generateReplyContent(
  agent: Agent,
  platform: Platform,
  originalContent: string,
  conversation?: AgentConversation | null,
): Promise<GeneratedContent> {
  const charLimit = CHAR_LIMITS[platform]?.reply || 1000;

  let systemPrompt = agent.personality_prompt + '\n' + DEFAULT_PROMPTS.reply;
  systemPrompt += `\nMax length: ${charLimit} characters.`;

  // Add conversation history for context
  if (conversation?.context_summary) {
    systemPrompt += `\n\nConversation history summary: ${conversation.context_summary}`;
  }
  if (conversation?.messages && conversation.messages.length > 0) {
    const recent = conversation.messages.slice(-5);
    systemPrompt += '\n\nRecent messages in this thread:';
    for (const msg of recent) {
      systemPrompt += `\n[${msg.role}]: ${msg.content}`;
    }
  }

  const userPrompt = `Reply to this post/message:\n\n"${originalContent}"`;

  return generateWithGuardrails(agent, systemPrompt, userPrompt);
}

/** Generate DM content */
export async function generateDMContent(
  agent: Agent,
  platform: Platform,
  targetUser: string,
  conversation?: AgentConversation | null,
): Promise<GeneratedContent> {
  const charLimit = CHAR_LIMITS[platform]?.dm || 2000;

  let systemPrompt = agent.personality_prompt + '\n' + DEFAULT_PROMPTS.dm;
  systemPrompt += `\nMax length: ${charLimit} characters.`;

  if (conversation?.context_summary) {
    systemPrompt += `\n\nPrevious conversation summary: ${conversation.context_summary}`;
  }

  let userPrompt: string;
  if (agent.dm_template) {
    userPrompt = `Send a DM to ${targetUser}. Use this template as a guide but make it natural:\n\n${agent.dm_template}`;
  } else {
    userPrompt = `Write a friendly, engaging DM to ${targetUser}. ${conversation ? 'Continue the conversation naturally.' : 'Start a new conversation.'}`;
  }

  return generateWithGuardrails(agent, systemPrompt, userPrompt);
}

/** Generate content based on web research results */
export async function generateResearchedContent(
  agent: Agent,
  platform: Platform,
  researchResults: ResearchResult[],
): Promise<GeneratedContent> {
  const charLimit = CHAR_LIMITS[platform]?.post || 280;

  let systemPrompt = agent.personality_prompt;
  systemPrompt += `\n${DEFAULT_PROMPTS.research_post}`;
  if (platform === 'twitter') {
    systemPrompt += `\nKeep it under 280 characters. Be punchy and quotable.`;
  } else if (platform === 'reddit') {
    systemPrompt += `\nUse a compelling title on the first line, then body text. Use markdown formatting.`;
  }
  systemPrompt += `\nMax length: ${charLimit} characters.`;

  // Build research context — include top 5 most relevant results
  const top = researchResults.slice(0, 5);
  let researchContext = 'Recent findings from web research:\n\n';
  for (let i = 0; i < top.length; i++) {
    const r = top[i];
    researchContext += `[${i + 1}] "${r.title}"\n`;
    if (r.snippet && r.snippet !== r.title) {
      researchContext += `    ${r.snippet.substring(0, 200)}\n`;
    }
    researchContext += `    Source: ${r.source}${r.timestamp ? ` | ${new Date(r.timestamp).toLocaleDateString()}` : ''}\n\n`;
  }

  const userPrompt = `${researchContext}\nBased on the above recent information, create an engaging ${platform} post in your voice. Pick the most interesting or timely finding and give your unique take on it. Topic focus: ${agent.topic_keywords.join(', ') || 'general'}`;

  return generateWithGuardrails(agent, systemPrompt, userPrompt);
}

/** Generate content with guardrail checks */
async function generateWithGuardrails(
  agent: Agent,
  systemPrompt: string,
  userPrompt: string,
): Promise<GeneratedContent> {
  const completion = await openai.chat.completions.create({
    model: agent.model || 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 500,
    temperature: 0.8,
  });

  const text = completion.choices[0]?.message?.content?.trim() || '';
  const tokensUsed = completion.usage?.total_tokens || 0;

  // Guardrail check
  const flaggedTerms = GUARDRAIL_FLAGS.filter((flag) =>
    text.toLowerCase().includes(flag.toLowerCase()),
  );
  const guardrailScore = flaggedTerms.length === 0 ? 1.0 : Math.max(0, 1 - flaggedTerms.length * 0.2);

  // Determine if needs review based on agent approval mode
  let needsReview = false;
  if (agent.approval_mode === 'review') {
    needsReview = true;
  } else if (agent.approval_mode === 'auto_with_guardrails' && guardrailScore < 0.8) {
    needsReview = true;
  }

  return { text, guardrailScore, flaggedTerms, tokensUsed, needsReview };
}

/** Update conversation memory after an interaction */
export async function updateConversationMemory(
  agentId: string,
  platform: Platform,
  platformAccountId: string,
  targetUser: string,
  role: 'agent' | 'user',
  content: string,
  threadId?: string,
) {
  const { query, queryOne } = await import('./db');

  // Find or create conversation
  let convo = await queryOne<AgentConversation>(
    `SELECT * FROM agent_conversations
     WHERE agent_id = $1 AND platform = $2 AND target_user = $3`,
    [agentId, platform, targetUser],
  );

  const newMessage = {
    role,
    content,
    timestamp: new Date().toISOString(),
  };

  if (convo) {
    const messages = [...convo.messages, newMessage];

    // Generate summary if messages getting long (every 10 messages)
    let contextSummary = convo.context_summary;
    if (messages.length % 10 === 0) {
      try {
        const summaryCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Summarize this conversation briefly in 2-3 sentences. Include key topics, sentiment, and any commitments made.' },
            { role: 'user', content: messages.map((m) => `[${m.role}]: ${m.content}`).join('\n') },
          ],
          max_tokens: 150,
        });
        contextSummary = summaryCompletion.choices[0]?.message?.content || contextSummary;
      } catch (err) {
        console.error('[AI] Failed to generate conversation summary:', err);
      }
    }

    await query(
      `UPDATE agent_conversations
       SET messages = $1, context_summary = $2, interaction_count = interaction_count + 1,
           last_interaction_at = now(), thread_id = COALESCE($3, thread_id)
       WHERE id = $4`,
      [JSON.stringify(messages), contextSummary, threadId, convo.id],
    );
  } else {
    await query(
      `INSERT INTO agent_conversations (
        agent_id, platform, platform_account_id, target_user, thread_id,
        messages, interaction_count, last_interaction_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 1, now())`,
      [agentId, platform, platformAccountId, targetUser, threadId, JSON.stringify([newMessage])],
    );
  }
}

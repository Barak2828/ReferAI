import Anthropic from '@anthropic-ai/sdk';
import type { GenerateContentParams, GenerateContentResult, Platform } from '@/types';

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildPrompt(params: GenerateContentParams): string {
    const langName = params.language === 'he' ? 'Hebrew' : 'English';

    const platformInstructions: Record<Platform, string> = {
        whatsapp: 'WhatsApp message (personal, direct, conversational, ~150 chars)',
        instagram: 'Instagram caption (visual, hashtags, emoji-rich, 2-3 paragraphs)',
        linkedin: 'LinkedIn post (professional tone, value-driven, 2-3 paragraphs)',
        facebook: 'Facebook post (community-oriented, shareable, 1-2 paragraphs)',
        twitter: 'Twitter/X post (punchy, under 280 chars, 1-2 hashtags)',
        tiktok: 'TikTok video script (casual, scene directions in brackets, hook + payoff)',
        email: 'Email (subject line + body, professional but warm)',
    };

    const platforms = params.platforms
        .map(p => `- "${p}": ${platformInstructions[p]}`)
        .join('\n');

    return `Generate referral marketing content in ${langName} for this product/service:
"${params.description}"

${params.tone ? `Tone: ${params.tone}` : ''}
${params.language === 'he' ? 'Write in natural Hebrew. Include relevant emojis.' : 'Include relevant emojis.'}

Generate content for these platforms:
${platforms}

Return ONLY a valid JSON object with platform names as keys and generated text as values. No markdown, no code fences.`;
}

export async function generateWithAnthropic(params: GenerateContentParams): Promise<GenerateContentResult> {
    const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
            { role: 'user', content: buildPrompt(params) },
        ],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') throw new Error('Empty response from Anthropic');

    const jsonStr = textBlock.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const content = JSON.parse(jsonStr) as Record<string, string>;
    return { success: true, content, provider: 'anthropic' };
}

export async function analyzeLeads(leads: Array<Record<string, unknown>>, campaignDescription: string): Promise<string> {
    const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: 'You are a marketing analytics expert. Analyze lead data and provide actionable insights in a concise format.',
        messages: [
            {
                role: 'user',
                content: `Campaign: ${campaignDescription}\n\nLeads data: ${JSON.stringify(leads)}\n\nProvide:\n1) Overall performance summary\n2) Top converting patterns\n3) Recommended next actions`,
            },
        ],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    return textBlock && textBlock.type === 'text' ? textBlock.text : 'Unable to analyze leads';
}

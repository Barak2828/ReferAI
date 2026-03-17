import OpenAI from 'openai';
import type { GenerateContentParams, GenerateContentResult, Platform } from '@/types';

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

function buildSystemPrompt(language: 'he' | 'en'): string {
    const langName = language === 'he' ? 'Hebrew' : 'English';
    return `You are a social media content expert specializing in referral marketing.
Generate high-converting ${langName} content for social media platforms.
${language === 'he' ? 'Write in Hebrew. Use natural Hebrew phrasing, not direct translations from English. Include relevant emojis.' : 'Write in English. Be concise and engaging. Include relevant emojis.'}
Return ONLY a valid JSON object with platform names as keys and the generated text as values. No markdown, no code fences, no explanations.`;
}

function buildUserPrompt(params: GenerateContentParams): string {
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

    return `Generate referral marketing content for this product/service:
"${params.description}"

${params.tone ? `Tone: ${params.tone}` : ''}

Generate content for these platforms:
${platforms}

Return a JSON object with platform names as keys.`;
}

export async function generateWithOpenAI(params: GenerateContentParams): Promise<GenerateContentResult> {
    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: buildSystemPrompt(params.language) },
            { role: 'user', content: buildUserPrompt(params) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: 2000,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('Empty response from OpenAI');

    const content = JSON.parse(raw) as Record<string, string>;
    return { success: true, content, provider: 'openai' };
}

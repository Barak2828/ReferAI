import type { GenerateContentParams, GenerateContentResult, AIProvider } from '@/types';
import { generateWithOpenAI } from './providers/openai';
import { generateWithAnthropic } from './providers/anthropic';

const primaryProvider = (process.env.AI_PRIMARY_PROVIDER || 'openai') as AIProvider;

export async function generateContent(params: GenerateContentParams): Promise<GenerateContentResult> {
    const primary = params.provider || primaryProvider;

    try {
        if (primary === 'openai') {
            return await generateWithOpenAI(params);
        } else {
            return await generateWithAnthropic(params);
        }
    } catch (primaryError) {
        console.error(`Primary AI (${primary}) failed:`, primaryError);

        // Fallback to other provider
        try {
            if (primary === 'openai') {
                return await generateWithAnthropic(params);
            } else {
                return await generateWithOpenAI(params);
            }
        } catch (fallbackError) {
            console.error('Fallback AI also failed:', fallbackError);
            return {
                success: false,
                content: {},
                error: 'AI generation failed. Please try again.',
            };
        }
    }
}

export { analyzeLeads } from './providers/anthropic';

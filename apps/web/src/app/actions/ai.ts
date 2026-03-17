'use server'

import { generateContent, analyzeLeads } from '@/lib/ai';
import type { GenerateContentParams, GenerateContentResult, AIProvider } from '@/types';

export async function generateCampaignContent(
    data: { description: string; platforms: string[]; language: string; provider?: AIProvider }
): Promise<GenerateContentResult> {
    try {
        const result = await generateContent({
            description: data.description,
            platforms: data.platforms as GenerateContentParams['platforms'],
            language: data.language as 'he' | 'en',
            provider: data.provider,
        });
        return result;
    } catch (error) {
        console.error('AI generation error:', error);
        return {
            success: false,
            content: {},
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function analyzeCampaignLeads(
    campaignDescription: string,
    leads: Array<Record<string, unknown>>
): Promise<{ success: boolean; analysis?: string; error?: string }> {
    try {
        const analysis = await analyzeLeads(leads, campaignDescription);
        return { success: true, analysis };
    } catch (error) {
        console.error('Lead analysis error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// ─── AI Media Generation (Direct — no NestJS dependency) ─────

import { generateImageWithDalle } from '@/lib/ai/providers/dalle';
import { generateImageWithGemini } from '@/lib/ai/providers/gemini-imagen';
import {
    analyzeChannel,
    generateSmartPrompts,
    type MediaGenerationResult,
    type SmartPromptResult,
} from '@/lib/riona/client';

export type ImageProvider = 'dalle' | 'gemini';

export async function generateCampaignImage(data: {
    prompt: string;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    style?: string;
    campaignId?: string;
    variants?: number;
    provider?: ImageProvider;
}): Promise<MediaGenerationResult> {
    try {
        const provider = data.provider || 'dalle';
        const variants = data.variants || 3;

        if (provider === 'gemini') {
            return await generateImageWithGemini(data.prompt, data.aspectRatio, variants);
        }
        return await generateImageWithDalle(data.prompt, data.aspectRatio, variants);
    } catch (error) {
        console.error('Image generation error:', error);
        return {
            success: false,
            assets: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function generateCampaignVideo(data: {
    prompt: string;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    duration?: 5 | 10;
    campaignId?: string;
}): Promise<MediaGenerationResult> {
    // Video generation is not yet available (Coming Soon)
    return {
        success: false,
        assets: [],
        error: 'Video generation is coming soon. Stay tuned!',
    };
}

export async function getAIMediaProviders() {
    return {
        image: {
            'dall-e-3': !!process.env.OPENAI_API_KEY,
            'gemini-imagen': !!process.env.GOOGLE_AI_API_KEY,
        },
        video: {},
    };
}

export async function analyzeUserChannel(
    userId: string,
    platform: string,
): Promise<{ success: boolean; analysis?: Record<string, any>; error?: string }> {
    try {
        return await analyzeChannel(userId, platform);
    } catch (error) {
        console.error('Channel analysis error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function getSmartPrompts(data: {
    userId: string;
    campaignDescription: string;
    campaignName: string;
    targetPlatform: string;
    language?: string;
}): Promise<SmartPromptResult> {
    try {
        return await generateSmartPrompts(
            data.userId,
            data.campaignDescription,
            data.campaignName,
            data.targetPlatform,
            data.language,
        );
    } catch (error) {
        console.error('Smart prompts error:', error);
        return {
            success: false,
            channelAnalysis: [],
            variants: [],
        };
    }
}

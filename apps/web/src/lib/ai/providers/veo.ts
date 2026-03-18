import { GoogleGenAI } from '@google/genai';
import type { MediaGenerationResult, MediaAssetResult } from '@/lib/riona/client';

export async function generateVideoWithVeo(
    prompt: string,
    aspectRatio: string = '9:16',
    duration: number = 8,
): Promise<MediaGenerationResult> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
        return { success: false, assets: [], error: 'Google AI API key not configured' };
    }

    const client = new GoogleGenAI({ apiKey });

    try {
        // Use Veo 3 for video generation via Gemini API
        let operation = await client.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: `Create a short vertical video for YouTube Shorts: ${prompt}`,
            config: {
                aspectRatio: aspectRatio as any,
                numberOfVideos: 1,
            },
        });

        // Poll for completion (video generation is async)
        const maxRetries = 60; // 5 minutes max
        for (let i = 0; i < maxRetries; i++) {
            if (operation.done) break;
            await new Promise(r => setTimeout(r, 5000)); // Poll every 5 seconds
            operation = await client.operations.get({ operation: operation });
        }

        if (!operation.done) {
            return { success: false, assets: [], error: 'Video generation timed out. Please try again.' };
        }

        const assets: MediaAssetResult[] = [];

        if (operation.response?.generatedVideos) {
            for (let i = 0; i < operation.response.generatedVideos.length; i++) {
                const video = operation.response.generatedVideos[i];
                if (video.video?.uri) {
                    assets.push({
                        id: `veo-${Date.now()}-${i}`,
                        url: video.video.uri,
                        type: 'video',
                        provider: 'google-veo',
                        prompt,
                        metadata: {
                            aspectRatio,
                            duration,
                            variant: i + 1,
                        },
                    });
                }
            }
        }

        if (assets.length === 0) {
            return { success: false, assets: [], error: 'Veo returned no videos. Try a different prompt.' };
        }

        return { success: true, assets };
    } catch (error) {
        console.error('Google Veo video generation error:', error);
        const message = error instanceof Error ? error.message : 'Unknown Veo error';
        if (message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
            return { success: false, assets: [], error: 'Daily video generation quota exceeded. Please try again tomorrow.' };
        }
        if (message.includes('paid plan')) {
            return { success: false, assets: [], error: 'Video generation requires a Google AI paid plan. Upgrade at https://ai.dev/projects' };
        }
        return { success: false, assets: [], error: message };
    }
}

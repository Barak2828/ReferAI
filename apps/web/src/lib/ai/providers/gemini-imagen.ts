import { GoogleGenAI } from '@google/genai';
import type { MediaGenerationResult, MediaAssetResult } from '@/lib/riona/client';

export async function generateImageWithGemini(
    prompt: string,
    aspectRatio: string = '1:1',
    variants: number = 3,
): Promise<MediaGenerationResult> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
        return { success: false, assets: [], error: 'Google AI API key not configured' };
    }

    const client = new GoogleGenAI({ apiKey });

    try {
        // Use Gemini native image generation (works on free tier)
        const assets: MediaAssetResult[] = [];

        for (let i = 0; i < Math.min(variants, 4); i++) {
            const response = await client.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: `Generate an image: ${prompt}. Variation ${i + 1} of ${variants}.`,
                config: {
                    responseModalities: ['TEXT', 'IMAGE'],
                },
            });

            if (response.candidates && response.candidates[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData?.mimeType?.startsWith('image/')) {
                        const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        assets.push({
                            id: `gemini-${Date.now()}-${i}`,
                            url: dataUrl,
                            type: 'image',
                            provider: 'gemini-imagen',
                            prompt,
                            metadata: {
                                aspectRatio,
                                variant: i + 1,
                            },
                        });
                        break; // One image per variant
                    }
                }
            }
        }

        if (assets.length === 0) {
            return { success: false, assets: [], error: 'Gemini returned no images. Try a different prompt.' };
        }

        return { success: true, assets };
    } catch (error) {
        console.error('Gemini image generation error:', error);
        const message = error instanceof Error ? error.message : 'Unknown Gemini error';
        if (message.includes('paid plan')) {
            return { success: false, assets: [], error: 'Gemini Imagen requires a paid Google AI plan. Please upgrade at https://ai.dev/projects' };
        }
        return { success: false, assets: [], error: message };
    }
}

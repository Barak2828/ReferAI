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
        const response = await client.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt,
            config: {
                numberOfImages: Math.min(variants, 4), // Imagen supports up to 4
            },
        });

        const assets: MediaAssetResult[] = [];

        if (response.generatedImages && response.generatedImages.length > 0) {
            for (let i = 0; i < response.generatedImages.length; i++) {
                const img = response.generatedImages[i];
                if (img.image?.imageBytes) {
                    // Convert base64 bytes to a data URL
                    const dataUrl = `data:image/png;base64,${img.image.imageBytes}`;
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
                }
            }
        }

        if (assets.length === 0) {
            return { success: false, assets: [], error: 'Gemini Imagen returned no images' };
        }

        return { success: true, assets };
    } catch (error) {
        console.error('Gemini Imagen error:', error);
        const message = error instanceof Error ? error.message : 'Unknown Gemini Imagen error';
        return { success: false, assets: [], error: message };
    }
}

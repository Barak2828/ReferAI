import OpenAI from 'openai';
import type { MediaGenerationResult, MediaAssetResult } from '@/lib/riona/client';

const ASPECT_RATIO_TO_SIZE: Record<string, '1024x1024' | '1792x1024' | '1024x1792'> = {
    '1:1': '1024x1024',
    '16:9': '1792x1024',
    '9:16': '1024x1792',
    '4:3': '1024x1024',  // closest supported size
    '3:4': '1024x1792',  // closest supported size
};

export async function generateImageWithDalle(
    prompt: string,
    aspectRatio: string = '1:1',
    variants: number = 3,
): Promise<MediaGenerationResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return { success: false, assets: [], error: 'OpenAI API key not configured' };
    }

    const client = new OpenAI({ apiKey });
    const size = ASPECT_RATIO_TO_SIZE[aspectRatio] || '1024x1024';

    const assets: MediaAssetResult[] = [];

    // DALL-E 3 only supports n=1, so we loop for multiple variants
    const variantSuffixes = [
        '',
        ' — use a different artistic style and color palette',
        ' — use a minimalist and modern design approach',
    ];

    for (let i = 0; i < Math.min(variants, 3); i++) {
        try {
            const variantPrompt = i === 0 ? prompt : `${prompt}${variantSuffixes[i] || ''}`;

            const response = await client.images.generate({
                model: 'dall-e-3',
                prompt: variantPrompt,
                n: 1,
                size,
                quality: 'hd',
                response_format: 'url',
            });

            const imageData = response.data?.[0];
            const imageUrl = imageData?.url;
            if (imageUrl) {
                assets.push({
                    id: `dalle-${Date.now()}-${i}`,
                    url: imageUrl,
                    type: 'image',
                    provider: 'dall-e-3',
                    prompt: variantPrompt,
                    metadata: {
                        aspectRatio,
                        size,
                        variant: i + 1,
                        revisedPrompt: imageData?.revised_prompt,
                    },
                });
            }
        } catch (error) {
            console.error(`DALL-E 3 variant ${i + 1} error:`, error);
            // Continue generating other variants even if one fails
        }
    }

    if (assets.length === 0) {
        return { success: false, assets: [], error: 'Failed to generate any images with DALL-E 3' };
    }

    return { success: true, assets };
}

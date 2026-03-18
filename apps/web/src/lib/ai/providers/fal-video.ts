import type { MediaGenerationResult, MediaAssetResult } from '@/lib/riona/client';

export async function generateVideoWithFal(
    prompt: string,
    aspectRatio: string = '9:16',
    duration: number = 5,
): Promise<MediaGenerationResult> {
    const apiKey = process.env.FAL_KEY;
    if (!apiKey) {
        return { success: false, assets: [], error: 'fal.ai API key not configured. Set FAL_KEY in .env.local' };
    }

    try {
        // Use fal.ai REST API directly (no SDK import needed for server actions)
        const response = await fetch('https://queue.fal.run/fal-ai/wan/v2.1/text-to-video', {
            method: 'POST',
            headers: {
                'Authorization': `Key ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: `Short vertical video for social media: ${prompt}`,
                num_frames: duration <= 5 ? 81 : 129, // ~5s or ~8s at 16fps
                resolution: aspectRatio === '9:16' ? '480p' : '720p',
                aspect_ratio: aspectRatio,
                enable_safety_checker: true,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `fal.ai API error: ${response.status}`);
        }

        const data = await response.json();

        // fal.ai queue API returns a request_id for async processing
        if (data.request_id) {
            // Poll for result
            const resultUrl = `https://queue.fal.run/fal-ai/wan/v2.1/text-to-video/requests/${data.request_id}`;
            const maxRetries = 60;
            for (let i = 0; i < maxRetries; i++) {
                await new Promise(r => setTimeout(r, 5000));

                const statusRes = await fetch(`${resultUrl}/status`, {
                    headers: { 'Authorization': `Key ${apiKey}` },
                });
                const statusData = await statusRes.json();

                if (statusData.status === 'COMPLETED') {
                    const resultRes = await fetch(resultUrl, {
                        headers: { 'Authorization': `Key ${apiKey}` },
                    });
                    const resultData = await resultRes.json();
                    return processResult(resultData, prompt, aspectRatio, duration);
                }

                if (statusData.status === 'FAILED') {
                    return { success: false, assets: [], error: 'Video generation failed. Try a different prompt.' };
                }
            }
            return { success: false, assets: [], error: 'Video generation timed out.' };
        }

        // Direct result (sync response)
        return processResult(data, prompt, aspectRatio, duration);
    } catch (error) {
        console.error('fal.ai video generation error:', error);
        const message = error instanceof Error ? error.message : 'Unknown fal.ai error';
        return { success: false, assets: [], error: message };
    }
}

function processResult(
    data: any,
    prompt: string,
    aspectRatio: string,
    duration: number,
): MediaGenerationResult {
    const assets: MediaAssetResult[] = [];

    if (data.video?.url) {
        assets.push({
            id: `fal-${Date.now()}-0`,
            url: data.video.url,
            type: 'video',
            provider: 'fal-ai',
            prompt,
            metadata: {
                aspectRatio,
                duration,
                model: 'wan-2.1',
            },
        });
    }

    if (assets.length === 0) {
        return { success: false, assets: [], error: 'fal.ai returned no video output.' };
    }

    return { success: true, assets };
}

import type { MediaGenerationResult, MediaAssetResult } from '@/lib/riona/client';

const FAL_API = 'https://queue.fal.run';
const MODEL = 'fal-ai/wan-t2v';

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
        // Step 1: Submit to queue
        const submitRes = await fetch(`${FAL_API}/${MODEL}`, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: `Short vertical video for social media: ${prompt}`,
                num_frames: duration <= 5 ? 81 : 129,
                resolution: '480p',
                aspect_ratio: aspectRatio,
                enable_safety_checker: true,
            }),
        });

        if (!submitRes.ok) {
            const errText = await submitRes.text();
            let errMsg = `fal.ai API error: ${submitRes.status}`;
            try { errMsg = JSON.parse(errText).detail || errMsg; } catch {}
            throw new Error(errMsg);
        }

        const submitData = await submitRes.json();
        const requestId = submitData.request_id;

        if (!requestId) {
            // Synchronous result returned directly
            return processResult(submitData, prompt, aspectRatio, duration);
        }

        // Step 2: Poll for completion
        const statusUrl = `${FAL_API}/${MODEL}/requests/${requestId}/status`;
        const resultUrl = `${FAL_API}/${MODEL}/requests/${requestId}`;
        const headers = { 'Authorization': `Key ${apiKey}` };

        for (let i = 0; i < 120; i++) { // Up to 10 minutes
            await new Promise(r => setTimeout(r, 5000));

            const statusRes = await fetch(statusUrl, { headers });
            const statusData = await statusRes.json();

            if (statusData.status === 'COMPLETED') {
                const resultRes = await fetch(resultUrl, { headers });
                const resultData = await resultRes.json();
                return processResult(resultData, prompt, aspectRatio, duration);
            }

            if (statusData.status === 'FAILED') {
                return { success: false, assets: [], error: statusData.error || 'Video generation failed. Try a different prompt.' };
            }
        }

        return { success: false, assets: [], error: 'Video generation timed out after 10 minutes.' };
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

    // fal.ai returns video in data.video.url
    const videoUrl = data.video?.url || data.output?.video?.url;
    if (videoUrl) {
        assets.push({
            id: `fal-${Date.now()}-0`,
            url: videoUrl,
            type: 'video',
            provider: 'fal-ai',
            prompt,
            metadata: {
                aspectRatio,
                duration,
                model: 'wan-t2v',
            },
        });
    }

    if (assets.length === 0) {
        return { success: false, assets: [], error: 'fal.ai returned no video output.' };
    }

    return { success: true, assets };
}

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface VideoGenerationRequest {
    prompt: string;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    duration?: 5 | 10;
    negativePrompt?: string;
}

export interface VideoGenerationResult {
    success: boolean;
    videoUrl?: string;
    taskId?: string;
    thumbnailUrl?: string;
    duration?: number;
    error?: string;
    provider: string;
}

@Injectable()
export class KlingService {
    private readonly logger = new Logger(KlingService.name);
    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.klingai.com/v1';

    constructor(private readonly httpService: HttpService) {
        this.apiKey = process.env.KLING_AI_API_KEY || '';
    }

    async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
        if (!this.apiKey) {
            return {
                success: false,
                error: 'KLING_AI_API_KEY not configured',
                provider: 'kling',
            };
        }

        try {
            this.logger.log(`Generating video with prompt: "${request.prompt.substring(0, 80)}..."`);

            // Submit video generation task
            const submitResponse = await firstValueFrom(
                this.httpService.post(
                    `${this.baseUrl}/videos/text2video`,
                    {
                        prompt: request.prompt,
                        aspect_ratio: request.aspectRatio || '9:16',
                        duration: request.duration || 5,
                        ...(request.negativePrompt && { negative_prompt: request.negativePrompt }),
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                        },
                        timeout: 30000,
                    },
                ),
            );

            const taskId = submitResponse.data?.data?.task_id;
            if (!taskId) {
                return {
                    success: false,
                    error: 'No task ID returned from Kling AI',
                    provider: 'kling',
                };
            }

            this.logger.log(`Video task submitted: ${taskId}, polling for completion...`);

            // Poll for completion (max 5 minutes)
            const result = await this.pollForCompletion(taskId, 60, 5000);
            return result;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message;
            this.logger.error(`Kling AI error: ${message}`);
            return {
                success: false,
                error: `Kling AI generation failed: ${message}`,
                provider: 'kling',
            };
        }
    }

    private async pollForCompletion(
        taskId: string,
        maxPolls: number,
        intervalMs: number,
    ): Promise<VideoGenerationResult> {
        for (let i = 0; i < maxPolls; i++) {
            await new Promise((resolve) => setTimeout(resolve, intervalMs));

            try {
                const statusResponse = await firstValueFrom(
                    this.httpService.get(`${this.baseUrl}/videos/${taskId}`, {
                        headers: {
                            Authorization: `Bearer ${this.apiKey}`,
                        },
                        timeout: 15000,
                    }),
                );

                const data = statusResponse.data?.data;
                const status = data?.status;

                if (status === 'completed' || status === 'succeed') {
                    const videoUrl = data?.works?.[0]?.resource?.resource || data?.video_url;
                    const thumbnailUrl = data?.works?.[0]?.resource?.cover || data?.thumbnail_url;

                    this.logger.log(`Video completed: ${videoUrl}`);
                    return {
                        success: true,
                        videoUrl,
                        taskId,
                        thumbnailUrl,
                        duration: data?.duration,
                        provider: 'kling',
                    };
                }

                if (status === 'failed') {
                    return {
                        success: false,
                        error: `Video generation failed: ${data?.error_message || 'Unknown error'}`,
                        taskId,
                        provider: 'kling',
                    };
                }

                this.logger.debug(`Video task ${taskId} status: ${status} (poll ${i + 1}/${maxPolls})`);
            } catch (error: any) {
                this.logger.warn(`Poll error for task ${taskId}: ${error.message}`);
            }
        }

        return {
            success: false,
            error: 'Video generation timed out',
            taskId,
            provider: 'kling',
        };
    }

    isConfigured(): boolean {
        return !!this.apiKey;
    }
}

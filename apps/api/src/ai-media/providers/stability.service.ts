import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';

export interface ImageGenerationRequest {
    prompt: string;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '9:21';
    negativePrompt?: string;
    style?: string; // e.g. 'photographic', 'digital-art', 'anime', etc.
}

export interface ImageGenerationResult {
    success: boolean;
    imageBuffer?: Buffer;
    contentType?: string;
    error?: string;
    provider: string;
}

@Injectable()
export class StabilityService {
    private readonly logger = new Logger(StabilityService.name);
    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.stability.ai';

    constructor(private readonly httpService: HttpService) {
        this.apiKey = process.env.STABILITY_AI_API_KEY || '';
    }

    async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
        if (!this.apiKey) {
            return {
                success: false,
                error: 'STABILITY_AI_API_KEY not configured',
                provider: 'stability',
            };
        }

        try {
            const formData = new FormData();
            formData.append('prompt', request.prompt);
            formData.append('model', 'sd3.5-medium');
            formData.append('output_format', 'png');

            if (request.aspectRatio) {
                formData.append('aspect_ratio', request.aspectRatio);
            }
            if (request.negativePrompt) {
                formData.append('negative_prompt', request.negativePrompt);
            }

            this.logger.log(`Generating image with prompt: "${request.prompt.substring(0, 80)}..."`);

            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.baseUrl}/v2beta/stable-image/generate/sd3`,
                    formData,
                    {
                        headers: {
                            ...formData.getHeaders(),
                            Authorization: `Bearer ${this.apiKey}`,
                            Accept: 'image/*',
                        },
                        responseType: 'arraybuffer',
                        timeout: 60000,
                    },
                ),
            );

            this.logger.log('Image generated successfully');

            return {
                success: true,
                imageBuffer: Buffer.from(response.data),
                contentType: 'image/png',
                provider: 'stability',
            };
        } catch (error: any) {
            const message = error.response?.data
                ? Buffer.from(error.response.data).toString('utf-8')
                : error.message;
            this.logger.error(`Stability AI error: ${message}`);
            return {
                success: false,
                error: `Stability AI generation failed: ${message}`,
                provider: 'stability',
            };
        }
    }

    isConfigured(): boolean {
        return !!this.apiKey;
    }
}

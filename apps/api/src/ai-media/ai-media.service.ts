import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StabilityService, ImageGenerationRequest } from './providers/stability.service';
import { KlingService, VideoGenerationRequest } from './providers/kling.service';

export interface GenerateImageDto {
    prompt: string;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '9:21';
    negativePrompt?: string;
    style?: string;
    campaignId?: string;
    variants?: number; // 1-3, default 1
}

export interface GenerateVideoDto {
    prompt: string;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    duration?: 5 | 10;
    negativePrompt?: string;
    campaignId?: string;
}

export interface MediaResult {
    success: boolean;
    assets: Array<{
        id: string;
        url: string;
        type: 'image' | 'video';
        provider: string;
        prompt: string;
        metadata?: Record<string, any>;
    }>;
    error?: string;
}

@Injectable()
export class AiMediaService {
    private readonly logger = new Logger(AiMediaService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly stabilityService: StabilityService,
        private readonly klingService: KlingService,
    ) {}

    async generateImage(dto: GenerateImageDto): Promise<MediaResult> {
        const variantCount = Math.min(dto.variants || 1, 3);
        const assets: MediaResult['assets'] = [];

        for (let i = 0; i < variantCount; i++) {
            // Slight prompt variations for multiple variants
            const prompt = variantCount > 1
                ? this.addVariantSuffix(dto.prompt, i)
                : dto.prompt;

            const result = await this.stabilityService.generateImage({
                prompt,
                aspectRatio: dto.aspectRatio,
                negativePrompt: dto.negativePrompt,
                style: dto.style,
            });

            if (!result.success || !result.imageBuffer) {
                this.logger.warn(`Image variant ${i + 1} failed: ${result.error}`);
                continue;
            }

            // Convert to base64 data URL for now (Supabase Storage upload can be added later)
            const base64 = result.imageBuffer.toString('base64');
            const dataUrl = `data:image/png;base64,${base64}`;

            // Save MediaAsset record
            const asset = await this.prisma.mediaAsset.create({
                data: {
                    type: 'image',
                    provider: 'stability',
                    prompt,
                    url: dataUrl,
                    metadata: JSON.stringify({
                        aspectRatio: dto.aspectRatio || '1:1',
                        format: 'png',
                        style: dto.style,
                        variant: i + 1,
                    }),
                    campaignId: dto.campaignId || null,
                },
            });

            assets.push({
                id: asset.id,
                url: dataUrl,
                type: 'image',
                provider: 'stability',
                prompt,
                metadata: { aspectRatio: dto.aspectRatio, variant: i + 1 },
            });
        }

        if (assets.length === 0) {
            return {
                success: false,
                assets: [],
                error: 'All image generation attempts failed',
            };
        }

        return { success: true, assets };
    }

    async generateVideo(dto: GenerateVideoDto): Promise<MediaResult> {
        // Try Kling AI first
        if (this.klingService.isConfigured()) {
            const result = await this.klingService.generateVideo({
                prompt: dto.prompt,
                aspectRatio: dto.aspectRatio,
                duration: dto.duration,
                negativePrompt: dto.negativePrompt,
            });

            if (result.success && result.videoUrl) {
                const asset = await this.prisma.mediaAsset.create({
                    data: {
                        type: 'video',
                        provider: 'kling',
                        prompt: dto.prompt,
                        url: result.videoUrl,
                        metadata: JSON.stringify({
                            aspectRatio: dto.aspectRatio || '9:16',
                            duration: result.duration || dto.duration || 5,
                            taskId: result.taskId,
                            thumbnailUrl: result.thumbnailUrl,
                        }),
                        campaignId: dto.campaignId || null,
                    },
                });

                return {
                    success: true,
                    assets: [{
                        id: asset.id,
                        url: result.videoUrl,
                        type: 'video',
                        provider: 'kling',
                        prompt: dto.prompt,
                        metadata: {
                            thumbnailUrl: result.thumbnailUrl,
                            duration: result.duration,
                            taskId: result.taskId,
                        },
                    }],
                };
            }

            this.logger.warn(`Kling AI failed: ${result.error}, no fallback available`);
        }

        return {
            success: false,
            assets: [],
            error: this.klingService.isConfigured()
                ? 'Video generation failed'
                : 'No video generation API configured (set KLING_AI_API_KEY)',
        };
    }

    async getAsset(assetId: string) {
        return this.prisma.mediaAsset.findUnique({ where: { id: assetId } });
    }

    async getCampaignAssets(campaignId: string) {
        return this.prisma.mediaAsset.findMany({
            where: { campaignId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteAsset(assetId: string) {
        return this.prisma.mediaAsset.delete({ where: { id: assetId } });
    }

    getAvailableProviders() {
        return {
            image: {
                stability: this.stabilityService.isConfigured(),
            },
            video: {
                kling: this.klingService.isConfigured(),
            },
        };
    }

    private addVariantSuffix(prompt: string, index: number): string {
        const styles = [
            '', // Original
            ', vibrant colors, dynamic composition',
            ', minimal clean design, professional look',
        ];
        return prompt + (styles[index] || '');
    }
}

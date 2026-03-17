import { Controller, Post, Get, Delete, Body, Param, Logger } from '@nestjs/common';
import { AiMediaService, GenerateImageDto, GenerateVideoDto } from './ai-media.service';

@Controller('ai-media')
export class AiMediaController {
    private readonly logger = new Logger(AiMediaController.name);

    constructor(private readonly aiMediaService: AiMediaService) {}

    @Post('generate-image')
    async generateImage(@Body() dto: GenerateImageDto) {
        this.logger.log(`Generate image request: "${dto.prompt?.substring(0, 60)}..."`);
        return this.aiMediaService.generateImage(dto);
    }

    @Post('generate-video')
    async generateVideo(@Body() dto: GenerateVideoDto) {
        this.logger.log(`Generate video request: "${dto.prompt?.substring(0, 60)}..."`);
        return this.aiMediaService.generateVideo(dto);
    }

    @Get('asset/:id')
    async getAsset(@Param('id') id: string) {
        const asset = await this.aiMediaService.getAsset(id);
        if (!asset) {
            return { error: 'Asset not found' };
        }
        return asset;
    }

    @Get('campaign/:campaignId/assets')
    async getCampaignAssets(@Param('campaignId') campaignId: string) {
        return this.aiMediaService.getCampaignAssets(campaignId);
    }

    @Delete('asset/:id')
    async deleteAsset(@Param('id') id: string) {
        return this.aiMediaService.deleteAsset(id);
    }

    @Get('providers')
    getProviders() {
        return this.aiMediaService.getAvailableProviders();
    }
}

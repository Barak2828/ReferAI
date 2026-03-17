import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ContentIntelligenceService } from './content-intelligence.service';

@Controller('content-intelligence')
export class ContentIntelligenceController {
    private readonly logger = new Logger(ContentIntelligenceController.name);

    constructor(private readonly service: ContentIntelligenceService) {}

    @Post('analyze-channel')
    async analyzeChannel(@Body() body: { userId: string; platform: string }) {
        this.logger.log(`Analyzing ${body.platform} channel for user ${body.userId}`);
        const result = await this.service.analyzeChannel(body.userId, body.platform);
        if (!result) {
            return { success: false, error: `No ${body.platform} account found or analysis failed` };
        }
        return { success: true, analysis: result };
    }

    @Post('generate-prompts')
    async generateSmartPrompts(@Body() body: {
        userId: string;
        campaignDescription: string;
        campaignName: string;
        targetPlatform: string;
        language?: string;
    }) {
        this.logger.log(`Generating smart prompts for campaign "${body.campaignName}"`);
        const result = await this.service.generateSmartPrompts(
            body.userId,
            body.campaignDescription,
            body.campaignName,
            body.targetPlatform,
            body.language || 'he',
        );
        return { success: true, ...result };
    }
}

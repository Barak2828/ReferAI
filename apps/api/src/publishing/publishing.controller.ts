import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { PublishingService } from './publishing.service';
import { YouTubePublisherService } from './platforms/youtube/youtube-publisher.service';

@Controller('publishing')
export class PublishingController {
    constructor(
        private readonly publishingService: PublishingService,
        private readonly youtubePublisher: YouTubePublisherService,
    ) {}

    /**
     * Publish content to a single platform.
     */
    @Post('publish')
    @HttpCode(HttpStatus.OK)
    async publish(
        @Body()
        body: {
            platform: string;
            accountId: string;
            campaignId: string;
            contentText: string;
            contentMeta?: Record<string, any>;
        },
    ) {
        const result = await this.publishingService.publish(
            body.platform as any,
            body.accountId,
            body.campaignId,
            body.contentText,
            body.contentMeta,
        );
        return result;
    }

    /**
     * Publish content to multiple platforms at once.
     */
    @Post('publish-all')
    @HttpCode(HttpStatus.OK)
    async publishAll(
        @Body()
        body: {
            campaignId: string;
            platforms: Array<{
                platform: string;
                accountId: string;
                contentText: string;
                contentMeta?: Record<string, any>;
            }>;
        },
    ) {
        const results = await this.publishingService.publishToAll(
            body.platforms as any,
            body.campaignId,
        );
        return { results };
    }

    /**
     * Get status of a publish job.
     */
    @Get('status/:jobId')
    async getJobStatus(@Param('jobId') jobId: string) {
        const job = await this.publishingService.getJobStatus(jobId);
        if (!job) {
            return { success: false, message: 'Job not found' };
        }
        return { success: true, job };
    }

    /**
     * Get all publish jobs for a campaign.
     */
    @Get('campaign/:campaignId/jobs')
    async getCampaignJobs(@Param('campaignId') campaignId: string) {
        const jobs = await this.publishingService.getCampaignJobs(campaignId);
        return { success: true, jobs };
    }

    /**
     * Retry a failed publish job.
     */
    @Post('retry/:jobId')
    @HttpCode(HttpStatus.OK)
    async retryJob(@Param('jobId') jobId: string) {
        return this.publishingService.retryJob(jobId);
    }

    /**
     * Validate a social account for publishing.
     */
    @Post('validate-account')
    @HttpCode(HttpStatus.OK)
    async validateAccount(
        @Body() body: { platform: string; accountId: string },
    ) {
        return this.publishingService.validateAccount(body.platform as any, body.accountId);
    }

    /**
     * Get list of available publishing platforms.
     */
    @Get('platforms')
    async getAvailablePlatforms() {
        return {
            platforms: this.publishingService.getAvailablePlatforms(),
        };
    }

    /**
     * Generate an AI video for YouTube publishing (HeyGen).
     */
    @Post('youtube/generate-video')
    @HttpCode(HttpStatus.OK)
    async generateVideo(
        @Body() body: { text: string; language?: string },
    ) {
        return this.youtubePublisher.generateVideo(body.text, body.language);
    }
}

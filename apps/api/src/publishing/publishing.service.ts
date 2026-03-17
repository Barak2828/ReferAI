import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IPlatformPublisher, PublishRequest, PublishResult } from './platforms/platform.interface';
import { InstagramPublisherService } from './platforms/instagram/instagram-publisher.service';
import { FacebookPublisherService } from './platforms/facebook/facebook-publisher.service';
import { WhatsAppPublisherService } from './platforms/whatsapp/whatsapp-publisher.service';
import { GoogleBusinessPublisherService } from './platforms/google-business/google-business-publisher.service';
import { YouTubePublisherService } from './platforms/youtube/youtube-publisher.service';

type SocialPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'WHATSAPP' | 'YOUTUBE' | 'GOOGLE_BUSINESS' | 'TWITTER' | 'LINKEDIN';

@Injectable()
export class PublishingService {
    private readonly logger = new Logger(PublishingService.name);
    private readonly publishers: Map<string, IPlatformPublisher>;

    constructor(
        private readonly prisma: PrismaService,
        private readonly instagramPublisher: InstagramPublisherService,
        private readonly facebookPublisher: FacebookPublisherService,
        private readonly whatsappPublisher: WhatsAppPublisherService,
        private readonly googleBusinessPublisher: GoogleBusinessPublisherService,
        private readonly youtubePublisher: YouTubePublisherService,
    ) {
        this.publishers = new Map<string, IPlatformPublisher>([
            ['INSTAGRAM', instagramPublisher],
            ['FACEBOOK', facebookPublisher],
            ['WHATSAPP', whatsappPublisher],
            ['GOOGLE_BUSINESS', googleBusinessPublisher],
            ['YOUTUBE', youtubePublisher],
        ]);
    }

    /**
     * Create a publish job and execute it.
     */
    async publish(
        platform: SocialPlatform,
        accountId: string,
        campaignId: string,
        contentText: string,
        contentMeta?: Record<string, any>,
    ): Promise<{ jobId: string; result: PublishResult }> {
        const publisher = this.publishers.get(platform);
        if (!publisher) {
            return {
                jobId: '',
                result: { success: false, message: `No publisher available for platform: ${platform}` },
            };
        }

        // Create a PublishJob record
        const job = await this.prisma.publishJob.create({
            data: {
                platform,
                contentText,
                contentMeta: contentMeta ? JSON.stringify(contentMeta) : null,
                status: 'PROCESSING',
                startedAt: new Date(),
                campaignId,
                accountId,
            },
        });

        try {
            const result = await publisher.publish({
                accountId,
                campaignId,
                contentText,
                contentMeta,
            });

            // Update job status
            await this.prisma.publishJob.update({
                where: { id: job.id },
                data: {
                    status: result.success ? 'COMPLETED' : 'FAILED',
                    errorMsg: result.success ? null : result.message,
                    completedAt: new Date(),
                },
            });

            return { jobId: job.id, result };
        } catch (error: any) {
            // Mark job as failed
            await this.prisma.publishJob.update({
                where: { id: job.id },
                data: {
                    status: 'FAILED',
                    errorMsg: error.message || 'Unknown error',
                    completedAt: new Date(),
                },
            });

            return {
                jobId: job.id,
                result: { success: false, message: error.message || 'Publishing failed' },
            };
        }
    }

    /**
     * Publish to multiple platforms at once.
     */
    async publishToAll(
        platforms: Array<{
            platform: SocialPlatform;
            accountId: string;
            contentText: string;
            contentMeta?: Record<string, any>;
        }>,
        campaignId: string,
    ): Promise<Array<{ platform: string; jobId: string; result: PublishResult }>> {
        const results = await Promise.allSettled(
            platforms.map((p) =>
                this.publish(p.platform, p.accountId, campaignId, p.contentText, p.contentMeta),
            ),
        );

        return results.map((r, i) => ({
            platform: platforms[i].platform,
            jobId: r.status === 'fulfilled' ? r.value.jobId : '',
            result:
                r.status === 'fulfilled'
                    ? r.value.result
                    : { success: false, message: (r as PromiseRejectedResult).reason?.message || 'Unknown error' },
        }));
    }

    /**
     * Get publish job status.
     */
    async getJobStatus(jobId: string) {
        return this.prisma.publishJob.findUnique({
            where: { id: jobId },
            select: {
                id: true,
                status: true,
                platform: true,
                errorMsg: true,
                retryCount: true,
                startedAt: true,
                completedAt: true,
                createdAt: true,
            },
        });
    }

    /**
     * Get all publish jobs for a campaign.
     */
    async getCampaignJobs(campaignId: string) {
        return this.prisma.publishJob.findMany({
            where: { campaignId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                platform: true,
                contentText: true,
                errorMsg: true,
                retryCount: true,
                startedAt: true,
                completedAt: true,
                createdAt: true,
                account: {
                    select: { id: true, username: true, platform: true },
                },
            },
        });
    }

    /**
     * Retry a failed publish job.
     */
    async retryJob(jobId: string): Promise<{ jobId: string; result: PublishResult }> {
        const job = await this.prisma.publishJob.findUnique({
            where: { id: jobId },
        });

        if (!job) {
            return { jobId, result: { success: false, message: 'Job not found' } };
        }

        if (job.status !== 'FAILED') {
            return { jobId, result: { success: false, message: `Job is not in FAILED state (current: ${job.status})` } };
        }

        if (job.retryCount >= job.maxRetries) {
            return { jobId, result: { success: false, message: `Max retries (${job.maxRetries}) exceeded` } };
        }

        // Update retry count
        await this.prisma.publishJob.update({
            where: { id: jobId },
            data: {
                status: 'RETRYING',
                retryCount: job.retryCount + 1,
            },
        });

        const contentMeta = job.contentMeta ? JSON.parse(job.contentMeta) : undefined;
        return this.publish(
            job.platform as SocialPlatform,
            job.accountId,
            job.campaignId,
            job.contentText,
            contentMeta,
        );
    }

    /**
     * Validate a social account connection for a platform.
     */
    async validateAccount(platform: SocialPlatform, accountId: string) {
        const publisher = this.publishers.get(platform);
        if (!publisher) {
            return { valid: false, message: `No publisher for ${platform}` };
        }
        return publisher.validateAccount(accountId);
    }

    /**
     * Get available platforms that have publishers.
     */
    getAvailablePlatforms(): string[] {
        return Array.from(this.publishers.keys());
    }
}

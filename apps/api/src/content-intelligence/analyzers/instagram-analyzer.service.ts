import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface InstagramChannelAnalysis {
    userId: string;
    username: string;
    topPosts: Array<{
        caption: string;
        likeCount: number;
        commentsCount: number;
        mediaType: string;
        timestamp: string;
        permalink: string;
    }>;
    hashtags: string[];
    captionStyle: string;
    averageEngagement: number;
    postingFrequency: string;
    contentMix: { images: number; videos: number; carousels: number };
}

@Injectable()
export class InstagramAnalyzerService {
    private readonly logger = new Logger(InstagramAnalyzerService.name);

    constructor(private readonly httpService: HttpService) {}

    async analyzeAccount(accessToken: string, igUserId: string): Promise<InstagramChannelAnalysis | null> {
        try {
            // Get user info
            const userResponse = await firstValueFrom(
                this.httpService.get(`https://graph.facebook.com/v18.0/${igUserId}`, {
                    params: {
                        fields: 'username,name,media_count,followers_count',
                        access_token: accessToken,
                    },
                    timeout: 15000,
                }),
            );

            const username = userResponse.data?.username || '';

            // Get recent media
            const mediaResponse = await firstValueFrom(
                this.httpService.get(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
                    params: {
                        fields: 'caption,like_count,comments_count,media_type,timestamp,permalink',
                        limit: 20,
                        access_token: accessToken,
                    },
                    timeout: 15000,
                }),
            );

            const posts = mediaResponse.data?.data || [];
            const topPosts = posts
                .map((p: any) => ({
                    caption: (p.caption || '').substring(0, 300),
                    likeCount: p.like_count || 0,
                    commentsCount: p.comments_count || 0,
                    mediaType: p.media_type || 'IMAGE',
                    timestamp: p.timestamp || '',
                    permalink: p.permalink || '',
                }))
                .sort((a: any, b: any) => (b.likeCount + b.commentsCount) - (a.likeCount + a.commentsCount));

            // Extract hashtags
            const allHashtags = posts
                .map((p: any) => p.caption || '')
                .join(' ')
                .match(/#\w+/g) || [];
            const hashtagCounts = new Map<string, number>();
            for (const tag of allHashtags) {
                hashtagCounts.set(tag.toLowerCase(), (hashtagCounts.get(tag.toLowerCase()) || 0) + 1);
            }
            const topHashtags = Array.from(hashtagCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([tag]) => tag);

            // Calculate engagement
            const totalInteractions = topPosts.reduce(
                (sum: number, p: any) => sum + p.likeCount + p.commentsCount,
                0,
            );
            const avgEngagement = topPosts.length > 0 ? totalInteractions / topPosts.length : 0;

            // Content mix
            const contentMix = {
                images: posts.filter((p: any) => p.media_type === 'IMAGE').length,
                videos: posts.filter((p: any) => p.media_type === 'VIDEO').length,
                carousels: posts.filter((p: any) => p.media_type === 'CAROUSEL_ALBUM').length,
            };

            // Posting frequency
            const postingFrequency = this.calculateFrequency(posts);

            // Caption style
            const captionStyle = this.inferCaptionStyle(posts);

            return {
                userId: igUserId,
                username,
                topPosts,
                hashtags: topHashtags,
                captionStyle,
                averageEngagement: Math.round(avgEngagement),
                postingFrequency,
                contentMix,
            };
        } catch (error: any) {
            this.logger.error(`Instagram analysis failed: ${error.message}`);
            return null;
        }
    }

    private calculateFrequency(posts: any[]): string {
        if (posts.length < 2) return 'unknown';
        const timestamps = posts
            .map((p: any) => new Date(p.timestamp).getTime())
            .filter((t: number) => !isNaN(t))
            .sort((a: number, b: number) => b - a);

        if (timestamps.length < 2) return 'unknown';
        const daysBetween = (timestamps[0] - timestamps[timestamps.length - 1]) / (1000 * 60 * 60 * 24);
        const postsPerDay = timestamps.length / Math.max(daysBetween, 1);

        if (postsPerDay >= 2) return 'multiple-daily';
        if (postsPerDay >= 0.8) return 'daily';
        if (postsPerDay >= 0.3) return 'few-times-weekly';
        if (postsPerDay >= 0.1) return 'weekly';
        return 'infrequent';
    }

    private inferCaptionStyle(posts: any[]): string {
        const captions = posts.map((p: any) => p.caption || '').filter(Boolean);
        if (captions.length === 0) return 'minimal';

        const avgLength = captions.reduce((sum: number, c: string) => sum + c.length, 0) / captions.length;
        const hasEmojis = captions.some((c: string) => /[\u{1F300}-\u{1FAFF}]/u.test(c));
        const hasHashtags = captions.some((c: string) => /#\w+/.test(c));

        if (avgLength > 500) return hasEmojis ? 'long-casual' : 'long-professional';
        if (avgLength > 150) return hasHashtags ? 'medium-hashtag-heavy' : 'medium-storytelling';
        return hasEmojis ? 'short-casual' : 'short-minimal';
    }
}

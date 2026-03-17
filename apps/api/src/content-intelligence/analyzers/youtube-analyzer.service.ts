import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface YouTubeChannelAnalysis {
    channelId: string;
    channelTitle: string;
    topVideos: Array<{
        title: string;
        description: string;
        viewCount: number;
        likeCount: number;
        tags: string[];
        publishedAt: string;
    }>;
    themes: string[];
    averageEngagement: number;
    contentStyle: string;
    topTags: string[];
}

@Injectable()
export class YouTubeAnalyzerService {
    private readonly logger = new Logger(YouTubeAnalyzerService.name);

    constructor(private readonly httpService: HttpService) {}

    async analyzeChannel(accessToken: string, channelId?: string): Promise<YouTubeChannelAnalysis | null> {
        try {
            // Get channel info
            const channelResponse = await firstValueFrom(
                this.httpService.get('https://www.googleapis.com/youtube/v3/channels', {
                    params: {
                        part: 'snippet,statistics',
                        ...(channelId ? { id: channelId } : { mine: true }),
                    },
                    headers: { Authorization: `Bearer ${accessToken}` },
                    timeout: 15000,
                }),
            );

            const channel = channelResponse.data?.items?.[0];
            if (!channel) {
                this.logger.warn('No YouTube channel found');
                return null;
            }

            const resolvedChannelId = channel.id;

            // Get top videos by view count
            const searchResponse = await firstValueFrom(
                this.httpService.get('https://www.googleapis.com/youtube/v3/search', {
                    params: {
                        part: 'snippet',
                        channelId: resolvedChannelId,
                        type: 'video',
                        order: 'viewCount',
                        maxResults: 20,
                    },
                    headers: { Authorization: `Bearer ${accessToken}` },
                    timeout: 15000,
                }),
            );

            const videoIds = searchResponse.data?.items
                ?.map((item: any) => item.id?.videoId)
                .filter(Boolean)
                .join(',');

            if (!videoIds) {
                return {
                    channelId: resolvedChannelId,
                    channelTitle: channel.snippet?.title || '',
                    topVideos: [],
                    themes: [],
                    averageEngagement: 0,
                    contentStyle: 'unknown',
                    topTags: [],
                };
            }

            // Get detailed video stats
            const videosResponse = await firstValueFrom(
                this.httpService.get('https://www.googleapis.com/youtube/v3/videos', {
                    params: {
                        part: 'snippet,statistics',
                        id: videoIds,
                    },
                    headers: { Authorization: `Bearer ${accessToken}` },
                    timeout: 15000,
                }),
            );

            const videos = videosResponse.data?.items || [];
            const topVideos = videos.map((v: any) => ({
                title: v.snippet?.title || '',
                description: (v.snippet?.description || '').substring(0, 200),
                viewCount: parseInt(v.statistics?.viewCount || '0', 10),
                likeCount: parseInt(v.statistics?.likeCount || '0', 10),
                tags: (v.snippet?.tags || []).slice(0, 10),
                publishedAt: v.snippet?.publishedAt || '',
            }));

            // Extract themes and tags
            const allTags = topVideos.flatMap((v: any) => v.tags);
            const tagCounts = new Map<string, number>();
            for (const tag of allTags) {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            }
            const topTags = Array.from(tagCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15)
                .map(([tag]) => tag);

            const totalViews = topVideos.reduce((sum: number, v: any) => sum + v.viewCount, 0);
            const totalLikes = topVideos.reduce((sum: number, v: any) => sum + v.likeCount, 0);
            const avgEngagement = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;

            // Extract themes from titles
            const themes = this.extractThemes(topVideos.map((v: any) => v.title));

            return {
                channelId: resolvedChannelId,
                channelTitle: channel.snippet?.title || '',
                topVideos,
                themes,
                averageEngagement: Math.round(avgEngagement * 100) / 100,
                contentStyle: this.inferContentStyle(topVideos),
                topTags,
            };
        } catch (error: any) {
            this.logger.error(`YouTube analysis failed: ${error.message}`);
            return null;
        }
    }

    private extractThemes(titles: string[]): string[] {
        const words = titles
            .join(' ')
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter((w) => w.length > 3);

        const wordCounts = new Map<string, number>();
        const stopWords = new Set(['this', 'that', 'with', 'from', 'will', 'have', 'been', 'your', 'what', 'when', 'how']);
        for (const word of words) {
            if (!stopWords.has(word)) {
                wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
            }
        }

        return Array.from(wordCounts.entries())
            .filter(([, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);
    }

    private inferContentStyle(videos: Array<{ title: string; viewCount: number }>): string {
        const titles = videos.map((v) => v.title.toLowerCase()).join(' ');
        if (titles.includes('tutorial') || titles.includes('how to') || titles.includes('guide')) return 'educational';
        if (titles.includes('review') || titles.includes('unboxing')) return 'review';
        if (titles.includes('vlog') || titles.includes('day in')) return 'vlog';
        if (titles.includes('game') || titles.includes('play') || titles.includes('stream')) return 'gaming';
        if (titles.includes('news') || titles.includes('update')) return 'news';
        return 'general';
    }
}

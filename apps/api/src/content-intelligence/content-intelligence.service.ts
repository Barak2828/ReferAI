import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OAuthService } from '../oauth/oauth.service';
import { YouTubeAnalyzerService, YouTubeChannelAnalysis } from './analyzers/youtube-analyzer.service';
import { InstagramAnalyzerService, InstagramChannelAnalysis } from './analyzers/instagram-analyzer.service';

export interface ChannelAnalysis {
    platform: string;
    youtube?: YouTubeChannelAnalysis;
    instagram?: InstagramChannelAnalysis;
}

export interface PromptVariant {
    label: string;
    description: string;
    textPrompt: string;
    imagePrompt: string;
    videoPrompt: string;
}

export interface SmartPromptResult {
    channelAnalysis: ChannelAnalysis[];
    variants: PromptVariant[];
}

@Injectable()
export class ContentIntelligenceService {
    private readonly logger = new Logger(ContentIntelligenceService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly oauthService: OAuthService,
        private readonly youtubeAnalyzer: YouTubeAnalyzerService,
        private readonly instagramAnalyzer: InstagramAnalyzerService,
    ) {}

    async analyzeChannel(userId: string, platform: string): Promise<ChannelAnalysis | null> {
        // Find the user's connected account for this platform
        const account = await this.prisma.socialAccount.findFirst({
            where: {
                userId,
                platform: platform as any,
                isActive: true,
            },
            include: { oauthToken: true },
        });

        if (!account) {
            this.logger.warn(`No ${platform} account found for user ${userId}`);
            return null;
        }

        if (platform === 'YOUTUBE') {
            if (!account.oauthToken) {
                return null;
            }
            const token = await this.oauthService.getValidToken(account.id);
            if (!token) return null;

            const decryptedAccessToken = this.oauthService.decryptToken(token.accessToken);
            const analysis = await this.youtubeAnalyzer.analyzeChannel(decryptedAccessToken);
            return analysis ? { platform: 'YOUTUBE', youtube: analysis } : null;
        }

        if (platform === 'INSTAGRAM') {
            if (!account.oauthToken) {
                return null;
            }
            const token = await this.oauthService.getValidToken(account.id);
            if (!token) return null;

            const decryptedAccessToken = this.oauthService.decryptToken(token.accessToken);
            const meta = account.oauthToken.platformMeta
                ? JSON.parse(account.oauthToken.platformMeta)
                : {};
            const igUserId = meta.igUserId || account.oauthToken.platformUserId;
            if (!igUserId) return null;

            const analysis = await this.instagramAnalyzer.analyzeAccount(decryptedAccessToken, igUserId);
            return analysis ? { platform: 'INSTAGRAM', instagram: analysis } : null;
        }

        return null;
    }

    async generateSmartPrompts(
        userId: string,
        campaignDescription: string,
        campaignName: string,
        targetPlatform: string,
        language: string = 'he',
    ): Promise<SmartPromptResult> {
        // Analyze all connected channels
        const analyses: ChannelAnalysis[] = [];

        const accounts = await this.prisma.socialAccount.findMany({
            where: { userId, isActive: true, platform: { in: ['YOUTUBE', 'INSTAGRAM'] } },
        });

        for (const account of accounts) {
            const analysis = await this.analyzeChannel(userId, account.platform);
            if (analysis) analyses.push(analysis);
        }

        // Build context from analyses
        const channelContext = this.buildChannelContext(analyses);

        // Generate 3 prompt variants
        const variants = this.generateVariants(
            campaignDescription,
            campaignName,
            targetPlatform,
            channelContext,
            language,
        );

        return { channelAnalysis: analyses, variants };
    }

    private buildChannelContext(analyses: ChannelAnalysis[]): string {
        const parts: string[] = [];

        for (const analysis of analyses) {
            if (analysis.youtube) {
                const yt = analysis.youtube;
                parts.push(`YouTube Channel "${yt.channelTitle}":
- Content style: ${yt.contentStyle}
- Top themes: ${yt.themes.join(', ')}
- Top tags: ${yt.topTags.slice(0, 10).join(', ')}
- Avg engagement: ${yt.averageEngagement}%
- Top video titles: ${yt.topVideos.slice(0, 5).map(v => v.title).join('; ')}`);
            }

            if (analysis.instagram) {
                const ig = analysis.instagram;
                parts.push(`Instagram @${ig.username}:
- Caption style: ${ig.captionStyle}
- Top hashtags: ${ig.hashtags.slice(0, 10).join(' ')}
- Avg engagement: ${ig.averageEngagement} interactions/post
- Posting frequency: ${ig.postingFrequency}
- Content mix: ${ig.contentMix.images} images, ${ig.contentMix.videos} videos, ${ig.contentMix.carousels} carousels`);
            }
        }

        return parts.join('\n\n');
    }

    private generateVariants(
        campaignDescription: string,
        campaignName: string,
        targetPlatform: string,
        channelContext: string,
        language: string,
    ): PromptVariant[] {
        const isHebrew = language === 'he';
        const baseContext = `Campaign: ${campaignName}\nDescription: ${campaignDescription}\nTarget: ${targetPlatform}`;
        const fullContext = channelContext
            ? `${baseContext}\n\nExisting Channel Analysis:\n${channelContext}`
            : baseContext;

        return [
            {
                label: isHebrew ? 'עקבי עם המותג' : 'Brand-Consistent',
                description: isHebrew
                    ? 'תוכן שמתאים לסגנון הקיים של הערוץ שלך'
                    : 'Content matching your existing channel style',
                textPrompt: isHebrew
                    ? `צור פוסט ל-${targetPlatform} בסגנון שמתאים לערוץ הקיים שלי.\nהקמפיין: ${campaignName}\nתיאור: ${campaignDescription}\n${channelContext ? `ניתוח ערוץ:\n${channelContext}` : ''}\nשמור על אותו טון, סגנון ואורך כמו התכנים הקיימים שלי.`
                    : `Create a ${targetPlatform} post in my existing channel style.\n${fullContext}\nMatch the tone, style, and length of my existing content.`,
                imagePrompt: `Professional social media image for: ${campaignDescription}. Style: brand-consistent, clean, modern design matching existing channel aesthetic.`,
                videoPrompt: `Create a short promotional video about: ${campaignDescription}. Style: matching the creator's existing content tone and visual style. ${targetPlatform === 'YOUTUBE' ? 'Vertical 9:16 format for YouTube Shorts.' : ''}`,
            },
            {
                label: isHebrew ? 'ויראלי' : 'Viral-Optimized',
                description: isHebrew
                    ? 'תוכן מותאם לוויראליות ומעורבות גבוהה'
                    : 'Content optimized for virality and high engagement',
                textPrompt: isHebrew
                    ? `צור פוסט ויראלי ל-${targetPlatform} שימשוך תשומת לב מיידית.\nהקמפיין: ${campaignName}\nתיאור: ${campaignDescription}\nהשתמש בהוק חזק בתחילת הפוסט, שאלות מעוררות סקרנות, ואמוג'ים. הפוך אותו לשתיף.`
                    : `Create a viral ${targetPlatform} post with an attention-grabbing hook.\n${fullContext}\nUse a strong opening hook, curiosity-inducing questions, and make it highly shareable.`,
                imagePrompt: `Eye-catching, bold social media image for: ${campaignDescription}. Style: viral, vibrant colors, high contrast, attention-grabbing, dynamic composition with bold text overlay.`,
                videoPrompt: `Create a viral short video about: ${campaignDescription}. Start with a shocking hook in the first 2 seconds. Fast-paced editing, trending style. Vertical 9:16 format.`,
            },
            {
                label: isHebrew ? 'ממוקד קהל' : 'Audience-Targeted',
                description: isHebrew
                    ? 'תוכן מותאם לקהל היעד שלך על סמך נתוני המעורבות'
                    : 'Content tailored to your audience based on engagement data',
                textPrompt: isHebrew
                    ? `צור פוסט ל-${targetPlatform} שמותאם במיוחד לקהל היעד שלי.\nהקמפיין: ${campaignName}\nתיאור: ${campaignDescription}\n${channelContext ? `ניתוח ערוץ:\n${channelContext}` : ''}\nהתמקד בנושאים שמקבלים הכי הרבה מעורבות מהקהל שלי.`
                    : `Create a ${targetPlatform} post specifically tailored to my audience.\n${fullContext}\nFocus on topics and formats that get the highest engagement from my existing audience.`,
                imagePrompt: `Targeted social media image for: ${campaignDescription}. Style: audience-focused, relatable, warm and inviting design that resonates with existing followers.`,
                videoPrompt: `Create a targeted short video about: ${campaignDescription}. Address the audience directly, use a conversational tone. Focus on value and relatability. Vertical 9:16 format.`,
            },
        ];
    }
}

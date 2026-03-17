import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { OAuthModule } from '../oauth/oauth.module';
import { ContentIntelligenceService } from './content-intelligence.service';
import { ContentIntelligenceController } from './content-intelligence.controller';
import { YouTubeAnalyzerService } from './analyzers/youtube-analyzer.service';
import { InstagramAnalyzerService } from './analyzers/instagram-analyzer.service';

@Module({
    imports: [PrismaModule, HttpModule, OAuthModule],
    controllers: [ContentIntelligenceController],
    providers: [ContentIntelligenceService, YouTubeAnalyzerService, InstagramAnalyzerService],
    exports: [ContentIntelligenceService],
})
export class ContentIntelligenceModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RionaModule } from './riona/riona.module';
import { SocialCredentialsModule } from './social-credentials/social-credentials.module';
import { OAuthModule } from './oauth/oauth.module';
import { PublishingModule } from './publishing/publishing.module';
import { AiMediaModule } from './ai-media/ai-media.module';
import { ContentIntelligenceModule } from './content-intelligence/content-intelligence.module';

@Module({
    imports: [
        PrismaModule,
        RionaModule,
        SocialCredentialsModule,
        OAuthModule,
        PublishingModule,
        AiMediaModule,
        ContentIntelligenceModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { RionaModule } from './riona/riona.module';
import { SocialCredentialsModule } from './social-credentials/social-credentials.module';
import { OAuthModule } from './oauth/oauth.module';
import { PublishingModule } from './publishing/publishing.module';
import { AiMediaModule } from './ai-media/ai-media.module';
import { ContentIntelligenceModule } from './content-intelligence/content-intelligence.module';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard';

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
    providers: [
        {
            provide: APP_GUARD,
            useClass: SupabaseAuthGuard,
        },
    ],
})
export class AppModule {}

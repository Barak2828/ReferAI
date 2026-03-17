import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PublishingService } from './publishing.service';
import { PublishingController } from './publishing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RionaModule } from '../riona/riona.module';
import { SocialCredentialsModule } from '../social-credentials/social-credentials.module';
import { OAuthModule } from '../oauth/oauth.module';
import { InstagramPublisherService } from './platforms/instagram/instagram-publisher.service';
import { FacebookPublisherService } from './platforms/facebook/facebook-publisher.service';
import { WhatsAppPublisherService } from './platforms/whatsapp/whatsapp-publisher.service';
import { GoogleBusinessPublisherService } from './platforms/google-business/google-business-publisher.service';
import { YouTubePublisherService } from './platforms/youtube/youtube-publisher.service';

@Module({
    imports: [
        PrismaModule,
        HttpModule,
        RionaModule,
        SocialCredentialsModule,
        OAuthModule,
    ],
    controllers: [PublishingController],
    providers: [
        PublishingService,
        InstagramPublisherService,
        FacebookPublisherService,
        WhatsAppPublisherService,
        GoogleBusinessPublisherService,
        YouTubePublisherService,
    ],
    exports: [PublishingService],
})
export class PublishingModule {}

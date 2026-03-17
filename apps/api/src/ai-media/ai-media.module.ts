import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { AiMediaService } from './ai-media.service';
import { AiMediaController } from './ai-media.controller';
import { StabilityService } from './providers/stability.service';
import { KlingService } from './providers/kling.service';

@Module({
    imports: [PrismaModule, HttpModule],
    controllers: [AiMediaController],
    providers: [AiMediaService, StabilityService, KlingService],
    exports: [AiMediaService],
})
export class AiMediaModule {}

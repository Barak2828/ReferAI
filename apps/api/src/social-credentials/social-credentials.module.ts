import { Module } from '@nestjs/common';
import { SocialCredentialsService } from './social-credentials.service';
import { SocialCredentialsController } from './social-credentials.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SocialCredentialsController],
    providers: [SocialCredentialsService],
    exports: [SocialCredentialsService],
})
export class SocialCredentialsModule {}

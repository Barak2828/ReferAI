import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('Prisma connected to database');
        } catch (error: any) {
            this.logger.warn(`Prisma connection skipped (using Supabase REST instead): ${error.message}`);
        }
    }

    async onModuleDestroy() {
        try {
            await this.$disconnect();
        } catch {
            // Best-effort disconnect
        }
    }
}

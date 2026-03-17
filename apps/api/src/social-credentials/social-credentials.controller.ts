import { Controller, Post, Get, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { SocialCredentialsService } from './social-credentials.service';

@Controller('social-credentials')
export class SocialCredentialsController {
    constructor(private readonly service: SocialCredentialsService) {}

    @Post('link')
    @HttpCode(HttpStatus.OK)
    async linkAccount(
        @Body() body: { userId: string; platform: 'INSTAGRAM' | 'TWITTER'; username: string; password: string },
    ) {
        const account = await this.service.linkAccount(
            body.userId,
            body.platform,
            body.username,
            body.password,
        );
        return {
            success: true,
            account: { id: account.id, platform: account.platform, username: account.username },
        };
    }

    @Get('accounts')
    async getLinkedAccounts(@Query('userId') userId: string) {
        const accounts = await this.service.getLinkedAccounts(userId);
        return { success: true, accounts };
    }

    @Delete(':accountId')
    @HttpCode(HttpStatus.OK)
    async unlinkAccount(
        @Param('accountId') accountId: string,
        @Body() body: { userId: string },
    ) {
        await this.service.unlinkAccount(accountId, body.userId);
        return { success: true, message: 'Account unlinked' };
    }
}

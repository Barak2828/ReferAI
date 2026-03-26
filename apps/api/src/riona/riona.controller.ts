import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RionaService } from './riona.service';
import { Public } from '../auth/supabase-auth.guard';

@Controller('riona')
export class RionaController {
    constructor(private readonly rionaService: RionaService) {}

    @Public()
    @Get('status')
    async getStatus() {
        return this.rionaService.getStatus();
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() body: { username: string; password: string }) {
        return this.rionaService.login(body.username, body.password);
    }

    @Post('interact')
    @HttpCode(HttpStatus.OK)
    async interact(@Body() body: { sessionUsername: string }) {
        return this.rionaService.interact(body.sessionUsername);
    }

    @Post('dm')
    @HttpCode(HttpStatus.OK)
    async sendDm(
        @Body() body: { sessionUsername: string; targetUsername: string; message: string },
    ) {
        return this.rionaService.sendDm(body.sessionUsername, body.targetUsername, body.message);
    }

    @Post('dm/bulk')
    @HttpCode(HttpStatus.OK)
    async sendBulkDm(
        @Body() body: { sessionUsername: string; targetUsernames: string[]; message: string },
    ) {
        return this.rionaService.sendBulkDm(
            body.sessionUsername,
            body.targetUsernames,
            body.message,
        );
    }

    @Post('scrape-followers')
    @HttpCode(HttpStatus.OK)
    async scrapeFollowers(
        @Body() body: { sessionUsername: string; targetAccount: string; maxFollowers?: number },
    ) {
        return this.rionaService.scrapeFollowers(
            body.sessionUsername,
            body.targetAccount,
            body.maxFollowers,
        );
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Body() body: { sessionUsername: string }) {
        await this.rionaService.logout(body.sessionUsername);
        return { success: true, message: 'Logged out' };
    }
}

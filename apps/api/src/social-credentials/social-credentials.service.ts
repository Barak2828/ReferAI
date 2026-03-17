import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

@Injectable()
export class SocialCredentialsService {
    private readonly logger = new Logger(SocialCredentialsService.name);
    private readonly encryptionKey: Buffer;

    constructor(private readonly prisma: PrismaService) {
        const key = process.env.SOCIAL_CREDENTIALS_ENCRYPTION_KEY;
        if (key && key.length >= 32) {
            this.encryptionKey = Buffer.from(key.slice(0, 32), 'utf-8');
        } else {
            // Fallback for development — NOT secure for production
            this.encryptionKey = crypto.scryptSync('dev-fallback-key', 'salt', 32);
            this.logger.warn('Using fallback encryption key. Set SOCIAL_CREDENTIALS_ENCRYPTION_KEY in production.');
        }
    }

    private encrypt(plaintext: string): string {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
        const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        // Format: iv:authTag:ciphertext (all hex)
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
    }

    private decrypt(ciphertext: string): string {
        const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
        decipher.setAuthTag(authTag);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf-8');
    }

    async linkAccount(
        userId: string,
        platform: 'INSTAGRAM' | 'TWITTER',
        username: string,
        password: string,
    ) {
        const encryptedCredentials = this.encrypt(JSON.stringify({ username, password }));
        return this.prisma.socialAccount.upsert({
            where: { userId_platform_username: { userId, platform, username } },
            update: { encryptedCredentials, isActive: true },
            create: { userId, platform, username, encryptedCredentials },
        });
    }

    async unlinkAccount(accountId: string, userId: string) {
        return this.prisma.socialAccount.updateMany({
            where: { id: accountId, userId },
            data: { isActive: false },
        });
    }

    async getLinkedAccounts(userId: string) {
        const accounts = await this.prisma.socialAccount.findMany({
            where: { userId, isActive: true },
            select: { id: true, platform: true, username: true, lastUsedAt: true, createdAt: true },
        });
        return accounts;
    }

    async getCredentials(accountId: string): Promise<{ username: string; password: string } | null> {
        const account = await this.prisma.socialAccount.findUnique({ where: { id: accountId } });
        if (!account || !account.isActive) return null;
        try {
            return JSON.parse(this.decrypt(account.encryptedCredentials));
        } catch {
            this.logger.error(`Failed to decrypt credentials for account ${accountId}`);
            return null;
        }
    }

    async markUsed(accountId: string) {
        return this.prisma.socialAccount.update({
            where: { id: accountId },
            data: { lastUsedAt: new Date() },
        });
    }
}

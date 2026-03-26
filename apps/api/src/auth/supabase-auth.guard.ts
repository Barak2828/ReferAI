import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Custom decorator to mark routes as public (no auth required)
 */
export function Public() {
    return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
        if (descriptor) {
            Reflect.defineMetadata(IS_PUBLIC_KEY, true, descriptor.value);
        } else {
            Reflect.defineMetadata(IS_PUBLIC_KEY, true, target);
        }
        return descriptor || target;
    };
}

/**
 * Supabase JWT Auth Guard
 *
 * Verifies the Bearer token from the Authorization header against
 * Supabase's JWT secret. Extracts the userId from the token's `sub` claim
 * and attaches it to the request as `req.userId`.
 *
 * Use @Public() decorator to skip auth on specific routes.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
    private readonly logger = new Logger(SupabaseAuthGuard.name);
    private readonly jwtSecret: string;

    constructor(private reflector: Reflector) {
        // Supabase JWT secret — derived from project's JWT secret
        // Can be found in Supabase dashboard: Settings > API > JWT Secret
        this.jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    }

    canActivate(context: ExecutionContext): boolean {
        // Check if route is marked as public
        const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // For backward compatibility during transition: if no auth header,
            // check if userId is provided in body/query (legacy mode)
            const legacyUserId = request.body?.userId || request.query?.userId;
            if (legacyUserId) {
                this.logger.warn(`Legacy auth: userId provided without JWT token for ${request.method} ${request.url}`);
                request.userId = legacyUserId;
                return true;
            }
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }

        const token = authHeader.substring(7);

        try {
            // Verify the JWT token
            // Supabase uses HS256 with the JWT secret
            const decoded = jwt.verify(token, this.jwtSecret, {
                algorithms: ['HS256'],
            }) as jwt.JwtPayload;

            // Extract user ID from the 'sub' claim
            if (!decoded.sub) {
                throw new UnauthorizedException('Token missing subject claim');
            }

            // Attach userId to request for downstream use
            request.userId = decoded.sub;
            request.userRole = decoded.role || 'authenticated';

            return true;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new UnauthorizedException('Token expired');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new UnauthorizedException('Invalid token');
            }
            throw new UnauthorizedException('Authentication failed');
        }
    }
}

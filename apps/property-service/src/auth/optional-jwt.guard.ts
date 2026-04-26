import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * A JWT guard that does NOT reject unauthenticated requests.
 * If a valid token is present → req.user is populated.
 * If no token or invalid token → req.user is null (request continues).
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
    handleRequest(_err: any, user: any) {
        return user || null;
    }
}

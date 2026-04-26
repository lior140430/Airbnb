import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor(
        configService: ConfigService,
        private authService: AuthService,
    ) {
        super({
            clientID: configService.get<string>('FACEBOOK_APP_ID'),
            clientSecret: configService.get<string>('FACEBOOK_APP_SECRET'),
            callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL'),
            scope: ['email', 'public_profile'],
            profileFields: ['id', 'displayName', 'name', 'emails'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (err: any, user: any, info?: any) => void,
    ): Promise<any> {
        const { name, emails, id } = profile;
        const user = await this.authService.validateFacebookUser({
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            facebookId: id,
            accessToken,
        });
        done(null, user);
    }
}

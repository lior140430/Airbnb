import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.API_URL}/auth/facebook/callback`,
      profileFields: ['id', 'email', 'displayName', 'photos'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: any) {
    return {
      email: profile.emails?.[0]?.value,
      facebookId: profile.id,
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value,
    };
  }
}

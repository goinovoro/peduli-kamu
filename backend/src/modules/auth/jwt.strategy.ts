import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => req?.cookies?.['pedulikamu_token'],
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret-ganti-di-prod',
    });
  }
  async validate(payload: any) {
    return { id: payload.sub, sub: payload.sub, role: payload.role };
  }
}

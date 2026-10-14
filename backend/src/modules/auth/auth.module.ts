import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  // JwtModule global (dengan secret) sudah diregistrasi di AppModule —
  // JANGAN import bare JwtModule di sini, itu membuat JwtService tanpa secret.
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

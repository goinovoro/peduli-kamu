import { Controller, Post, Get, Body, Res, Req, UseGuards } from '@nestjs/common';
import type { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { AuthService, authCookieOptions } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SkipIdempotency } from '../../common/idempotency/idempotency.decorator';

@ApiTags('auth')
@SkipIdempotency() // set/hapus cookie HttpOnly; tidak di-replay dari cache
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrasi Pasien/Mitra (set cookie HttpOnly)' })
  @ApiResponse({ status: 201, description: 'User terdaftar + cookie diset' })
  @ApiResponse({ status: 409, description: 'Email sudah terdaftar' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.register(dto);
    res.cookie(AuthService.cookieName, token, authCookieOptions());
    return { user };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login (set cookie HttpOnly)' })
  @ApiResponse({ status: 201, description: 'Login berhasil' })
  @ApiResponse({ status: 401, description: 'Email/password salah' })
  @ApiResponse({ status: 403, description: 'Akun dibatasi (blokir/tangguh/beku)' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.login(dto);
    res.cookie(AuthService.cookieName, token, authCookieOptions());
    return { user };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout (hapus cookie)' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AuthService.cookieName, { path: '/' });
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Profil user login' })
  @ApiResponse({ status: 401, description: 'Belum login' })
  me(@CurrentUser() user: any) {
    return this.auth.me(user.sub ?? user.id);
  }
}

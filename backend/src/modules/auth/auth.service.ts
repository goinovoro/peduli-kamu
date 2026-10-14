import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma.service';
import { RegisterDto, LoginDto, RegisterCaregiverDto } from './auth.dto';

const COOKIE_NAME = 'pedulikamu_token';

// Status akun yang tidak boleh login sama sekali (A-05).
const LOGIN_BLOCKED_STATUSES = ['DIBLOKIR', 'DITANGGUHKAN', 'DIBEKUKAN'];

const USER_SELECT = { id: true, email: true, name: true, role: true, accountStatus: true, createdAt: true } as const;

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: RegisterDto | RegisterCaregiverDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email sudah terdaftar');
    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password,
        role: dto.role as any,
        phone: (dto as RegisterDto).phone ?? null,
        accountStatus: 'AKTIF',
      },
      select: { ...USER_SELECT },
    });
    if (dto.role === 'caregiver' || dto.role === 'MITRA') {
      const c = dto as RegisterCaregiverDto;
      await this.prisma.caregiver.create({
        data: {
          userId: user.id,
          university: c.university ?? '-',
          graduationYear: Number(c.graduationYear ?? new Date().getFullYear()),
          ratePerHour: Number(c.ratePerHour ?? 50000),
          tier: c.tier ?? 'companion',
          location: c.location ?? '-',
          strStatus: (c.strStatus as any) ?? 'MENUNGGU_STR',
        },
      });
    }
    // Catat persetujuan ketentuan (B-05/O-01). Best-effort agar register lama tetap jalan.
    if ((dto as RegisterDto).agreeToTerms) {
      await this.prisma.consent.upsert({
        where: { userId_kind_version: { userId: user.id, kind: 'KETENTUAN_PLATFORM', version: 'v1' } },
        update: {},
        create: { userId: user.id, kind: 'KETENTUAN_PLATFORM', version: 'v1' },
      });
    }
    const token = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { user, token };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Email atau password salah');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Email atau password salah');
    if (LOGIN_BLOCKED_STATUSES.includes(user.accountStatus)) {
      throw new ForbiddenException('Akun Anda sedang dibatasi. Hubungi Admin Peduli Kamu.');
    }
    const token = await this.jwt.signAsync({ sub: user.id, role: user.role });
    const { password, ...safe } = user;
    return { user: safe, token };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { ...USER_SELECT },
    });
  }

  static cookieName = COOKIE_NAME;
}

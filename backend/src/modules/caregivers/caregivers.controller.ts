import { Controller, Get, Patch, Post, Param, Query, Body, UseGuards, Header } from '@nestjs/common';
import { IsIn, IsOptional } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiPropertyOptional } from '@nestjs/swagger';
import { CaregiversService } from './caregivers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class UpdateProfileDto {
  @IsOptional() domicile?: string;
  @IsOptional() serviceArea?: string;
  @IsOptional() education?: string;
  @IsOptional() experience?: string;
  @IsOptional() competencies?: string;
  @IsOptional() certifications?: string;
  @IsOptional() strNo?: string;
  @IsOptional() @IsIn(['MENUNGGU_STR', 'STR_AKTIF']) strStatus?: string;
  @IsOptional() bio?: string;
  @IsOptional() bankName?: string;
  @IsOptional() bankAccountNo?: string;
  @IsOptional() bankAccountName?: string;
  @IsOptional() university?: string;
  @IsOptional() graduationYear?: number;
  @IsOptional() ratePerHour?: number;
  @IsOptional() @IsIn(['companion', 'skilled']) tier?: string;
  @IsOptional() location?: string;
  @IsOptional() isAvailable?: boolean;
}

class DecideVerificationDto {
  @ApiPropertyOptional({ enum: ['DISETUJUI', 'DITOLAK', 'PERLU_PERBAIKAN'] })
  @IsIn(['DISETUJUI', 'DITOLAK', 'PERLU_PERBAIKAN']) status!: string;
  @IsOptional() note?: string;
}

@ApiTags('caregivers')
@Controller('caregivers')
export class CaregiversController {
  constructor(private caregivers: CaregiversService) {}

  // GET /api/v1/caregivers?search=jakarta&tier=skilled&strStatus=STR_AKTIF
  // Public — dipakai halaman SSR /family/find untuk SEO
  @Get()
  @Header('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  @ApiOperation({ summary: 'Cari caregiver publik (SSR-friendly)' })
  search(
    @Query('search') search?: string,
    @Query('tier') tier?: string,
    @Query('strStatus') strStatus?: string,
    @Query('skip') skip?: string,
  ) {
    return this.caregivers.search({ search, tier, strStatus, skip });
  }

  // NOTE: route statis didaftarkan sebelum :id agar tidak tertelan param.
  @Get('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MITRA', 'caregiver')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Profil lengkap milik saya' })
  myProfile(@CurrentUser() user: any) {
    return this.caregivers.myProfile(user.sub ?? user.id);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MITRA', 'caregiver')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update profil profesional + rekening' })
  updateMyProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.caregivers.updateMyProfile(user.sub ?? user.id, dto as Record<string, unknown>);
  }

  @Post('verification/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MITRA', 'caregiver')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Ajukan verifikasi (syarat: profil lengkap + ≥1 dokumen)' })
  @ApiResponse({ status: 400, description: 'Belum lengkap (daftar kekurangan)' })
  @ApiResponse({ status: 409, description: 'Sudah ditinjau/terverifikasi' })
  submitVerification(@CurrentUser() user: any) {
    return this.caregivers.submitVerification(user.sub ?? user.id);
  }

  @Get('verification/queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Antrian verifikasi (Admin)' })
  verificationQueue() {
    return this.caregivers.verificationQueue();
  }

  @Patch(':id/verification')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Putuskan verifikasi (Admin)' })
  decideVerification(@Param('id') id: string, @Body() dto: DecideVerificationDto) {
    return this.caregivers.decideVerification(id, dto.status, dto.note);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail caregiver publik' })
  findOne(@Param('id') id: string) {
    return this.caregivers.findOne(id);
  }
}

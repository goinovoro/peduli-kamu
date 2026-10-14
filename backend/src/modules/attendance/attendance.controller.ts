import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiConsumes, ApiBody, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { removeUploadFile } from '../../common/utils/upload.util';

const ALLOWED_MIMES = ['image/jpeg', 'image/png'];
const MAX_SIZE = 5 * 1024 * 1024; // absensi wajib foto live (camera-only di frontend)

class ClockDto {
  // Semua opsional di DTO agar file sempat dibersihkan saat validasi gagal
  // (multer menyimpan file sebelum ValidationPipe; cek manual di handler).
  @IsOptional() contractId?: string;
  @IsOptional() lat?: number;
  @IsOptional() lng?: number;
  @IsOptional() accuracyM?: number;
}

class ReviewDto {
  @ApiPropertyOptional({ example: true }) @IsBoolean() approve!: boolean;
  @IsOptional() reason?: string;
}

const clockInterceptor = FileInterceptor('photo', {
  storage: diskStorage({
    destination: './uploads/attendance',
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomUUID()}${extname(file.originalname)}`),
  }),
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new BadRequestException('Foto harus JPG/PNG') as any, false);
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_SIZE },
});

@ApiTags('attendance')
@ApiCookieAuth()
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendance: AttendanceService) {}

  private clockInput(dto: ClockDto) {
    if (!dto.contractId) throw new BadRequestException('contractId wajib diisi');
    const num = (v: unknown) => {
      if (v === undefined || v === null || v === '') return undefined;
      const n = Number(v);
      return Number.isNaN(n) ? undefined : n;
    };
    return { contractId: dto.contractId, lat: num(dto.lat), lng: num(dto.lng), accuracyM: num(dto.accuracyM) };
  }

  @Post('clock-in')
  @Roles('MITRA', 'caregiver')
  @UseInterceptors(clockInterceptor)
  async clockIn(@CurrentUser() user: any, @UploadedFile() photo: Express.Multer.File, @Body() dto: ClockDto) {
    if (!photo) throw new BadRequestException('Foto kehadiran wajib');
    try {
      const inp = this.clockInput(dto);
      return await this.attendance.clockIn(
        user.sub ?? user.id,
        inp.contractId,
        `/uploads/attendance/${photo.filename}`,
        inp.lat,
        inp.lng,
        inp.accuracyM,
      );
    } catch (e) {
      await removeUploadFile(photo);
      throw e;
    }
  }

  @Post('clock-out')
  @Roles('MITRA', 'caregiver')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { photo: { type: 'string', format: 'binary' }, contractId: { type: 'string' }, lat: { type: 'number' }, lng: { type: 'number' }, accuracyM: { type: 'number' } }, required: ['photo', 'contractId', 'lat', 'lng'] } })
  @ApiOperation({ summary: 'Clock-out: terpasang ke sesi terbuka, durasi dihitung sistem' })
  @ApiResponse({ status: 409, description: 'Tidak ada sesi terbuka' })
  @UseInterceptors(clockInterceptor)
  async clockOut(@CurrentUser() user: any, @UploadedFile() photo: Express.Multer.File, @Body() dto: ClockDto) {
    if (!photo) throw new BadRequestException('Foto kehadiran wajib');
    try {
      const inp = this.clockInput(dto);
      return await this.attendance.clockOut(
        user.sub ?? user.id,
        inp.contractId,
        `/uploads/attendance/${photo.filename}`,
        inp.lat,
        inp.lng,
        inp.accuracyM,
      );
    } catch (e) {
      await removeUploadFile(photo);
      throw e;
    }
  }

  @Get('contract/:contractId')
  @Roles('PASIEN', 'family', 'MITRA', 'caregiver', 'admin')
  @ApiOperation({ summary: 'Daftar absensi satu kontrak' })
  list(@CurrentUser() user: any, @Param('contractId') contractId: string) {
    return this.attendance.list(user.sub ?? user.id, user.role, contractId);
  }

  @Get('contract/:contractId/recap')
  @Roles('PASIEN', 'family', 'MITRA', 'caregiver', 'admin')
  @ApiOperation({ summary: 'Rekap jam: floor 15 menit, hanya sesi approved' })
  recap(@CurrentUser() user: any, @Param('contractId') contractId: string) {
    // Otorisasi ikut list (pihak terkait / admin).
    return this.attendance.list(user.sub ?? user.id, user.role, contractId).then(() => this.attendance.recap(contractId));
  }

  @Patch(':id/review')
  @Roles('PASIEN', 'family')
  @ApiOperation({ summary: 'Pasien setujui/tolak absensi per sesi' })
  review(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: ReviewDto) {
    return this.attendance.review(user.sub ?? user.id, id, dto.approve, dto.reason);
  }

  @Patch(':id/override')
  @Roles('admin')
  @ApiOperation({ summary: 'Override admin atas absensi' })
  override(@CurrentUser() admin: any, @Param('id') id: string, @Body() dto: ReviewDto) {
    return this.attendance.override(admin.sub ?? admin.id, id, dto.approve);
  }
}

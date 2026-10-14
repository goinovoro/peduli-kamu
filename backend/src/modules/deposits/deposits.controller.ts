import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiConsumes, ApiBody, ApiPropertyOptional } from '@nestjs/swagger';
import { DepositsService, depositAmount, depositDurationMonths } from './deposits.service';
import { removeUploadFile } from '../../common/utils/upload.util';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024;

class VerifyDto {
  @ApiPropertyOptional({ example: true }) @IsBoolean() approve!: boolean;
  @IsOptional() note?: string;
}

class RefundDto {
  @IsOptional() proofTfUrl?: string;
}

@ApiTags('deposits')
@ApiCookieAuth()
@Controller('deposits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepositsController {
  constructor(private deposits: DepositsService) {}

  /** Nominal + durasi resmi dari server (C-01). */
  @Get('config')
  @ApiOperation({ summary: 'Nominal & durasi deposit resmi' })
  config() {
    return { amount: depositAmount(), durationMonths: depositDurationMonths(), method: 'QRIS_MANUAL' };
  }

  @Get('me')
  @Roles('MITRA', 'caregiver')
  @ApiOperation({ summary: 'Riwayat deposit saya' })
  mine(@CurrentUser() user: any) {
    return this.deposits.mine(user.sub ?? user.id);
  }

  @Get('current')
  @Roles('MITRA', 'caregiver')
  @ApiOperation({ summary: 'Status deposit berjalan (aktif + expiry)' })
  current(@CurrentUser() user: any) {
    return this.deposits.current(user.sub ?? user.id);
  }

  @Post()
  @Roles('MITRA', 'caregiver')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { proof: { type: 'string', format: 'binary' } }, required: ['proof'] } })
  @ApiOperation({ summary: 'Bayar deposit via QRIS + bukti (nominal dikunci server)' })
  @ApiResponse({ status: 409, description: 'Sudah ada yang menunggu verifikasi' })
  @UseInterceptors(
    FileInterceptor('proof', {
      storage: diskStorage({
        destination: './uploads/payments',
        filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomUUID()}${extname(file.originalname)}`),
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIMES.includes(file.mimetype)) {
          return cb(new BadRequestException('Tipe file harus JPG/PNG/PDF') as any, false);
        }
        cb(null, true);
      },
      limits: { fileSize: MAX_SIZE },
    }),
  )
  async create(@CurrentUser() user: any, @UploadedFile() proof: Express.Multer.File) {
    if (!proof) throw new BadRequestException('Bukti bayar wajib diunggah');
    try {
      return await this.deposits.create(user.sub ?? user.id, `/uploads/payments/${proof.filename}`);
    } catch (e) {
      await removeUploadFile(proof);
      throw e;
    }
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Antrian deposit (Admin, filter ?status=)' })
  queue(@Query('status') status?: string) {
    return this.deposits.queue(status);
  }

  @Patch(':id/verify')
  @Roles('admin')
  @ApiOperation({ summary: 'Verifikasi deposit: AKTIF 2 bulan / DITOLAK' })
  verify(@CurrentUser() admin: any, @Param('id') id: string, @Body() dto: VerifyDto) {
    return this.deposits.verify(id, admin.sub ?? admin.id, dto.approve, dto.note);
  }

  @Post(':id/refund')
  @Roles('admin')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { proof: { type: 'string', format: 'binary' }, proofTfUrl: { type: 'string' } } } })
  @ApiOperation({ summary: 'Refund deposit awal bulan 3 (khusus ada klien)' })
  @ApiResponse({ status: 400, description: 'Tidak layak refund' })
  @UseInterceptors(
    FileInterceptor('proof', {
      storage: diskStorage({
        destination: './uploads/payments',
        filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomUUID()}${extname(file.originalname)}`),
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIMES.includes(file.mimetype)) {
          return cb(new BadRequestException('Tipe file harus JPG/PNG/PDF') as any, false);
        }
        cb(null, true);
      },
      limits: { fileSize: MAX_SIZE },
    }),
  )
  async refund(@Param('id') id: string, @UploadedFile() proof: Express.Multer.File, @Body() dto: RefundDto) {
    const url = proof ? `/uploads/payments/${proof.filename}` : dto.proofTfUrl;
    if (!url) throw new BadRequestException('Bukti TF wajib (file atau proofTfUrl)');
    try {
      return await this.deposits.refund(id, url);
    } catch (e) {
      await removeUploadFile(proof);
      throw e;
    }
  }

  /** C-04/C-05: proses kedaluwarsa massal (dipanggil Admin/cron). */
  @Post('process-expiry')
  @Roles('admin')
  @ApiOperation({ summary: 'Proses kedaluwarsa: hangus vs kembali + kunci akun' })
  processExpiry() {
    return this.deposits.processExpiry();
  }
}

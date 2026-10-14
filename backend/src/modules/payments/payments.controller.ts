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
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiConsumes, ApiBody, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentsService, paymentExpiryHours, qrisImageUrl } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { removeUploadFile } from '../../common/utils/upload.util';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024;

class PayServiceDto {
  // Opsional di DTO agar file sempat dibersihkan saat contractId kosong (cek manual di handler).
  @IsOptional() contractId?: string;
}

class VerifyDto {
  @ApiPropertyOptional({ example: true }) @IsBoolean() approve!: boolean;
  @IsOptional() note?: string;
}

@ApiTags('payments')
@ApiCookieAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  /** Info halaman bayar: nominal diambil dari kontrak, QRIS dari config. */
  @Get('config')
  @ApiOperation({ summary: 'Info halaman bayar (metode, QRIS, batas jam)' })
  config() {
    return { method: 'QRIS_MANUAL', qrisImageUrl: qrisImageUrl(), expiryHours: paymentExpiryHours() };
  }

  @Get('me')
  @Roles('PASIEN', 'family', 'MITRA', 'caregiver')
  @ApiOperation({ summary: 'Pembayaran yang saya bayar' })
  mine(@CurrentUser() user: any) {
    return this.payments.mine(user.sub ?? user.id);
  }

  @Post('service')
  @Roles('PASIEN', 'family')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { proof: { type: 'string', format: 'binary' }, contractId: { type: 'string' } }, required: ['proof', 'contractId'] } })
  @ApiOperation({ summary: 'Bayar full via QRIS + bukti (nominal = total kontrak)' })
  @ApiResponse({ status: 409, description: 'Sudah ada pembayaran' })
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
  async payService(
    @CurrentUser() user: any,
    @UploadedFile() proof: Express.Multer.File,
    @Body() dto: PayServiceDto,
  ) {
    if (!proof) throw new BadRequestException('Bukti bayar wajib diunggah');
    if (!dto.contractId) {
      await removeUploadFile(proof);
      throw new BadRequestException('contractId wajib diisi');
    }
    try {
      return await this.payments.payService(user.sub ?? user.id, dto.contractId, `/uploads/payments/${proof.filename}`);
    } catch (e) {
      await removeUploadFile(proof);
      throw e;
    }
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Antrian pembayaran (Admin, filter ?type=&status=)' })
  queue(@Query('type') type?: string, @Query('status') status?: string) {
    return this.payments.queue(type, status);
  }

  @Patch(':id/verify')
  @Roles('admin')
  @ApiOperation({ summary: 'Verifikasi: escrow DIBAYAR_DITAHAN / DITOLAK' })
  verify(@CurrentUser() admin: any, @Param('id') id: string, @Body() dto: VerifyDto) {
    return this.payments.verify(id, admin.sub ?? admin.id, dto.approve, dto.note);
  }

  /** Batalkan Deal yang tak dibayar melewati batas (dipanggil Admin/cron). */
  @Post('process-expiry')
  @Roles('admin')
  @ApiOperation({ summary: 'Batalkan Deal tak dibayar > batas jam' })
  processExpiry() {
    return this.payments.processExpiry();
  }
}

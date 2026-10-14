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
import { IsOptional } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiConsumes, ApiBody, ApiPropertyOptional } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { removeUploadFile } from '../../common/utils/upload.util';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024;

class NoteDto {
  @ApiPropertyOptional() @IsOptional() note?: string;
}

class PayDto {
  @ApiPropertyOptional({ description: 'Alternatif jika tanpa upload file' }) @IsOptional() proofTfUrl?: string;
}

@ApiTags('payouts')
@ApiCookieAuth()
@Controller('payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayoutsController {
  constructor(private payouts: PayoutsService) {}

  @Get('me')
  @Roles('MITRA', 'caregiver')
  @ApiOperation({ summary: 'Riwayat pendapatan saya' })
  mine(@CurrentUser() user: any) {
    return this.payouts.mine(user.sub ?? user.id);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Antrian payout (Admin, filter ?status=)' })
  queue(@Query('status') status?: string) {
    return this.payouts.queue(status);
  }

  @Get(':id')
  @Roles('MITRA', 'caregiver', 'admin')
  @ApiOperation({ summary: 'Detail payout (pemilik/admin)' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.payouts.findOne(user.sub ?? user.id, user.role, id);
  }

  @Post(':id/pay')
  @Roles('admin')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { proof: { type: 'string', format: 'binary' }, proofTfUrl: { type: 'string' } } } })
  @ApiOperation({ summary: 'TF manual + bukti → DIBAYARKAN (bisa dari LAYAK/DITAHAN/GAGAL)' })
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
  async pay(
    @CurrentUser() admin: any,
    @Param('id') id: string,
    @UploadedFile() proof: Express.Multer.File,
    @Body() dto: PayDto,
  ) {
    const url = proof ? `/uploads/payments/${proof.filename}` : dto.proofTfUrl;
    if (!url) throw new BadRequestException('Bukti TF wajib (file atau proofTfUrl)');
    try {
      return await this.payouts.pay(id, admin.sub ?? admin.id, url);
    } catch (e) {
      await removeUploadFile(proof);
      throw e;
    }
  }

  @Patch(':id/hold')
  @Roles('admin')
  @ApiOperation({ summary: 'Tahan payout sementara' })
  hold(@CurrentUser() admin: any, @Param('id') id: string, @Body() dto: NoteDto) {
    return this.payouts.hold(id, admin.sub ?? admin.id, dto.note);
  }

  @Patch(':id/fail')
  @Roles('admin')
  @ApiOperation({ summary: 'Tandai gagal (bisa diproses ulang)' })
  fail(@CurrentUser() admin: any, @Param('id') id: string, @Body() dto: NoteDto) {
    return this.payouts.fail(id, admin.sub ?? admin.id, dto.note);
  }
}

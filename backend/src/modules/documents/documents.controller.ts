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
import { IsIn, IsOptional } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiConsumes, ApiBody, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { removeUploadFile } from '../../common/utils/upload.util';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB (B-02: tipe/ukuran divalidasi)

const DOC_KINDS = ['KTP', 'IJAZAH', 'SERTIFIKAT', 'STR', 'LAINNYA'] as const;

class ReviewDto {
  @ApiPropertyOptional({ enum: ['DISETUJUI', 'DITOLAK', 'PERLU_PERBAIKAN'] })
  @IsIn(['DISETUJUI', 'DITOLAK', 'PERLU_PERBAIKAN']) status!: string;
  @IsOptional() note?: string;
}

@ApiTags('documents')
@ApiCookieAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private docs: DocumentsService) {}

  @Post()
  @Roles('MITRA', 'caregiver')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, kind: { type: 'string', enum: ['KTP', 'IJAZAH', 'SERTIFIKAT', 'STR', 'LAINNYA'] } }, required: ['file', 'kind'] } })
  @ApiOperation({ summary: 'Upload dokumen verifikasi (JPG/PNG/PDF ≤5MB)' })
  @ApiResponse({ status: 403, description: 'Bukan mitra' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documents',
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
  async upload(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('kind') kind: string,
  ) {
    DocumentsService.assertMitra(user.role);
    if (!file) throw new BadRequestException('File wajib diunggah');
    if (!(DOC_KINDS as readonly string[]).includes(kind)) {
      await removeUploadFile(file);
      throw new BadRequestException('Jenis dokumen tidak valid');
    }
    try {
      return await this.docs.create(user.sub ?? user.id, kind, `/uploads/documents/${file.filename}`);
    } catch (e) {
      await removeUploadFile(file);
      throw e;
    }
  }

  @Get('me')
  @Roles('MITRA', 'caregiver')
  @ApiOperation({ summary: 'Dokumen milik saya' })
  mine(@CurrentUser() user: any) {
    DocumentsService.assertMitra(user.role);
    return this.docs.mine(user.sub ?? user.id);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Antrian dokumen (Admin, filter ?status=)' })
  listAll(@Query('status') status?: string) {
    return this.docs.listAll(status);
  }

  @Patch(':id/review')
  @Roles('admin')
  @ApiOperation({ summary: 'Putuskan dokumen (Admin)' })
  review(@Param('id') id: string, @Body() dto: ReviewDto) {
    return this.docs.review(id, dto.status, dto.note);
  }
}

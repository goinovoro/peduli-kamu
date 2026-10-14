import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputesService } from './disputes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const CATEGORIES = [
  'LAYANAN_TIDAK_SESUAI',
  'PERBEDAAN_INFO',
  'PEMBATALAN',
  'PEMBAYARAN',
  'PERILAKU',
  'KOMUNIKASI',
  'LAINNYA',
] as const;

class CreateDisputeDto {
  @ApiProperty() @IsNotEmpty() contractId!: string;
  @ApiPropertyOptional() @IsOptional() reportedUserId?: string;
  @ApiProperty({ enum: CATEGORIES as unknown as string[] })
  @IsIn(CATEGORIES as unknown as string[]) category!: string;
  @ApiProperty() @IsNotEmpty() description!: string;
  @ApiPropertyOptional() @IsOptional() evidenceUrls?: string;
}

class HandleDto {
  @ApiProperty({ enum: ['DITINJAU', 'BUTUH_INFO', 'SELESAI', 'DITUTUP'] })
  @IsIn(['DITINJAU', 'BUTUH_INFO', 'SELESAI', 'DITUTUP']) status!: string;
  @ApiPropertyOptional() @IsOptional() decision?: string;
}

@ApiTags('disputes')
@ApiCookieAuth()
@Controller('disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DisputesController {
  constructor(private disputes: DisputesService) {}

  @Post()
  @Roles('PASIEN', 'family', 'MITRA', 'caregiver')
  @ApiOperation({ summary: 'Buat laporan/sengketa atas kontrak sendiri' })
  create(@CurrentUser() user: any, @Body() dto: CreateDisputeDto) {
    return this.disputes.create(user.sub ?? user.id, dto);
  }

  @Get('me')
  @Roles('PASIEN', 'family', 'MITRA', 'caregiver')
  @ApiOperation({ summary: 'Laporan yang saya buat' })
  mine(@CurrentUser() user: any) {
    return this.disputes.mine(user.sub ?? user.id);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Antrian sengketa (Admin, filter ?status=)' })
  queue(@Query('status') status?: string) {
    return this.disputes.queue(status);
  }

  @Get(':id')
  @Roles('PASIEN', 'family', 'MITRA', 'caregiver', 'admin')
  @ApiOperation({ summary: 'Detail sengketa (pelapor/terlapor/admin)' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.disputes.findOne(user.sub ?? user.id, user.role, id);
  }

  @Patch(':id/handle')
  @Roles('admin')
  @ApiOperation({ summary: 'Tangani: BARU→DITINJAU→BUTUH_INFO→SELESAI/DITUTUP' })
  @ApiResponse({ status: 409, description: 'Transisi tidak diizinkan / terkunci' })
  handle(@CurrentUser() admin: any, @Param('id') id: string, @Body() dto: HandleDto) {
    return this.disputes.handle(admin.sub ?? admin.id, id, dto.status, dto.decision);
  }
}

import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class CreateContractDto {
  @ApiProperty({ description: 'Minat yang DITERIMA' }) @IsNotEmpty() interestId!: string;
  @ApiPropertyOptional({ example: 40 }) @IsOptional() @IsInt() @Min(1) totalHours?: number;
  @ApiPropertyOptional({ example: 100000, description: 'Default tarif mitra; totalCost selalu dihitung server' })
  @IsOptional() @IsInt() @Min(1) hourlyRate?: number;
  @IsOptional() schedule?: string;
  @IsOptional() locationText?: string;
  @IsOptional() locationLat?: number;
  @IsOptional() locationLng?: number;
  @IsOptional() attendanceRadiusM?: number;
  @IsOptional() scope?: string;
  @IsOptional() startDate?: string;
  @IsOptional() endDate?: string;
}

class MisconductDto {
  @ApiProperty({ example: 35, description: 'Jam yang benar dikerjakan (0..totalHours)' })
  @IsInt() @Min(0) workedHours!: number;
  @ApiPropertyOptional() @IsOptional() description?: string;
}

@ApiTags('contracts')
@ApiCookieAuth()
@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractsController {
  constructor(private contracts: ContractsService) {}

  @Post()
  @Roles('PASIEN', 'family')
  @ApiOperation({ summary: 'Buat Deal: totalCost = jam × tarif (dikunci server)' })
  @ApiResponse({ status: 409, description: 'Minat belum diterima / need sudah ber kontrak' })
  create(@CurrentUser() user: any, @Body() dto: CreateContractDto) {
    return this.contracts.create(user.sub ?? user.id, dto);
  }

  @Get('me')
  @Roles('PASIEN', 'family', 'MITRA', 'caregiver')
  @ApiOperation({ summary: 'Kontrak milik saya' })
  mine(@CurrentUser() user: any) {
    return this.contracts.mine(user.sub ?? user.id, user.role);
  }

  @Get(':id')
  @Roles('PASIEN', 'family', 'MITRA', 'caregiver', 'admin')
  @ApiOperation({ summary: 'Detail kontrak + payment + payout + absensi' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contracts.findOne(user.sub ?? user.id, user.role, id);
  }

  @Post(':id/start')
  @Roles('PASIEN', 'family', 'MITRA', 'caregiver')
  @ApiOperation({ summary: 'Mulai layanan (syarat escrow terverifikasi)' })
  @ApiResponse({ status: 409, description: 'Belum SIAP_JALAN / belum dibayar' })
  start(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contracts.start(user.sub ?? user.id, user.role, id);
  }

  @Post(':id/finish')
  @Roles('MITRA', 'caregiver')
  @ApiOperation({ summary: 'Mitra minta selesai (syarat rekap approved > 0)' })
  finish(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contracts.finish(user.sub ?? user.id, id);
  }

  @Post(':id/confirm')
  @Roles('PASIEN', 'family')
  @ApiOperation({ summary: 'Pasien konfirmasi → SELESAI + payout LAYAK_BAYAR' })
  confirm(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contracts.confirm(user.sub ?? user.id, id);
  }

  @Post(':id/confirm-override')
  @Roles('admin')
  @ApiOperation({ summary: 'Override konfirmasi (Admin)' })
  confirmOverride(@CurrentUser() admin: any, @Param('id') id: string) {
    return this.contracts.confirmOverride(admin.sub ?? admin.id, id);
  }

  @Post(':id/cancel-by-patient')
  @Roles('PASIEN', 'family')
  @ApiOperation({ summary: 'Pasien batal sepihak: tanpa refund, full ke mitra' })
  @ApiResponse({ status: 409, description: 'Belum ada escrow / sudah selesai' })
  cancelByPatient(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contracts.cancelByPatient(user.sub ?? user.id, id);
  }

  @Post(':id/misconduct')
  @Roles('admin')
  @ApiOperation({ summary: 'Wanprestasi: beku + hangus + refund/jam (body: workedHours, description?)' })
  misconduct(@CurrentUser() admin: any, @Param('id') id: string, @Body() dto: MisconductDto) {
    return this.contracts.misconduct(admin.sub ?? admin.id, id, dto.workedHours, dto.description);
  }
}

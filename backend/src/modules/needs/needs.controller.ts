import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NeedsService } from './needs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class CreateNeedDto {
  @ApiProperty({ example: 'Pendampingan lansia' }) @IsNotEmpty() serviceType!: string;
  @ApiProperty({ example: 'Jakarta Selatan' }) @IsNotEmpty() locationText!: string;
  @ApiProperty({ example: 40 }) @IsInt() @Min(1) totalHours!: number;
  @IsOptional() forWhom?: string;
  @IsOptional() locationLat?: number;
  @IsOptional() locationLng?: number;
  @IsOptional() startDate?: string;
  @IsOptional() schedule?: string;
  @IsOptional() durationHoursPerDay?: number;
  @IsOptional() frequency?: string;
  @IsOptional() conditionDesc?: string;
  @IsOptional() specialNeeds?: string;
  @IsOptional() budgetEstimate?: number;
  @IsOptional() description?: string;
  @IsOptional() patientProfileId?: string;
}

class UpdateNeedDto {
  @IsOptional() serviceType?: string;
  @IsOptional() forWhom?: string;
  @IsOptional() locationText?: string;
  @IsOptional() locationLat?: number;
  @IsOptional() locationLng?: number;
  @IsOptional() startDate?: string;
  @IsOptional() schedule?: string;
  @IsOptional() durationHoursPerDay?: number;
  @IsOptional() frequency?: string;
  @IsOptional() totalHours?: number;
  @IsOptional() conditionDesc?: string;
  @IsOptional() specialNeeds?: string;
  @IsOptional() budgetEstimate?: number;
  @IsOptional() description?: string;
  @IsOptional() patientProfileId?: string;
}

@ApiTags('needs')
@ApiCookieAuth()
@Controller('needs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NeedsController {
  constructor(private needs: NeedsService) {}

  @Post()
  @Roles('PASIEN', 'family')
  @ApiOperation({ summary: 'Buat kebutuhan (Draft)' })
  create(@CurrentUser() user: any, @Body() dto: CreateNeedDto) {
    NeedsService.assertPasien(user.role);
    return this.needs.create(user.sub ?? user.id, dto as Record<string, any>);
  }

  @Get('me')
  @Roles('PASIEN', 'family')
  @ApiOperation({ summary: 'Kebutuhan milik saya' })
  mine(@CurrentUser() user: any) {
    NeedsService.assertPasien(user.role);
    return this.needs.mine(user.sub ?? user.id);
  }

  @Get('published')
  @Roles('MITRA', 'caregiver')
  @ApiOperation({ summary: 'Kebutuhan publik (mitra deposit aktif saja)' })
  @ApiResponse({ status: 403, description: 'Deposit kedaluwarsa' })
  published(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('serviceType') serviceType?: string,
    @Query('region') region?: string,
  ) {
    return this.needs.published(user.sub ?? user.id, { search, serviceType, region });
  }

  @Get(':id')
  @Roles('PASIEN', 'family', 'MITRA', 'caregiver', 'admin')
  @ApiOperation({ summary: 'Detail kebutuhan (otorisasi pihak/admin)' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.needs.findOne(user.sub ?? user.id, user.role, id);
  }

  @Patch(':id')
  @Roles('PASIEN', 'family')
  @ApiOperation({ summary: 'Ubah kebutuhan (sebelum Deal)' })
  @ApiResponse({ status: 409, description: 'Sudah Deal' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateNeedDto) {
    NeedsService.assertPasien(user.role);
    return this.needs.update(user.sub ?? user.id, id, dto as Record<string, any>);
  }

  @Post(':id/publish')
  @Roles('PASIEN', 'family')
  @ApiOperation({ summary: 'Publikasikan Draft' })
  publish(@CurrentUser() user: any, @Param('id') id: string) {
    NeedsService.assertPasien(user.role);
    return this.needs.publish(user.sub ?? user.id, id);
  }

  @Post(':id/close')
  @Roles('PASIEN', 'family')
  @ApiOperation({ summary: 'Tutup kebutuhan (sebelum Deal, tanpa konsekuensi uang)' })
  close(@CurrentUser() user: any, @Param('id') id: string) {
    NeedsService.assertPasien(user.role);
    return this.needs.close(user.sub ?? user.id, id);
  }
}

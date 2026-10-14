import { Controller, Post, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InterestsService } from './interests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class ApplyDto {
  @IsOptional() intro?: string;
  @IsOptional() relevantExp?: string;
  @IsOptional() availability?: string;
  // needId dikirim di body agar frontend simpel (alternatif: POST /needs/:id/interests)
}

class ApplyWithNeedDto extends ApplyDto {
  @ApiProperty({ description: 'ID kebutuhan yang dilamar' }) @IsNotEmpty() needId!: string;
}

class RespondDto {
  @ApiProperty({ example: true }) @IsBoolean() accept!: boolean;
}

@ApiTags('interests')
@ApiCookieAuth()
@Controller('interests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InterestsController {
  constructor(private interests: InterestsService) {}

  @Post()
  @Roles('MITRA', 'caregiver')
  @ApiOperation({ summary: 'Ajukan minat (deposit aktif, anti-duplikat)' })
  @ApiResponse({ status: 403, description: 'Deposit kedaluwarsa' })
  @ApiResponse({ status: 409, description: 'Sudah melamar / kebutuhan tutup' })
  apply(@CurrentUser() user: any, @Body() dto: ApplyWithNeedDto) {
    return this.interests.apply(user.sub ?? user.id, dto.needId, dto);
  }

  @Get('me')
  @Roles('MITRA', 'caregiver')
  @ApiOperation({ summary: 'Minat yang saya kirim' })
  mine(@CurrentUser() user: any) {
    return this.interests.mine(user.sub ?? user.id);
  }

  @Get('incoming')
  @Roles('PASIEN', 'family')
  @ApiOperation({ summary: 'Semua minat masuk untuk kebutuhan saya' })
  incoming(@CurrentUser() user: any) {
    return this.interests.incoming(user.sub ?? user.id);
  }

  @Get('need/:needId')
  @Roles('PASIEN', 'family')
  @ApiOperation({ summary: 'Minat masuk untuk kebutuhan saya' })
  forNeed(@CurrentUser() user: any, @Param('needId') needId: string) {
    return this.interests.forNeed(user.sub ?? user.id, needId);
  }

  @Patch(':id/respond')
  @Roles('PASIEN', 'family')
  @ApiOperation({ summary: 'Terima/tolak minat (terima → tahap Kontak)' })
  respond(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: RespondDto) {
    return this.interests.respond(user.sub ?? user.id, id, dto.accept);
  }

  @Post(':id/cancel')
  @Roles('MITRA', 'caregiver')
  @ApiOperation({ summary: 'Batalkan minat sendiri (sebelum diproses)' })
  cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.interests.cancel(user.sub ?? user.id, id);
  }
}

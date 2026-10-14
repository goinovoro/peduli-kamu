import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { IsIn, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiTags, ApiOperation, ApiCookieAuth, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsentsService } from './consents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const CONSENT_KINDS = [
  'KETENTUAN_PLATFORM',
  'KODE_ETIK',
  'PELAYANAN',
  'KOMUNIKASI',
  'PRIVASI',
  'PEMBATALAN',
  'PEMBAYARAN',
  'SENGKETA',
] as const;

class AgreeDto {
  @ApiProperty({ enum: CONSENT_KINDS as unknown as string[], example: 'KETENTUAN_PLATFORM' })
  @IsIn(CONSENT_KINDS as unknown as string[]) kind!: string;
  @ApiPropertyOptional({ example: 'v1' }) @IsOptional() @IsNotEmpty() version?: string;
}

@ApiTags('consents')
@ApiCookieAuth()
@Controller('consents')
@UseGuards(JwtAuthGuard)
export class ConsentsController {
  constructor(private consents: ConsentsService) {}

  @Post()
  @ApiOperation({ summary: 'Catat persetujuan ketentuan (idempotent)' })
  agree(@CurrentUser() user: any, @Body() dto: AgreeDto) {
    return this.consents.agree(user.sub ?? user.id, dto.kind, dto.version ?? 'v1');
  }

  @Get('me')
  @ApiOperation({ summary: 'Daftar persetujuan saya' })
  mine(@CurrentUser() user: any) {
    return this.consents.mine(user.sub ?? user.id);
  }
}

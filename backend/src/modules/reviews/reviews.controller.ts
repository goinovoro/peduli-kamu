import { Controller, Post, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { IsBoolean, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiTags, ApiOperation, ApiCookieAuth, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class CreateReviewDto {
  @ApiProperty() @IsNotEmpty() contractId!: string;
  @ApiProperty({ minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5) punctuality!: number;
  @IsInt() @Min(1) @Max(5) professionalism!: number;
  @IsInt() @Min(1) @Max(5) communication!: number;
  @IsInt() @Min(1) @Max(5) quality!: number;
  @IsInt() @Min(1) @Max(5) overall!: number;
  @IsOptional() comment?: string;
}

class ModerateDto {
  @ApiProperty({ example: true }) @IsBoolean() hide!: boolean;
}

@ApiTags('reviews')
@ApiCookieAuth()
@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  @Post()
  @Roles('PASIEN', 'family')
  @ApiOperation({ summary: 'Beri review (hanya kontrak SELESAI, 1× per layanan)' })
  create(@CurrentUser() user: any, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.sub ?? user.id, dto as unknown as Record<string, any>);
  }

  @Get('caregiver/:caregiverId')
  @ApiOperation({ summary: 'Review publik seorang mitra' })
  forCaregiver(@Param('caregiverId') caregiverId: string) {
    return this.reviews.forCaregiver(caregiverId);
  }

  @Patch(':id/moderate')
  @Roles('admin')
  @ApiOperation({ summary: 'Sembunyikan/tampilkan review + hitung ulang rating' })
  moderate(@Param('id') id: string, @Body() dto: ModerateDto) {
    return this.reviews.moderate(id, dto.hide);
  }
}

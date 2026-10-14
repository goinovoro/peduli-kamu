import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiCookieAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard: pengguna, antrian, operasional, escrow' })
  stats() {
    return this.admin.stats();
  }

  @Get('needs')
  @ApiOperation({ summary: 'Monitor kebutuhan (Admin, filter ?status=)' })
  needs(@Query('status') status?: string) {
    return this.admin.needs(status);
  }

  @Get('contracts')
  @ApiOperation({ summary: 'Monitor kontrak + relasi uang (Admin, filter ?status=)' })
  contracts(@Query('status') status?: string) {
    return this.admin.contracts(status);
  }

  @Get('attendances')
  @ApiOperation({ summary: 'Monitor absensi (Admin, filter ?status= & ?flag=lokasi)' })
  attendances(@Query('status') status?: string, @Query('flag') flag?: string) {
    return this.admin.attendances(status, flag);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Semua review untuk moderasi (Admin)' })
  reviews() {
    return this.admin.reviews();
  }
}

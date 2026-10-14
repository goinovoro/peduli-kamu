import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { IsIn } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiProperty } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class SetStatusDto {
  @ApiProperty({ enum: ['AKTIF', 'TIDAK_AKTIF', 'DITANGGUHKAN', 'DIBLOKIR', 'TERKUNCI_PERIODE', 'DIBEKUKAN'] })
  @IsIn(['AKTIF', 'TIDAK_AKTIF', 'DITANGGUHKAN', 'DIBLOKIR', 'TERKUNCI_PERIODE', 'DIBEKUKAN'])
  status!: string;
}

@ApiTags('users')
@ApiCookieAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Daftar semua user (Admin)' })
  @ApiResponse({ status: 403, description: 'Bukan admin' })
  findAll() {
    return this.users.findAll();
  }

  @Patch(':id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Ubah status akun (Admin, tidak boleh akun sendiri)' })
  @ApiResponse({ status: 403, description: 'Akun sendiri / bukan admin' })
  setStatus(@CurrentUser() admin: any, @Param('id') id: string, @Body() dto: SetStatusDto) {
    return this.users.setStatus(admin.sub ?? admin.id, id, dto.status);
  }
}

import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { PatientsService, CreatePatientDto } from './patients.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('patients (legacy)')
@ApiCookieAuth()
@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private patients: PatientsService) {}
  @Get()
  @ApiOperation({ summary: 'Pasien milik saya [legacy, digantikan needs]' })
  byOwner(@CurrentUser() user: any) {
    return this.patients.byOwner(user.sub ?? user.id);
  }
  @Post()
  @ApiOperation({ summary: 'Tambah pasien [legacy]' })
  create(@CurrentUser() user: any, @Body() dto: CreatePatientDto) {
    return this.patients.create(user.sub ?? user.id, dto);
  }
}

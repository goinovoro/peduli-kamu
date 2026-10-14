import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { BookingsService, CreateBookingDto } from './bookings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('bookings (legacy)')
@ApiCookieAuth()
@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private bookings: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Buat booking langsung [legacy, digantikan needs→contracts]' })
  create(@CurrentUser() user: any, @Body() dto: CreateBookingDto) {
    return this.bookings.create(user.sub ?? user.id, dto);
  }

  @Get('mine/family')
  @ApiOperation({ summary: 'Booking saya (family) [legacy]' })
  byFamily(@CurrentUser() user: any) {
    return this.bookings.byFamily(user.sub ?? user.id);
  }

  @Get('mine/caregiver')
  @ApiOperation({ summary: 'Booking saya (caregiver) [legacy]' })
  byCaregiver(@CurrentUser() user: any) {
    return this.bookings.byCaregiverUser(user.sub ?? user.id);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Terima booking [legacy]' })
  accept(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookings.setStatus(id, user.sub ?? user.id, 'upcoming');
  }

  @Patch(':id/decline')
  @ApiOperation({ summary: 'Tolak booking [legacy]' })
  decline(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookings.setStatus(id, user.sub ?? user.id, 'cancelled');
  }
}

import { Controller, Get, Patch, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiCookieAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Notifikasi saya (?unread=true)' })
  mine(@CurrentUser() user: any, @Query('unread') unread?: string) {
    return this.notifications.mine(user.sub ?? user.id, unread === 'true');
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Jumlah belum dibaca (badge)' })
  unreadCount(@CurrentUser() user: any) {
    return this.notifications.unreadCount(user.sub ?? user.id).then((count) => ({ count }));
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Tandai satu dibaca' })
  markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notifications.markRead(user.sub ?? user.id, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Tandai semua dibaca' })
  markAllRead(@CurrentUser() user: any) {
    return this.notifications.markAllRead(user.sub ?? user.id);
  }
}

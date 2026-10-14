import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { IsNotEmpty } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiProperty } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class SendDto {
  @ApiProperty() @IsNotEmpty() interestId!: string;
  @ApiProperty({ example: 'Kondisi pasien bagaimana?' }) @IsNotEmpty() body!: string;
}

@ApiTags('messages')
@ApiCookieAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private messages: MessagesService) {}

  @Post()
  @Roles('PASIEN', 'family', 'MITRA', 'caregiver')
  @ApiOperation({ summary: 'Kirim chat (hanya setelah minat DITERIMA)' })
  @ApiResponse({ status: 403, description: 'Belum diterima / bukan pihak' })
  send(@CurrentUser() user: any, @Body() dto: SendDto) {
    return this.messages.send(user.sub ?? user.id, user.role, dto.interestId, dto.body);
  }

  @Get('interest/:interestId')
  @Roles('PASIEN', 'family', 'MITRA', 'caregiver')
  @ApiOperation({ summary: 'Riwayat chat satu minat' })
  thread(@CurrentUser() user: any, @Param('interestId') interestId: string) {
    return this.messages.thread(user.sub ?? user.id, user.role, interestId);
  }
}

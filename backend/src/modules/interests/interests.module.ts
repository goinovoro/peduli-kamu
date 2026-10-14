import { Module } from '@nestjs/common';
import { InterestsController } from './interests.controller';
import { InterestsService } from './interests.service';
import { DepositsModule } from '../deposits/deposits.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DepositsModule, NotificationsModule],
  controllers: [InterestsController],
  providers: [InterestsService],
  exports: [InterestsService],
})
export class InterestsModule {}

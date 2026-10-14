import { Module } from '@nestjs/common';
import { DepositsController } from './deposits.controller';
import { DepositsService } from './deposits.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [DepositsController],
  providers: [DepositsService],
  exports: [DepositsService],
})
export class DepositsModule {}

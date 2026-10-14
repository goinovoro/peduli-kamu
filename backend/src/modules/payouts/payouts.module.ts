import { Module } from '@nestjs/common';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PayoutsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}

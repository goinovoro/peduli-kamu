import { Module } from '@nestjs/common';
import { CaregiversController } from './caregivers.controller';
import { CaregiversService } from './caregivers.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CaregiversController],
  providers: [CaregiversService],
})
export class CaregiversModule {}

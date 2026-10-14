import { Module } from '@nestjs/common';
import { NeedsController } from './needs.controller';
import { NeedsService } from './needs.service';
import { DepositsModule } from '../deposits/deposits.module';

@Module({
  imports: [DepositsModule],
  controllers: [NeedsController],
  providers: [NeedsService],
  exports: [NeedsService],
})
export class NeedsModule {}

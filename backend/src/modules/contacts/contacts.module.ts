import { Module } from '@nestjs/common';
import { UcontactsController } from './contacts.controller';
import { UcontactsService } from './contacts.service';

@Module({
  controllers: [UcontactsController],
  providers: [UcontactsService],
  exports: [UcontactsService],
})
export class UcontactsModule {}

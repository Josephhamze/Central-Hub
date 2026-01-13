import { Module } from '@nestjs/common';
import { ExcavatorEntriesService } from './excavator-entries.service';
import { ExcavatorEntriesController } from './excavator-entries.controller';
import { PrismaModule } from '../../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExcavatorEntriesController],
  providers: [ExcavatorEntriesService],
  exports: [ExcavatorEntriesService],
})
export class ExcavatorEntriesModule {}

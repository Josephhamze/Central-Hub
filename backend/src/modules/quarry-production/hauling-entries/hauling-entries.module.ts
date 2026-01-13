import { Module } from '@nestjs/common';
import { HaulingEntriesService } from './hauling-entries.service';
import { HaulingEntriesController } from './hauling-entries.controller';
import { PrismaModule } from '../../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HaulingEntriesController],
  providers: [HaulingEntriesService],
  exports: [HaulingEntriesService],
})
export class HaulingEntriesModule {}

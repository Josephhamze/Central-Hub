import { Module } from '@nestjs/common';
import { CrusherFeedEntriesService } from './crusher-feed-entries.service';
import { CrusherFeedEntriesController } from './crusher-feed-entries.controller';
import { PrismaModule } from '../../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CrusherFeedEntriesController],
  providers: [CrusherFeedEntriesService],
  exports: [CrusherFeedEntriesService],
})
export class CrusherFeedEntriesModule {}

import { Module } from '@nestjs/common';
import { CrusherOutputEntriesService } from './crusher-output-entries.service';
import { CrusherOutputEntriesController } from './crusher-output-entries.controller';
import { PrismaModule } from '../../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CrusherOutputEntriesController],
  providers: [CrusherOutputEntriesService],
  exports: [CrusherOutputEntriesService],
})
export class CrusherOutputEntriesModule {}

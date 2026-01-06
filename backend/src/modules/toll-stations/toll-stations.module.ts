import { Module } from '@nestjs/common';
import { TollStationsController } from './toll-stations.controller';
import { TollStationsService } from './toll-stations.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TollStationsController],
  providers: [TollStationsService],
  exports: [TollStationsService],
})
export class TollStationsModule {}

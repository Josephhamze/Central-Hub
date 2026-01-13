import { Module } from '@nestjs/common';
import { StockpileLocationsService } from './stockpile-locations.service';
import { StockpileLocationsController } from './stockpile-locations.controller';
import { PrismaModule } from '../../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StockpileLocationsController],
  providers: [StockpileLocationsService],
  exports: [StockpileLocationsService],
})
export class StockpileLocationsModule {}

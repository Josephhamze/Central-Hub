import { Module } from '@nestjs/common';
import { PitLocationsService } from './pit-locations.service';
import { PitLocationsController } from './pit-locations.controller';
import { PrismaModule } from '../../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PitLocationsController],
  providers: [PitLocationsService],
  exports: [PitLocationsService],
})
export class PitLocationsModule {}

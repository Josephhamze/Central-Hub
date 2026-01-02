import { Module } from '@nestjs/common';
import { MaintenanceSchedulesController } from './maintenance-schedules.controller';
import { MaintenanceSchedulesService } from './maintenance-schedules.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MaintenanceSchedulesController],
  providers: [MaintenanceSchedulesService],
  exports: [MaintenanceSchedulesService],
})
export class MaintenanceSchedulesModule {}

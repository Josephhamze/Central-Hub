import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QuarryPlanningController } from './quarry-planning.controller';
import { QuarryPlanningService } from './quarry-planning.service';

@Module({
  controllers: [QuarryPlanningController],
  providers: [QuarryPlanningService, PrismaService],
  exports: [QuarryPlanningService],
})
export class QuarryPlanningModule {}

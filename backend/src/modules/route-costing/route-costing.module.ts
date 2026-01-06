import { Module } from '@nestjs/common';
import { RouteCostingController, CostingCalculatorController } from './route-costing.controller';
import { RouteCostingService } from './route-costing.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RouteCostingController, CostingCalculatorController],
  providers: [RouteCostingService],
  exports: [RouteCostingService],
})
export class RouteCostingModule {}

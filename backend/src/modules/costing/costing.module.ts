import { Module } from '@nestjs/common';
import { CostingController } from './costing.controller';

@Module({
  controllers: [CostingController],
})
export class CostingModule {}

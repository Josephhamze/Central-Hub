import { Module } from '@nestjs/common';
import { StockItemsController } from './stockitems.controller';
import { StockItemsService } from './stockitems.service';

@Module({
  controllers: [StockItemsController],
  providers: [StockItemsService],
  exports: [StockItemsService],
})
export class StockItemsModule {}

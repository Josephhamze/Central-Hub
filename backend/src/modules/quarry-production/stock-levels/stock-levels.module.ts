import { Module } from '@nestjs/common';
import { StockLevelsService } from './stock-levels.service';
import { StockLevelsController } from './stock-levels.controller';
import { PrismaModule } from '../../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StockLevelsController],
  providers: [StockLevelsService],
  exports: [StockLevelsService],
})
export class StockLevelsModule {}

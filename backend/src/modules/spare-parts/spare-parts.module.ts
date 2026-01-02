import { Module } from '@nestjs/common';
import { SparePartsController } from './spare-parts.controller';
import { SparePartsService } from './spare-parts.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SparePartsController],
  providers: [SparePartsService],
  exports: [SparePartsService],
})
export class SparePartsModule {}

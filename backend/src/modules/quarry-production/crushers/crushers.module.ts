import { Module } from '@nestjs/common';
import { CrushersService } from './crushers.service';
import { CrushersController } from './crushers.controller';
import { PrismaModule } from '../../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CrushersController],
  providers: [CrushersService],
  exports: [CrushersService],
})
export class CrushersModule {}

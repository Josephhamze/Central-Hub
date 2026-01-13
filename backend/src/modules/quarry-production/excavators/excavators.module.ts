import { Module } from '@nestjs/common';
import { ExcavatorsService } from './excavators.service';
import { ExcavatorsController } from './excavators.controller';
import { PrismaModule } from '../../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExcavatorsController],
  providers: [ExcavatorsService],
  exports: [ExcavatorsService],
})
export class ExcavatorsModule {}

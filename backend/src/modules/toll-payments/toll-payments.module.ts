import { Module } from '@nestjs/common';
import { TollPaymentsController } from './toll-payments.controller';
import { TollPaymentsService } from './toll-payments.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TollPaymentsController],
  providers: [TollPaymentsService],
  exports: [TollPaymentsService],
})
export class TollPaymentsModule {}

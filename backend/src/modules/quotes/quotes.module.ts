import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { QuoteArchivingService } from './quote-archiving.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [NotificationsModule, PrismaModule],
  controllers: [QuotesController],
  providers: [QuotesService, QuoteArchivingService],
  exports: [QuotesService, QuoteArchivingService],
})
export class QuotesModule {}

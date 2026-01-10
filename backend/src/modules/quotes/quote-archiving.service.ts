import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QuoteStatus } from '@prisma/client';

@Injectable()
export class QuoteArchivingService {
  private readonly logger = new Logger(QuoteArchivingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Run daily at 2 AM to archive quotes based on business rules
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleQuoteArchiving() {
    this.logger.log('Starting quote archiving job...');
    
    try {
      const now = new Date();
      const archivedCount = await this.archiveQuotes(now);
      
      this.logger.log(`Quote archiving completed. Archived ${archivedCount} quotes.`);
    } catch (error) {
      this.logger.error('Error in quote archiving job:', error);
    }
  }

  /**
   * Archive quotes based on business rules:
   * 1. REJECTED quotes: Archive after 7 days from rejection
   * 2. WON/LOST quotes: Archive after the month is over
   * 3. Expired quotes: Archive 7 days after expiration
   */
  async archiveQuotes(now: Date = new Date()): Promise<number> {
    let archivedCount = 0;

    // 1. Archive REJECTED quotes that were rejected 7+ days ago
    const rejectedQuotes = await this.prisma.quote.findMany({
      where: {
        status: QuoteStatus.REJECTED,
        archived: false,
        rejectedAt: {
          not: null,
          lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
      },
    });

    if (rejectedQuotes.length > 0) {
      const result = await this.prisma.quote.updateMany({
        where: {
          id: { in: rejectedQuotes.map(q => q.id) },
        },
        data: {
          archived: true,
          archivedAt: now,
        },
      });
      archivedCount += result.count;
      this.logger.log(`Archived ${result.count} rejected quotes (7+ days old)`);
    }

    // 2. Archive WON/LOST quotes after the month is over
    // Get quotes that are WON or LOST, not archived, and the month has passed
    const wonLostQuotes = await this.prisma.quote.findMany({
      where: {
        status: { in: [QuoteStatus.WON, QuoteStatus.LOST] },
        archived: false,
      },
    });

    const quotesToArchiveByMonth: string[] = [];
    for (const quote of wonLostQuotes) {
      // Determine the date to check - use updatedAt (when status changed) or createdAt
      const statusChangeDate = quote.updatedAt || quote.createdAt;
      const statusChangeMonth = new Date(statusChangeDate.getFullYear(), statusChangeDate.getMonth(), 1);
      const nextMonth = new Date(statusChangeMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      // If we're past the end of the month when status changed, archive it
      if (now >= nextMonth) {
        quotesToArchiveByMonth.push(quote.id);
      }
    }

    if (quotesToArchiveByMonth.length > 0) {
      const result = await this.prisma.quote.updateMany({
        where: {
          id: { in: quotesToArchiveByMonth },
        },
        data: {
          archived: true,
          archivedAt: now,
        },
      });
      archivedCount += result.count;
      this.logger.log(`Archived ${result.count} won/lost quotes (month ended)`);
    }

    // 3. Archive expired quotes 7 days after expiration
    const expiredQuotes = await this.prisma.quote.findMany({
      where: {
        archived: false,
        expiresAt: {
          not: null,
          lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Expired 7+ days ago
        },
      },
    });

    if (expiredQuotes.length > 0) {
      const result = await this.prisma.quote.updateMany({
        where: {
          id: { in: expiredQuotes.map(q => q.id) },
        },
        data: {
          archived: true,
          archivedAt: now,
        },
      });
      archivedCount += result.count;
      this.logger.log(`Archived ${result.count} expired quotes (7+ days after expiration)`);
    }

    return archivedCount;
  }

  /**
   * Manually archive a quote (called when status changes to WON or LOST)
   */
  async archiveQuote(quoteId: string): Promise<void> {
    await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        archived: true,
        archivedAt: new Date(),
      },
    });
    this.logger.log(`Manually archived quote ${quoteId}`);
  }
}

import { PrismaService } from '../../common/prisma/prisma.service';
export declare class QuoteArchivingService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleQuoteArchiving(): Promise<void>;
    archiveQuotes(now?: Date): Promise<number>;
    archiveQuote(quoteId: string): Promise<void>;
}

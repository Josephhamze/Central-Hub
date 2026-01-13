"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var QuoteArchivingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteArchivingService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
let QuoteArchivingService = QuoteArchivingService_1 = class QuoteArchivingService {
    prisma;
    logger = new common_1.Logger(QuoteArchivingService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleQuoteArchiving() {
        this.logger.log('Starting quote archiving job...');
        try {
            const now = new Date();
            const archivedCount = await this.archiveQuotes(now);
            this.logger.log(`Quote archiving completed. Archived ${archivedCount} quotes.`);
        }
        catch (error) {
            this.logger.error('Error in quote archiving job:', error);
        }
    }
    async archiveQuotes(now = new Date()) {
        let archivedCount = 0;
        const rejectedQuotes = await this.prisma.quote.findMany({
            where: {
                status: client_1.QuoteStatus.REJECTED,
                archived: false,
                rejectedAt: {
                    not: null,
                    lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
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
        const wonLostQuotes = await this.prisma.quote.findMany({
            where: {
                status: { in: [client_1.QuoteStatus.WON, client_1.QuoteStatus.LOST] },
                archived: false,
            },
        });
        const quotesToArchiveByMonth = [];
        for (const quote of wonLostQuotes) {
            const statusChangeDate = quote.updatedAt || quote.createdAt;
            const statusChangeMonth = new Date(statusChangeDate.getFullYear(), statusChangeDate.getMonth(), 1);
            const nextMonth = new Date(statusChangeMonth);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
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
        const expiredQuotes = await this.prisma.quote.findMany({
            where: {
                archived: false,
                expiresAt: {
                    not: null,
                    lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
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
    async archiveQuote(quoteId) {
        await this.prisma.quote.update({
            where: { id: quoteId },
            data: {
                archived: true,
                archivedAt: new Date(),
            },
        });
        this.logger.log(`Manually archived quote ${quoteId}`);
    }
};
exports.QuoteArchivingService = QuoteArchivingService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QuoteArchivingService.prototype, "handleQuoteArchiving", null);
exports.QuoteArchivingService = QuoteArchivingService = QuoteArchivingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuoteArchivingService);
//# sourceMappingURL=quote-archiving.service.js.map
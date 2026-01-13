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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    calculateVariance(expected, actual, threshold) {
        const variance = actual.minus(expected);
        const variancePercent = expected.isZero()
            ? new library_1.Decimal(0)
            : variance.dividedBy(expected).times(100);
        const absPercent = variancePercent.abs().toNumber();
        let status = 'OK';
        if (absPercent > threshold * 1.5) {
            status = 'ALERT';
        }
        else if (absPercent > threshold) {
            status = 'WARNING';
        }
        return { variance, variancePercent, status };
    }
    async getVarianceAnalysis(date, shift) {
        date.setHours(0, 0, 0, 0);
        const where = { date, status: client_1.EntryStatus.APPROVED };
        if (shift)
            where.shift = shift;
        const [excavatorEntries, haulingEntries, crusherFeedEntries, crusherOutputEntries] = await Promise.all([
            this.prisma.excavatorEntry.findMany({
                where: shift ? { ...where, shift } : where,
            }),
            this.prisma.haulingEntry.findMany({
                where: shift ? { ...where, shift } : where,
            }),
            this.prisma.crusherFeedEntry.findMany({
                where: shift ? { ...where, shift } : where,
            }),
            this.prisma.crusherOutputEntry.findMany({
                where: shift ? { ...where, shift } : where,
            }),
        ]);
        const excavatorTonnage = excavatorEntries.reduce((sum, entry) => sum.plus(entry.estimatedTonnage), new library_1.Decimal(0));
        const haulingTonnage = haulingEntries.reduce((sum, entry) => sum.plus(entry.totalHauled), new library_1.Decimal(0));
        const crusherFeedTonnage = crusherFeedEntries.reduce((sum, entry) => sum.plus(entry.weighBridgeTonnage), new library_1.Decimal(0));
        const crusherOutputTonnage = crusherOutputEntries.reduce((sum, entry) => sum.plus(entry.outputTonnage), new library_1.Decimal(0));
        const variances = [];
        const checkpoint1 = this.calculateVariance(excavatorTonnage, haulingTonnage, 8);
        variances.push({
            checkpoint: 1,
            name: 'Excavator → Hauling',
            expected: excavatorTonnage,
            actual: haulingTonnage,
            variance: checkpoint1.variance,
            variancePercent: checkpoint1.variancePercent,
            threshold: 8,
            status: checkpoint1.status,
        });
        const checkpoint2 = this.calculateVariance(haulingTonnage, crusherFeedTonnage, 3);
        variances.push({
            checkpoint: 2,
            name: 'Hauling → Crusher Feed',
            expected: haulingTonnage,
            actual: crusherFeedTonnage,
            variance: checkpoint2.variance,
            variancePercent: checkpoint2.variancePercent,
            threshold: 3,
            status: checkpoint2.status,
        });
        const checkpoint3 = this.calculateVariance(crusherFeedTonnage, crusherOutputTonnage, 8);
        let status3 = checkpoint3.status;
        const lossPercent = checkpoint3.variancePercent.negated().toNumber();
        if (lossPercent >= 2 && lossPercent <= 8) {
            status3 = 'OK';
        }
        else if (lossPercent > 8) {
            status3 = 'ALERT';
        }
        else if (lossPercent < 2) {
            status3 = 'WARNING';
        }
        variances.push({
            checkpoint: 3,
            name: 'Crusher Feed → Output',
            expected: crusherFeedTonnage,
            actual: crusherOutputTonnage,
            variance: checkpoint3.variance,
            variancePercent: checkpoint3.variancePercent,
            threshold: 8,
            status: status3,
        });
        return {
            date,
            shift,
            excavatorTonnage,
            haulingTonnage,
            crusherFeedTonnage,
            crusherOutputTonnage,
            variances,
        };
    }
    async getKPIs(dateFrom, dateTo) {
        dateFrom.setHours(0, 0, 0, 0);
        dateTo.setHours(23, 59, 59, 999);
        const where = {
            date: { gte: dateFrom, lte: dateTo },
            status: client_1.EntryStatus.APPROVED,
        };
        const [excavatorEntries, haulingEntries, crusherFeedEntries, crusherOutputEntries] = await Promise.all([
            this.prisma.excavatorEntry.findMany({ where }),
            this.prisma.haulingEntry.findMany({ where }),
            this.prisma.crusherFeedEntry.findMany({ where }),
            this.prisma.crusherOutputEntry.findMany({ where }),
        ]);
        const totalExcavatorTonnage = excavatorEntries.reduce((sum, e) => sum.plus(e.estimatedTonnage), new library_1.Decimal(0));
        const totalHaulingTonnage = haulingEntries.reduce((sum, e) => sum.plus(e.totalHauled), new library_1.Decimal(0));
        const totalCrusherFeedTonnage = crusherFeedEntries.reduce((sum, e) => sum.plus(e.weighBridgeTonnage), new library_1.Decimal(0));
        const totalCrusherOutputTonnage = crusherOutputEntries.reduce((sum, e) => sum.plus(e.outputTonnage), new library_1.Decimal(0));
        const kpis = [];
        const totalBucketCount = excavatorEntries.reduce((sum, e) => sum + e.bucketCount, 0);
        kpis.push({
            name: 'Excavator Efficiency',
            value: totalExcavatorTonnage,
            unit: 'tonnes',
        });
        const totalTrips = haulingEntries.reduce((sum, e) => sum + e.tripCount, 0);
        kpis.push({
            name: 'Hauling Efficiency',
            value: totalHaulingTonnage,
            unit: 'tonnes',
        });
        const yieldPercent = totalCrusherFeedTonnage.isZero()
            ? new library_1.Decimal(0)
            : totalCrusherOutputTonnage.dividedBy(totalCrusherFeedTonnage).times(100);
        kpis.push({
            name: 'Crusher Yield',
            value: yieldPercent.toNumber(),
            target: 95,
            unit: '%',
            percentage: yieldPercent.toNumber(),
        });
        const recoveryRate = totalExcavatorTonnage.isZero()
            ? new library_1.Decimal(0)
            : totalCrusherOutputTonnage.dividedBy(totalExcavatorTonnage).times(100);
        kpis.push({
            name: 'Overall Recovery Rate',
            value: recoveryRate.toNumber(),
            target: 90,
            unit: '%',
            percentage: recoveryRate.toNumber(),
        });
        return kpis;
    }
    async getDailySummary(date) {
        date.setHours(0, 0, 0, 0);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        const where = {
            date: { gte: date, lt: nextDay },
            status: client_1.EntryStatus.APPROVED,
        };
        const [dayEntries, nightEntries] = await Promise.all([
            this.getVarianceAnalysis(date, client_1.Shift.DAY),
            this.getVarianceAnalysis(date, client_1.Shift.NIGHT),
        ]);
        return {
            date,
            day: dayEntries,
            night: nightEntries,
            total: {
                excavatorTonnage: dayEntries.excavatorTonnage.plus(nightEntries.excavatorTonnage),
                haulingTonnage: dayEntries.haulingTonnage.plus(nightEntries.haulingTonnage),
                crusherFeedTonnage: dayEntries.crusherFeedTonnage.plus(nightEntries.crusherFeedTonnage),
                crusherOutputTonnage: dayEntries.crusherOutputTonnage.plus(nightEntries.crusherOutputTonnage),
            },
        };
    }
    async getWeeklySummary(startDate) {
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        const summaries = [];
        for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
            summaries.push(await this.getDailySummary(new Date(d)));
        }
        return summaries;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map
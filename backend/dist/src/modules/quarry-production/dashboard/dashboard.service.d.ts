import { PrismaService } from '../../../common/prisma/prisma.service';
import { Shift } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
export interface VarianceCheckpoint {
    checkpoint: number;
    name: string;
    expected: Decimal;
    actual: Decimal;
    variance: Decimal;
    variancePercent: Decimal;
    threshold: number;
    status: 'OK' | 'WARNING' | 'ALERT';
}
export interface ProductionSummary {
    date: Date;
    shift?: Shift;
    excavatorTonnage: Decimal;
    haulingTonnage: Decimal;
    crusherFeedTonnage: Decimal;
    crusherOutputTonnage: Decimal;
    variances: VarianceCheckpoint[];
}
export interface KPI {
    name: string;
    value: Decimal | number;
    target?: Decimal | number;
    unit: string;
    percentage?: number;
}
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    private calculateVariance;
    getVarianceAnalysis(date: Date, shift?: Shift): Promise<ProductionSummary>;
    getKPIs(dateFrom: Date, dateTo: Date): Promise<KPI[]>;
    getDailySummary(date: Date): Promise<{
        date: Date;
        day: ProductionSummary;
        night: ProductionSummary;
        total: {
            excavatorTonnage: Decimal;
            haulingTonnage: Decimal;
            crusherFeedTonnage: Decimal;
            crusherOutputTonnage: Decimal;
        };
    }>;
    getWeeklySummary(startDate: Date): Promise<{
        date: Date;
        day: ProductionSummary;
        night: ProductionSummary;
        total: {
            excavatorTonnage: Decimal;
            haulingTonnage: Decimal;
            crusherFeedTonnage: Decimal;
            crusherOutputTonnage: Decimal;
        };
    }[]>;
}

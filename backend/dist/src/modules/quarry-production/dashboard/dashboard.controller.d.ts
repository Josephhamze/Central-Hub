import { DashboardService } from './dashboard.service';
import { VarianceQueryDto } from './dto/variance-query.dto';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getVarianceAnalysis(query: VarianceQueryDto): Promise<import("./dashboard.service").ProductionSummary>;
    getKPIs(dateFrom: string, dateTo: string): Promise<import("./dashboard.service").KPI[]>;
    getDailySummary(date: string): Promise<{
        date: Date;
        day: import("./dashboard.service").ProductionSummary;
        night: import("./dashboard.service").ProductionSummary;
        total: {
            excavatorTonnage: import("@prisma/client/runtime/library").Decimal;
            haulingTonnage: import("@prisma/client/runtime/library").Decimal;
            crusherFeedTonnage: import("@prisma/client/runtime/library").Decimal;
            crusherOutputTonnage: import("@prisma/client/runtime/library").Decimal;
        };
    }>;
    getWeeklySummary(startDate: string): Promise<{
        date: Date;
        day: import("./dashboard.service").ProductionSummary;
        night: import("./dashboard.service").ProductionSummary;
        total: {
            excavatorTonnage: import("@prisma/client/runtime/library").Decimal;
            haulingTonnage: import("@prisma/client/runtime/library").Decimal;
            crusherFeedTonnage: import("@prisma/client/runtime/library").Decimal;
            crusherOutputTonnage: import("@prisma/client/runtime/library").Decimal;
        };
    }[]>;
}

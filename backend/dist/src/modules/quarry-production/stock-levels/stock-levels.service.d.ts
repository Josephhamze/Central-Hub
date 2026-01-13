import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateStockLevelDto } from './dto/create-stock-level.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { Decimal } from '@prisma/client/runtime/library';
export declare class StockLevelsService {
    private prisma;
    constructor(prisma: PrismaService);
    private getPreviousDayClosingStock;
    private calculateProduced;
    private calculateClosingStock;
    findAll(page?: number, limit?: number, dateFrom?: string, dateTo?: string, productTypeId?: string, stockpileLocationId?: string): Promise<{
        items: ({
            productType: {
                id: string;
                name: string;
            };
            stockpileLocation: {
                id: string;
                name: string;
            };
            createdBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productTypeId: string;
            stockpileLocationId: string;
            date: Date;
            createdById: string;
            openingStock: Decimal;
            sold: Decimal;
            adjustments: Decimal;
            adjustmentReason: string | null;
            produced: Decimal;
            closingStock: Decimal;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        productType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        };
        stockpileLocation: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        };
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        stockpileLocationId: string;
        date: Date;
        createdById: string;
        openingStock: Decimal;
        sold: Decimal;
        adjustments: Decimal;
        adjustmentReason: string | null;
        produced: Decimal;
        closingStock: Decimal;
    }>;
    getCurrentStock(productTypeId?: string, stockpileLocationId?: string): Promise<({
        productType: {
            id: string;
            name: string;
        };
        stockpileLocation: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        stockpileLocationId: string;
        date: Date;
        createdById: string;
        openingStock: Decimal;
        sold: Decimal;
        adjustments: Decimal;
        adjustmentReason: string | null;
        produced: Decimal;
        closingStock: Decimal;
    })[]>;
    createOrUpdate(dto: CreateStockLevelDto, createdById: string): Promise<{
        productType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        };
        stockpileLocation: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        stockpileLocationId: string;
        date: Date;
        createdById: string;
        openingStock: Decimal;
        sold: Decimal;
        adjustments: Decimal;
        adjustmentReason: string | null;
        produced: Decimal;
        closingStock: Decimal;
    }>;
    adjustStock(id: string, dto: AdjustStockDto, createdById: string): Promise<{
        productType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        };
        stockpileLocation: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        stockpileLocationId: string;
        date: Date;
        createdById: string;
        openingStock: Decimal;
        sold: Decimal;
        adjustments: Decimal;
        adjustmentReason: string | null;
        produced: Decimal;
        closingStock: Decimal;
    }>;
    recalculateStock(date: Date, productTypeId: string, stockpileLocationId: string): Promise<{
        productType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        };
        stockpileLocation: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        stockpileLocationId: string;
        date: Date;
        createdById: string;
        openingStock: Decimal;
        sold: Decimal;
        adjustments: Decimal;
        adjustmentReason: string | null;
        produced: Decimal;
        closingStock: Decimal;
    }>;
}

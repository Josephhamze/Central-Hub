import { StockLevelsService } from './stock-levels.service';
import { CreateStockLevelDto } from './dto/create-stock-level.dto';
import { UpdateStockLevelDto } from './dto/update-stock-level.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
export declare class StockLevelsController {
    private readonly stockLevelsService;
    constructor(stockLevelsService: StockLevelsService);
    create(createDto: CreateStockLevelDto, userId: string): Promise<{
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
        openingStock: import("@prisma/client/runtime/library").Decimal;
        sold: import("@prisma/client/runtime/library").Decimal;
        adjustments: import("@prisma/client/runtime/library").Decimal;
        adjustmentReason: string | null;
        produced: import("@prisma/client/runtime/library").Decimal;
        closingStock: import("@prisma/client/runtime/library").Decimal;
    }>;
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
            openingStock: import("@prisma/client/runtime/library").Decimal;
            sold: import("@prisma/client/runtime/library").Decimal;
            adjustments: import("@prisma/client/runtime/library").Decimal;
            adjustmentReason: string | null;
            produced: import("@prisma/client/runtime/library").Decimal;
            closingStock: import("@prisma/client/runtime/library").Decimal;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
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
        openingStock: import("@prisma/client/runtime/library").Decimal;
        sold: import("@prisma/client/runtime/library").Decimal;
        adjustments: import("@prisma/client/runtime/library").Decimal;
        adjustmentReason: string | null;
        produced: import("@prisma/client/runtime/library").Decimal;
        closingStock: import("@prisma/client/runtime/library").Decimal;
    })[]>;
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
        openingStock: import("@prisma/client/runtime/library").Decimal;
        sold: import("@prisma/client/runtime/library").Decimal;
        adjustments: import("@prisma/client/runtime/library").Decimal;
        adjustmentReason: string | null;
        produced: import("@prisma/client/runtime/library").Decimal;
        closingStock: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, updateDto: UpdateStockLevelDto, userId: string): Promise<{
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
        openingStock: import("@prisma/client/runtime/library").Decimal;
        sold: import("@prisma/client/runtime/library").Decimal;
        adjustments: import("@prisma/client/runtime/library").Decimal;
        adjustmentReason: string | null;
        produced: import("@prisma/client/runtime/library").Decimal;
        closingStock: import("@prisma/client/runtime/library").Decimal;
    }>;
    adjustStock(id: string, adjustDto: AdjustStockDto, userId: string): Promise<{
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
        openingStock: import("@prisma/client/runtime/library").Decimal;
        sold: import("@prisma/client/runtime/library").Decimal;
        adjustments: import("@prisma/client/runtime/library").Decimal;
        adjustmentReason: string | null;
        produced: import("@prisma/client/runtime/library").Decimal;
        closingStock: import("@prisma/client/runtime/library").Decimal;
    }>;
    recalculateStock(body: {
        date: string;
        productTypeId: string;
        stockpileLocationId: string;
    }): Promise<{
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
        openingStock: import("@prisma/client/runtime/library").Decimal;
        sold: import("@prisma/client/runtime/library").Decimal;
        adjustments: import("@prisma/client/runtime/library").Decimal;
        adjustmentReason: string | null;
        produced: import("@prisma/client/runtime/library").Decimal;
        closingStock: import("@prisma/client/runtime/library").Decimal;
    }>;
}

import { StockItemsService } from './stockitems.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
export declare class StockItemsController {
    private readonly stockItemsService;
    constructor(stockItemsService: StockItemsService);
    findAll(companyId?: string, projectId?: string, warehouseId?: string, page?: number, limit?: number, search?: string): Promise<{
        items: ({
            project: {
                id: string;
                name: string;
                companyId: string;
            };
            warehouse: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            projectId: string;
            warehouseId: string;
            sku: string | null;
            uom: string;
            minUnitPrice: import("@prisma/client/runtime/library").Decimal;
            defaultUnitPrice: import("@prisma/client/runtime/library").Decimal;
            minOrderQty: import("@prisma/client/runtime/library").Decimal;
            truckloadOnly: boolean;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        _count: {
            quoteItems: number;
        };
        project: {
            id: string;
            code: string | null;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            companyId: string;
            region: string | null;
        };
        warehouse: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            projectId: string | null;
            companyId: string;
            locationCity: string | null;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        projectId: string;
        warehouseId: string;
        sku: string | null;
        uom: string;
        minUnitPrice: import("@prisma/client/runtime/library").Decimal;
        defaultUnitPrice: import("@prisma/client/runtime/library").Decimal;
        minOrderQty: import("@prisma/client/runtime/library").Decimal;
        truckloadOnly: boolean;
    }>;
    create(dto: CreateStockItemDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        projectId: string;
        warehouseId: string;
        sku: string | null;
        uom: string;
        minUnitPrice: import("@prisma/client/runtime/library").Decimal;
        defaultUnitPrice: import("@prisma/client/runtime/library").Decimal;
        minOrderQty: import("@prisma/client/runtime/library").Decimal;
        truckloadOnly: boolean;
    }>;
    update(id: string, dto: UpdateStockItemDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        projectId: string;
        warehouseId: string;
        sku: string | null;
        uom: string;
        minUnitPrice: import("@prisma/client/runtime/library").Decimal;
        defaultUnitPrice: import("@prisma/client/runtime/library").Decimal;
        minOrderQty: import("@prisma/client/runtime/library").Decimal;
        truckloadOnly: boolean;
    }>;
    bulkImport(file: any): Promise<{
        success: any[];
        errors: {
            row: number;
            error: string;
        }[];
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        projectId: string;
        warehouseId: string;
        sku: string | null;
        uom: string;
        minUnitPrice: import("@prisma/client/runtime/library").Decimal;
        defaultUnitPrice: import("@prisma/client/runtime/library").Decimal;
        minOrderQty: import("@prisma/client/runtime/library").Decimal;
        truckloadOnly: boolean;
    }>;
}

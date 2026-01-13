import { SparePartsService } from './spare-parts.service';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';
export declare class SparePartsController {
    private readonly sparePartsService;
    constructor(sparePartsService: SparePartsService);
    findAll(page?: number, limit?: number, search?: string, warehouseId?: string): Promise<{
        items: {
            isLowStock: boolean;
            _count: {
                partUsages: number;
            };
            warehouse: {
                id: string;
                name: string;
            };
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            warehouseId: string;
            sku: string;
            uom: string;
            quantityOnHand: import("@prisma/client/runtime/library").Decimal;
            minStockLevel: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            isCritical: boolean;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getLowStock(): Promise<({
        warehouse: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        sku: string;
        uom: string;
        quantityOnHand: import("@prisma/client/runtime/library").Decimal;
        minStockLevel: import("@prisma/client/runtime/library").Decimal;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        isCritical: boolean;
    })[]>;
    findOne(id: string): Promise<{
        isLowStock: boolean;
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
        partUsages: ({
            workOrder: {
                id: string;
                description: string;
                completedAt: Date | null;
            };
        } & {
            id: string;
            createdAt: Date;
            sparePartId: string;
            quantityUsed: import("@prisma/client/runtime/library").Decimal;
            workOrderId: string;
            costSnapshot: import("@prisma/client/runtime/library").Decimal;
        })[];
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        sku: string;
        uom: string;
        quantityOnHand: import("@prisma/client/runtime/library").Decimal;
        minStockLevel: import("@prisma/client/runtime/library").Decimal;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        isCritical: boolean;
    }>;
    create(dto: CreateSparePartDto): Promise<{
        warehouse: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        sku: string;
        uom: string;
        quantityOnHand: import("@prisma/client/runtime/library").Decimal;
        minStockLevel: import("@prisma/client/runtime/library").Decimal;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        isCritical: boolean;
    }>;
    update(id: string, dto: UpdateSparePartDto): Promise<{
        warehouse: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        sku: string;
        uom: string;
        quantityOnHand: import("@prisma/client/runtime/library").Decimal;
        minStockLevel: import("@prisma/client/runtime/library").Decimal;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        isCritical: boolean;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}

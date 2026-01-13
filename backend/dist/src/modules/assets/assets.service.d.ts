import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetStatus } from '@prisma/client';
export declare class AssetsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, limit?: number, search?: string, status?: AssetStatus): Promise<{
        items: ({
            _count: {
                workOrders: number;
                maintenanceSchedules: number;
            };
            project: {
                id: string;
                name: string;
            } | null;
            warehouse: {
                id: string;
                name: string;
            } | null;
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            category: string;
            assetTag: string;
            manufacturer: string | null;
            model: string | null;
            serialNumber: string | null;
            acquisitionDate: Date;
            acquisitionCost: import("@prisma/client/runtime/library").Decimal;
            currentValue: import("@prisma/client/runtime/library").Decimal;
            status: import(".prisma/client").$Enums.AssetStatus;
            location: string | null;
            projectId: string | null;
            warehouseId: string | null;
            assignedTo: string | null;
            criticality: import(".prisma/client").$Enums.AssetCriticality;
            expectedLifeYears: number | null;
            notes: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        workOrders: ({
            assignedTo: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.WorkOrderType;
            status: import(".prisma/client").$Enums.WorkOrderStatus;
            notes: string | null;
            assetId: string;
            scheduleId: string | null;
            priority: import(".prisma/client").$Enums.WorkOrderPriority;
            assignedToUserId: string | null;
            startedAt: Date | null;
            completedAt: Date | null;
            downtimeHours: import("@prisma/client/runtime/library").Decimal | null;
            laborCost: import("@prisma/client/runtime/library").Decimal;
            partsCost: import("@prisma/client/runtime/library").Decimal;
            totalCost: import("@prisma/client/runtime/library").Decimal;
        })[];
        project: {
            id: string;
            code: string | null;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            companyId: string;
            region: string | null;
        } | null;
        warehouse: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            projectId: string | null;
            companyId: string;
            locationCity: string | null;
        } | null;
        depreciationProfile: ({
            entries: {
                id: string;
                createdAt: Date;
                period: string;
                assetId: string;
                profileId: string;
                depreciationAmount: import("@prisma/client/runtime/library").Decimal;
                bookValueAfter: import("@prisma/client/runtime/library").Decimal;
                isPosted: boolean;
                postedAt: Date | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            assetId: string;
            method: import(".prisma/client").$Enums.DepreciationMethod;
            usefulLifeYears: number;
            salvageValue: import("@prisma/client/runtime/library").Decimal;
            startDate: Date;
        }) | null;
        maintenanceSchedules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.MaintenanceScheduleType;
            isActive: boolean;
            nextDueAt: Date | null;
            assetId: string;
            intervalDays: number | null;
            intervalHours: number | null;
            checklistJson: import("@prisma/client/runtime/library").JsonValue | null;
            estimatedDurationHours: import("@prisma/client/runtime/library").Decimal | null;
            requiredPartsJson: import("@prisma/client/runtime/library").JsonValue | null;
            lastPerformedAt: Date | null;
        }[];
        history: ({
            actor: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            eventType: import(".prisma/client").$Enums.AssetHistoryEventType;
            metadataJson: import("@prisma/client/runtime/library").JsonValue | null;
            actorUserId: string | null;
            assetId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        assetTag: string;
        manufacturer: string | null;
        model: string | null;
        serialNumber: string | null;
        acquisitionDate: Date;
        acquisitionCost: import("@prisma/client/runtime/library").Decimal;
        currentValue: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.AssetStatus;
        location: string | null;
        projectId: string | null;
        warehouseId: string | null;
        assignedTo: string | null;
        criticality: import(".prisma/client").$Enums.AssetCriticality;
        expectedLifeYears: number | null;
        notes: string | null;
    }>;
    create(dto: CreateAssetDto, actorUserId: string): Promise<{
        project: {
            id: string;
            name: string;
        } | null;
        warehouse: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        assetTag: string;
        manufacturer: string | null;
        model: string | null;
        serialNumber: string | null;
        acquisitionDate: Date;
        acquisitionCost: import("@prisma/client/runtime/library").Decimal;
        currentValue: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.AssetStatus;
        location: string | null;
        projectId: string | null;
        warehouseId: string | null;
        assignedTo: string | null;
        criticality: import(".prisma/client").$Enums.AssetCriticality;
        expectedLifeYears: number | null;
        notes: string | null;
    }>;
    update(id: string, dto: UpdateAssetDto, actorUserId: string): Promise<{
        project: {
            id: string;
            name: string;
        } | null;
        warehouse: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        assetTag: string;
        manufacturer: string | null;
        model: string | null;
        serialNumber: string | null;
        acquisitionDate: Date;
        acquisitionCost: import("@prisma/client/runtime/library").Decimal;
        currentValue: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.AssetStatus;
        location: string | null;
        projectId: string | null;
        warehouseId: string | null;
        assignedTo: string | null;
        criticality: import(".prisma/client").$Enums.AssetCriticality;
        expectedLifeYears: number | null;
        notes: string | null;
    }>;
    retire(id: string, actorUserId: string): Promise<{
        project: {
            id: string;
            name: string;
        } | null;
        warehouse: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        assetTag: string;
        manufacturer: string | null;
        model: string | null;
        serialNumber: string | null;
        acquisitionDate: Date;
        acquisitionCost: import("@prisma/client/runtime/library").Decimal;
        currentValue: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.AssetStatus;
        location: string | null;
        projectId: string | null;
        warehouseId: string | null;
        assignedTo: string | null;
        criticality: import(".prisma/client").$Enums.AssetCriticality;
        expectedLifeYears: number | null;
        notes: string | null;
    }>;
    getHistory(id: string, page?: number, limit?: number): Promise<{
        items: ({
            actor: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            eventType: import(".prisma/client").$Enums.AssetHistoryEventType;
            metadataJson: import("@prisma/client/runtime/library").JsonValue | null;
            actorUserId: string | null;
            assetId: string;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getOverview(): Promise<{
        totalAssets: number;
        operationalAssets: number;
        maintenanceAssets: number;
        brokenAssets: number;
        overdueMaintenance: number;
        openWorkOrders: number;
    }>;
}

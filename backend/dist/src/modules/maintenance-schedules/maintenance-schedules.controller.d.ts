import { MaintenanceSchedulesService } from './maintenance-schedules.service';
import { CreateMaintenanceScheduleDto } from './dto/create-maintenance-schedule.dto';
import { UpdateMaintenanceScheduleDto } from './dto/update-maintenance-schedule.dto';
export declare class MaintenanceSchedulesController {
    private readonly maintenanceSchedulesService;
    constructor(maintenanceSchedulesService: MaintenanceSchedulesService);
    findAll(page?: number, limit?: number, assetId?: string, isActive?: boolean): Promise<{
        items: ({
            _count: {
                workOrders: number;
            };
            asset: {
                id: string;
                name: string;
                assetTag: string;
                status: import(".prisma/client").$Enums.AssetStatus;
            };
        } & {
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
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getOverdue(): Promise<({
        asset: {
            id: string;
            name: string;
            assetTag: string;
            status: import(".prisma/client").$Enums.AssetStatus;
        };
    } & {
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
    })[]>;
    findOne(id: string): Promise<{
        workOrders: {
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
        }[];
        asset: {
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
        };
    } & {
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
    }>;
    create(dto: CreateMaintenanceScheduleDto): Promise<{
        asset: {
            id: string;
            name: string;
            assetTag: string;
        };
    } & {
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
    }>;
    update(id: string, dto: UpdateMaintenanceScheduleDto): Promise<{
        asset: {
            id: string;
            name: string;
            assetTag: string;
        };
    } & {
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
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}

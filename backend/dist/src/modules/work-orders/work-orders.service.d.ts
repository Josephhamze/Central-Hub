import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { CompleteWorkOrderDto } from './dto/complete-work-order.dto';
import { ConsumePartDto } from './dto/consume-part.dto';
import { WorkOrderStatus } from '@prisma/client';
export declare class WorkOrdersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, limit?: number, status?: WorkOrderStatus, assetId?: string): Promise<{
        items: ({
            _count: {
                partUsages: number;
            };
            asset: {
                id: string;
                name: string;
                assetTag: string;
                status: import(".prisma/client").$Enums.AssetStatus;
            };
            assignedTo: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            } | null;
            schedule: {
                id: string;
                type: import(".prisma/client").$Enums.MaintenanceScheduleType;
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
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
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
        assignedTo: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
        schedule: {
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
        } | null;
        partUsages: ({
            sparePart: {
                id: string;
                name: string;
                sku: string;
            };
        } & {
            id: string;
            createdAt: Date;
            sparePartId: string;
            quantityUsed: import("@prisma/client/runtime/library").Decimal;
            workOrderId: string;
            costSnapshot: import("@prisma/client/runtime/library").Decimal;
        })[];
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
    }>;
    create(dto: CreateWorkOrderDto, actorUserId: string): Promise<{
        asset: {
            id: string;
            name: string;
            assetTag: string;
        };
        assignedTo: {
            id: string;
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
    }>;
    update(id: string, dto: UpdateWorkOrderDto): Promise<{
        asset: {
            id: string;
            name: string;
            assetTag: string;
        };
        assignedTo: {
            id: string;
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
    }>;
    start(id: string, actorUserId: string): Promise<{
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
    }>;
    complete(id: string, dto: CompleteWorkOrderDto, actorUserId: string): Promise<{
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
    }>;
    consumePart(workOrderId: string, dto: ConsumePartDto, actorUserId: string): Promise<{
        id: string;
        createdAt: Date;
        sparePartId: string;
        quantityUsed: import("@prisma/client/runtime/library").Decimal;
        workOrderId: string;
        costSnapshot: import("@prisma/client/runtime/library").Decimal;
    }>;
    cancel(id: string, actorUserId: string): Promise<{
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
    }>;
}

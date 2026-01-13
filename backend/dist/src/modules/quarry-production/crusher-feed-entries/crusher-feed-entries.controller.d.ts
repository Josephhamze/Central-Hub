import { CrusherFeedEntriesService } from './crusher-feed-entries.service';
import { CreateCrusherFeedEntryDto } from './dto/create-crusher-feed-entry.dto';
import { UpdateCrusherFeedEntryDto } from './dto/update-crusher-feed-entry.dto';
import { ApproveEntryDto } from '../excavator-entries/dto/approve-entry.dto';
import { RejectEntryDto } from '../excavator-entries/dto/reject-entry.dto';
export declare class CrusherFeedEntriesController {
    private readonly crusherFeedEntriesService;
    constructor(crusherFeedEntriesService: CrusherFeedEntriesService);
    create(createDto: CreateCrusherFeedEntryDto, userId: string): Promise<{
        crusher: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.CrusherType;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            ratedCapacity: import("@prisma/client/runtime/library").Decimal;
        };
        materialType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            density: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shift: import(".prisma/client").$Enums.Shift;
        status: import(".prisma/client").$Enums.EntryStatus;
        notes: string | null;
        approvedAt: Date | null;
        crusherId: string;
        materialTypeId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        feedStartTime: Date;
        feedEndTime: Date;
        truckLoadsReceived: number;
        weighBridgeTonnage: import("@prisma/client/runtime/library").Decimal;
        rejectOversizeTonnage: import("@prisma/client/runtime/library").Decimal | null;
        feedRate: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    findAll(page?: number, limit?: number, dateFrom?: string, dateTo?: string, shift?: string, crusherId?: string, status?: string): Promise<{
        items: ({
            crusher: {
                id: string;
                name: string;
                type: import(".prisma/client").$Enums.CrusherType;
                ratedCapacity: import("@prisma/client/runtime/library").Decimal;
            };
            materialType: {
                id: string;
                name: string;
                density: import("@prisma/client/runtime/library").Decimal;
            };
            createdBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
            approver: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            shift: import(".prisma/client").$Enums.Shift;
            status: import(".prisma/client").$Enums.EntryStatus;
            notes: string | null;
            approvedAt: Date | null;
            crusherId: string;
            materialTypeId: string;
            date: Date;
            approverId: string | null;
            createdById: string;
            feedStartTime: Date;
            feedEndTime: Date;
            truckLoadsReceived: number;
            weighBridgeTonnage: import("@prisma/client/runtime/library").Decimal;
            rejectOversizeTonnage: import("@prisma/client/runtime/library").Decimal | null;
            feedRate: import("@prisma/client/runtime/library").Decimal | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        crusher: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.CrusherType;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            ratedCapacity: import("@prisma/client/runtime/library").Decimal;
        };
        materialType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            density: import("@prisma/client/runtime/library").Decimal;
        };
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        approver: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shift: import(".prisma/client").$Enums.Shift;
        status: import(".prisma/client").$Enums.EntryStatus;
        notes: string | null;
        approvedAt: Date | null;
        crusherId: string;
        materialTypeId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        feedStartTime: Date;
        feedEndTime: Date;
        truckLoadsReceived: number;
        weighBridgeTonnage: import("@prisma/client/runtime/library").Decimal;
        rejectOversizeTonnage: import("@prisma/client/runtime/library").Decimal | null;
        feedRate: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    update(id: string, updateDto: UpdateCrusherFeedEntryDto, userId: string): Promise<{
        crusher: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.CrusherType;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            ratedCapacity: import("@prisma/client/runtime/library").Decimal;
        };
        materialType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            density: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shift: import(".prisma/client").$Enums.Shift;
        status: import(".prisma/client").$Enums.EntryStatus;
        notes: string | null;
        approvedAt: Date | null;
        crusherId: string;
        materialTypeId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        feedStartTime: Date;
        feedEndTime: Date;
        truckLoadsReceived: number;
        weighBridgeTonnage: import("@prisma/client/runtime/library").Decimal;
        rejectOversizeTonnage: import("@prisma/client/runtime/library").Decimal | null;
        feedRate: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    approve(id: string, approveDto: ApproveEntryDto, approverId: string): Promise<{
        crusher: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.CrusherType;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            ratedCapacity: import("@prisma/client/runtime/library").Decimal;
        };
        materialType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            density: import("@prisma/client/runtime/library").Decimal;
        };
        approver: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shift: import(".prisma/client").$Enums.Shift;
        status: import(".prisma/client").$Enums.EntryStatus;
        notes: string | null;
        approvedAt: Date | null;
        crusherId: string;
        materialTypeId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        feedStartTime: Date;
        feedEndTime: Date;
        truckLoadsReceived: number;
        weighBridgeTonnage: import("@prisma/client/runtime/library").Decimal;
        rejectOversizeTonnage: import("@prisma/client/runtime/library").Decimal | null;
        feedRate: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    reject(id: string, rejectDto: RejectEntryDto, approverId: string): Promise<{
        crusher: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.CrusherType;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            ratedCapacity: import("@prisma/client/runtime/library").Decimal;
        };
        materialType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            density: import("@prisma/client/runtime/library").Decimal;
        };
        approver: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shift: import(".prisma/client").$Enums.Shift;
        status: import(".prisma/client").$Enums.EntryStatus;
        notes: string | null;
        approvedAt: Date | null;
        crusherId: string;
        materialTypeId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        feedStartTime: Date;
        feedEndTime: Date;
        truckLoadsReceived: number;
        weighBridgeTonnage: import("@prisma/client/runtime/library").Decimal;
        rejectOversizeTonnage: import("@prisma/client/runtime/library").Decimal | null;
        feedRate: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    remove(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shift: import(".prisma/client").$Enums.Shift;
        status: import(".prisma/client").$Enums.EntryStatus;
        notes: string | null;
        approvedAt: Date | null;
        crusherId: string;
        materialTypeId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        feedStartTime: Date;
        feedEndTime: Date;
        truckLoadsReceived: number;
        weighBridgeTonnage: import("@prisma/client/runtime/library").Decimal;
        rejectOversizeTonnage: import("@prisma/client/runtime/library").Decimal | null;
        feedRate: import("@prisma/client/runtime/library").Decimal | null;
    }>;
}

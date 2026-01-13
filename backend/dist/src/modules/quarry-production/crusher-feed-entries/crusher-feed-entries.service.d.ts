import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateCrusherFeedEntryDto } from './dto/create-crusher-feed-entry.dto';
import { UpdateCrusherFeedEntryDto } from './dto/update-crusher-feed-entry.dto';
import { EntryStatus, Shift } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
export declare class CrusherFeedEntriesService {
    private prisma;
    constructor(prisma: PrismaService);
    private calculateFeedRate;
    findAll(page?: number, limit?: number, dateFrom?: string, dateTo?: string, shift?: Shift, crusherId?: string, status?: EntryStatus): Promise<{
        items: ({
            crusher: {
                id: string;
                name: string;
                type: import(".prisma/client").$Enums.CrusherType;
                ratedCapacity: Decimal;
            };
            materialType: {
                id: string;
                name: string;
                density: Decimal;
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
            weighBridgeTonnage: Decimal;
            rejectOversizeTonnage: Decimal | null;
            feedRate: Decimal | null;
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
            ratedCapacity: Decimal;
        };
        materialType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            density: Decimal;
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
        weighBridgeTonnage: Decimal;
        rejectOversizeTonnage: Decimal | null;
        feedRate: Decimal | null;
    }>;
    create(dto: CreateCrusherFeedEntryDto, createdById: string): Promise<{
        crusher: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.CrusherType;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            ratedCapacity: Decimal;
        };
        materialType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            density: Decimal;
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
        weighBridgeTonnage: Decimal;
        rejectOversizeTonnage: Decimal | null;
        feedRate: Decimal | null;
    }>;
    update(id: string, dto: UpdateCrusherFeedEntryDto, userId: string): Promise<{
        crusher: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.CrusherType;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            ratedCapacity: Decimal;
        };
        materialType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            density: Decimal;
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
        weighBridgeTonnage: Decimal;
        rejectOversizeTonnage: Decimal | null;
        feedRate: Decimal | null;
    }>;
    approve(id: string, approverId: string, notes?: string): Promise<{
        crusher: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.CrusherType;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            ratedCapacity: Decimal;
        };
        materialType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            density: Decimal;
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
        weighBridgeTonnage: Decimal;
        rejectOversizeTonnage: Decimal | null;
        feedRate: Decimal | null;
    }>;
    reject(id: string, approverId: string, reason: string): Promise<{
        crusher: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.CrusherType;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            ratedCapacity: Decimal;
        };
        materialType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            density: Decimal;
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
        weighBridgeTonnage: Decimal;
        rejectOversizeTonnage: Decimal | null;
        feedRate: Decimal | null;
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
        weighBridgeTonnage: Decimal;
        rejectOversizeTonnage: Decimal | null;
        feedRate: Decimal | null;
    }>;
}

import { ExcavatorEntriesService } from './excavator-entries.service';
import { CreateExcavatorEntryDto } from './dto/create-excavator-entry.dto';
import { UpdateExcavatorEntryDto } from './dto/update-excavator-entry.dto';
import { ApproveEntryDto } from './dto/approve-entry.dto';
import { RejectEntryDto } from './dto/reject-entry.dto';
export declare class ExcavatorEntriesController {
    private readonly excavatorEntriesService;
    constructor(excavatorEntriesService: ExcavatorEntriesService);
    create(createDto: CreateExcavatorEntryDto, userId: string): Promise<{
        excavator: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            bucketCapacity: import("@prisma/client/runtime/library").Decimal;
        };
        pitLocation: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        };
        materialType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            density: import("@prisma/client/runtime/library").Decimal;
        };
        operator: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shift: import(".prisma/client").$Enums.Shift;
        status: import(".prisma/client").$Enums.EntryStatus;
        notes: string | null;
        downtimeHours: import("@prisma/client/runtime/library").Decimal | null;
        approvedAt: Date | null;
        excavatorId: string;
        pitLocationId: string;
        materialTypeId: string;
        date: Date;
        operatorId: string;
        bucketCount: number;
        estimatedVolume: import("@prisma/client/runtime/library").Decimal;
        estimatedTonnage: import("@prisma/client/runtime/library").Decimal;
        approverId: string | null;
        createdById: string;
    }>;
    findAll(page?: number, limit?: number, dateFrom?: string, dateTo?: string, shift?: string, excavatorId?: string, operatorId?: string, status?: string): Promise<{
        items: ({
            excavator: {
                id: string;
                name: string;
                bucketCapacity: import("@prisma/client/runtime/library").Decimal;
            };
            pitLocation: {
                id: string;
                name: string;
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
            operator: {
                id: string;
                email: string;
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
            downtimeHours: import("@prisma/client/runtime/library").Decimal | null;
            approvedAt: Date | null;
            excavatorId: string;
            pitLocationId: string;
            materialTypeId: string;
            date: Date;
            operatorId: string;
            bucketCount: number;
            estimatedVolume: import("@prisma/client/runtime/library").Decimal;
            estimatedTonnage: import("@prisma/client/runtime/library").Decimal;
            approverId: string | null;
            createdById: string;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        excavator: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            bucketCapacity: import("@prisma/client/runtime/library").Decimal;
        };
        pitLocation: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
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
        operator: {
            id: string;
            email: string;
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
        downtimeHours: import("@prisma/client/runtime/library").Decimal | null;
        approvedAt: Date | null;
        excavatorId: string;
        pitLocationId: string;
        materialTypeId: string;
        date: Date;
        operatorId: string;
        bucketCount: number;
        estimatedVolume: import("@prisma/client/runtime/library").Decimal;
        estimatedTonnage: import("@prisma/client/runtime/library").Decimal;
        approverId: string | null;
        createdById: string;
    }>;
    update(id: string, updateDto: UpdateExcavatorEntryDto, userId: string): Promise<{
        excavator: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            bucketCapacity: import("@prisma/client/runtime/library").Decimal;
        };
        pitLocation: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        };
        materialType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            density: import("@prisma/client/runtime/library").Decimal;
        };
        operator: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shift: import(".prisma/client").$Enums.Shift;
        status: import(".prisma/client").$Enums.EntryStatus;
        notes: string | null;
        downtimeHours: import("@prisma/client/runtime/library").Decimal | null;
        approvedAt: Date | null;
        excavatorId: string;
        pitLocationId: string;
        materialTypeId: string;
        date: Date;
        operatorId: string;
        bucketCount: number;
        estimatedVolume: import("@prisma/client/runtime/library").Decimal;
        estimatedTonnage: import("@prisma/client/runtime/library").Decimal;
        approverId: string | null;
        createdById: string;
    }>;
    approve(id: string, approveDto: ApproveEntryDto, approverId: string): Promise<{
        excavator: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            bucketCapacity: import("@prisma/client/runtime/library").Decimal;
        };
        pitLocation: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        };
        materialType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            density: import("@prisma/client/runtime/library").Decimal;
        };
        operator: {
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
        downtimeHours: import("@prisma/client/runtime/library").Decimal | null;
        approvedAt: Date | null;
        excavatorId: string;
        pitLocationId: string;
        materialTypeId: string;
        date: Date;
        operatorId: string;
        bucketCount: number;
        estimatedVolume: import("@prisma/client/runtime/library").Decimal;
        estimatedTonnage: import("@prisma/client/runtime/library").Decimal;
        approverId: string | null;
        createdById: string;
    }>;
    reject(id: string, rejectDto: RejectEntryDto, approverId: string): Promise<{
        excavator: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            bucketCapacity: import("@prisma/client/runtime/library").Decimal;
        };
        pitLocation: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        };
        materialType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            density: import("@prisma/client/runtime/library").Decimal;
        };
        operator: {
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
        downtimeHours: import("@prisma/client/runtime/library").Decimal | null;
        approvedAt: Date | null;
        excavatorId: string;
        pitLocationId: string;
        materialTypeId: string;
        date: Date;
        operatorId: string;
        bucketCount: number;
        estimatedVolume: import("@prisma/client/runtime/library").Decimal;
        estimatedTonnage: import("@prisma/client/runtime/library").Decimal;
        approverId: string | null;
        createdById: string;
    }>;
    remove(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shift: import(".prisma/client").$Enums.Shift;
        status: import(".prisma/client").$Enums.EntryStatus;
        notes: string | null;
        downtimeHours: import("@prisma/client/runtime/library").Decimal | null;
        approvedAt: Date | null;
        excavatorId: string;
        pitLocationId: string;
        materialTypeId: string;
        date: Date;
        operatorId: string;
        bucketCount: number;
        estimatedVolume: import("@prisma/client/runtime/library").Decimal;
        estimatedTonnage: import("@prisma/client/runtime/library").Decimal;
        approverId: string | null;
        createdById: string;
    }>;
}

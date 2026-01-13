import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateExcavatorEntryDto } from './dto/create-excavator-entry.dto';
import { UpdateExcavatorEntryDto } from './dto/update-excavator-entry.dto';
import { EntryStatus, Shift } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
export declare class ExcavatorEntriesService {
    private prisma;
    constructor(prisma: PrismaService);
    private calculateEstimates;
    findAll(page?: number, limit?: number, dateFrom?: string, dateTo?: string, shift?: Shift, excavatorId?: string, operatorId?: string, status?: EntryStatus): Promise<{
        items: ({
            excavator: {
                id: string;
                name: string;
                bucketCapacity: Decimal;
            };
            pitLocation: {
                id: string;
                name: string;
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
            downtimeHours: Decimal | null;
            approvedAt: Date | null;
            excavatorId: string;
            pitLocationId: string;
            materialTypeId: string;
            date: Date;
            operatorId: string;
            bucketCount: number;
            estimatedVolume: Decimal;
            estimatedTonnage: Decimal;
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
            bucketCapacity: Decimal;
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
            density: Decimal;
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
        downtimeHours: Decimal | null;
        approvedAt: Date | null;
        excavatorId: string;
        pitLocationId: string;
        materialTypeId: string;
        date: Date;
        operatorId: string;
        bucketCount: number;
        estimatedVolume: Decimal;
        estimatedTonnage: Decimal;
        approverId: string | null;
        createdById: string;
    }>;
    create(dto: CreateExcavatorEntryDto, createdById: string): Promise<{
        excavator: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            bucketCapacity: Decimal;
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
            density: Decimal;
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
        downtimeHours: Decimal | null;
        approvedAt: Date | null;
        excavatorId: string;
        pitLocationId: string;
        materialTypeId: string;
        date: Date;
        operatorId: string;
        bucketCount: number;
        estimatedVolume: Decimal;
        estimatedTonnage: Decimal;
        approverId: string | null;
        createdById: string;
    }>;
    update(id: string, dto: UpdateExcavatorEntryDto, userId: string): Promise<{
        excavator: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            bucketCapacity: Decimal;
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
            density: Decimal;
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
        downtimeHours: Decimal | null;
        approvedAt: Date | null;
        excavatorId: string;
        pitLocationId: string;
        materialTypeId: string;
        date: Date;
        operatorId: string;
        bucketCount: number;
        estimatedVolume: Decimal;
        estimatedTonnage: Decimal;
        approverId: string | null;
        createdById: string;
    }>;
    approve(id: string, approverId: string, notes?: string): Promise<{
        excavator: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            bucketCapacity: Decimal;
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
            density: Decimal;
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
        downtimeHours: Decimal | null;
        approvedAt: Date | null;
        excavatorId: string;
        pitLocationId: string;
        materialTypeId: string;
        date: Date;
        operatorId: string;
        bucketCount: number;
        estimatedVolume: Decimal;
        estimatedTonnage: Decimal;
        approverId: string | null;
        createdById: string;
    }>;
    reject(id: string, approverId: string, reason: string): Promise<{
        excavator: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            bucketCapacity: Decimal;
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
            density: Decimal;
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
        downtimeHours: Decimal | null;
        approvedAt: Date | null;
        excavatorId: string;
        pitLocationId: string;
        materialTypeId: string;
        date: Date;
        operatorId: string;
        bucketCount: number;
        estimatedVolume: Decimal;
        estimatedTonnage: Decimal;
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
        downtimeHours: Decimal | null;
        approvedAt: Date | null;
        excavatorId: string;
        pitLocationId: string;
        materialTypeId: string;
        date: Date;
        operatorId: string;
        bucketCount: number;
        estimatedVolume: Decimal;
        estimatedTonnage: Decimal;
        approverId: string | null;
        createdById: string;
    }>;
}

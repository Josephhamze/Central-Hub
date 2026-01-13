import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateHaulingEntryDto } from './dto/create-hauling-entry.dto';
import { UpdateHaulingEntryDto } from './dto/update-hauling-entry.dto';
import { EntryStatus, Shift } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
export declare class HaulingEntriesService {
    private prisma;
    constructor(prisma: PrismaService);
    private calculateTotalHauled;
    findAll(page?: number, limit?: number, dateFrom?: string, dateTo?: string, shift?: Shift, truckId?: string, driverId?: string, status?: EntryStatus): Promise<{
        items: ({
            truck: {
                id: string;
                name: string;
                loadCapacity: Decimal;
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
            driver: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            sourceExcavatorEntry: {
                id: string;
                shift: import(".prisma/client").$Enums.Shift;
                date: Date;
                estimatedTonnage: Decimal;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            shift: import(".prisma/client").$Enums.Shift;
            status: import(".prisma/client").$Enums.EntryStatus;
            notes: string | null;
            approvedAt: Date | null;
            truckId: string;
            date: Date;
            approverId: string | null;
            createdById: string;
            driverId: string;
            excavatorEntryId: string | null;
            tripCount: number;
            avgCycleTime: Decimal | null;
            fuelConsumption: Decimal | null;
            totalHauled: Decimal;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        truck: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            loadCapacity: Decimal;
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
        driver: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        sourceExcavatorEntry: {
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
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shift: import(".prisma/client").$Enums.Shift;
        status: import(".prisma/client").$Enums.EntryStatus;
        notes: string | null;
        approvedAt: Date | null;
        truckId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        driverId: string;
        excavatorEntryId: string | null;
        tripCount: number;
        avgCycleTime: Decimal | null;
        fuelConsumption: Decimal | null;
        totalHauled: Decimal;
    }>;
    create(dto: CreateHaulingEntryDto, createdById: string): Promise<{
        truck: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            loadCapacity: Decimal;
        };
        driver: {
            id: string;
            firstName: string;
            lastName: string;
        };
        sourceExcavatorEntry: {
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
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shift: import(".prisma/client").$Enums.Shift;
        status: import(".prisma/client").$Enums.EntryStatus;
        notes: string | null;
        approvedAt: Date | null;
        truckId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        driverId: string;
        excavatorEntryId: string | null;
        tripCount: number;
        avgCycleTime: Decimal | null;
        fuelConsumption: Decimal | null;
        totalHauled: Decimal;
    }>;
    update(id: string, dto: UpdateHaulingEntryDto, userId: string): Promise<{
        truck: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            loadCapacity: Decimal;
        };
        driver: {
            id: string;
            firstName: string;
            lastName: string;
        };
        sourceExcavatorEntry: {
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
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shift: import(".prisma/client").$Enums.Shift;
        status: import(".prisma/client").$Enums.EntryStatus;
        notes: string | null;
        approvedAt: Date | null;
        truckId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        driverId: string;
        excavatorEntryId: string | null;
        tripCount: number;
        avgCycleTime: Decimal | null;
        fuelConsumption: Decimal | null;
        totalHauled: Decimal;
    }>;
    approve(id: string, approverId: string, notes?: string): Promise<{
        truck: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            loadCapacity: Decimal;
        };
        approver: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        driver: {
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
        approvedAt: Date | null;
        truckId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        driverId: string;
        excavatorEntryId: string | null;
        tripCount: number;
        avgCycleTime: Decimal | null;
        fuelConsumption: Decimal | null;
        totalHauled: Decimal;
    }>;
    reject(id: string, approverId: string, reason: string): Promise<{
        truck: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            loadCapacity: Decimal;
        };
        approver: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        driver: {
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
        approvedAt: Date | null;
        truckId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        driverId: string;
        excavatorEntryId: string | null;
        tripCount: number;
        avgCycleTime: Decimal | null;
        fuelConsumption: Decimal | null;
        totalHauled: Decimal;
    }>;
    remove(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shift: import(".prisma/client").$Enums.Shift;
        status: import(".prisma/client").$Enums.EntryStatus;
        notes: string | null;
        approvedAt: Date | null;
        truckId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        driverId: string;
        excavatorEntryId: string | null;
        tripCount: number;
        avgCycleTime: Decimal | null;
        fuelConsumption: Decimal | null;
        totalHauled: Decimal;
    }>;
}

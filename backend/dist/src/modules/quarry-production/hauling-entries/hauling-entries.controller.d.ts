import { HaulingEntriesService } from './hauling-entries.service';
import { CreateHaulingEntryDto } from './dto/create-hauling-entry.dto';
import { UpdateHaulingEntryDto } from './dto/update-hauling-entry.dto';
import { ApproveEntryDto } from '../excavator-entries/dto/approve-entry.dto';
import { RejectEntryDto } from '../excavator-entries/dto/reject-entry.dto';
export declare class HaulingEntriesController {
    private readonly haulingEntriesService;
    constructor(haulingEntriesService: HaulingEntriesService);
    create(createDto: CreateHaulingEntryDto, userId: string): Promise<{
        truck: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            loadCapacity: import("@prisma/client/runtime/library").Decimal;
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
        avgCycleTime: import("@prisma/client/runtime/library").Decimal | null;
        fuelConsumption: import("@prisma/client/runtime/library").Decimal | null;
        totalHauled: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAll(page?: number, limit?: number, dateFrom?: string, dateTo?: string, shift?: string, truckId?: string, driverId?: string, status?: string): Promise<{
        items: ({
            truck: {
                id: string;
                name: string;
                loadCapacity: import("@prisma/client/runtime/library").Decimal;
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
                estimatedTonnage: import("@prisma/client/runtime/library").Decimal;
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
            avgCycleTime: import("@prisma/client/runtime/library").Decimal | null;
            fuelConsumption: import("@prisma/client/runtime/library").Decimal | null;
            totalHauled: import("@prisma/client/runtime/library").Decimal;
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
            loadCapacity: import("@prisma/client/runtime/library").Decimal;
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
        avgCycleTime: import("@prisma/client/runtime/library").Decimal | null;
        fuelConsumption: import("@prisma/client/runtime/library").Decimal | null;
        totalHauled: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, updateDto: UpdateHaulingEntryDto, userId: string): Promise<{
        truck: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            loadCapacity: import("@prisma/client/runtime/library").Decimal;
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
        avgCycleTime: import("@prisma/client/runtime/library").Decimal | null;
        fuelConsumption: import("@prisma/client/runtime/library").Decimal | null;
        totalHauled: import("@prisma/client/runtime/library").Decimal;
    }>;
    approve(id: string, approveDto: ApproveEntryDto, approverId: string): Promise<{
        truck: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            loadCapacity: import("@prisma/client/runtime/library").Decimal;
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
        avgCycleTime: import("@prisma/client/runtime/library").Decimal | null;
        fuelConsumption: import("@prisma/client/runtime/library").Decimal | null;
        totalHauled: import("@prisma/client/runtime/library").Decimal;
    }>;
    reject(id: string, rejectDto: RejectEntryDto, approverId: string): Promise<{
        truck: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            loadCapacity: import("@prisma/client/runtime/library").Decimal;
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
        avgCycleTime: import("@prisma/client/runtime/library").Decimal | null;
        fuelConsumption: import("@prisma/client/runtime/library").Decimal | null;
        totalHauled: import("@prisma/client/runtime/library").Decimal;
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
        avgCycleTime: import("@prisma/client/runtime/library").Decimal | null;
        fuelConsumption: import("@prisma/client/runtime/library").Decimal | null;
        totalHauled: import("@prisma/client/runtime/library").Decimal;
    }>;
}

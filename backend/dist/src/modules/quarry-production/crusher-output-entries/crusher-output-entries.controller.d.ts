import { CrusherOutputEntriesService } from './crusher-output-entries.service';
import { CreateCrusherOutputEntryDto } from './dto/create-crusher-output-entry.dto';
import { UpdateCrusherOutputEntryDto } from './dto/update-crusher-output-entry.dto';
import { ApproveEntryDto } from '../excavator-entries/dto/approve-entry.dto';
import { RejectEntryDto } from '../excavator-entries/dto/reject-entry.dto';
export declare class CrusherOutputEntriesController {
    private readonly crusherOutputEntriesService;
    constructor(crusherOutputEntriesService: CrusherOutputEntriesService);
    create(createDto: CreateCrusherOutputEntryDto, userId: string): Promise<{
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
        productType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        };
        stockpileLocation: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
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
        productTypeId: string;
        stockpileLocationId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        outputTonnage: import("@prisma/client/runtime/library").Decimal;
        qualityGrade: import(".prisma/client").$Enums.QualityGrade;
        moisturePercentage: import("@prisma/client/runtime/library").Decimal | null;
        yieldPercentage: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    findAll(page?: number, limit?: number, dateFrom?: string, dateTo?: string, shift?: string, crusherId?: string, productTypeId?: string, status?: string): Promise<{
        items: ({
            crusher: {
                id: string;
                name: string;
                type: import(".prisma/client").$Enums.CrusherType;
            };
            productType: {
                id: string;
                name: string;
            };
            stockpileLocation: {
                id: string;
                name: string;
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
            productTypeId: string;
            stockpileLocationId: string;
            date: Date;
            approverId: string | null;
            createdById: string;
            outputTonnage: import("@prisma/client/runtime/library").Decimal;
            qualityGrade: import(".prisma/client").$Enums.QualityGrade;
            moisturePercentage: import("@prisma/client/runtime/library").Decimal | null;
            yieldPercentage: import("@prisma/client/runtime/library").Decimal | null;
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
        productType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        };
        stockpileLocation: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
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
        productTypeId: string;
        stockpileLocationId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        outputTonnage: import("@prisma/client/runtime/library").Decimal;
        qualityGrade: import(".prisma/client").$Enums.QualityGrade;
        moisturePercentage: import("@prisma/client/runtime/library").Decimal | null;
        yieldPercentage: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    update(id: string, updateDto: UpdateCrusherOutputEntryDto, userId: string): Promise<{
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
        productType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        };
        stockpileLocation: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
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
        productTypeId: string;
        stockpileLocationId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        outputTonnage: import("@prisma/client/runtime/library").Decimal;
        qualityGrade: import(".prisma/client").$Enums.QualityGrade;
        moisturePercentage: import("@prisma/client/runtime/library").Decimal | null;
        yieldPercentage: import("@prisma/client/runtime/library").Decimal | null;
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
        productType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        };
        stockpileLocation: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
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
        productTypeId: string;
        stockpileLocationId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        outputTonnage: import("@prisma/client/runtime/library").Decimal;
        qualityGrade: import(".prisma/client").$Enums.QualityGrade;
        moisturePercentage: import("@prisma/client/runtime/library").Decimal | null;
        yieldPercentage: import("@prisma/client/runtime/library").Decimal | null;
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
        productType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        };
        stockpileLocation: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
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
        productTypeId: string;
        stockpileLocationId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        outputTonnage: import("@prisma/client/runtime/library").Decimal;
        qualityGrade: import(".prisma/client").$Enums.QualityGrade;
        moisturePercentage: import("@prisma/client/runtime/library").Decimal | null;
        yieldPercentage: import("@prisma/client/runtime/library").Decimal | null;
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
        productTypeId: string;
        stockpileLocationId: string;
        date: Date;
        approverId: string | null;
        createdById: string;
        outputTonnage: import("@prisma/client/runtime/library").Decimal;
        qualityGrade: import(".prisma/client").$Enums.QualityGrade;
        moisturePercentage: import("@prisma/client/runtime/library").Decimal | null;
        yieldPercentage: import("@prisma/client/runtime/library").Decimal | null;
    }>;
}

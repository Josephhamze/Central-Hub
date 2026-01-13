import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateCrusherOutputEntryDto } from './dto/create-crusher-output-entry.dto';
import { UpdateCrusherOutputEntryDto } from './dto/update-crusher-output-entry.dto';
import { EntryStatus, Shift } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
export declare class CrusherOutputEntriesService {
    private prisma;
    constructor(prisma: PrismaService);
    private calculateYieldPercentage;
    findAll(page?: number, limit?: number, dateFrom?: string, dateTo?: string, shift?: Shift, crusherId?: string, productTypeId?: string, status?: EntryStatus): Promise<{
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
            outputTonnage: Decimal;
            qualityGrade: import(".prisma/client").$Enums.QualityGrade;
            moisturePercentage: Decimal | null;
            yieldPercentage: Decimal | null;
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
        outputTonnage: Decimal;
        qualityGrade: import(".prisma/client").$Enums.QualityGrade;
        moisturePercentage: Decimal | null;
        yieldPercentage: Decimal | null;
    }>;
    create(dto: CreateCrusherOutputEntryDto, createdById: string): Promise<{
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
        outputTonnage: Decimal;
        qualityGrade: import(".prisma/client").$Enums.QualityGrade;
        moisturePercentage: Decimal | null;
        yieldPercentage: Decimal | null;
    }>;
    update(id: string, dto: UpdateCrusherOutputEntryDto, userId: string): Promise<{
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
        outputTonnage: Decimal;
        qualityGrade: import(".prisma/client").$Enums.QualityGrade;
        moisturePercentage: Decimal | null;
        yieldPercentage: Decimal | null;
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
        outputTonnage: Decimal;
        qualityGrade: import(".prisma/client").$Enums.QualityGrade;
        moisturePercentage: Decimal | null;
        yieldPercentage: Decimal | null;
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
        outputTonnage: Decimal;
        qualityGrade: import(".prisma/client").$Enums.QualityGrade;
        moisturePercentage: Decimal | null;
        yieldPercentage: Decimal | null;
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
        outputTonnage: Decimal;
        qualityGrade: import(".prisma/client").$Enums.QualityGrade;
        moisturePercentage: Decimal | null;
        yieldPercentage: Decimal | null;
    }>;
}

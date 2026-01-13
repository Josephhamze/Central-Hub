import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateCrusherDto } from './dto/create-crusher.dto';
import { UpdateCrusherDto } from './dto/update-crusher.dto';
import { EquipmentStatus } from '@prisma/client';
export declare class CrushersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, limit?: number, search?: string, status?: EquipmentStatus): Promise<{
        items: ({
            _count: {
                feedEntries: number;
                outputEntries: number;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.CrusherType;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            ratedCapacity: import("@prisma/client/runtime/library").Decimal;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        _count: {
            feedEntries: number;
            outputEntries: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.CrusherType;
        status: import(".prisma/client").$Enums.EquipmentStatus;
        notes: string | null;
        ratedCapacity: import("@prisma/client/runtime/library").Decimal;
    }>;
    create(dto: CreateCrusherDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.CrusherType;
        status: import(".prisma/client").$Enums.EquipmentStatus;
        notes: string | null;
        ratedCapacity: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, dto: UpdateCrusherDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.CrusherType;
        status: import(".prisma/client").$Enums.EquipmentStatus;
        notes: string | null;
        ratedCapacity: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.CrusherType;
        status: import(".prisma/client").$Enums.EquipmentStatus;
        notes: string | null;
        ratedCapacity: import("@prisma/client/runtime/library").Decimal;
    }>;
}

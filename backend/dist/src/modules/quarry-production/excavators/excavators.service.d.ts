import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateExcavatorDto } from './dto/create-excavator.dto';
import { UpdateExcavatorDto } from './dto/update-excavator.dto';
import { EquipmentStatus } from '@prisma/client';
export declare class ExcavatorsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, limit?: number, search?: string, status?: EquipmentStatus): Promise<{
        items: ({
            _count: {
                entries: number;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EquipmentStatus;
            notes: string | null;
            bucketCapacity: import("@prisma/client/runtime/library").Decimal;
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
            entries: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EquipmentStatus;
        notes: string | null;
        bucketCapacity: import("@prisma/client/runtime/library").Decimal;
    }>;
    create(dto: CreateExcavatorDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EquipmentStatus;
        notes: string | null;
        bucketCapacity: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, dto: UpdateExcavatorDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EquipmentStatus;
        notes: string | null;
        bucketCapacity: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EquipmentStatus;
        notes: string | null;
        bucketCapacity: import("@prisma/client/runtime/library").Decimal;
    }>;
}

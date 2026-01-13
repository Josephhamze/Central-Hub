import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { EquipmentStatus } from '@prisma/client';
export declare class TrucksService {
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
            loadCapacity: import("@prisma/client/runtime/library").Decimal;
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
        loadCapacity: import("@prisma/client/runtime/library").Decimal;
    }>;
    create(dto: CreateTruckDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EquipmentStatus;
        notes: string | null;
        loadCapacity: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, dto: UpdateTruckDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EquipmentStatus;
        notes: string | null;
        loadCapacity: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EquipmentStatus;
        notes: string | null;
        loadCapacity: import("@prisma/client/runtime/library").Decimal;
    }>;
}

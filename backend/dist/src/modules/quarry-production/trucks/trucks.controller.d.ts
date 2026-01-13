import { TrucksService } from './trucks.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
export declare class TrucksController {
    private readonly trucksService;
    constructor(trucksService: TrucksService);
    create(createTruckDto: CreateTruckDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EquipmentStatus;
        notes: string | null;
        loadCapacity: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAll(page?: number, limit?: number, search?: string, status?: string): Promise<{
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
    update(id: string, updateTruckDto: UpdateTruckDto): Promise<{
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

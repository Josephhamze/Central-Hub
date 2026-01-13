import { CrushersService } from './crushers.service';
import { CreateCrusherDto } from './dto/create-crusher.dto';
import { UpdateCrusherDto } from './dto/update-crusher.dto';
export declare class CrushersController {
    private readonly crushersService;
    constructor(crushersService: CrushersService);
    create(createCrusherDto: CreateCrusherDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.CrusherType;
        status: import(".prisma/client").$Enums.EquipmentStatus;
        notes: string | null;
        ratedCapacity: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAll(page?: number, limit?: number, search?: string, status?: string): Promise<{
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
    update(id: string, updateCrusherDto: UpdateCrusherDto): Promise<{
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

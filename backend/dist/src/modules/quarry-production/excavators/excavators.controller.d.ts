import { ExcavatorsService } from './excavators.service';
import { CreateExcavatorDto } from './dto/create-excavator.dto';
import { UpdateExcavatorDto } from './dto/update-excavator.dto';
export declare class ExcavatorsController {
    private readonly excavatorsService;
    constructor(excavatorsService: ExcavatorsService);
    create(createExcavatorDto: CreateExcavatorDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EquipmentStatus;
        notes: string | null;
        bucketCapacity: import("@prisma/client/runtime/library").Decimal;
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
    update(id: string, updateExcavatorDto: UpdateExcavatorDto): Promise<{
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

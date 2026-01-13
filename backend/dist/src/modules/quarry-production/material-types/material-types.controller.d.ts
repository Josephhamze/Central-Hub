import { MaterialTypesService } from './material-types.service';
import { CreateMaterialTypeDto } from './dto/create-material-type.dto';
import { UpdateMaterialTypeDto } from './dto/update-material-type.dto';
export declare class MaterialTypesController {
    private readonly materialTypesService;
    constructor(materialTypesService: MaterialTypesService);
    create(createMaterialTypeDto: CreateMaterialTypeDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        density: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAll(page?: number, limit?: number, search?: string, isActive?: string): Promise<{
        items: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            density: import("@prisma/client/runtime/library").Decimal;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        density: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, updateMaterialTypeDto: UpdateMaterialTypeDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        density: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        density: import("@prisma/client/runtime/library").Decimal;
    }>;
}

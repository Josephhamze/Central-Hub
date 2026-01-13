import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    findAll(companyId?: string, page?: number, limit?: number): Promise<{
        items: ({
            company: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            code: string | null;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            companyId: string;
            region: string | null;
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
            quotes: number;
        };
        company: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            legalName: string | null;
            nif: string | null;
            rccm: string | null;
            idNational: string | null;
            vat: string | null;
            addressLine1: string | null;
            addressLine2: string | null;
            city: string | null;
            state: string | null;
            country: string | null;
            logoUrl: string | null;
        };
        warehouses: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            projectId: string | null;
            companyId: string;
            locationCity: string | null;
        }[];
        stockItems: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            projectId: string;
            warehouseId: string;
            sku: string | null;
            uom: string;
            minUnitPrice: import("@prisma/client/runtime/library").Decimal;
            defaultUnitPrice: import("@prisma/client/runtime/library").Decimal;
            minOrderQty: import("@prisma/client/runtime/library").Decimal;
            truckloadOnly: boolean;
        }[];
    } & {
        id: string;
        code: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: string;
        region: string | null;
    }>;
    create(dto: CreateProjectDto): Promise<{
        id: string;
        code: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: string;
        region: string | null;
    }>;
    update(id: string, dto: UpdateProjectDto): Promise<{
        id: string;
        code: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: string;
        region: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        code: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: string;
        region: string | null;
    }>;
}

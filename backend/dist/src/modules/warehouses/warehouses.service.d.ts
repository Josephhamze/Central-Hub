import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
export declare class WarehousesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(companyId?: string, projectId?: string, page?: number, limit?: number): Promise<{
        items: ({
            company: {
                id: string;
                name: string;
            };
            project: {
                id: string;
                name: string;
            } | null;
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            projectId: string | null;
            companyId: string;
            locationCity: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
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
        project: {
            id: string;
            code: string | null;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            companyId: string;
            region: string | null;
        } | null;
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
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        projectId: string | null;
        companyId: string;
        locationCity: string | null;
    }>;
    create(dto: CreateWarehouseDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        projectId: string | null;
        companyId: string;
        locationCity: string | null;
    }>;
    update(id: string, dto: UpdateWarehouseDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        projectId: string | null;
        companyId: string;
        locationCity: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        projectId: string | null;
        companyId: string;
        locationCity: string | null;
    }>;
}

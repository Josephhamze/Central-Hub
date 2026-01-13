import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
export declare class CompaniesController {
    private readonly companiesService;
    constructor(companiesService: CompaniesService);
    findAll(page?: number, limit?: number, search?: string): Promise<{
        items: {
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
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    uploadLogo(file: Express.Multer.File): Promise<{
        logoUrl: string;
    }>;
    findOne(id: string): Promise<{
        _count: {
            quotes: number;
        };
        warehouses: {
            id: string;
            name: string;
            locationCity: string | null;
        }[];
        projects: {
            id: string;
            code: string | null;
            name: string;
        }[];
    } & {
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
    }>;
    create(dto: CreateCompanyDto): Promise<{
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
    }>;
    update(id: string, dto: UpdateCompanyDto): Promise<{
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
    }>;
    remove(id: string): Promise<{
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
    }>;
}

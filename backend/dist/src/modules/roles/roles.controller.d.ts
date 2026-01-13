import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAll(): Promise<{
        id: string;
        name: string;
        description: string | null;
        isSystem: boolean;
        userCount: number;
        permissions: {
            id: string;
            code: string;
            name: string;
            description: string | null;
            module: string;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getAllPermissions(): Promise<{
        permissions: {
            id: string;
            code: string;
            name: string;
            description: string | null;
            module: string;
            createdAt: Date;
        }[];
        byModule: Record<string, {
            id: string;
            code: string;
            name: string;
            description: string | null;
            module: string;
            createdAt: Date;
        }[]>;
    }>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        isSystem: boolean;
        userCount: number;
        permissions: {
            id: string;
            code: string;
            name: string;
            description: string | null;
            module: string;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateRoleDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        isSystem: boolean;
        permissions: {
            id: string;
            code: string;
            name: string;
            description: string | null;
            module: string;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateRoleDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        isSystem: boolean;
        permissions: {
            id: string;
            code: string;
            name: string;
            description: string | null;
            module: string;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}

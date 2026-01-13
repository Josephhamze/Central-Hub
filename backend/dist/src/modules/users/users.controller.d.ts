import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(page?: number, limit?: number): Promise<{
        items: {
            roles: {
                id: string;
                name: string;
            }[];
            id: string;
            createdAt: Date;
            email: string;
            firstName: string;
            lastName: string;
            accountStatus: import(".prisma/client").$Enums.AccountStatus;
            emailVerified: boolean;
            lastLoginAt: Date | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        themePreference: import(".prisma/client").$Enums.ThemePreference;
        roles: string[];
        permissions: string[];
    }>;
    updateProfile(userId: string, dto: UpdateUserDto): Promise<{
        id: string;
        updatedAt: Date;
        email: string;
        firstName: string;
        lastName: string;
        themePreference: import(".prisma/client").$Enums.ThemePreference;
    }>;
    updateTheme(userId: string, dto: UpdateThemeDto): Promise<{
        id: string;
        themePreference: import(".prisma/client").$Enums.ThemePreference;
    }>;
    findOne(id: string): Promise<{
        roles: any[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        firstName: string;
        lastName: string;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
        emailVerified: boolean;
        lastLoginAt: Date | null;
        themePreference: import(".prisma/client").$Enums.ThemePreference;
    }>;
    deactivate(id: string, currentUserId: string): Promise<{
        message: string;
    }>;
    activate(id: string): Promise<{
        message: string;
    }>;
    create(dto: CreateUserDto): Promise<{
        roles: any[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        firstName: string;
        lastName: string;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
        emailVerified: boolean;
        lastLoginAt: Date | null;
        themePreference: import(".prisma/client").$Enums.ThemePreference;
    }>;
    assignRoles(id: string, dto: AssignRolesDto): Promise<{
        roles: any[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        firstName: string;
        lastName: string;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
        emailVerified: boolean;
        lastLoginAt: Date | null;
        themePreference: import(".prisma/client").$Enums.ThemePreference;
    }>;
    assignAdminByEmail(email: string): Promise<{
        message: string;
    }>;
}

import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
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
    deactivate(id: string, currentUserId: string): Promise<{
        message: string;
    }>;
    activate(id: string): Promise<{
        message: string;
    }>;
    assignRoles(userId: string, roleIds: string[]): Promise<{
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
    assignAdminByEmail(email: string): Promise<{
        message: string;
    }>;
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    accountStatus: true,
                    emailVerified: true,
                    lastLoginAt: true,
                    createdAt: true,
                    roles: {
                        select: {
                            role: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count(),
        ]);
        return {
            items: users.map((user) => ({
                ...user,
                roles: user.roles.map((ur) => ur.role),
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                accountStatus: true,
                emailVerified: true,
                themePreference: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                roles: {
                    select: {
                        role: {
                            select: {
                                id: true,
                                name: true,
                                permissions: {
                                    select: {
                                        permission: {
                                            select: {
                                                code: true,
                                                name: true,
                                                module: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            ...user,
            roles: user.roles.map((ur) => ({
                ...ur.role,
                permissions: ur.role.permissions.map((rp) => rp.permission),
            })),
        };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                accountStatus: true,
                emailVerified: true,
                themePreference: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                roles: {
                    select: {
                        role: {
                            select: {
                                id: true,
                                name: true,
                                permissions: {
                                    select: {
                                        permission: {
                                            select: {
                                                code: true,
                                                name: true,
                                                module: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const roles = user.roles.map((ur) => ur.role.name);
        const permissions = new Set();
        user.roles.forEach((ur) => {
            ur.role.permissions.forEach((rp) => {
                permissions.add(rp.permission.code);
            });
        });
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            themePreference: user.themePreference,
            roles: Array.from(roles),
            permissions: Array.from(permissions),
        };
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (dto.email && dto.email !== user.email) {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (existingUser) {
                throw new common_1.BadRequestException('Email already in use');
            }
        }
        const updateData = {};
        if (dto.firstName)
            updateData.firstName = dto.firstName;
        if (dto.lastName)
            updateData.lastName = dto.lastName;
        if (dto.email)
            updateData.email = dto.email;
        if (dto.currentPassword && dto.newPassword) {
            const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
            if (!isPasswordValid) {
                throw new common_1.BadRequestException('Current password is incorrect');
            }
            updateData.passwordHash = await bcrypt.hash(dto.newPassword, 12);
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                themePreference: true,
                updatedAt: true,
            },
        });
        return updated;
    }
    async updateTheme(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                themePreference: dto.theme,
            },
            select: {
                id: true,
                themePreference: true,
            },
        });
        return updated;
    }
    async deactivate(id, currentUserId) {
        if (id === currentUserId) {
            throw new common_1.BadRequestException('Cannot deactivate your own account');
        }
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.prisma.user.update({
            where: { id },
            data: { accountStatus: 'DISABLED', deactivatedAt: new Date(), deactivatedBy: currentUserId },
        });
        return { message: 'User deactivated successfully' };
    }
    async activate(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.prisma.user.update({
            where: { id },
            data: { accountStatus: 'ACTIVE', deactivatedAt: null, deactivatedBy: null },
        });
        return { message: 'User activated successfully' };
    }
    async assignRoles(userId, roleIds) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const roles = await this.prisma.role.findMany({
            where: { id: { in: roleIds } },
        });
        if (roles.length !== roleIds.length) {
            throw new common_1.BadRequestException('One or more roles not found');
        }
        await this.prisma.$transaction([
            this.prisma.userRole.deleteMany({
                where: { userId },
            }),
            this.prisma.userRole.createMany({
                data: roleIds.map((roleId) => ({
                    userId,
                    roleId,
                })),
            }),
        ]);
        return this.findOne(userId);
    }
    async create(dto) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(dto.email)) {
            throw new common_1.BadRequestException('Invalid email format');
        }
        if (dto.password.length < 8) {
            throw new common_1.BadRequestException('Password must be at least 8 characters long');
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('Email already in use');
        }
        if (dto.roleIds && dto.roleIds.length > 0) {
            const validRoles = await this.prisma.role.findMany({
                where: { id: { in: dto.roleIds } },
            });
            if (validRoles.length !== dto.roleIds.length) {
                throw new common_1.BadRequestException('One or more role IDs are invalid');
            }
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.trim().toLowerCase(),
                passwordHash,
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                roles: dto.roleIds && dto.roleIds.length > 0
                    ? {
                        create: dto.roleIds.map((roleId) => ({ roleId })),
                    }
                    : undefined,
            },
        });
        return this.findOne(user.id);
    }
    async assignAdminByEmail(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const adminRole = await this.prisma.role.findFirst({
            where: {
                name: {
                    in: ['Administrator', 'Admin'],
                },
            },
        });
        if (!adminRole) {
            throw new common_1.NotFoundException('Administrator role not found');
        }
        const existingRole = await this.prisma.userRole.findFirst({
            where: {
                userId: user.id,
                roleId: adminRole.id,
            },
        });
        if (existingRole) {
            return { message: 'User already has Administrator role' };
        }
        await this.prisma.userRole.create({
            data: {
                userId: user.id,
                roleId: adminRole.id,
            },
        });
        return { message: 'Administrator role assigned successfully' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map
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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let RolesService = class RolesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const roles = await this.prisma.role.findMany({
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                _count: {
                    select: { users: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        return roles.map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description,
            isSystem: role.isSystem,
            userCount: role._count.users,
            permissions: role.permissions.map((rp) => rp.permission),
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
        }));
    }
    async findOne(id) {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                _count: {
                    select: { users: true },
                },
            },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        return {
            id: role.id,
            name: role.name,
            description: role.description,
            isSystem: role.isSystem,
            userCount: role._count.users,
            permissions: role.permissions.map((rp) => rp.permission),
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
        };
    }
    async create(dto) {
        const existingRole = await this.prisma.role.findUnique({
            where: { name: dto.name },
        });
        if (existingRole) {
            throw new common_1.BadRequestException('Role with this name already exists');
        }
        if (dto.permissionIds?.length) {
            const permissions = await this.prisma.permission.findMany({
                where: { id: { in: dto.permissionIds } },
            });
            if (permissions.length !== dto.permissionIds.length) {
                throw new common_1.BadRequestException('One or more permissions not found');
            }
        }
        const role = await this.prisma.role.create({
            data: {
                name: dto.name,
                description: dto.description,
                permissions: dto.permissionIds?.length
                    ? {
                        create: dto.permissionIds.map((permissionId) => ({
                            permissionId,
                        })),
                    }
                    : undefined,
            },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });
        return {
            id: role.id,
            name: role.name,
            description: role.description,
            isSystem: role.isSystem,
            permissions: role.permissions.map((rp) => rp.permission),
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
        };
    }
    async update(id, dto) {
        const role = await this.prisma.role.findUnique({
            where: { id },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        if (role.isSystem && dto.name && dto.name !== role.name) {
            throw new common_1.BadRequestException('Cannot rename system roles');
        }
        if (dto.name) {
            const existingRole = await this.prisma.role.findUnique({
                where: { name: dto.name },
            });
            if (existingRole && existingRole.id !== id) {
                throw new common_1.BadRequestException('Role with this name already exists');
            }
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            await tx.role.update({
                where: { id },
                data: {
                    name: dto.name,
                    description: dto.description,
                },
            });
            if (dto.permissionIds !== undefined) {
                await tx.rolePermission.deleteMany({
                    where: { roleId: id },
                });
                if (dto.permissionIds.length > 0) {
                    await tx.rolePermission.createMany({
                        data: dto.permissionIds.map((permissionId) => ({
                            roleId: id,
                            permissionId,
                        })),
                    });
                }
            }
            return tx.role.findUnique({
                where: { id },
                include: {
                    permissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
            });
        });
        return {
            id: updated.id,
            name: updated.name,
            description: updated.description,
            isSystem: updated.isSystem,
            permissions: updated.permissions.map((rp) => rp.permission),
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
        };
    }
    async remove(id) {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { users: true },
                },
            },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        if (role.isSystem) {
            throw new common_1.BadRequestException('Cannot delete system roles');
        }
        if (role._count.users > 0) {
            throw new common_1.BadRequestException('Cannot delete role with assigned users. Remove users first.');
        }
        await this.prisma.role.delete({
            where: { id },
        });
        return { message: 'Role deleted successfully' };
    }
    async getAllPermissions() {
        const permissions = await this.prisma.permission.findMany({
            orderBy: [{ module: 'asc' }, { name: 'asc' }],
        });
        const grouped = permissions.reduce((acc, perm) => {
            if (!acc[perm.module]) {
                acc[perm.module] = [];
            }
            acc[perm.module].push(perm);
            return acc;
        }, {});
        return {
            permissions,
            byModule: grouped,
        };
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map
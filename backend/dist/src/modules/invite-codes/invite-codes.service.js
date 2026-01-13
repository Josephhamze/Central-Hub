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
exports.InviteCodesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const crypto_1 = require("crypto");
let InviteCodesService = class InviteCodesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    generateCode() {
        return (0, crypto_1.randomBytes)(4).toString('hex').toUpperCase();
    }
    async create(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                roles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isAdmin = user.roles.some((ur) => ur.role.name === 'Administrator' || ur.role.name === 'Admin');
        if (!isAdmin) {
            throw new common_1.ForbiddenException('Only administrators can create invite codes');
        }
        let code;
        let attempts = 0;
        do {
            code = this.generateCode();
            const existing = await this.prisma.inviteCode.findUnique({
                where: { code },
            });
            if (!existing)
                break;
            attempts++;
            if (attempts > 10) {
                throw new common_1.BadRequestException('Failed to generate unique invite code');
            }
        } while (true);
        const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
        const maxUses = dto.maxUses || 1;
        const inviteCode = await this.prisma.inviteCode.create({
            data: {
                code,
                createdBy: userId,
                maxUses,
                expiresAt,
            },
        });
        return inviteCode;
    }
    async validate(code) {
        const inviteCode = await this.prisma.inviteCode.findUnique({
            where: { code },
        });
        if (!inviteCode) {
            return { valid: false, message: 'Invalid invite code' };
        }
        if (!inviteCode.isActive) {
            return { valid: false, message: 'This invite code has been deactivated' };
        }
        if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
            return { valid: false, message: 'This invite code has expired' };
        }
        if (inviteCode.useCount >= inviteCode.maxUses) {
            return { valid: false, message: 'This invite code has reached its usage limit' };
        }
        return { valid: true };
    }
    async markAsUsed(code, userId) {
        const inviteCode = await this.prisma.inviteCode.findUnique({
            where: { code },
        });
        if (!inviteCode) {
            throw new common_1.NotFoundException('Invite code not found');
        }
        const validation = await this.validate(code);
        if (!validation.valid) {
            throw new common_1.BadRequestException(validation.message);
        }
        await this.prisma.inviteCode.update({
            where: { id: inviteCode.id },
            data: {
                usedBy: userId,
                usedAt: new Date(),
                useCount: inviteCode.useCount + 1,
                isActive: inviteCode.useCount + 1 >= inviteCode.maxUses ? false : inviteCode.isActive,
            },
        });
    }
    async findAll(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                roles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isAdmin = user.roles.some((ur) => ur.role.name === 'Administrator' || ur.role.name === 'Admin');
        if (!isAdmin) {
            throw new common_1.ForbiddenException('Only administrators can view invite codes');
        }
        return this.prisma.inviteCode.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                creator: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }
    async deactivate(userId, codeId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                roles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isAdmin = user.roles.some((ur) => ur.role.name === 'Administrator' || ur.role.name === 'Admin');
        if (!isAdmin) {
            throw new common_1.ForbiddenException('Only administrators can deactivate invite codes');
        }
        const inviteCode = await this.prisma.inviteCode.findUnique({
            where: { id: codeId },
        });
        if (!inviteCode) {
            throw new common_1.NotFoundException('Invite code not found');
        }
        return this.prisma.inviteCode.update({
            where: { id: codeId },
            data: { isActive: false },
        });
    }
};
exports.InviteCodesService = InviteCodesService;
exports.InviteCodesService = InviteCodesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InviteCodesService);
//# sourceMappingURL=invite-codes.service.js.map
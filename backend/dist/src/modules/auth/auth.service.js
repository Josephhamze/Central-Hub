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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const invite_codes_service_1 = require("../invite-codes/invite-codes.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    inviteCodesService;
    constructor(prisma, jwtService, configService, inviteCodesService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.inviteCodesService = inviteCodesService;
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: {
                roles: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.accountStatus !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('Account is disabled');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        return this.generateTokens(user.id, user.email);
    }
    async register(dto) {
        const validation = await this.inviteCodesService.validate(dto.inviteCode);
        if (!validation.valid) {
            throw new common_1.BadRequestException(validation.message || 'Invalid invite code');
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('Email already registered');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const viewerRole = await this.prisma.role.findUnique({
            where: { name: 'Viewer' },
        });
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                roles: viewerRole
                    ? {
                        create: {
                            roleId: viewerRole.id,
                        },
                    }
                    : undefined,
            },
        });
        await this.inviteCodesService.markAsUsed(dto.inviteCode, user.id);
        return this.generateTokens(user.id, user.email);
    }
    async refreshTokens(dto) {
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: dto.refreshToken },
            include: { user: true },
        });
        if (!storedToken) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (storedToken.revokedAt) {
            throw new common_1.UnauthorizedException('Refresh token has been revoked');
        }
        if (storedToken.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token has expired');
        }
        if (storedToken.user.accountStatus !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('Account is disabled');
        }
        await this.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });
        return this.generateTokens(storedToken.user.id, storedToken.user.email);
    }
    async logout(userId, refreshToken) {
        if (refreshToken) {
            await this.prisma.refreshToken.updateMany({
                where: {
                    userId,
                    token: refreshToken,
                    revokedAt: null,
                },
                data: { revokedAt: new Date() },
            });
        }
        else {
            await this.prisma.refreshToken.updateMany({
                where: {
                    userId,
                    revokedAt: null,
                },
                data: { revokedAt: new Date() },
            });
        }
    }
    async generateTokens(userId, email) {
        const accessTokenPayload = {
            sub: userId,
            email,
            type: 'access',
        };
        const refreshTokenPayload = {
            sub: userId,
            email,
            type: 'refresh',
        };
        const accessToken = this.jwtService.sign(accessTokenPayload);
        const refreshExpiration = this.configService.get('JWT_REFRESH_EXPIRATION', '7d');
        const refreshToken = this.jwtService.sign(refreshTokenPayload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: refreshExpiration,
        });
        const expiresAt = new Date();
        const match = refreshExpiration.match(/(\d+)([dhms])/);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            switch (unit) {
                case 'd':
                    expiresAt.setDate(expiresAt.getDate() + value);
                    break;
                case 'h':
                    expiresAt.setHours(expiresAt.getHours() + value);
                    break;
                case 'm':
                    expiresAt.setMinutes(expiresAt.getMinutes() + value);
                    break;
                case 's':
                    expiresAt.setSeconds(expiresAt.getSeconds() + value);
                    break;
            }
        }
        await this.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId,
                expiresAt,
            },
        });
        const accessExpiration = this.configService.get('JWT_EXPIRATION', '15m');
        let expiresIn = 900;
        const accessMatch = accessExpiration.match(/(\d+)([dhms])/);
        if (accessMatch) {
            const value = parseInt(accessMatch[1]);
            const unit = accessMatch[2];
            switch (unit) {
                case 'd':
                    expiresIn = value * 24 * 60 * 60;
                    break;
                case 'h':
                    expiresIn = value * 60 * 60;
                    break;
                case 'm':
                    expiresIn = value * 60;
                    break;
                case 's':
                    expiresIn = value;
                    break;
            }
        }
        return {
            accessToken,
            refreshToken,
            expiresIn,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        invite_codes_service_1.InviteCodesService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
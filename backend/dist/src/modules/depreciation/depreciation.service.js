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
exports.DepreciationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
let DepreciationService = class DepreciationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(page = 1, limit = 20) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const [items, total] = await Promise.all([
            this.prisma.depreciationProfile.findMany({
                skip,
                take: limitNum,
                include: {
                    asset: {
                        select: { id: true, assetTag: true, name: true, acquisitionCost: true, currentValue: true },
                    },
                    entries: {
                        orderBy: { period: 'desc' },
                        take: 1,
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.depreciationProfile.count(),
        ]);
        return {
            items,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }
    async findOne(assetId) {
        const profile = await this.prisma.depreciationProfile.findUnique({
            where: { assetId },
            include: {
                asset: true,
                entries: {
                    orderBy: { period: 'desc' },
                },
            },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Depreciation profile not found');
        }
        return profile;
    }
    async createProfile(dto) {
        const existing = await this.prisma.depreciationProfile.findUnique({
            where: { assetId: dto.assetId },
        });
        if (existing) {
            throw new common_1.BadRequestException('Depreciation profile already exists for this asset');
        }
        const asset = await this.prisma.asset.findUnique({
            where: { id: dto.assetId },
        });
        if (!asset) {
            throw new common_1.BadRequestException('Asset not found');
        }
        const profile = await this.prisma.depreciationProfile.create({
            data: {
                assetId: dto.assetId,
                method: dto.method,
                usefulLifeYears: dto.usefulLifeYears,
                salvageValue: dto.salvageValue,
                startDate: new Date(dto.startDate),
            },
            include: {
                asset: {
                    select: { id: true, assetTag: true, name: true },
                },
            },
        });
        return profile;
    }
    async runMonthly(dto, actorUserId) {
        const profiles = await this.prisma.depreciationProfile.findMany({
            include: {
                asset: true,
                entries: {
                    where: { period: dto.period },
                },
            },
        });
        const results = [];
        for (const profile of profiles) {
            if (profile.entries.length > 0) {
                continue;
            }
            const acquisitionCost = Number(profile.asset.acquisitionCost);
            const salvageValue = Number(profile.salvageValue);
            const usefulLifeYears = profile.usefulLifeYears;
            const startDate = new Date(profile.startDate);
            const lastEntry = await this.prisma.depreciationEntry.findFirst({
                where: {
                    assetId: profile.assetId,
                    isPosted: true,
                },
                orderBy: { period: 'desc' },
            });
            const currentBookValue = lastEntry
                ? Number(lastEntry.bookValueAfter)
                : acquisitionCost;
            let depreciationAmount = 0;
            let bookValueAfter = currentBookValue;
            if (currentBookValue > salvageValue) {
                if (profile.method === client_1.DepreciationMethod.STRAIGHT_LINE) {
                    const annualDepreciation = (acquisitionCost - salvageValue) / usefulLifeYears;
                    depreciationAmount = annualDepreciation / 12;
                    bookValueAfter = currentBookValue - depreciationAmount;
                }
                else if (profile.method === client_1.DepreciationMethod.DECLINING_BALANCE) {
                    const annualRate = 2 / usefulLifeYears;
                    depreciationAmount = currentBookValue * (annualRate / 12);
                    bookValueAfter = currentBookValue - depreciationAmount;
                }
                if (bookValueAfter < salvageValue) {
                    depreciationAmount = currentBookValue - salvageValue;
                    bookValueAfter = salvageValue;
                }
            }
            if (depreciationAmount > 0) {
                const entry = await this.prisma.depreciationEntry.create({
                    data: {
                        assetId: profile.assetId,
                        profileId: profile.id,
                        period: dto.period,
                        depreciationAmount,
                        bookValueAfter,
                        isPosted: false,
                    },
                });
                results.push({
                    assetId: profile.assetId,
                    assetTag: profile.asset.assetTag,
                    depreciationAmount,
                    bookValueAfter,
                });
            }
        }
        return {
            period: dto.period,
            entriesCreated: results.length,
            entries: results,
        };
    }
    async postEntry(assetId, period, actorUserId) {
        const entry = await this.prisma.depreciationEntry.findUnique({
            where: {
                assetId_period: {
                    assetId,
                    period,
                },
            },
        });
        if (!entry) {
            throw new common_1.NotFoundException('Depreciation entry not found');
        }
        if (entry.isPosted) {
            throw new common_1.BadRequestException('Entry is already posted');
        }
        const posted = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.depreciationEntry.update({
                where: {
                    assetId_period: {
                        assetId,
                        period,
                    },
                },
                data: {
                    isPosted: true,
                    postedAt: new Date(),
                },
            });
            await tx.asset.update({
                where: { id: assetId },
                data: {
                    currentValue: updated.bookValueAfter,
                },
            });
            await tx.assetHistory.create({
                data: {
                    assetId,
                    eventType: 'COST_UPDATED',
                    actorUserId,
                    metadataJson: {
                        period,
                        depreciationAmount: updated.depreciationAmount,
                        newBookValue: updated.bookValueAfter,
                    },
                },
            });
            return updated;
        });
        return posted;
    }
    async postAllForPeriod(period, actorUserId) {
        const entries = await this.prisma.depreciationEntry.findMany({
            where: {
                period,
                isPosted: false,
            },
        });
        const results = [];
        for (const entry of entries) {
            try {
                const posted = await this.postEntry(entry.assetId, period, actorUserId);
                results.push({
                    assetId: entry.assetId,
                    success: true,
                    depreciationAmount: posted.depreciationAmount,
                });
            }
            catch (error) {
                results.push({
                    assetId: entry.assetId,
                    success: false,
                    error: error.message,
                });
            }
        }
        return {
            period,
            total: entries.length,
            posted: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            results,
        };
    }
};
exports.DepreciationService = DepreciationService;
exports.DepreciationService = DepreciationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepreciationService);
//# sourceMappingURL=depreciation.service.js.map
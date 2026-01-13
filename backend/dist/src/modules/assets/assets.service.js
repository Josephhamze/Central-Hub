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
exports.AssetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
let AssetsService = class AssetsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(page = 1, limit = 20, search, status) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (search) {
            where.OR = [
                { assetTag: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
                { manufacturer: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status) {
            where.status = status;
        }
        const [items, total] = await Promise.all([
            this.prisma.asset.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    project: { select: { id: true, name: true } },
                    warehouse: { select: { id: true, name: true } },
                    _count: {
                        select: {
                            workOrders: true,
                            maintenanceSchedules: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.asset.count({ where }),
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
    async findOne(id) {
        const asset = await this.prisma.asset.findUnique({
            where: { id },
            include: {
                project: true,
                warehouse: true,
                maintenanceSchedules: {
                    where: { isActive: true },
                    orderBy: { nextDueAt: 'asc' },
                },
                workOrders: {
                    where: { status: { not: 'COMPLETED' } },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    include: {
                        assignedTo: {
                            select: { id: true, firstName: true, lastName: true, email: true },
                        },
                    },
                },
                history: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    include: {
                        actor: {
                            select: { id: true, firstName: true, lastName: true },
                        },
                    },
                },
                depreciationProfile: {
                    include: {
                        entries: {
                            orderBy: { period: 'desc' },
                            take: 12,
                        },
                    },
                },
            },
        });
        if (!asset) {
            throw new common_1.NotFoundException('Asset not found');
        }
        return asset;
    }
    async create(dto, actorUserId) {
        const existing = await this.prisma.asset.findUnique({
            where: { assetTag: dto.assetTag },
        });
        if (existing) {
            throw new common_1.BadRequestException('Asset tag already exists');
        }
        if (dto.projectId) {
            const project = await this.prisma.project.findUnique({
                where: { id: dto.projectId },
            });
            if (!project) {
                throw new common_1.BadRequestException('Project not found');
            }
        }
        if (dto.warehouseId) {
            const warehouse = await this.prisma.warehouse.findUnique({
                where: { id: dto.warehouseId },
            });
            if (!warehouse) {
                throw new common_1.BadRequestException('Warehouse not found');
            }
        }
        const asset = await this.prisma.asset.create({
            data: {
                assetTag: dto.assetTag,
                name: dto.name,
                category: dto.category,
                manufacturer: dto.manufacturer,
                model: dto.model,
                serialNumber: dto.serialNumber,
                acquisitionDate: new Date(dto.acquisitionDate),
                acquisitionCost: dto.acquisitionCost,
                currentValue: dto.currentValue,
                status: dto.status || client_1.AssetStatus.OPERATIONAL,
                location: dto.location,
                projectId: dto.projectId,
                warehouseId: dto.warehouseId,
                assignedTo: dto.assignedTo,
                criticality: dto.criticality || 'MEDIUM',
                expectedLifeYears: dto.expectedLifeYears,
                notes: dto.notes,
                history: {
                    create: {
                        eventType: 'CREATED',
                        actorUserId,
                        metadataJson: {
                            assetTag: dto.assetTag,
                            name: dto.name,
                            category: dto.category,
                        },
                    },
                },
            },
            include: {
                project: { select: { id: true, name: true } },
                warehouse: { select: { id: true, name: true } },
            },
        });
        return asset;
    }
    async update(id, dto, actorUserId) {
        const asset = await this.prisma.asset.findUnique({
            where: { id },
        });
        if (!asset) {
            throw new common_1.NotFoundException('Asset not found');
        }
        if (asset.status === client_1.AssetStatus.RETIRED) {
            throw new common_1.BadRequestException('Cannot update retired assets');
        }
        if (dto.assetTag && dto.assetTag !== asset.assetTag) {
            const existing = await this.prisma.asset.findUnique({
                where: { assetTag: dto.assetTag },
            });
            if (existing) {
                throw new common_1.BadRequestException('Asset tag already exists');
            }
        }
        const oldStatus = asset.status;
        const updateData = {};
        if (dto.assetTag)
            updateData.assetTag = dto.assetTag;
        if (dto.name)
            updateData.name = dto.name;
        if (dto.category)
            updateData.category = dto.category;
        if (dto.manufacturer !== undefined)
            updateData.manufacturer = dto.manufacturer;
        if (dto.model !== undefined)
            updateData.model = dto.model;
        if (dto.serialNumber !== undefined)
            updateData.serialNumber = dto.serialNumber;
        if (dto.acquisitionDate)
            updateData.acquisitionDate = new Date(dto.acquisitionDate);
        if (dto.acquisitionCost !== undefined)
            updateData.acquisitionCost = dto.acquisitionCost;
        if (dto.currentValue !== undefined)
            updateData.currentValue = dto.currentValue;
        if (dto.status)
            updateData.status = dto.status;
        if (dto.location !== undefined)
            updateData.location = dto.location;
        if (dto.projectId !== undefined)
            updateData.projectId = dto.projectId;
        if (dto.warehouseId !== undefined)
            updateData.warehouseId = dto.warehouseId;
        if (dto.assignedTo !== undefined)
            updateData.assignedTo = dto.assignedTo;
        if (dto.criticality)
            updateData.criticality = dto.criticality;
        if (dto.expectedLifeYears !== undefined)
            updateData.expectedLifeYears = dto.expectedLifeYears;
        if (dto.notes !== undefined)
            updateData.notes = dto.notes;
        const updated = await this.prisma.$transaction(async (tx) => {
            const asset = await tx.asset.update({
                where: { id },
                data: updateData,
                include: {
                    project: { select: { id: true, name: true } },
                    warehouse: { select: { id: true, name: true } },
                },
            });
            if (dto.status && dto.status !== oldStatus) {
                await tx.assetHistory.create({
                    data: {
                        assetId: id,
                        eventType: 'STATUS_CHANGED',
                        actorUserId,
                        metadataJson: {
                            oldStatus,
                            newStatus: dto.status,
                        },
                    },
                });
            }
            return asset;
        });
        return updated;
    }
    async retire(id, actorUserId) {
        const asset = await this.prisma.asset.findUnique({
            where: { id },
            include: {
                workOrders: {
                    where: {
                        status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_PARTS'] },
                    },
                },
            },
        });
        if (!asset) {
            throw new common_1.NotFoundException('Asset not found');
        }
        if (asset.status === client_1.AssetStatus.RETIRED) {
            throw new common_1.BadRequestException('Asset is already retired');
        }
        if (asset.workOrders.length > 0) {
            throw new common_1.BadRequestException('Cannot retire asset with open work orders');
        }
        const retired = await this.prisma.$transaction(async (tx) => {
            const asset = await tx.asset.update({
                where: { id },
                data: { status: client_1.AssetStatus.RETIRED },
                include: {
                    project: { select: { id: true, name: true } },
                    warehouse: { select: { id: true, name: true } },
                },
            });
            await tx.assetHistory.create({
                data: {
                    assetId: id,
                    eventType: 'RETIRED',
                    actorUserId,
                    metadataJson: {
                        retiredAt: new Date().toISOString(),
                    },
                },
            });
            return asset;
        });
        return retired;
    }
    async getHistory(id, page = 1, limit = 50) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 50);
        const skip = (pageNum - 1) * limitNum;
        const asset = await this.prisma.asset.findUnique({
            where: { id },
        });
        if (!asset) {
            throw new common_1.NotFoundException('Asset not found');
        }
        const [items, total] = await Promise.all([
            this.prisma.assetHistory.findMany({
                where: { assetId: id },
                skip,
                take: limitNum,
                include: {
                    actor: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.assetHistory.count({ where: { assetId: id } }),
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
    async getOverview() {
        try {
            const [totalAssets, operationalAssets, maintenanceAssets, brokenAssets, overdueMaintenance, openWorkOrders,] = await Promise.all([
                this.prisma.asset.count().catch(() => 0),
                this.prisma.asset.count({ where: { status: 'OPERATIONAL' } }).catch(() => 0),
                this.prisma.asset.count({ where: { status: 'MAINTENANCE' } }).catch(() => 0),
                this.prisma.asset.count({ where: { status: 'BROKEN' } }).catch(() => 0),
                this.prisma.maintenanceSchedule.count({
                    where: {
                        isActive: true,
                        nextDueAt: {
                            lte: new Date(),
                            not: null,
                        },
                    },
                }).catch(() => 0),
                this.prisma.workOrder.count({
                    where: {
                        status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_PARTS'] },
                    },
                }).catch(() => 0),
            ]);
            return {
                totalAssets,
                operationalAssets,
                maintenanceAssets,
                brokenAssets,
                overdueMaintenance,
                openWorkOrders,
            };
        }
        catch (error) {
            console.error('Error in getOverview:', error);
            return {
                totalAssets: 0,
                operationalAssets: 0,
                maintenanceAssets: 0,
                brokenAssets: 0,
                overdueMaintenance: 0,
                openWorkOrders: 0,
            };
        }
    }
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AssetsService);
//# sourceMappingURL=assets.service.js.map
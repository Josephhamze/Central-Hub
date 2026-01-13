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
exports.TollStationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let TollStationsService = class TollStationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(page = 1, limit = 20, filters) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (filters?.isActive !== undefined)
            where.isActive = filters.isActive;
        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { cityOrArea: { contains: filters.search, mode: 'insensitive' } },
                { code: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.tollStation.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    rates: { where: { isActive: true }, orderBy: { vehicleType: 'asc' } },
                    _count: { select: { routeStations: true, payments: true } },
                },
                orderBy: { name: 'asc' },
            }),
            this.prisma.tollStation.count({ where }),
        ]);
        return { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
    }
    async findOne(id) {
        const station = await this.prisma.tollStation.findUnique({
            where: { id },
            include: {
                rates: { orderBy: [{ vehicleType: 'asc' }, { effectiveFrom: 'desc' }] },
                _count: { select: { routeStations: true, payments: true } },
            },
        });
        if (!station)
            throw new common_1.NotFoundException('Toll station not found');
        return station;
    }
    async create(dto) {
        if (dto.code) {
            const existing = await this.prisma.tollStation.findUnique({ where: { code: dto.code } });
            if (existing)
                throw new common_1.BadRequestException('Toll station code already exists');
        }
        return this.prisma.tollStation.create({
            data: {
                ...dto,
                isActive: dto.isActive !== undefined ? dto.isActive : true,
            },
        });
    }
    async update(id, dto) {
        const station = await this.prisma.tollStation.findUnique({ where: { id } });
        if (!station)
            throw new common_1.NotFoundException('Toll station not found');
        if (dto.code && dto.code !== station.code) {
            const existing = await this.prisma.tollStation.findUnique({ where: { code: dto.code } });
            if (existing)
                throw new common_1.BadRequestException('Toll station code already exists');
        }
        return this.prisma.tollStation.update({ where: { id }, data: dto });
    }
    async remove(id) {
        const station = await this.prisma.tollStation.findUnique({
            where: { id },
            include: { _count: { select: { routeStations: true, payments: true } } },
        });
        if (!station)
            throw new common_1.NotFoundException('Toll station not found');
        if (station._count.routeStations > 0 || station._count.payments > 0) {
            throw new common_1.BadRequestException('Cannot delete toll station with associated routes or payments');
        }
        return this.prisma.tollStation.delete({ where: { id } });
    }
    async createRate(tollStationId, dto) {
        const station = await this.prisma.tollStation.findUnique({ where: { id: tollStationId } });
        if (!station)
            throw new common_1.NotFoundException('Toll station not found');
        if (dto.effectiveFrom || dto.effectiveTo) {
            const overlapping = await this.prisma.tollRate.findFirst({
                where: {
                    tollStationId,
                    vehicleType: dto.vehicleType,
                    isActive: true,
                    OR: [
                        {
                            AND: [
                                { effectiveFrom: { lte: dto.effectiveTo ? new Date(dto.effectiveTo) : new Date('2099-12-31') } },
                                { effectiveTo: { gte: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date('1970-01-01') } },
                            ],
                        },
                        {
                            AND: [
                                { effectiveFrom: null },
                                { effectiveTo: null },
                            ],
                        },
                    ],
                },
            });
            if (overlapping) {
                throw new common_1.BadRequestException('Overlapping effective date range for this vehicle type');
            }
        }
        return this.prisma.tollRate.create({
            data: {
                ...dto,
                tollStationId,
                currency: dto.currency || 'USD',
                isActive: dto.isActive !== undefined ? dto.isActive : true,
                effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
                effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
            },
        });
    }
    async updateRate(tollStationId, rateId, dto) {
        const rate = await this.prisma.tollRate.findUnique({
            where: { id: rateId },
        });
        if (!rate || rate.tollStationId !== tollStationId) {
            throw new common_1.NotFoundException('Toll rate not found');
        }
        return this.prisma.tollRate.update({
            where: { id: rateId },
            data: {
                ...dto,
                effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
                effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
            },
        });
    }
    async removeRate(tollStationId, rateId) {
        const rate = await this.prisma.tollRate.findUnique({
            where: { id: rateId },
        });
        if (!rate || rate.tollStationId !== tollStationId) {
            throw new common_1.NotFoundException('Toll rate not found');
        }
        return this.prisma.tollRate.delete({ where: { id: rateId } });
    }
    async getRates(tollStationId, vehicleType) {
        const station = await this.prisma.tollStation.findUnique({ where: { id: tollStationId } });
        if (!station)
            throw new common_1.NotFoundException('Toll station not found');
        const where = { tollStationId };
        if (vehicleType)
            where.vehicleType = vehicleType;
        return this.prisma.tollRate.findMany({
            where,
            orderBy: [{ vehicleType: 'asc' }, { effectiveFrom: 'desc' }],
        });
    }
    async bulkImport(file) {
        if (!file || !file.buffer) {
            throw new common_1.BadRequestException('Invalid file: file buffer is missing');
        }
        let XLSX;
        try {
            XLSX = require('xlsx');
        }
        catch (error) {
            throw new common_1.BadRequestException('xlsx package is not installed. Please install it: pnpm add xlsx');
        }
        let workbook;
        try {
            workbook = XLSX.read(file.buffer, { type: 'buffer' });
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to read Excel file: ${error.message}`);
        }
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (data.length < 2) {
            throw new common_1.BadRequestException('Excel file must contain at least a header row and one data row');
        }
        const headers = data[0];
        const expectedHeaders = ['Name', 'City/Area', 'Code', 'Is Active', 'FLATBED Rate', 'TIPPER Rate', 'Currency', 'Effective From', 'Effective To'];
        const normalizedHeaders = headers.map(h => h?.toString().trim());
        const headerMap = {};
        expectedHeaders.forEach((expected) => {
            const foundIdx = normalizedHeaders.findIndex(h => h?.toLowerCase() === expected.toLowerCase());
            if (foundIdx !== -1) {
                headerMap[expected] = foundIdx;
            }
        });
        if (headerMap['Name'] === undefined) {
            throw new common_1.BadRequestException('Missing required column: Name');
        }
        const results = {
            success: [],
            errors: [],
        };
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.every(cell => !cell || cell.toString().trim() === ''))
                continue;
            try {
                const name = row[headerMap['Name']]?.toString().trim();
                const cityOrArea = row[headerMap['City/Area']]?.toString().trim() || undefined;
                const code = row[headerMap['Code']]?.toString().trim() || undefined;
                const isActiveStr = row[headerMap['Is Active']]?.toString().trim().toLowerCase() || 'yes';
                const flatbedRateStr = row[headerMap['FLATBED Rate']]?.toString().trim() || undefined;
                const tipperRateStr = row[headerMap['TIPPER Rate']]?.toString().trim() || undefined;
                const currency = row[headerMap['Currency']]?.toString().trim() || 'USD';
                const effectiveFromStr = row[headerMap['Effective From']]?.toString().trim() || undefined;
                const effectiveToStr = row[headerMap['Effective To']]?.toString().trim() || undefined;
                if (!name)
                    throw new Error('Name is required');
                const isActive = isActiveStr === 'yes' || isActiveStr === 'true' || isActiveStr === '1';
                if (code) {
                    const existing = await this.prisma.tollStation.findUnique({ where: { code } });
                    if (existing) {
                        throw new Error(`Toll station code "${code}" already exists`);
                    }
                }
                const flatbedRate = flatbedRateStr ? parseFloat(flatbedRateStr.replace(/[^0-9.]/g, '')) : undefined;
                const tipperRate = tipperRateStr ? parseFloat(tipperRateStr.replace(/[^0-9.]/g, '')) : undefined;
                if (flatbedRateStr && (isNaN(flatbedRate) || flatbedRate < 0)) {
                    throw new Error('FLATBED Rate must be a valid non-negative number');
                }
                if (tipperRateStr && (isNaN(tipperRate) || tipperRate < 0)) {
                    throw new Error('TIPPER Rate must be a valid non-negative number');
                }
                let effectiveFrom = null;
                let effectiveTo = null;
                const parseDate = (dateStr) => {
                    if (!dateStr || dateStr.trim() === '')
                        return null;
                    const numValue = Number(dateStr);
                    if (!isNaN(numValue) && numValue > 0 && numValue < 1000000) {
                        const excelEpoch = new Date(1899, 11, 30);
                        const date = new Date(excelEpoch.getTime() + (numValue - 1) * 24 * 60 * 60 * 1000);
                        if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
                            return date;
                        }
                    }
                    const isoDate = new Date(dateStr);
                    if (!isNaN(isoDate.getTime())) {
                        const year = isoDate.getFullYear();
                        if (year >= 1900 && year <= 2100) {
                            return isoDate;
                        }
                    }
                    return null;
                };
                if (effectiveFromStr) {
                    effectiveFrom = parseDate(effectiveFromStr);
                    if (!effectiveFrom) {
                        throw new Error(`Effective From must be a valid date (YYYY-MM-DD). Got: ${effectiveFromStr}`);
                    }
                }
                if (effectiveToStr) {
                    effectiveTo = parseDate(effectiveToStr);
                    if (!effectiveTo) {
                        throw new Error(`Effective To must be a valid date (YYYY-MM-DD). Got: ${effectiveToStr}`);
                    }
                }
                if (effectiveFrom && effectiveTo && effectiveFrom > effectiveTo) {
                    throw new Error('Effective From date must be before Effective To date');
                }
                const station = await this.prisma.tollStation.create({
                    data: {
                        name,
                        cityOrArea,
                        code,
                        isActive,
                    },
                });
                let ratesCreated = 0;
                if (flatbedRate !== undefined) {
                    await this.prisma.tollRate.create({
                        data: {
                            tollStationId: station.id,
                            vehicleType: client_1.VehicleType.FLATBED,
                            amount: new library_1.Decimal(flatbedRate),
                            currency,
                            effectiveFrom,
                            effectiveTo,
                            isActive: true,
                        },
                    });
                    ratesCreated++;
                }
                if (tipperRate !== undefined) {
                    await this.prisma.tollRate.create({
                        data: {
                            tollStationId: station.id,
                            vehicleType: client_1.VehicleType.TIPPER,
                            amount: new library_1.Decimal(tipperRate),
                            currency,
                            effectiveFrom,
                            effectiveTo,
                            isActive: true,
                        },
                    });
                    ratesCreated++;
                }
                results.success.push({ row: i + 1, name, ratesCreated });
            }
            catch (error) {
                results.errors.push({
                    row: i + 1,
                    error: error.message || 'Unknown error',
                });
            }
        }
        return results;
    }
};
exports.TollStationsService = TollStationsService;
exports.TollStationsService = TollStationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TollStationsService);
//# sourceMappingURL=toll-stations.service.js.map
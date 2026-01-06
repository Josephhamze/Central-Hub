import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTollStationDto } from './dto/create-toll-station.dto';
import { UpdateTollStationDto } from './dto/update-toll-station.dto';
import { CreateTollRateDto } from './dto/create-toll-rate.dto';
import { UpdateTollRateDto } from './dto/update-toll-rate.dto';
import { VehicleType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TollStationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, filters?: { isActive?: boolean; search?: string }) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
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

  async findOne(id: string) {
    const station = await this.prisma.tollStation.findUnique({
      where: { id },
      include: {
        rates: { orderBy: [{ vehicleType: 'asc' }, { effectiveFrom: 'desc' }] },
        _count: { select: { routeStations: true, payments: true } },
      },
    });
    if (!station) throw new NotFoundException('Toll station not found');
    return station;
  }

  async create(dto: CreateTollStationDto) {
    if (dto.code) {
      const existing = await this.prisma.tollStation.findUnique({ where: { code: dto.code } });
      if (existing) throw new BadRequestException('Toll station code already exists');
    }
    return this.prisma.tollStation.create({
      data: {
        ...dto,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async update(id: string, dto: UpdateTollStationDto) {
    const station = await this.prisma.tollStation.findUnique({ where: { id } });
    if (!station) throw new NotFoundException('Toll station not found');

    if (dto.code && dto.code !== station.code) {
      const existing = await this.prisma.tollStation.findUnique({ where: { code: dto.code } });
      if (existing) throw new BadRequestException('Toll station code already exists');
    }

    return this.prisma.tollStation.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const station = await this.prisma.tollStation.findUnique({
      where: { id },
      include: { _count: { select: { routeStations: true, payments: true } } },
    });
    if (!station) throw new NotFoundException('Toll station not found');
    if (station._count.routeStations > 0 || station._count.payments > 0) {
      throw new BadRequestException('Cannot delete toll station with associated routes or payments');
    }
    return this.prisma.tollStation.delete({ where: { id } });
  }

  // Toll Rate Management
  async createRate(tollStationId: string, dto: CreateTollRateDto) {
    const station = await this.prisma.tollStation.findUnique({ where: { id: tollStationId } });
    if (!station) throw new NotFoundException('Toll station not found');

    // Check for overlapping effective dates
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
        throw new BadRequestException('Overlapping effective date range for this vehicle type');
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

  async updateRate(tollStationId: string, rateId: string, dto: UpdateTollRateDto) {
    const rate = await this.prisma.tollRate.findUnique({
      where: { id: rateId },
    });
    if (!rate || rate.tollStationId !== tollStationId) {
      throw new NotFoundException('Toll rate not found');
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

  async removeRate(tollStationId: string, rateId: string) {
    const rate = await this.prisma.tollRate.findUnique({
      where: { id: rateId },
    });
    if (!rate || rate.tollStationId !== tollStationId) {
      throw new NotFoundException('Toll rate not found');
    }
    return this.prisma.tollRate.delete({ where: { id: rateId } });
  }

  async getRates(tollStationId: string, vehicleType?: string) {
    const station = await this.prisma.tollStation.findUnique({ where: { id: tollStationId } });
    if (!station) throw new NotFoundException('Toll station not found');

    const where: any = { tollStationId };
    if (vehicleType) where.vehicleType = vehicleType;

    return this.prisma.tollRate.findMany({
      where,
      orderBy: [{ vehicleType: 'asc' }, { effectiveFrom: 'desc' }],
    });
  }

  async bulkImport(file: any) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Invalid file: file buffer is missing');
    }
    
    let XLSX;
    try {
      XLSX = require('xlsx');
    } catch (error) {
      throw new BadRequestException('xlsx package is not installed. Please install it: pnpm add xlsx');
    }
    
    let workbook;
    try {
      workbook = XLSX.read(file.buffer, { type: 'buffer' });
    } catch (error: any) {
      throw new BadRequestException(`Failed to read Excel file: ${error.message}`);
    }
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      throw new BadRequestException('Excel file must contain at least a header row and one data row');
    }

    // Expected headers: Name, City/Area, Code, Is Active, FLATBED Rate, TIPPER Rate, Currency, Effective From, Effective To
    const headers = data[0] as string[];
    const expectedHeaders = ['Name', 'City/Area', 'Code', 'Is Active', 'FLATBED Rate', 'TIPPER Rate', 'Currency', 'Effective From', 'Effective To'];
    
    // Validate headers (case-insensitive)
    const normalizedHeaders = headers.map(h => h?.toString().trim());
    const headerMap: Record<string, number> = {};
    expectedHeaders.forEach((expected) => {
      const foundIdx = normalizedHeaders.findIndex(h => h?.toLowerCase() === expected.toLowerCase());
      if (foundIdx !== -1) {
        headerMap[expected] = foundIdx;
      }
    });

    // Validate required headers
    if (headerMap['Name'] === undefined) {
      throw new BadRequestException('Missing required column: Name');
    }

    const results = {
      success: [] as Array<{ row: number; name: string; ratesCreated: number }>,
      errors: [] as Array<{ row: number; error: string }>,
    };

    // Process each row
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) continue; // Skip empty rows

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

        // Validation
        if (!name) throw new Error('Name is required');

        const isActive = isActiveStr === 'yes' || isActiveStr === 'true' || isActiveStr === '1';

        // Check for duplicate code
        if (code) {
          const existing = await this.prisma.tollStation.findUnique({ where: { code } });
          if (existing) {
            throw new Error(`Toll station code "${code}" already exists`);
          }
        }

        // Parse rates
        const flatbedRate = flatbedRateStr ? parseFloat(flatbedRateStr.replace(/[^0-9.]/g, '')) : undefined;
        const tipperRate = tipperRateStr ? parseFloat(tipperRateStr.replace(/[^0-9.]/g, '')) : undefined;

        if (flatbedRateStr && (isNaN(flatbedRate!) || flatbedRate! < 0)) {
          throw new Error('FLATBED Rate must be a valid non-negative number');
        }
        if (tipperRateStr && (isNaN(tipperRate!) || tipperRate! < 0)) {
          throw new Error('TIPPER Rate must be a valid non-negative number');
        }

        // Parse dates
        let effectiveFrom: Date | null = null;
        let effectiveTo: Date | null = null;
        
        if (effectiveFromStr) {
          effectiveFrom = new Date(effectiveFromStr);
          if (isNaN(effectiveFrom.getTime())) {
            throw new Error('Effective From must be a valid date (YYYY-MM-DD)');
          }
        }
        
        if (effectiveToStr) {
          effectiveTo = new Date(effectiveToStr);
          if (isNaN(effectiveTo.getTime())) {
            throw new Error('Effective To must be a valid date (YYYY-MM-DD)');
          }
        }

        if (effectiveFrom && effectiveTo && effectiveFrom > effectiveTo) {
          throw new Error('Effective From date must be before Effective To date');
        }

        // Create toll station
        const station = await this.prisma.tollStation.create({
          data: {
            name,
            cityOrArea,
            code,
            isActive,
          },
        });

        let ratesCreated = 0;

        // Create FLATBED rate if provided
        if (flatbedRate !== undefined) {
          await this.prisma.tollRate.create({
            data: {
              tollStationId: station.id,
              vehicleType: VehicleType.FLATBED,
              amount: new Decimal(flatbedRate),
              currency,
              effectiveFrom,
              effectiveTo,
              isActive: true,
            },
          });
          ratesCreated++;
        }

        // Create TIPPER rate if provided
        if (tipperRate !== undefined) {
          await this.prisma.tollRate.create({
            data: {
              tollStationId: station.id,
              vehicleType: VehicleType.TIPPER,
              amount: new Decimal(tipperRate),
              currency,
              effectiveFrom,
              effectiveTo,
              isActive: true,
            },
          });
          ratesCreated++;
        }

        results.success.push({ row: i + 1, name, ratesCreated });
      } catch (error: any) {
        results.errors.push({
          row: i + 1,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  }
}

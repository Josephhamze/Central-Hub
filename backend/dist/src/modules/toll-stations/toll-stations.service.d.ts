import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTollStationDto } from './dto/create-toll-station.dto';
import { UpdateTollStationDto } from './dto/update-toll-station.dto';
import { CreateTollRateDto } from './dto/create-toll-rate.dto';
import { UpdateTollRateDto } from './dto/update-toll-rate.dto';
import { Decimal } from '@prisma/client/runtime/library';
export declare class TollStationsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, limit?: number, filters?: {
        isActive?: boolean;
        search?: string;
    }): Promise<{
        items: ({
            _count: {
                routeStations: number;
                payments: number;
            };
            rates: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                tollStationId: string;
                vehicleType: import(".prisma/client").$Enums.VehicleType;
                amount: Decimal;
                currency: string;
                effectiveFrom: Date | null;
                effectiveTo: Date | null;
            }[];
        } & {
            id: string;
            code: string | null;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            cityOrArea: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        _count: {
            routeStations: number;
            payments: number;
        };
        rates: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            tollStationId: string;
            vehicleType: import(".prisma/client").$Enums.VehicleType;
            amount: Decimal;
            currency: string;
            effectiveFrom: Date | null;
            effectiveTo: Date | null;
        }[];
    } & {
        id: string;
        code: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        cityOrArea: string | null;
    }>;
    create(dto: CreateTollStationDto): Promise<{
        id: string;
        code: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        cityOrArea: string | null;
    }>;
    update(id: string, dto: UpdateTollStationDto): Promise<{
        id: string;
        code: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        cityOrArea: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        code: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        cityOrArea: string | null;
    }>;
    createRate(tollStationId: string, dto: CreateTollRateDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        tollStationId: string;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        amount: Decimal;
        currency: string;
        effectiveFrom: Date | null;
        effectiveTo: Date | null;
    }>;
    updateRate(tollStationId: string, rateId: string, dto: UpdateTollRateDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        tollStationId: string;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        amount: Decimal;
        currency: string;
        effectiveFrom: Date | null;
        effectiveTo: Date | null;
    }>;
    removeRate(tollStationId: string, rateId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        tollStationId: string;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        amount: Decimal;
        currency: string;
        effectiveFrom: Date | null;
        effectiveTo: Date | null;
    }>;
    getRates(tollStationId: string, vehicleType?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        tollStationId: string;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        amount: Decimal;
        currency: string;
        effectiveFrom: Date | null;
        effectiveTo: Date | null;
    }[]>;
    bulkImport(file: any): Promise<{
        success: Array<{
            row: number;
            name: string;
            ratesCreated: number;
        }>;
        errors: Array<{
            row: number;
            error: string;
        }>;
    }>;
}

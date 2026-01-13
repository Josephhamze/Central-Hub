import { TollStationsService } from './toll-stations.service';
import { CreateTollStationDto } from './dto/create-toll-station.dto';
import { UpdateTollStationDto } from './dto/update-toll-station.dto';
import { CreateTollRateDto } from './dto/create-toll-rate.dto';
import { UpdateTollRateDto } from './dto/update-toll-rate.dto';
export declare class TollStationsController {
    private readonly tollStationsService;
    constructor(tollStationsService: TollStationsService);
    findAll(page?: number, limit?: number, isActive?: string, search?: string): Promise<{
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
                amount: import("@prisma/client/runtime/library").Decimal;
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
            amount: import("@prisma/client/runtime/library").Decimal;
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
    bulkImport(file: any): Promise<{
        success: {
            row: number;
            name: string;
            ratesCreated: number;
        }[];
        errors: {
            row: number;
            error: string;
        }[];
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
    getRates(id: string, vehicleType?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        tollStationId: string;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        effectiveFrom: Date | null;
        effectiveTo: Date | null;
    }[]>;
    createRate(id: string, dto: CreateTollRateDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        tollStationId: string;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        effectiveFrom: Date | null;
        effectiveTo: Date | null;
    }>;
    updateRate(id: string, rateId: string, dto: UpdateTollRateDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        tollStationId: string;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        effectiveFrom: Date | null;
        effectiveTo: Date | null;
    }>;
    removeRate(id: string, rateId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        tollStationId: string;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        effectiveFrom: Date | null;
        effectiveTo: Date | null;
    }>;
}

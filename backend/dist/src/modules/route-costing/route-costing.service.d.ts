import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCostProfileDto } from './dto/create-cost-profile.dto';
import { UpdateCostProfileDto } from './dto/update-cost-profile.dto';
import { CalculateCostingDto } from './dto/calculate-costing.dto';
import { VehicleType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
export declare class RouteCostingService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(vehicleType?: VehicleType, page?: number, limit?: number): Promise<{
        items: ({
            _count: {
                scenarios: number;
            };
            creator: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            createdByUserId: string | null;
            vehicleType: import(".prisma/client").$Enums.VehicleType;
            currency: string;
            configJson: import("@prisma/client/runtime/library").JsonValue;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
        scenarios: ({
            route: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                warehouseId: string | null;
                notes: string | null;
                distanceKm: Decimal;
                costPerKm: Decimal | null;
                fromCity: string;
                toCity: string;
                timeHours: Decimal | null;
                createdByUserId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            routeId: string;
            costProfileId: string;
            tripsPerMonth: Decimal | null;
            plannedTonnagePerMonth: Decimal | null;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        createdByUserId: string | null;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        currency: string;
        configJson: import("@prisma/client/runtime/library").JsonValue;
    }>;
    create(dto: CreateCostProfileDto, userId?: string): Promise<{
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        createdByUserId: string | null;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        currency: string;
        configJson: import("@prisma/client/runtime/library").JsonValue;
    }>;
    update(id: string, dto: UpdateCostProfileDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        createdByUserId: string | null;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        currency: string;
        configJson: import("@prisma/client/runtime/library").JsonValue;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        createdByUserId: string | null;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        currency: string;
        configJson: import("@prisma/client/runtime/library").JsonValue;
    }>;
    private validateCostProfileConfig;
    calculateCosting(dto: CalculateCostingDto): Promise<{
        distanceKm: string;
        timeHours: string | null;
        tollStations: {
            stationId: string;
            name: string;
            amount: string;
        }[];
        tollPerTrip: string;
        tollPerMonth: string | null;
        costComponents: {
            fuel: string;
            communicationsMonthly: string;
            laborMonthly: string;
            docsGpsMonthly: string;
            depreciationMonthly: string;
            overheadPerTrip: string;
            fixedCostPerTrip: string;
        };
        totals: {
            totalCostPerTrip: string;
            totalCostPerMonth: string | null;
            costPerTonPerKm: string;
            costPerTonPerKmIncludingEmptyLeg: string;
            salesPriceWithProfitMargin: string;
            salesPricePerTon: string;
        };
    }>;
}

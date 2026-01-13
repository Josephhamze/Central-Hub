import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { CreateTollDto } from './dto/create-toll.dto';
import { SetRouteStationsDto } from './dto/set-route-stations.dto';
import { CreateRouteRequestDto } from './dto/create-route-request.dto';
import { ReviewRouteRequestDto } from './dto/review-route-request.dto';
import { VehicleType, RouteRequestStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
export declare class RoutesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, limit?: number, filters?: {
        fromCity?: string;
        toCity?: string;
        isActive?: boolean;
        search?: string;
    }): Promise<{
        items: ({
            _count: {
                quotes: number;
            };
            warehouse: {
                id: string;
                name: string;
                locationCity: string | null;
            } | null;
            creator: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            } | null;
            tolls: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                routeId: string;
                cost: Decimal;
            }[];
            tollStations: ({
                tollStation: {
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
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                routeId: string;
                tollStationId: string;
                sortOrder: number;
            })[];
        } & {
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
            quotes: number;
        };
        warehouse: {
            id: string;
            name: string;
            locationCity: string | null;
        } | null;
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
        tolls: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            routeId: string;
            cost: Decimal;
        }[];
        tollStations: ({
            tollStation: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            routeId: string;
            tollStationId: string;
            sortOrder: number;
        })[];
    } & {
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
    }>;
    getExpectedTollTotal(routeId: string, vehicleType: VehicleType): Promise<Decimal>;
    setRouteStations(routeId: string, dto: SetRouteStationsDto, userId?: string): Promise<{
        _count: {
            quotes: number;
        };
        warehouse: {
            id: string;
            name: string;
            locationCity: string | null;
        } | null;
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
        tolls: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            routeId: string;
            cost: Decimal;
        }[];
        tollStations: ({
            tollStation: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            routeId: string;
            tollStationId: string;
            sortOrder: number;
        })[];
    } & {
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
    }>;
    deactivate(id: string): Promise<{
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
    }>;
    create(dto: CreateRouteDto, userId?: string): Promise<{
        warehouse: {
            id: string;
            name: string;
            locationCity: string | null;
        } | null;
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
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
    }>;
    update(id: string, dto: UpdateRouteDto): Promise<{
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
    }>;
    remove(id: string): Promise<{
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
    }>;
    addToll(dto: CreateTollDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        routeId: string;
        cost: Decimal;
    }>;
    removeToll(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        routeId: string;
        cost: Decimal;
    }>;
    bulkImport(file: any, userId?: string): Promise<{
        success: Array<{
            row: number;
            fromCity: string;
            toCity: string;
        }>;
        errors: Array<{
            row: number;
            error: string;
        }>;
    }>;
    createRouteRequest(dto: CreateRouteRequestDto, userId: string): Promise<{
        warehouse: {
            id: string;
            name: string;
            locationCity: string | null;
        } | null;
        quote: {
            id: string;
            quoteNumber: string;
        } | null;
        requestedBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.RouteRequestStatus;
        warehouseId: string | null;
        notes: string | null;
        distanceKm: Decimal | null;
        fromCity: string | null;
        toCity: string | null;
        timeHours: Decimal | null;
        quoteId: string | null;
        requestedByUserId: string;
        reviewedByUserId: string | null;
        reviewedAt: Date | null;
        rejectionReason: string | null;
        approvedRouteId: string | null;
    }>;
    findAllRouteRequests(page?: number, limit?: number, status?: RouteRequestStatus): Promise<{
        items: ({
            warehouse: {
                id: string;
                name: string;
                locationCity: string | null;
            } | null;
            quote: {
                id: string;
                quoteNumber: string;
            } | null;
            requestedBy: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            reviewedBy: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.RouteRequestStatus;
            warehouseId: string | null;
            notes: string | null;
            distanceKm: Decimal | null;
            fromCity: string | null;
            toCity: string | null;
            timeHours: Decimal | null;
            quoteId: string | null;
            requestedByUserId: string;
            reviewedByUserId: string | null;
            reviewedAt: Date | null;
            rejectionReason: string | null;
            approvedRouteId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOneRouteRequest(id: string): Promise<{
        warehouse: {
            id: string;
            name: string;
            locationCity: string | null;
        } | null;
        quote: {
            id: string;
            quoteNumber: string;
        } | null;
        requestedBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        reviewedBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.RouteRequestStatus;
        warehouseId: string | null;
        notes: string | null;
        distanceKm: Decimal | null;
        fromCity: string | null;
        toCity: string | null;
        timeHours: Decimal | null;
        quoteId: string | null;
        requestedByUserId: string;
        reviewedByUserId: string | null;
        reviewedAt: Date | null;
        rejectionReason: string | null;
        approvedRouteId: string | null;
    }>;
    reviewRouteRequest(id: string, dto: ReviewRouteRequestDto, reviewerId: string): Promise<({
        warehouse: {
            id: string;
            name: string;
            locationCity: string | null;
        } | null;
        quote: {
            id: string;
            quoteNumber: string;
        } | null;
        requestedBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        reviewedBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.RouteRequestStatus;
        warehouseId: string | null;
        notes: string | null;
        distanceKm: Decimal | null;
        fromCity: string | null;
        toCity: string | null;
        timeHours: Decimal | null;
        quoteId: string | null;
        requestedByUserId: string;
        reviewedByUserId: string | null;
        reviewedAt: Date | null;
        rejectionReason: string | null;
        approvedRouteId: string | null;
    }) | {
        request: {
            warehouse: {
                id: string;
                name: string;
                locationCity: string | null;
            } | null;
            quote: {
                id: string;
                quoteNumber: string;
            } | null;
            requestedBy: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            reviewedBy: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.RouteRequestStatus;
            warehouseId: string | null;
            notes: string | null;
            distanceKm: Decimal | null;
            fromCity: string | null;
            toCity: string | null;
            timeHours: Decimal | null;
            quoteId: string | null;
            requestedByUserId: string;
            reviewedByUserId: string | null;
            reviewedAt: Date | null;
            rejectionReason: string | null;
            approvedRouteId: string | null;
        };
        route: {
            warehouse: {
                id: string;
                name: string;
                locationCity: string | null;
            } | null;
            creator: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
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
    }>;
    deleteRouteRequest(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.RouteRequestStatus;
        warehouseId: string | null;
        notes: string | null;
        distanceKm: Decimal | null;
        fromCity: string | null;
        toCity: string | null;
        timeHours: Decimal | null;
        quoteId: string | null;
        requestedByUserId: string;
        reviewedByUserId: string | null;
        reviewedAt: Date | null;
        rejectionReason: string | null;
        approvedRouteId: string | null;
    }>;
}

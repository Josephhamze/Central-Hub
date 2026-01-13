import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { CreateTollDto } from './dto/create-toll.dto';
import { SetRouteStationsDto } from './dto/set-route-stations.dto';
import { CreateRouteRequestDto } from './dto/create-route-request.dto';
import { ReviewRouteRequestDto } from './dto/review-route-request.dto';
import { VehicleType, RouteRequestStatus } from '@prisma/client';
export declare class RoutesController {
    private readonly routesService;
    constructor(routesService: RoutesService);
    findAll(page?: number, limit?: number, fromCity?: string, toCity?: string, isActive?: string, search?: string): Promise<{
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
                cost: import("@prisma/client/runtime/library").Decimal;
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
            distanceKm: import("@prisma/client/runtime/library").Decimal;
            costPerKm: import("@prisma/client/runtime/library").Decimal | null;
            fromCity: string;
            toCity: string;
            timeHours: import("@prisma/client/runtime/library").Decimal | null;
            createdByUserId: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
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
        distanceKm: import("@prisma/client/runtime/library").Decimal | null;
        fromCity: string | null;
        toCity: string | null;
        timeHours: import("@prisma/client/runtime/library").Decimal | null;
        quoteId: string | null;
        requestedByUserId: string;
        reviewedByUserId: string | null;
        reviewedAt: Date | null;
        rejectionReason: string | null;
        approvedRouteId: string | null;
    }>;
    findAllRouteRequests(status?: RouteRequestStatus, page?: number, limit?: number): Promise<{
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
            distanceKm: import("@prisma/client/runtime/library").Decimal | null;
            fromCity: string | null;
            toCity: string | null;
            timeHours: import("@prisma/client/runtime/library").Decimal | null;
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
        distanceKm: import("@prisma/client/runtime/library").Decimal | null;
        fromCity: string | null;
        toCity: string | null;
        timeHours: import("@prisma/client/runtime/library").Decimal | null;
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
        distanceKm: import("@prisma/client/runtime/library").Decimal | null;
        fromCity: string | null;
        toCity: string | null;
        timeHours: import("@prisma/client/runtime/library").Decimal | null;
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
            distanceKm: import("@prisma/client/runtime/library").Decimal | null;
            fromCity: string | null;
            toCity: string | null;
            timeHours: import("@prisma/client/runtime/library").Decimal | null;
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
            distanceKm: import("@prisma/client/runtime/library").Decimal;
            costPerKm: import("@prisma/client/runtime/library").Decimal | null;
            fromCity: string;
            toCity: string;
            timeHours: import("@prisma/client/runtime/library").Decimal | null;
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
        distanceKm: import("@prisma/client/runtime/library").Decimal | null;
        fromCity: string | null;
        toCity: string | null;
        timeHours: import("@prisma/client/runtime/library").Decimal | null;
        quoteId: string | null;
        requestedByUserId: string;
        reviewedByUserId: string | null;
        reviewedAt: Date | null;
        rejectionReason: string | null;
        approvedRouteId: string | null;
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
            cost: import("@prisma/client/runtime/library").Decimal;
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
        distanceKm: import("@prisma/client/runtime/library").Decimal;
        costPerKm: import("@prisma/client/runtime/library").Decimal | null;
        fromCity: string;
        toCity: string;
        timeHours: import("@prisma/client/runtime/library").Decimal | null;
        createdByUserId: string | null;
    }>;
    getExpectedToll(id: string, vehicleType: VehicleType): Promise<{
        routeId: string;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        total: string;
    }>;
    create(dto: CreateRouteDto, userId: string): Promise<{
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
        distanceKm: import("@prisma/client/runtime/library").Decimal;
        costPerKm: import("@prisma/client/runtime/library").Decimal | null;
        fromCity: string;
        toCity: string;
        timeHours: import("@prisma/client/runtime/library").Decimal | null;
        createdByUserId: string | null;
    }>;
    bulkImport(file: any, userId: string): Promise<{
        success: {
            row: number;
            fromCity: string;
            toCity: string;
        }[];
        errors: {
            row: number;
            error: string;
        }[];
    }>;
    update(id: string, dto: UpdateRouteDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        warehouseId: string | null;
        notes: string | null;
        distanceKm: import("@prisma/client/runtime/library").Decimal;
        costPerKm: import("@prisma/client/runtime/library").Decimal | null;
        fromCity: string;
        toCity: string;
        timeHours: import("@prisma/client/runtime/library").Decimal | null;
        createdByUserId: string | null;
    }>;
    deactivate(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        warehouseId: string | null;
        notes: string | null;
        distanceKm: import("@prisma/client/runtime/library").Decimal;
        costPerKm: import("@prisma/client/runtime/library").Decimal | null;
        fromCity: string;
        toCity: string;
        timeHours: import("@prisma/client/runtime/library").Decimal | null;
        createdByUserId: string | null;
    }>;
    setRouteStations(id: string, dto: SetRouteStationsDto, userId: string): Promise<{
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
            cost: import("@prisma/client/runtime/library").Decimal;
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
        distanceKm: import("@prisma/client/runtime/library").Decimal;
        costPerKm: import("@prisma/client/runtime/library").Decimal | null;
        fromCity: string;
        toCity: string;
        timeHours: import("@prisma/client/runtime/library").Decimal | null;
        createdByUserId: string | null;
    }>;
    getRouteStations(id: string): Promise<({
        tollStation: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        routeId: string;
        tollStationId: string;
        sortOrder: number;
    })[]>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        warehouseId: string | null;
        notes: string | null;
        distanceKm: import("@prisma/client/runtime/library").Decimal;
        costPerKm: import("@prisma/client/runtime/library").Decimal | null;
        fromCity: string;
        toCity: string;
        timeHours: import("@prisma/client/runtime/library").Decimal | null;
        createdByUserId: string | null;
    }>;
    addToll(dto: CreateTollDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        routeId: string;
        cost: import("@prisma/client/runtime/library").Decimal;
    }>;
    removeToll(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        routeId: string;
        cost: import("@prisma/client/runtime/library").Decimal;
    }>;
}

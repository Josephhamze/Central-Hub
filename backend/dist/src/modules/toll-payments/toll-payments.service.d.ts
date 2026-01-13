import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTollPaymentDto } from './dto/create-toll-payment.dto';
import { UpdateTollPaymentDto } from './dto/update-toll-payment.dto';
import { ReconcileTollPaymentsDto } from './dto/reconcile-toll-payments.dto';
import { TollPaymentStatus, VehicleType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
export declare class TollPaymentsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, limit?: number, filters?: {
        startDate?: Date;
        endDate?: Date;
        routeId?: string;
        tollStationId?: string;
        vehicleType?: VehicleType;
        status?: TollPaymentStatus;
        paidByUserId?: string;
    }): Promise<{
        items: ({
            route: {
                id: string;
                fromCity: string;
                toCity: string;
            } | null;
            tollStation: {
                id: string;
                name: string;
            } | null;
            paidBy: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            } | null;
            attachments: {
                id: string;
                createdAt: Date;
                tollPaymentId: string;
                filePath: string;
                fileName: string;
                mimeType: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.TollPaymentStatus;
            notes: string | null;
            routeId: string | null;
            tollStationId: string | null;
            vehicleType: import(".prisma/client").$Enums.VehicleType;
            amount: Decimal;
            currency: string;
            paidAt: Date;
            receiptRef: string | null;
            paidByUserId: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
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
        } | null;
        tollStation: {
            id: string;
            code: string | null;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            cityOrArea: string | null;
        } | null;
        paidBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
        attachments: {
            id: string;
            createdAt: Date;
            tollPaymentId: string;
            filePath: string;
            fileName: string;
            mimeType: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.TollPaymentStatus;
        notes: string | null;
        routeId: string | null;
        tollStationId: string | null;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        amount: Decimal;
        currency: string;
        paidAt: Date;
        receiptRef: string | null;
        paidByUserId: string | null;
    }>;
    create(dto: CreateTollPaymentDto, userId?: string): Promise<{
        route: {
            id: string;
            fromCity: string;
            toCity: string;
        } | null;
        tollStation: {
            id: string;
            name: string;
        } | null;
        paidBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.TollPaymentStatus;
        notes: string | null;
        routeId: string | null;
        tollStationId: string | null;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        amount: Decimal;
        currency: string;
        paidAt: Date;
        receiptRef: string | null;
        paidByUserId: string | null;
    }>;
    update(id: string, dto: UpdateTollPaymentDto, userId: string, userPermissions: string[]): Promise<{
        route: {
            id: string;
            fromCity: string;
            toCity: string;
        } | null;
        tollStation: {
            id: string;
            name: string;
        } | null;
        paidBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.TollPaymentStatus;
        notes: string | null;
        routeId: string | null;
        tollStationId: string | null;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        amount: Decimal;
        currency: string;
        paidAt: Date;
        receiptRef: string | null;
        paidByUserId: string | null;
    }>;
    submit(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.TollPaymentStatus;
        notes: string | null;
        routeId: string | null;
        tollStationId: string | null;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        amount: Decimal;
        currency: string;
        paidAt: Date;
        receiptRef: string | null;
        paidByUserId: string | null;
    }>;
    approve(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.TollPaymentStatus;
        notes: string | null;
        routeId: string | null;
        tollStationId: string | null;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        amount: Decimal;
        currency: string;
        paidAt: Date;
        receiptRef: string | null;
        paidByUserId: string | null;
    }>;
    post(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.TollPaymentStatus;
        notes: string | null;
        routeId: string | null;
        tollStationId: string | null;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        amount: Decimal;
        currency: string;
        paidAt: Date;
        receiptRef: string | null;
        paidByUserId: string | null;
    }>;
    remove(id: string, userId: string, userPermissions: string[]): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.TollPaymentStatus;
        notes: string | null;
        routeId: string | null;
        tollStationId: string | null;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
        amount: Decimal;
        currency: string;
        paidAt: Date;
        receiptRef: string | null;
        paidByUserId: string | null;
    }>;
    reconcile(dto: ReconcileTollPaymentsDto): Promise<{
        dateRange: {
            startDate: string;
            endDate: string;
        };
        routeId: string | undefined;
        vehicleType: import(".prisma/client").$Enums.VehicleType | undefined;
        expectedTollsTotal: string;
        actualTollsTotal: string;
        variance: string;
        byStation: {
            stationId: string;
            stationName: string;
            expected: string;
            actual: string;
            variance: string;
        }[];
    }>;
}

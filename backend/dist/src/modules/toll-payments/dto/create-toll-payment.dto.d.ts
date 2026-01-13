import { VehicleType, TollPaymentStatus } from '@prisma/client';
export declare class CreateTollPaymentDto {
    paidAt: string;
    vehicleType: VehicleType;
    routeId?: string;
    tollStationId?: string;
    amount: number;
    currency?: string;
    receiptRef?: string;
    notes?: string;
    status?: TollPaymentStatus;
}

import { VehicleType } from '@prisma/client';
export declare class ReconcileTollPaymentsDto {
    startDate: string;
    endDate: string;
    routeId?: string;
    vehicleType?: VehicleType;
}

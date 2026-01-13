import { VehicleType } from '@prisma/client';
export declare class CalculateCostingDto {
    routeId: string;
    vehicleType: VehicleType;
    costProfileId: string;
    tonsPerTrip: number;
    tripsPerMonth?: number;
    includeEmptyLeg?: boolean;
    profitMarginPercentOverride?: number;
}

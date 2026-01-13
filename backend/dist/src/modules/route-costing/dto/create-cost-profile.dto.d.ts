import { VehicleType } from '@prisma/client';
export declare class CostProfileConfigDto {
    fuel?: {
        costPerUnit?: number;
        consumptionPerKm?: number;
        costPerKm?: number;
    };
    communicationsMonthly?: number;
    laborMonthly?: number;
    docsGpsMonthly?: number;
    depreciationMonthly?: number;
    overheadPerTrip?: number;
    includeEmptyLeg?: boolean;
    emptyLegFactor?: number;
    profitMarginPercent?: number;
}
export declare class CreateCostProfileDto {
    name: string;
    vehicleType: VehicleType;
    currency?: string;
    isActive?: boolean;
    config: CostProfileConfigDto;
}

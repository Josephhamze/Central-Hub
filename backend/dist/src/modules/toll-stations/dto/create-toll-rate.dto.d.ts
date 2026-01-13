import { VehicleType } from '@prisma/client';
export declare class CreateTollRateDto {
    vehicleType: VehicleType;
    amount: number;
    currency?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    isActive?: boolean;
}

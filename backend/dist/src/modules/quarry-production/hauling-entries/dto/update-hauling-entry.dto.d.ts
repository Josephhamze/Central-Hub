import { Shift } from '@prisma/client';
export declare class UpdateHaulingEntryDto {
    date?: string;
    shift?: Shift;
    truckId?: string;
    driverId?: string;
    excavatorEntryId?: string;
    tripCount?: number;
    avgCycleTime?: number;
    fuelConsumption?: number;
    notes?: string;
}

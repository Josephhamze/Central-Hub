import { Shift } from '@prisma/client';
export declare class CreateExcavatorEntryDto {
    date: string;
    shift: Shift;
    excavatorId: string;
    operatorId: string;
    materialTypeId: string;
    pitLocationId: string;
    bucketCount: number;
    downtimeHours?: number;
    notes?: string;
}

import { Shift } from '@prisma/client';
export declare class CreateCrusherFeedEntryDto {
    date: string;
    shift: Shift;
    crusherId: string;
    materialTypeId: string;
    feedStartTime: string;
    feedEndTime: string;
    truckLoadsReceived: number;
    weighBridgeTonnage: number;
    rejectOversizeTonnage?: number;
    notes?: string;
}

import { DepreciationMethod } from '@prisma/client';
export declare class CreateDepreciationProfileDto {
    assetId: string;
    method: DepreciationMethod;
    usefulLifeYears: number;
    salvageValue: number;
    startDate: string;
}

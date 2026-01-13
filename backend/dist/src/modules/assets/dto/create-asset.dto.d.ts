import { AssetStatus, AssetCriticality } from '@prisma/client';
export declare class CreateAssetDto {
    assetTag: string;
    name: string;
    category: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    acquisitionDate: string;
    acquisitionCost: number;
    currentValue: number;
    status?: AssetStatus;
    location?: string;
    projectId?: string;
    warehouseId?: string;
    assignedTo?: string;
    criticality?: AssetCriticality;
    expectedLifeYears?: number;
    notes?: string;
}

import { EquipmentStatus } from '@prisma/client';
export declare class UpdateTruckDto {
    name?: string;
    loadCapacity?: number;
    status?: EquipmentStatus;
    notes?: string;
}

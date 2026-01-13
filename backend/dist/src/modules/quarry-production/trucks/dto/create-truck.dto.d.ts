import { EquipmentStatus } from '@prisma/client';
export declare class CreateTruckDto {
    name: string;
    loadCapacity: number;
    status?: EquipmentStatus;
    notes?: string;
}

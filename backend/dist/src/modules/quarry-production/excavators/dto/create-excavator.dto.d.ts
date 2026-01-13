import { EquipmentStatus } from '@prisma/client';
export declare class CreateExcavatorDto {
    name: string;
    bucketCapacity: number;
    status?: EquipmentStatus;
    notes?: string;
}

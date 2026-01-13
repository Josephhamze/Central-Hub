import { EquipmentStatus, CrusherType } from '@prisma/client';
export declare class CreateCrusherDto {
    name: string;
    type: CrusherType;
    ratedCapacity: number;
    status?: EquipmentStatus;
    notes?: string;
}

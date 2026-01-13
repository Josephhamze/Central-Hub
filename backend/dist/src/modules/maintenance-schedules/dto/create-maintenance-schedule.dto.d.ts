import { MaintenanceScheduleType } from '@prisma/client';
export declare class CreateMaintenanceScheduleDto {
    assetId: string;
    type: MaintenanceScheduleType;
    intervalDays?: number;
    intervalHours?: number;
    checklistJson?: any;
    estimatedDurationHours?: number;
    requiredPartsJson?: any;
    isActive?: boolean;
}

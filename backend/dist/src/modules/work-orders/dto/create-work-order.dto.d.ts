import { WorkOrderType, WorkOrderPriority } from '@prisma/client';
export declare class CreateWorkOrderDto {
    assetId: string;
    scheduleId?: string;
    type: WorkOrderType;
    priority?: WorkOrderPriority;
    description: string;
    assignedToUserId?: string;
    notes?: string;
}

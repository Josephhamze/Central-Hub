import { RouteRequestStatus } from '@prisma/client';
export declare class ReviewRouteRequestDto {
    status: RouteRequestStatus;
    rejectionReason?: string | null;
}

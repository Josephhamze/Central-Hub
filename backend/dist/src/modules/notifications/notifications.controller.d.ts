import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(userId: string): Promise<{
        id: string;
        createdAt: Date;
        link: string | null;
        userId: string;
        type: string;
        title: string;
        message: string;
        read: boolean;
        readAt: Date | null;
    }[]>;
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
    markAsRead(userId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        link: string | null;
        userId: string;
        type: string;
        title: string;
        message: string;
        read: boolean;
        readAt: Date | null;
    }>;
    markAllAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}

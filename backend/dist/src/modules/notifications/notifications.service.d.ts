import { PrismaService } from '../../common/prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, type: string, title: string, message: string, link?: string): Promise<{
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
    findAll(userId: string, unreadOnly?: boolean): Promise<{
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
    markAsRead(userId: string, notificationId: string): Promise<{
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
    getUnreadCount(userId: string): Promise<number>;
}

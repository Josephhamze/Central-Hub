import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, type: string, title: string, message: string, link?: string) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
      },
    });
  }

  async findAll(userId: string, unreadOnly = false) {
    try {
      return await this.prisma.notification.findMany({
        where: {
          userId,
          ...(unreadOnly && { read: false }),
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });
    } catch (error) {
      this.logger.error('Error fetching notifications:', error);
      return [];
    }
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.update({
      where: {
        id: notificationId,
        userId, // Ensure user can only mark their own notifications as read
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  async getUnreadCount(userId: string) {
    try {
      return await this.prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      });
    } catch (error) {
      this.logger.error('Error fetching unread count:', error);
      return 0;
    }
  }
}

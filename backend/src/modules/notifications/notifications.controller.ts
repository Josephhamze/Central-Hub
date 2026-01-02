import { Controller, Get, Put, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UseInterceptors } from '@nestjs/common';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseInterceptors(ResponseInterceptor)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(RbacGuard)
  @Permissions('notifications:view')
  @ApiOperation({ summary: 'Get all notifications for current user' })
  async findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') userPermissions: string[],
  ) {
    return this.notificationsService.findAll(userId);
  }

  @Get('unread-count')
  @UseGuards(RbacGuard)
  @Permissions('notifications:view')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Put(':id/read')
  @UseGuards(RbacGuard)
  @Permissions('notifications:view')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notificationsService.markAsRead(userId, id);
  }

  @Put('read-all')
  @UseGuards(RbacGuard)
  @Permissions('notifications:view')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}

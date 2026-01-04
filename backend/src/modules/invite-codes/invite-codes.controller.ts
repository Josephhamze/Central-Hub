import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InviteCodesService } from './invite-codes.service';
import { CreateInviteCodeDto } from './dto/create-invite-code.dto';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { UseInterceptors } from '@nestjs/common';

@ApiTags('Invite Codes')
@ApiBearerAuth('JWT-auth')
@Controller('invite-codes')
@UseInterceptors(ResponseInterceptor)
export class InviteCodesController {
  constructor(private readonly inviteCodesService: InviteCodesService) {}

  @Post()
  @UseGuards(RbacGuard)
  @Permissions('users:create')
  @ApiOperation({ summary: 'Create a new invite code (admin only)' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateInviteCodeDto,
  ) {
    return this.inviteCodesService.create(userId, dto);
  }

  @Get()
  @UseGuards(RbacGuard)
  @Permissions('users:view')
  @ApiOperation({ summary: 'Get all invite codes (admin only)' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.inviteCodesService.findAll(userId);
  }

  @Delete(':id')
  @UseGuards(RbacGuard)
  @Permissions('users:update')
  @ApiOperation({ summary: 'Deactivate an invite code (admin only)' })
  async deactivate(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.inviteCodesService.deactivate(userId, id);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseInterceptors(ResponseInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RbacGuard)
  @Permissions('system:manage_users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of users' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.usersService.findAll(page, limit);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/theme')
  @ApiOperation({ summary: 'Update user theme preference' })
  @ApiResponse({ status: 200, description: 'Theme updated successfully' })
  async updateTheme(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateThemeDto,
  ) {
    return this.usersService.updateTheme(userId, dto);
  }

  @Get(':id')
  @UseGuards(RbacGuard)
  @Permissions('system:manage_users')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/deactivate')
  @UseGuards(RbacGuard)
  @Permissions('system:manage_users')
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  async deactivate(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.usersService.deactivate(id, currentUserId);
  }

  @Patch(':id/activate')
  @UseGuards(RbacGuard)
  @Permissions('system:manage_users')
  @ApiOperation({ summary: 'Activate a user' })
  @ApiResponse({ status: 200, description: 'User activated' })
  async activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }


  @Post()
  @UseGuards(RbacGuard)
  @Permissions('system:manage_users')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or email already in use' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':id/roles')
  @UseGuards(RbacGuard)
  @Permissions('system:manage_users', 'system:manage_roles')
  @ApiOperation({ summary: 'Assign roles to a user' })
  @ApiResponse({ status: 200, description: 'Roles assigned successfully' })
  async assignRoles(@Param('id') id: string, @Body() dto: AssignRolesDto) {
    return this.usersService.assignRoles(id, dto.roleIds);
  }

  @Post('assign-admin/:email')
  @Public()
  @ApiOperation({ summary: 'Assign Administrator role to user by email (one-time setup endpoint)' })
  @ApiResponse({ status: 200, description: 'Administrator role assigned successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async assignAdminByEmail(@Param('email') email: string) {
    return this.usersService.assignAdminByEmail(email);
  }

}

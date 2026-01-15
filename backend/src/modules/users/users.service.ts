import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ThemePreference } from '@prisma/client';

const USER_PROFILE_CACHE_TTL = 60 * 1000; // 1 minute cache for user profiles

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(page = 1, limit = 20) {
    // Convert to numbers since query params come as strings
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          accountStatus: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      items: users.map((user) => ({
        ...user,
        roles: user.roles.map((ur) => ur.role).filter((role) => role !== null),
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accountStatus: true,
        emailVerified: true,
        themePreference: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                permissions: {
                  select: {
                    permission: {
                      select: {
                        code: true,
                        name: true,
                        module: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      roles: user.roles
        .map((ur: any) => ur.role)
        .filter((role: any) => role !== null)
        .map((role: any) => ({
          ...role,
          permissions: (role.permissions || []).map((rp: any) => rp.permission),
        })),
    };
  }

  async getProfile(userId: string) {
    // Check Redis cache first
    const cacheKey = `user:profile:${userId}`;
    const cachedProfile = await this.cacheManager.get(cacheKey);
    if (cachedProfile) {
      return cachedProfile;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accountStatus: true,
        emailVerified: true,
        themePreference: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                permissions: {
                  select: {
                    permission: {
                      select: {
                        code: true,
                        name: true,
                        module: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Flatten roles and permissions for frontend
    const roles = user.roles.map((ur) => ur.role?.name).filter((name) => name !== undefined);
    const permissions = new Set<string>();
    user.roles.forEach((ur) => {
      if (!ur.role) return;
      ur.role.permissions?.forEach((rp) => {
        permissions.add(rp.permission.code);
      });
    });

    const profile = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      themePreference: user.themePreference,
      roles: Array.from(roles),
      permissions: Array.from(permissions),
    };

    // Cache the profile in Redis
    await this.cacheManager.set(cacheKey, profile, USER_PROFILE_CACHE_TTL);

    return profile;
  }

  // Helper method to invalidate user profile cache
  async invalidateUserProfileCache(userId: string) {
    const cacheKey = `user:profile:${userId}`;
    await this.cacheManager.del(cacheKey);
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.email) updateData.email = dto.email;
    if (dto.currentPassword && dto.newPassword) {
      const isPasswordValid = await bcrypt.compare(
        dto.currentPassword,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }
      updateData.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        themePreference: true,
        updatedAt: true,
      },
    });

    // Invalidate user profile cache
    await this.invalidateUserProfileCache(userId);

    return updated;
  }

  async updateTheme(userId: string, dto: UpdateThemeDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        themePreference: dto.theme as ThemePreference,
      },
      select: {
        id: true,
        themePreference: true,
      },
    });

    // Invalidate user profile cache
    await this.invalidateUserProfileCache(userId);

    return updated;
  }

  async deactivate(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: { accountStatus: 'DISABLED', deactivatedAt: new Date(), deactivatedBy: currentUserId },
    });

    // Invalidate user profile cache
    await this.invalidateUserProfileCache(id);

    return { message: 'User deactivated successfully' };
  }

  async activate(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: { accountStatus: 'ACTIVE', deactivatedAt: null, deactivatedBy: null },
    });

    // Invalidate user profile cache
    await this.invalidateUserProfileCache(id);

    return { message: 'User activated successfully' };
  }

  async assignRoles(userId: string, roleIds: string[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify all roles exist
    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
    });

    if (roles.length !== roleIds.length) {
      throw new BadRequestException('One or more roles not found');
    }

    // Remove existing roles and assign new ones
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({
        where: { userId },
      }),
      this.prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId,
          roleId,
        })),
      }),
    ]);

    // Invalidate user profile cache since roles changed
    await this.invalidateUserProfileCache(userId);

    return this.findOne(userId);
  }

  async create(dto: CreateUserDto) {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Validate password strength
    if (dto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // Validate role IDs if provided
    if (dto.roleIds && dto.roleIds.length > 0) {
      const validRoles = await this.prisma.role.findMany({
        where: { id: { in: dto.roleIds } },
      });
      if (validRoles.length !== dto.roleIds.length) {
        throw new BadRequestException('One or more role IDs are invalid');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.trim().toLowerCase(),
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        roles: dto.roleIds && dto.roleIds.length > 0
          ? {
              create: dto.roleIds.map((roleId) => ({ roleId })),
            }
          : undefined,
      },
    });

    return this.findOne(user.id);
  }

  async assignAdminByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find Administrator role
    const adminRole = await this.prisma.role.findFirst({
      where: {
        name: {
          in: ['Administrator', 'Admin'],
        },
      },
    });

    if (!adminRole) {
      throw new NotFoundException('Administrator role not found');
    }

    // Check if user already has admin role
    const existingRole = await this.prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });

    if (existingRole) {
      return { message: 'User already has Administrator role' };
    }

    // Assign admin role
    await this.prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });

    return { message: 'Administrator role assigned successfully' };
  }
}



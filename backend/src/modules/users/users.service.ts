import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { ThemePreference, AccountStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    // Convert string query params to numbers
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
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
          deactivatedAt: true,
          deactivatedBy: true,
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
        roles: user.roles.map((ur) => ur.role),
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
        deactivatedAt: true,
        deactivatedBy: true,
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
      roles: user.roles.map((ur) => ({
        ...ur.role,
        permissions: ur.role.permissions.map((rp) => rp.permission),
      })),
    };
  }

  async getProfile(userId: string) {
    return this.findOne(userId);
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

    return updated;
  }

  async deactivate(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is an admin
    const isAdmin = user.roles.some((ur) => ur.role.name === 'Administrator' || ur.role.name === 'Admin');
    
    if (isAdmin) {
      // Check if this is the last admin user
      const adminRoles = await this.prisma.role.findMany({
        where: {
          OR: [
            { name: 'Administrator' },
            { name: 'Admin' },
          ],
        },
      });

      if (adminRoles.length > 0) {
        // Count active admin users (excluding the one being deactivated)
        const activeAdminCount = await this.prisma.userRole.count({
          where: {
            roleId: { in: adminRoles.map((r) => r.id) },
            user: {
              accountStatus: 'ACTIVE',
              id: { not: id },
            },
          },
        });

        if (activeAdminCount === 0) {
          throw new BadRequestException('Cannot deactivate the last active administrator');
        }
      }
    }

    // Update user status
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        accountStatus: 'DISABLED',
        deactivatedAt: new Date(),
        deactivatedBy: currentUserId,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'USER_DEACTIVATED',
        entityType: 'User',
        entityId: id,
        oldValues: { accountStatus: user.accountStatus || 'ACTIVE' },
        newValues: { accountStatus: 'DISABLED' },
      },
    });

    return { message: 'User deactivated successfully' };
  }

  async activate(id: string, currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        accountStatus: 'ACTIVE',
        deactivatedAt: null,
        deactivatedBy: null,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'USER_ACTIVATED',
        entityType: 'User',
        entityId: id,
        oldValues: { accountStatus: user.accountStatus || 'DISABLED' },
        newValues: { accountStatus: 'ACTIVE' },
      },
    });

    return { message: 'User activated successfully' };
  }

  async assignRoles(userId: string, roleIds: string[], currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user currently has admin role
    const currentRoles = user.roles.map((ur) => ur.role);
    const hadAdminRole = currentRoles.some((r) => r.name === 'Administrator' || r.name === 'Admin');

    // Verify all roles exist
    const newRoles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
    });

    if (newRoles.length !== roleIds.length) {
      throw new BadRequestException('One or more roles not found');
    }

    // Check if new roles include admin
    const willHaveAdminRole = newRoles.some((r) => r.name === 'Administrator' || r.name === 'Admin');

    // If removing admin role from a user who had it
    if (hadAdminRole && !willHaveAdminRole) {
      // Check if this is the last admin user
      const adminRoles = await this.prisma.role.findMany({
        where: {
          OR: [
            { name: 'Administrator' },
            { name: 'Admin' },
          ],
        },
      });

      if (adminRoles.length > 0) {
        // Count active admin users (excluding the one being modified)
        const activeAdminCount = await this.prisma.userRole.count({
          where: {
            roleId: { in: adminRoles.map((r) => r.id) },
            user: {
              accountStatus: 'ACTIVE',
              id: { not: userId },
            },
          },
        });

        if (activeAdminCount === 0) {
          throw new BadRequestException('Cannot remove the last administrator role from the last active administrator');
        }
      }
    }

    // Ensure at least one role is assigned
    if (roleIds.length === 0) {
      throw new BadRequestException('User must have at least one role');
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

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'USER_ROLES_UPDATED',
        entityType: 'User',
        entityId: userId,
        oldValues: { roleIds: currentRoles.map((r) => r.id) },
        newValues: { roleIds },
      },
    });

    return this.findOne(userId);
  }

  async create(dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Verify all roles exist if provided
    if (dto.roleIds?.length) {
      const roles = await this.prisma.role.findMany({
        where: { id: { in: dto.roleIds } },
      });

      if (roles.length !== dto.roleIds.length) {
        throw new BadRequestException('One or more roles not found');
      }
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        accountStatus: 'ACTIVE',
        emailVerified: false,
        roles: dto.roleIds?.length
          ? {
              create: dto.roleIds.map((roleId) => ({
                roleId,
              })),
            }
          : undefined,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      accountStatus: user.accountStatus,
      emailVerified: user.emailVerified,
      roles: user.roles.map((ur) => ur.role),
      createdAt: user.createdAt,
    };
  }

  async assignAdminByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find or get Administrator role
    let adminRole = await this.prisma.role.findUnique({
      where: { name: 'Administrator' },
    });

    if (!adminRole) {
      adminRole = await this.prisma.role.create({
        data: {
          name: 'Administrator',
          description: 'Full system access with all permissions',
          isSystem: true,
        },
      });
    }

    // Check if user already has Administrator role
    const hasAdminRole = user.roles.some((ur) => ur.role.name === 'Administrator');

    if (!hasAdminRole) {
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });
    }

    // Ensure Administrator role has all permissions
    const allPermissions = await this.prisma.permission.findMany();
    for (const perm of allPermissions) {
      await this.prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      });
    }

    return {
      message: `Administrator role assigned to ${email}`,
      user: await this.findOne(user.id),
    };
  }


}

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInviteCodeDto } from './dto/create-invite-code.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class InviteCodesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a random invite code (8 characters, alphanumeric, uppercase)
   */
  private generateCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * Create a new invite code (admin only)
   */
  async create(userId: string, dto: CreateInviteCodeDto) {
    // Verify user is admin
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

    const isAdmin = user.roles.some((ur) => 
      ur.role.name === 'Administrator' || ur.role.name === 'Admin'
    );

    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can create invite codes');
    }

    // Generate unique code
    let code: string;
    let attempts = 0;
    do {
      code = this.generateCode();
      const existing = await this.prisma.inviteCode.findUnique({
        where: { code },
      });
      if (!existing) break;
      attempts++;
      if (attempts > 10) {
        throw new BadRequestException('Failed to generate unique invite code');
      }
    } while (true);

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    const maxUses = dto.maxUses || 1;

    const inviteCode = await this.prisma.inviteCode.create({
      data: {
        code,
        createdBy: userId,
        maxUses,
        expiresAt,
      },
    });

    return inviteCode;
  }

  /**
   * Validate an invite code
   */
  async validate(code: string): Promise<{ valid: boolean; message?: string }> {
    const inviteCode = await this.prisma.inviteCode.findUnique({
      where: { code },
    });

    if (!inviteCode) {
      return { valid: false, message: 'Invalid invite code' };
    }

    if (!inviteCode.isActive) {
      return { valid: false, message: 'This invite code has been deactivated' };
    }

    if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
      return { valid: false, message: 'This invite code has expired' };
    }

    if (inviteCode.useCount >= inviteCode.maxUses) {
      return { valid: false, message: 'This invite code has reached its usage limit' };
    }

    return { valid: true };
  }

  /**
   * Mark an invite code as used
   */
  async markAsUsed(code: string, userId: string) {
    const inviteCode = await this.prisma.inviteCode.findUnique({
      where: { code },
    });

    if (!inviteCode) {
      throw new NotFoundException('Invite code not found');
    }

    const validation = await this.validate(code);
    if (!validation.valid) {
      throw new BadRequestException(validation.message);
    }

    await this.prisma.inviteCode.update({
      where: { id: inviteCode.id },
      data: {
        usedBy: userId,
        usedAt: new Date(),
        useCount: inviteCode.useCount + 1,
        isActive: inviteCode.useCount + 1 >= inviteCode.maxUses ? false : inviteCode.isActive,
      },
    });
  }

  /**
   * Get all invite codes (admin only)
   */
  async findAll(userId: string) {
    // Verify user is admin
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

    const isAdmin = user.roles.some((ur) => 
      ur.role.name === 'Administrator' || ur.role.name === 'Admin'
    );

    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can view invite codes');
    }

    return this.prisma.inviteCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Deactivate an invite code (admin only)
   */
  async deactivate(userId: string, codeId: string) {
    // Verify user is admin
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

    const isAdmin = user.roles.some((ur) => 
      ur.role.name === 'Administrator' || ur.role.name === 'Admin'
    );

    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can deactivate invite codes');
    }

    const inviteCode = await this.prisma.inviteCode.findUnique({
      where: { id: codeId },
    });

    if (!inviteCode) {
      throw new NotFoundException('Invite code not found');
    }

    return this.prisma.inviteCode.update({
      where: { id: codeId },
      data: { isActive: false },
    });
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDepreciationProfileDto } from './dto/create-profile.dto';
import { RunMonthlyDepreciationDto } from './dto/run-monthly.dto';
import { DepreciationMethod } from '@prisma/client';

@Injectable()
export class DepreciationService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      this.prisma.depreciationProfile.findMany({
        skip,
        take: limitNum,
        include: {
          asset: {
            select: { id: true, assetTag: true, name: true, acquisitionCost: true, currentValue: true },
          },
          entries: {
            orderBy: { period: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.depreciationProfile.count(),
    ]);

    return {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async findOne(assetId: string) {
    const profile = await this.prisma.depreciationProfile.findUnique({
      where: { assetId },
      include: {
        asset: true,
        entries: {
          orderBy: { period: 'desc' },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Depreciation profile not found');
    }

    return profile;
  }

  async createProfile(dto: CreateDepreciationProfileDto) {
    // Check if profile already exists
    const existing = await this.prisma.depreciationProfile.findUnique({
      where: { assetId: dto.assetId },
    });

    if (existing) {
      throw new BadRequestException('Depreciation profile already exists for this asset');
    }

    // Validate asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: dto.assetId },
    });

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    const profile = await this.prisma.depreciationProfile.create({
      data: {
        assetId: dto.assetId,
        method: dto.method,
        usefulLifeYears: dto.usefulLifeYears,
        salvageValue: dto.salvageValue,
        startDate: new Date(dto.startDate),
      },
      include: {
        asset: {
          select: { id: true, assetTag: true, name: true },
        },
      },
    });

    return profile;
  }

  async runMonthly(dto: RunMonthlyDepreciationDto, actorUserId: string) {
    // Get all active depreciation profiles
    const profiles = await this.prisma.depreciationProfile.findMany({
      include: {
        asset: true,
        entries: {
          where: { period: dto.period },
        },
      },
    });

    const results = [];

    for (const profile of profiles) {
      // Skip if entry already exists for this period
      if (profile.entries.length > 0) {
        continue;
      }

      // Calculate depreciation based on method
      const acquisitionCost = Number(profile.asset.acquisitionCost);
      const salvageValue = Number(profile.salvageValue);
      const usefulLifeYears = profile.usefulLifeYears;
      const startDate = new Date(profile.startDate);

      // Get last entry to determine current book value
      const lastEntry = await this.prisma.depreciationEntry.findFirst({
        where: {
          assetId: profile.assetId,
          isPosted: true,
        },
        orderBy: { period: 'desc' },
      });

      const currentBookValue = lastEntry
        ? Number(lastEntry.bookValueAfter)
        : acquisitionCost;

      let depreciationAmount = 0;
      let bookValueAfter = currentBookValue;

      if (currentBookValue > salvageValue) {
        if (profile.method === DepreciationMethod.STRAIGHT_LINE) {
          // Straight-line: (Cost - Salvage) / Useful Life / 12
          const annualDepreciation = (acquisitionCost - salvageValue) / usefulLifeYears;
          depreciationAmount = annualDepreciation / 12;
          bookValueAfter = currentBookValue - depreciationAmount;
        } else if (profile.method === DepreciationMethod.DECLINING_BALANCE) {
          // Declining balance: Current Book Value * (2 / Useful Life) / 12
          const annualRate = 2 / usefulLifeYears;
          depreciationAmount = currentBookValue * (annualRate / 12);
          bookValueAfter = currentBookValue - depreciationAmount;
        }

        // Ensure book value doesn't go below salvage value
        if (bookValueAfter < salvageValue) {
          depreciationAmount = currentBookValue - salvageValue;
          bookValueAfter = salvageValue;
        }
      }

      if (depreciationAmount > 0) {
        const entry = await this.prisma.depreciationEntry.create({
          data: {
            assetId: profile.assetId,
            profileId: profile.id,
            period: dto.period,
            depreciationAmount,
            bookValueAfter,
            isPosted: false,
          },
        });

        results.push({
          assetId: profile.assetId,
          assetTag: profile.asset.assetTag,
          depreciationAmount,
          bookValueAfter,
        });
      }
    }

    return {
      period: dto.period,
      entriesCreated: results.length,
      entries: results,
    };
  }

  async postEntry(assetId: string, period: string, actorUserId: string) {
    const entry = await this.prisma.depreciationEntry.findUnique({
      where: {
        assetId_period: {
          assetId,
          period,
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Depreciation entry not found');
    }

    if (entry.isPosted) {
      throw new BadRequestException('Entry is already posted');
    }

    const posted = await this.prisma.$transaction(async (tx) => {
      // Mark entry as posted
      const updated = await tx.depreciationEntry.update({
        where: {
          assetId_period: {
            assetId,
            period,
          },
        },
        data: {
          isPosted: true,
          postedAt: new Date(),
        },
      });

      // Update asset current value
      await tx.asset.update({
        where: { id: assetId },
        data: {
          currentValue: updated.bookValueAfter,
        },
      });

      // Log to asset history
      await tx.assetHistory.create({
        data: {
          assetId,
          eventType: 'COST_UPDATED',
          actorUserId,
          metadataJson: {
            period,
            depreciationAmount: updated.depreciationAmount,
            newBookValue: updated.bookValueAfter,
          },
        },
      });

      return updated;
    });

    return posted;
  }

  async postAllForPeriod(period: string, actorUserId: string) {
    const entries = await this.prisma.depreciationEntry.findMany({
      where: {
        period,
        isPosted: false,
      },
    });

    const results = [];

    for (const entry of entries) {
      try {
        const posted = await this.postEntry(entry.assetId, period, actorUserId);
        results.push({
          assetId: entry.assetId,
          success: true,
          depreciationAmount: posted.depreciationAmount,
        });
      } catch (error) {
        results.push({
          assetId: entry.assetId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      period,
      total: entries.length,
      posted: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }
}

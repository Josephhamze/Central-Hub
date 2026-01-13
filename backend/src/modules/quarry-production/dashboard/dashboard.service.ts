import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { EntryStatus, Shift } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface VarianceCheckpoint {
  checkpoint: number;
  name: string;
  expected: Decimal;
  actual: Decimal;
  variance: Decimal;
  variancePercent: Decimal;
  threshold: number; // percentage threshold
  status: 'OK' | 'WARNING' | 'ALERT';
}

export interface ProductionSummary {
  date: Date;
  shift?: Shift;
  excavatorTonnage: Decimal;
  haulingTonnage: Decimal;
  crusherFeedTonnage: Decimal;
  crusherOutputTonnage: Decimal;
  variances: VarianceCheckpoint[];
}

export interface KPI {
  name: string;
  value: Decimal | number;
  target?: Decimal | number;
  unit: string;
  percentage?: number;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate variance between two values
   */
  private calculateVariance(
    expected: Decimal,
    actual: Decimal,
    threshold: number,
  ): { variance: Decimal; variancePercent: Decimal; status: 'OK' | 'WARNING' | 'ALERT' } {
    const variance = actual.minus(expected);
    const variancePercent = expected.isZero()
      ? new Decimal(0)
      : variance.dividedBy(expected).times(100);

    const absPercent = variancePercent.abs().toNumber();
    let status: 'OK' | 'WARNING' | 'ALERT' = 'OK';

    if (absPercent > threshold * 1.5) {
      status = 'ALERT';
    } else if (absPercent > threshold) {
      status = 'WARNING';
    }

    return { variance, variancePercent, status };
  }

  /**
   * Get variance analysis for a specific date/shift
   */
  async getVarianceAnalysis(date: Date, shift?: Shift): Promise<ProductionSummary> {
    date.setHours(0, 0, 0, 0);

    const where: any = { date, status: EntryStatus.APPROVED };
    if (shift) where.shift = shift;

    // Get all approved entries for the date/shift
    const [excavatorEntries, haulingEntries, crusherFeedEntries, crusherOutputEntries] = await Promise.all([
      this.prisma.excavatorEntry.findMany({
        where: shift ? { ...where, shift } : where,
      }),
      this.prisma.haulingEntry.findMany({
        where: shift ? { ...where, shift } : where,
      }),
      this.prisma.crusherFeedEntry.findMany({
        where: shift ? { ...where, shift } : where,
      }),
      this.prisma.crusherOutputEntry.findMany({
        where: shift ? { ...where, shift } : where,
      }),
    ]);

    // Sum tonnages
    const excavatorTonnage = excavatorEntries.reduce(
      (sum, entry) => sum.plus(entry.estimatedTonnage),
      new Decimal(0),
    );

    const haulingTonnage = haulingEntries.reduce(
      (sum, entry) => sum.plus(entry.totalHauled),
      new Decimal(0),
    );

    const crusherFeedTonnage = crusherFeedEntries.reduce(
      (sum, entry) => sum.plus(entry.weighBridgeTonnage),
      new Decimal(0),
    );

    const crusherOutputTonnage = crusherOutputEntries.reduce(
      (sum, entry) => sum.plus(entry.outputTonnage),
      new Decimal(0),
    );

    // Calculate variances
    const variances: VarianceCheckpoint[] = [];

    // Checkpoint 1: Excavator vs Hauling (±8%)
    const checkpoint1 = this.calculateVariance(excavatorTonnage, haulingTonnage, 8);
    variances.push({
      checkpoint: 1,
      name: 'Excavator → Hauling',
      expected: excavatorTonnage,
      actual: haulingTonnage,
      variance: checkpoint1.variance,
      variancePercent: checkpoint1.variancePercent,
      threshold: 8,
      status: checkpoint1.status,
    });

    // Checkpoint 2: Hauling vs Crusher Feed (±3%)
    const checkpoint2 = this.calculateVariance(haulingTonnage, crusherFeedTonnage, 3);
    variances.push({
      checkpoint: 2,
      name: 'Hauling → Crusher Feed',
      expected: haulingTonnage,
      actual: crusherFeedTonnage,
      variance: checkpoint2.variance,
      variancePercent: checkpoint2.variancePercent,
      threshold: 3,
      status: checkpoint2.status,
    });

    // Checkpoint 3: Crusher Feed vs Output (±8%, expect 2-8% loss)
    const checkpoint3 = this.calculateVariance(crusherFeedTonnage, crusherOutputTonnage, 8);
    // Adjust status for expected loss
    let status3 = checkpoint3.status;
    const lossPercent = checkpoint3.variancePercent.negated().toNumber(); // Negative variance = loss
    if (lossPercent >= 2 && lossPercent <= 8) {
      status3 = 'OK'; // Expected loss range
    } else if (lossPercent > 8) {
      status3 = 'ALERT'; // Excessive loss
    } else if (lossPercent < 2) {
      status3 = 'WARNING'; // Unusually low loss
    }
    variances.push({
      checkpoint: 3,
      name: 'Crusher Feed → Output',
      expected: crusherFeedTonnage,
      actual: crusherOutputTonnage,
      variance: checkpoint3.variance,
      variancePercent: checkpoint3.variancePercent,
      threshold: 8,
      status: status3,
    });

    return {
      date,
      shift,
      excavatorTonnage,
      haulingTonnage,
      crusherFeedTonnage,
      crusherOutputTonnage,
      variances,
    };
  }

  /**
   * Get KPIs for a date range
   */
  async getKPIs(dateFrom: Date, dateTo: Date): Promise<KPI[]> {
    dateFrom.setHours(0, 0, 0, 0);
    dateTo.setHours(23, 59, 59, 999);

    const where = {
      date: { gte: dateFrom, lte: dateTo },
      status: EntryStatus.APPROVED,
    };

    const [excavatorEntries, haulingEntries, crusherFeedEntries, crusherOutputEntries] = await Promise.all([
      this.prisma.excavatorEntry.findMany({ where }),
      this.prisma.haulingEntry.findMany({ where }),
      this.prisma.crusherFeedEntry.findMany({ where }),
      this.prisma.crusherOutputEntry.findMany({ where }),
    ]);

    // Calculate totals
    const totalExcavatorTonnage = excavatorEntries.reduce(
      (sum, e) => sum.plus(e.estimatedTonnage),
      new Decimal(0),
    );
    const totalHaulingTonnage = haulingEntries.reduce(
      (sum, e) => sum.plus(e.totalHauled),
      new Decimal(0),
    );
    const totalCrusherFeedTonnage = crusherFeedEntries.reduce(
      (sum, e) => sum.plus(e.weighBridgeTonnage),
      new Decimal(0),
    );
    const totalCrusherOutputTonnage = crusherOutputEntries.reduce(
      (sum, e) => sum.plus(e.outputTonnage),
      new Decimal(0),
    );

    // Calculate KPIs
    const kpis: KPI[] = [];

    // Excavator efficiency (actual vs expected based on bucket capacity)
    const totalBucketCount = excavatorEntries.reduce((sum, e) => sum + e.bucketCount, 0);
    kpis.push({
      name: 'Excavator Efficiency',
      value: totalExcavatorTonnage,
      unit: 'tonnes',
    });

    // Hauling efficiency
    const totalTrips = haulingEntries.reduce((sum, e) => sum + e.tripCount, 0);
    kpis.push({
      name: 'Hauling Efficiency',
      value: totalHaulingTonnage,
      unit: 'tonnes',
    });

    // Crusher yield
    const yieldPercent = totalCrusherFeedTonnage.isZero()
      ? new Decimal(0)
      : totalCrusherOutputTonnage.dividedBy(totalCrusherFeedTonnage).times(100);
    kpis.push({
      name: 'Crusher Yield',
      value: yieldPercent.toNumber(),
      target: 95, // Target 95% yield
      unit: '%',
      percentage: yieldPercent.toNumber(),
    });

    // Overall recovery rate
    const recoveryRate = totalExcavatorTonnage.isZero()
      ? new Decimal(0)
      : totalCrusherOutputTonnage.dividedBy(totalExcavatorTonnage).times(100);
    kpis.push({
      name: 'Overall Recovery Rate',
      value: recoveryRate.toNumber(),
      target: 90, // Target 90% recovery
      unit: '%',
      percentage: recoveryRate.toNumber(),
    });

    return kpis;
  }

  /**
   * Get daily production summary
   */
  async getDailySummary(date: Date) {
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const where = {
      date: { gte: date, lt: nextDay },
      status: EntryStatus.APPROVED,
    };

    const [dayEntries, nightEntries] = await Promise.all([
      this.getVarianceAnalysis(date, Shift.DAY),
      this.getVarianceAnalysis(date, Shift.NIGHT),
    ]);

    return {
      date,
      day: dayEntries,
      night: nightEntries,
      total: {
        excavatorTonnage: dayEntries.excavatorTonnage.plus(nightEntries.excavatorTonnage),
        haulingTonnage: dayEntries.haulingTonnage.plus(nightEntries.haulingTonnage),
        crusherFeedTonnage: dayEntries.crusherFeedTonnage.plus(nightEntries.crusherFeedTonnage),
        crusherOutputTonnage: dayEntries.crusherOutputTonnage.plus(nightEntries.crusherOutputTonnage),
      },
    };
  }

  /**
   * Get weekly production summary
   */
  async getWeeklySummary(startDate: Date) {
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const summaries = [];
    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
      summaries.push(await this.getDailySummary(new Date(d)));
    }

    return summaries;
  }
}

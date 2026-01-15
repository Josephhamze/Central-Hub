import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  QuarryPlanningService,
  QuarryConfiguration,
  MachineCategory,
  QuarryMachine,
} from './quarry-planning.service';

// DTO for creating a quarry plan
interface CreateQuarryPlanDto {
  drillId: string;
  excavatorId: string;
  truckIds: string[];
  crusherId: string;
  rockDensity?: number;
  drilledMetersToBlastVolume?: number;
  operatingHoursPerDay?: number;
  operatingDaysPerMonth?: number;
  quarryReserves: number;
}

@Controller('quarry-planning')
@UseGuards(JwtAuthGuard)
export class QuarryPlanningController {
  constructor(private readonly quarryPlanningService: QuarryPlanningService) {}

  // Get all machines from the registry
  @Get('machines')
  getMachines(@Query('category') category?: string) {
    if (category) {
      const machineCategory = category.toUpperCase() as MachineCategory;
      if (Object.values(MachineCategory).includes(machineCategory)) {
        return this.quarryPlanningService.getMachinesByCategory(machineCategory);
      }
    }
    return this.quarryPlanningService.getMachineRegistry();
  }

  // Get machines grouped by category
  @Get('machines/grouped')
  getMachinesGrouped() {
    const machines = this.quarryPlanningService.getMachineRegistry();
    return {
      drills: machines.filter((m) => m.category === MachineCategory.DRILL),
      excavators: machines.filter((m) => m.category === MachineCategory.EXCAVATOR),
      trucks: machines.filter((m) => m.category === MachineCategory.TRUCK),
      crushers: machines.filter((m) => m.category === MachineCategory.CRUSHER),
    };
  }

  // Get a single machine by ID
  @Get('machines/:id')
  getMachine(@Param('id') id: string) {
    const machine = this.quarryPlanningService.getMachineById(id);
    if (!machine) {
      return { error: 'Machine not found' };
    }
    return machine;
  }

  // Get a sample configuration
  @Get('sample-config')
  getSampleConfiguration() {
    return this.quarryPlanningService.createSampleConfiguration();
  }

  // Calculate a sample quarry plan
  @Get('sample-plan')
  getSamplePlan() {
    const config = this.quarryPlanningService.createSampleConfiguration();
    return this.quarryPlanningService.calculateQuarryPlan(config);
  }

  // Calculate a custom quarry plan
  @Post('calculate')
  calculatePlan(@Body() dto: CreateQuarryPlanDto) {
    // Build configuration from machine IDs
    const drill = this.quarryPlanningService.getMachineById(dto.drillId);
    const excavator = this.quarryPlanningService.getMachineById(dto.excavatorId);
    const trucks = dto.truckIds
      .map((id) => this.quarryPlanningService.getMachineById(id))
      .filter((t): t is QuarryMachine => t !== undefined);
    const crusher = this.quarryPlanningService.getMachineById(dto.crusherId);

    // Validate all machines exist
    if (!drill) {
      return { error: `Drill with ID ${dto.drillId} not found` };
    }
    if (!excavator) {
      return { error: `Excavator with ID ${dto.excavatorId} not found` };
    }
    if (trucks.length === 0) {
      return { error: 'At least one valid truck is required' };
    }
    if (!crusher) {
      return { error: `Crusher with ID ${dto.crusherId} not found` };
    }

    const config: QuarryConfiguration = {
      drill,
      excavator,
      trucks,
      crusher,
      rockDensity: dto.rockDensity ?? 2.6,
      drilledMetersToBlastVolume: dto.drilledMetersToBlastVolume ?? 50,
      operatingHoursPerDay: dto.operatingHoursPerDay ?? 10,
      operatingDaysPerMonth: dto.operatingDaysPerMonth ?? 25,
      quarryReserves: dto.quarryReserves,
    };

    return this.quarryPlanningService.calculateQuarryPlan(config);
  }

  // Quick production estimate
  @Post('estimate')
  getEstimate(@Body() dto: CreateQuarryPlanDto) {
    const drill = this.quarryPlanningService.getMachineById(dto.drillId);
    const excavator = this.quarryPlanningService.getMachineById(dto.excavatorId);
    const trucks = dto.truckIds
      .map((id) => this.quarryPlanningService.getMachineById(id))
      .filter((t): t is QuarryMachine => t !== undefined);
    const crusher = this.quarryPlanningService.getMachineById(dto.crusherId);

    if (!drill || !excavator || trucks.length === 0 || !crusher) {
      return { error: 'Invalid machine configuration' };
    }

    const config: QuarryConfiguration = {
      drill,
      excavator,
      trucks,
      crusher,
      rockDensity: dto.rockDensity ?? 2.6,
      drilledMetersToBlastVolume: dto.drilledMetersToBlastVolume ?? 50,
      operatingHoursPerDay: dto.operatingHoursPerDay ?? 10,
      operatingDaysPerMonth: dto.operatingDaysPerMonth ?? 25,
      quarryReserves: dto.quarryReserves,
    };

    const productionRates = this.quarryPlanningService.calculateProductionRates(config);
    const costBreakdown = this.quarryPlanningService.calculateCostBreakdown(config, productionRates);

    return {
      tonsPerHour: productionRates.effective.tonsPerHour,
      tonsPerDay: productionRates.effective.tonsPerDay,
      costPerTon: costBreakdown.total.perTon,
      bottleneck: productionRates.bottleneck.stage,
    };
  }
}

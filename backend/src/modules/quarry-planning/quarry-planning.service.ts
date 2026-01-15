import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export enum MachineCategory {
  DRILL = 'DRILL',
  EXCAVATOR = 'EXCAVATOR',
  TRUCK = 'TRUCK',
  CRUSHER = 'CRUSHER',
}

export interface QuarryMachine {
  id: string;
  name: string;
  category: MachineCategory;
  capacity: number;
  capacityUnit: string;
  fuelCostPerHour: number;
  maintenanceCostPerHour: number;
  ownershipCostPerHour: number;
  availabilityPercent: number;
  // Additional specs
  manufacturer?: string;
  model?: string;
  yearModel?: number;
  notes?: string;
}

export interface QuarryConfiguration {
  drill: QuarryMachine;
  excavator: QuarryMachine;
  trucks: QuarryMachine[];
  crusher: QuarryMachine;
  // Conversion parameters
  rockDensity: number; // tons per cubic meter (default: 2.6)
  drilledMetersToBlastVolume: number; // cubic meters per drilled meter (default: 50)
  operatingHoursPerDay: number; // default: 10
  operatingDaysPerMonth: number; // default: 25
  quarryReserves: number; // total tons in quarry
}

export interface ProductionRates {
  drilling: {
    metersPerHour: number;
    cubicMetersPerHour: number;
    tonsPerHour: number;
  };
  excavating: {
    cubicMetersPerHour: number;
    tonsPerHour: number;
  };
  hauling: {
    tonsPerHourPerTruck: number;
    totalTonsPerHour: number;
    truckCount: number;
  };
  crushing: {
    tonsPerHour: number;
  };
  effective: {
    tonsPerHour: number;
    tonsPerDay: number;
    tonsPerMonth: number;
  };
  bottleneck: {
    stage: string;
    machine: QuarryMachine;
    limitingCapacity: number;
  };
}

export interface CostBreakdown {
  drilling: {
    fuelPerHour: number;
    maintenancePerHour: number;
    ownershipPerHour: number;
    totalPerHour: number;
  };
  excavating: {
    fuelPerHour: number;
    maintenancePerHour: number;
    ownershipPerHour: number;
    totalPerHour: number;
  };
  hauling: {
    fuelPerHour: number;
    maintenancePerHour: number;
    ownershipPerHour: number;
    totalPerHour: number;
    truckCount: number;
  };
  crushing: {
    fuelPerHour: number;
    maintenancePerHour: number;
    ownershipPerHour: number;
    totalPerHour: number;
  };
  total: {
    perHour: number;
    perDay: number;
    perMonth: number;
    perTon: number;
  };
}

export interface QuarryLifeEstimate {
  totalReserves: number;
  productionPerDay: number;
  productionPerMonth: number;
  productionPerYear: number;
  daysRemaining: number;
  monthsRemaining: number;
  yearsRemaining: number;
}

export interface WhatIfScenario {
  name: string;
  description: string;
  changes: {
    addTrucks?: number;
    replaceCrusher?: QuarryMachine;
    replaceExcavator?: QuarryMachine;
    replaceDrill?: QuarryMachine;
  };
  result: {
    newProductionRate: number;
    newCostPerTon: number;
    newBottleneck: string;
    productionChange: number;
    costChange: number;
  };
}

export interface QuarryPlanningResult {
  configuration: QuarryConfiguration;
  productionRates: ProductionRates;
  costBreakdown: CostBreakdown;
  quarryLife: QuarryLifeEstimate;
  whatIfScenarios: WhatIfScenario[];
}

// ============================================================================
// DEFAULT MACHINE REGISTRY
// ============================================================================

export const DEFAULT_MACHINES: QuarryMachine[] = [
  // DRILLS
  {
    id: 'drill-atlas-copco-d65',
    name: 'Atlas Copco FlexiROC D65',
    category: MachineCategory.DRILL,
    capacity: 25, // meters drilled per hour
    capacityUnit: 'm/hr',
    fuelCostPerHour: 45,
    maintenanceCostPerHour: 35,
    ownershipCostPerHour: 85,
    availabilityPercent: 85,
    manufacturer: 'Atlas Copco',
    model: 'FlexiROC D65',
  },
  {
    id: 'drill-sandvik-dp1500i',
    name: 'Sandvik DP1500i',
    category: MachineCategory.DRILL,
    capacity: 30, // meters drilled per hour
    capacityUnit: 'm/hr',
    fuelCostPerHour: 55,
    maintenanceCostPerHour: 40,
    ownershipCostPerHour: 95,
    availabilityPercent: 88,
    manufacturer: 'Sandvik',
    model: 'DP1500i',
  },
  {
    id: 'drill-epiroc-smartroc-t45',
    name: 'Epiroc SmartROC T45',
    category: MachineCategory.DRILL,
    capacity: 35, // meters drilled per hour
    capacityUnit: 'm/hr',
    fuelCostPerHour: 60,
    maintenanceCostPerHour: 45,
    ownershipCostPerHour: 110,
    availabilityPercent: 90,
    manufacturer: 'Epiroc',
    model: 'SmartROC T45',
  },

  // EXCAVATORS
  {
    id: 'excavator-cat-390f',
    name: 'Caterpillar 390F',
    category: MachineCategory.EXCAVATOR,
    capacity: 450, // cubic meters per hour
    capacityUnit: 'm³/hr',
    fuelCostPerHour: 120,
    maintenanceCostPerHour: 65,
    ownershipCostPerHour: 180,
    availabilityPercent: 90,
    manufacturer: 'Caterpillar',
    model: '390F',
  },
  {
    id: 'excavator-komatsu-pc800',
    name: 'Komatsu PC800-8',
    category: MachineCategory.EXCAVATOR,
    capacity: 550, // cubic meters per hour
    capacityUnit: 'm³/hr',
    fuelCostPerHour: 140,
    maintenanceCostPerHour: 75,
    ownershipCostPerHour: 210,
    availabilityPercent: 88,
    manufacturer: 'Komatsu',
    model: 'PC800-8',
  },
  {
    id: 'excavator-hitachi-ex1200',
    name: 'Hitachi EX1200-7',
    category: MachineCategory.EXCAVATOR,
    capacity: 700, // cubic meters per hour
    capacityUnit: 'm³/hr',
    fuelCostPerHour: 180,
    maintenanceCostPerHour: 95,
    ownershipCostPerHour: 280,
    availabilityPercent: 87,
    manufacturer: 'Hitachi',
    model: 'EX1200-7',
  },
  {
    id: 'excavator-liebherr-r9100',
    name: 'Liebherr R9100',
    category: MachineCategory.EXCAVATOR,
    capacity: 850, // cubic meters per hour
    capacityUnit: 'm³/hr',
    fuelCostPerHour: 200,
    maintenanceCostPerHour: 110,
    ownershipCostPerHour: 320,
    availabilityPercent: 85,
    manufacturer: 'Liebherr',
    model: 'R9100',
  },

  // TRUCKS
  {
    id: 'truck-cat-775g',
    name: 'Caterpillar 775G',
    category: MachineCategory.TRUCK,
    capacity: 65, // tons per trip, ~4 trips/hr = 260 tons/hr
    capacityUnit: 't/hr',
    fuelCostPerHour: 85,
    maintenanceCostPerHour: 45,
    ownershipCostPerHour: 120,
    availabilityPercent: 88,
    manufacturer: 'Caterpillar',
    model: '775G',
    notes: '65t payload, ~4 trips/hour',
  },
  {
    id: 'truck-komatsu-hd785',
    name: 'Komatsu HD785-7',
    category: MachineCategory.TRUCK,
    capacity: 90, // tons per trip, ~3.5 trips/hr = 315 tons/hr
    capacityUnit: 't/hr',
    fuelCostPerHour: 95,
    maintenanceCostPerHour: 50,
    ownershipCostPerHour: 140,
    availabilityPercent: 87,
    manufacturer: 'Komatsu',
    model: 'HD785-7',
    notes: '91t payload, ~3.5 trips/hour',
  },
  {
    id: 'truck-volvo-a40g',
    name: 'Volvo A40G',
    category: MachineCategory.TRUCK,
    capacity: 55, // tons per trip, ~4 trips/hr = 220 tons/hr
    capacityUnit: 't/hr',
    fuelCostPerHour: 70,
    maintenanceCostPerHour: 40,
    ownershipCostPerHour: 100,
    availabilityPercent: 90,
    manufacturer: 'Volvo',
    model: 'A40G',
    notes: '39t payload articulated, ~4 trips/hour',
  },
  {
    id: 'truck-bell-b45e',
    name: 'Bell B45E',
    category: MachineCategory.TRUCK,
    capacity: 50, // tons per trip, ~4 trips/hr = 200 tons/hr
    capacityUnit: 't/hr',
    fuelCostPerHour: 65,
    maintenanceCostPerHour: 35,
    ownershipCostPerHour: 90,
    availabilityPercent: 89,
    manufacturer: 'Bell',
    model: 'B45E',
    notes: '41t payload articulated, ~4 trips/hour',
  },

  // CRUSHERS
  {
    id: 'crusher-metso-c150',
    name: 'Metso Nordberg C150',
    category: MachineCategory.CRUSHER,
    capacity: 500, // tons per hour
    capacityUnit: 't/hr',
    fuelCostPerHour: 150,
    maintenanceCostPerHour: 85,
    ownershipCostPerHour: 200,
    availabilityPercent: 92,
    manufacturer: 'Metso',
    model: 'Nordberg C150',
    notes: 'Primary jaw crusher',
  },
  {
    id: 'crusher-sandvik-cj815',
    name: 'Sandvik CJ815',
    category: MachineCategory.CRUSHER,
    capacity: 650, // tons per hour
    capacityUnit: 't/hr',
    fuelCostPerHour: 180,
    maintenanceCostPerHour: 100,
    ownershipCostPerHour: 250,
    availabilityPercent: 90,
    manufacturer: 'Sandvik',
    model: 'CJ815',
    notes: 'Primary jaw crusher',
  },
  {
    id: 'crusher-terex-finlay-j-1480',
    name: 'Terex Finlay J-1480',
    category: MachineCategory.CRUSHER,
    capacity: 400, // tons per hour
    capacityUnit: 't/hr',
    fuelCostPerHour: 120,
    maintenanceCostPerHour: 70,
    ownershipCostPerHour: 160,
    availabilityPercent: 88,
    manufacturer: 'Terex Finlay',
    model: 'J-1480',
    notes: 'Mobile jaw crusher',
  },
  {
    id: 'crusher-kleemann-mc140z',
    name: 'Kleemann MC 140 Z',
    category: MachineCategory.CRUSHER,
    capacity: 750, // tons per hour
    capacityUnit: 't/hr',
    fuelCostPerHour: 200,
    maintenanceCostPerHour: 120,
    ownershipCostPerHour: 300,
    availabilityPercent: 91,
    manufacturer: 'Kleemann',
    model: 'MC 140 Z',
    notes: 'Large mobile jaw crusher',
  },
];

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class QuarryPlanningService {
  constructor(private prisma: PrismaService) {}

  // Get all available machines from the registry
  getMachineRegistry(): QuarryMachine[] {
    return DEFAULT_MACHINES;
  }

  // Get machines by category
  getMachinesByCategory(category: MachineCategory): QuarryMachine[] {
    return DEFAULT_MACHINES.filter((m) => m.category === category);
  }

  // Get a single machine by ID
  getMachineById(id: string): QuarryMachine | undefined {
    return DEFAULT_MACHINES.find((m) => m.id === id);
  }

  // Calculate production rates
  calculateProductionRates(config: QuarryConfiguration): ProductionRates {
    const { drill, excavator, trucks, crusher, rockDensity, drilledMetersToBlastVolume } = config;

    // Apply availability to each machine's capacity
    const effectiveDrillCapacity = drill.capacity * (drill.availabilityPercent / 100);
    const effectiveExcavatorCapacity = excavator.capacity * (excavator.availabilityPercent / 100);
    const effectiveCrusherCapacity = crusher.capacity * (crusher.availabilityPercent / 100);

    // Calculate drilling production
    // Drill produces meters → convert to blast volume → convert to tons
    const drillMetersPerHour = effectiveDrillCapacity;
    const drillCubicMetersPerHour = drillMetersPerHour * drilledMetersToBlastVolume;
    const drillTonsPerHour = drillCubicMetersPerHour * rockDensity;

    // Calculate excavating production
    // Excavator moves cubic meters → convert to tons
    const excavatorCubicMetersPerHour = effectiveExcavatorCapacity;
    const excavatorTonsPerHour = excavatorCubicMetersPerHour * rockDensity;

    // Calculate hauling production
    // Each truck has tons/hour capacity, sum all trucks
    const truckTonsPerHour = trucks.reduce((sum, truck) => {
      return sum + truck.capacity * (truck.availabilityPercent / 100);
    }, 0);

    // Calculate crushing production
    const crusherTonsPerHour = effectiveCrusherCapacity;

    // Find the bottleneck (minimum production rate)
    const stages = [
      { stage: 'Drilling', tonsPerHour: drillTonsPerHour, machine: drill },
      { stage: 'Excavating', tonsPerHour: excavatorTonsPerHour, machine: excavator },
      { stage: 'Hauling', tonsPerHour: truckTonsPerHour, machine: trucks[0] }, // Primary truck as reference
      { stage: 'Crushing', tonsPerHour: crusherTonsPerHour, machine: crusher },
    ];

    const bottleneck = stages.reduce((min, current) =>
      current.tonsPerHour < min.tonsPerHour ? current : min
    );

    const effectiveTonsPerHour = bottleneck.tonsPerHour;
    const effectiveTonsPerDay = effectiveTonsPerHour * config.operatingHoursPerDay;
    const effectiveTonsPerMonth = effectiveTonsPerDay * config.operatingDaysPerMonth;

    return {
      drilling: {
        metersPerHour: drillMetersPerHour,
        cubicMetersPerHour: drillCubicMetersPerHour,
        tonsPerHour: drillTonsPerHour,
      },
      excavating: {
        cubicMetersPerHour: excavatorCubicMetersPerHour,
        tonsPerHour: excavatorTonsPerHour,
      },
      hauling: {
        tonsPerHourPerTruck: trucks.length > 0 ? truckTonsPerHour / trucks.length : 0,
        totalTonsPerHour: truckTonsPerHour,
        truckCount: trucks.length,
      },
      crushing: {
        tonsPerHour: crusherTonsPerHour,
      },
      effective: {
        tonsPerHour: effectiveTonsPerHour,
        tonsPerDay: effectiveTonsPerDay,
        tonsPerMonth: effectiveTonsPerMonth,
      },
      bottleneck: {
        stage: bottleneck.stage,
        machine: bottleneck.machine,
        limitingCapacity: bottleneck.tonsPerHour,
      },
    };
  }

  // Calculate cost breakdown
  calculateCostBreakdown(config: QuarryConfiguration, productionRates: ProductionRates): CostBreakdown {
    const { drill, excavator, trucks, crusher, operatingHoursPerDay, operatingDaysPerMonth } = config;

    // Drilling costs
    const drillingCosts = {
      fuelPerHour: drill.fuelCostPerHour,
      maintenancePerHour: drill.maintenanceCostPerHour,
      ownershipPerHour: drill.ownershipCostPerHour,
      totalPerHour: drill.fuelCostPerHour + drill.maintenanceCostPerHour + drill.ownershipCostPerHour,
    };

    // Excavating costs
    const excavatingCosts = {
      fuelPerHour: excavator.fuelCostPerHour,
      maintenancePerHour: excavator.maintenanceCostPerHour,
      ownershipPerHour: excavator.ownershipCostPerHour,
      totalPerHour: excavator.fuelCostPerHour + excavator.maintenanceCostPerHour + excavator.ownershipCostPerHour,
    };

    // Hauling costs (sum all trucks)
    const haulingCosts = {
      fuelPerHour: trucks.reduce((sum, t) => sum + t.fuelCostPerHour, 0),
      maintenancePerHour: trucks.reduce((sum, t) => sum + t.maintenanceCostPerHour, 0),
      ownershipPerHour: trucks.reduce((sum, t) => sum + t.ownershipCostPerHour, 0),
      totalPerHour: trucks.reduce(
        (sum, t) => sum + t.fuelCostPerHour + t.maintenanceCostPerHour + t.ownershipCostPerHour,
        0
      ),
      truckCount: trucks.length,
    };

    // Crushing costs
    const crushingCosts = {
      fuelPerHour: crusher.fuelCostPerHour,
      maintenancePerHour: crusher.maintenanceCostPerHour,
      ownershipPerHour: crusher.ownershipCostPerHour,
      totalPerHour: crusher.fuelCostPerHour + crusher.maintenanceCostPerHour + crusher.ownershipCostPerHour,
    };

    // Total costs
    const totalPerHour =
      drillingCosts.totalPerHour +
      excavatingCosts.totalPerHour +
      haulingCosts.totalPerHour +
      crushingCosts.totalPerHour;

    const totalPerDay = totalPerHour * operatingHoursPerDay;
    const totalPerMonth = totalPerDay * operatingDaysPerMonth;

    // Cost per ton
    const costPerTon = productionRates.effective.tonsPerHour > 0
      ? totalPerHour / productionRates.effective.tonsPerHour
      : 0;

    return {
      drilling: drillingCosts,
      excavating: excavatingCosts,
      hauling: haulingCosts,
      crushing: crushingCosts,
      total: {
        perHour: totalPerHour,
        perDay: totalPerDay,
        perMonth: totalPerMonth,
        perTon: costPerTon,
      },
    };
  }

  // Calculate quarry life estimate
  calculateQuarryLife(config: QuarryConfiguration, productionRates: ProductionRates): QuarryLifeEstimate {
    const { quarryReserves, operatingDaysPerMonth } = config;
    const { effective } = productionRates;

    const daysRemaining = effective.tonsPerDay > 0 ? quarryReserves / effective.tonsPerDay : Infinity;
    const monthsRemaining = daysRemaining / operatingDaysPerMonth;
    const yearsRemaining = monthsRemaining / 12;

    return {
      totalReserves: quarryReserves,
      productionPerDay: effective.tonsPerDay,
      productionPerMonth: effective.tonsPerMonth,
      productionPerYear: effective.tonsPerMonth * 12,
      daysRemaining: Math.round(daysRemaining),
      monthsRemaining: Math.round(monthsRemaining * 10) / 10,
      yearsRemaining: Math.round(yearsRemaining * 10) / 10,
    };
  }

  // Generate what-if scenarios
  generateWhatIfScenarios(config: QuarryConfiguration): WhatIfScenario[] {
    const scenarios: WhatIfScenario[] = [];

    // Base calculation
    const baseProduction = this.calculateProductionRates(config);
    const baseCost = this.calculateCostBreakdown(config, baseProduction);

    // Scenario 1: Add 1 truck
    const additionalTruck = config.trucks[0]; // Use same type as existing
    if (additionalTruck) {
      const configWithMoreTrucks = {
        ...config,
        trucks: [...config.trucks, additionalTruck],
      };
      const newProduction = this.calculateProductionRates(configWithMoreTrucks);
      const newCost = this.calculateCostBreakdown(configWithMoreTrucks, newProduction);

      scenarios.push({
        name: 'Add 1 Truck',
        description: `Add another ${additionalTruck.name} to the fleet`,
        changes: { addTrucks: 1 },
        result: {
          newProductionRate: newProduction.effective.tonsPerHour,
          newCostPerTon: newCost.total.perTon,
          newBottleneck: newProduction.bottleneck.stage,
          productionChange: ((newProduction.effective.tonsPerHour - baseProduction.effective.tonsPerHour) / baseProduction.effective.tonsPerHour) * 100,
          costChange: ((newCost.total.perTon - baseCost.total.perTon) / baseCost.total.perTon) * 100,
        },
      });
    }

    // Scenario 2: Add 2 trucks
    if (additionalTruck) {
      const configWithMoreTrucks = {
        ...config,
        trucks: [...config.trucks, additionalTruck, additionalTruck],
      };
      const newProduction = this.calculateProductionRates(configWithMoreTrucks);
      const newCost = this.calculateCostBreakdown(configWithMoreTrucks, newProduction);

      scenarios.push({
        name: 'Add 2 Trucks',
        description: `Add two more ${additionalTruck.name}s to the fleet`,
        changes: { addTrucks: 2 },
        result: {
          newProductionRate: newProduction.effective.tonsPerHour,
          newCostPerTon: newCost.total.perTon,
          newBottleneck: newProduction.bottleneck.stage,
          productionChange: ((newProduction.effective.tonsPerHour - baseProduction.effective.tonsPerHour) / baseProduction.effective.tonsPerHour) * 100,
          costChange: ((newCost.total.perTon - baseCost.total.perTon) / baseCost.total.perTon) * 100,
        },
      });
    }

    // Scenario 3: Bigger crusher
    const biggerCrushers = this.getMachinesByCategory(MachineCategory.CRUSHER)
      .filter((c) => c.capacity > config.crusher.capacity)
      .sort((a, b) => a.capacity - b.capacity);

    if (biggerCrushers.length > 0) {
      const biggerCrusher = biggerCrushers[0];
      const configWithBiggerCrusher = {
        ...config,
        crusher: biggerCrusher,
      };
      const newProduction = this.calculateProductionRates(configWithBiggerCrusher);
      const newCost = this.calculateCostBreakdown(configWithBiggerCrusher, newProduction);

      scenarios.push({
        name: 'Upgrade Crusher',
        description: `Replace ${config.crusher.name} with ${biggerCrusher.name} (${biggerCrusher.capacity} t/hr)`,
        changes: { replaceCrusher: biggerCrusher },
        result: {
          newProductionRate: newProduction.effective.tonsPerHour,
          newCostPerTon: newCost.total.perTon,
          newBottleneck: newProduction.bottleneck.stage,
          productionChange: ((newProduction.effective.tonsPerHour - baseProduction.effective.tonsPerHour) / baseProduction.effective.tonsPerHour) * 100,
          costChange: ((newCost.total.perTon - baseCost.total.perTon) / baseCost.total.perTon) * 100,
        },
      });
    }

    // Scenario 4: Bigger excavator
    const biggerExcavators = this.getMachinesByCategory(MachineCategory.EXCAVATOR)
      .filter((e) => e.capacity > config.excavator.capacity)
      .sort((a, b) => a.capacity - b.capacity);

    if (biggerExcavators.length > 0) {
      const biggerExcavator = biggerExcavators[0];
      const configWithBiggerExcavator = {
        ...config,
        excavator: biggerExcavator,
      };
      const newProduction = this.calculateProductionRates(configWithBiggerExcavator);
      const newCost = this.calculateCostBreakdown(configWithBiggerExcavator, newProduction);

      scenarios.push({
        name: 'Upgrade Excavator',
        description: `Replace ${config.excavator.name} with ${biggerExcavator.name} (${biggerExcavator.capacity} m³/hr)`,
        changes: { replaceExcavator: biggerExcavator },
        result: {
          newProductionRate: newProduction.effective.tonsPerHour,
          newCostPerTon: newCost.total.perTon,
          newBottleneck: newProduction.bottleneck.stage,
          productionChange: ((newProduction.effective.tonsPerHour - baseProduction.effective.tonsPerHour) / baseProduction.effective.tonsPerHour) * 100,
          costChange: ((newCost.total.perTon - baseCost.total.perTon) / baseCost.total.perTon) * 100,
        },
      });
    }

    // Scenario 5: Better drill
    const betterDrills = this.getMachinesByCategory(MachineCategory.DRILL)
      .filter((d) => d.capacity > config.drill.capacity)
      .sort((a, b) => a.capacity - b.capacity);

    if (betterDrills.length > 0) {
      const betterDrill = betterDrills[0];
      const configWithBetterDrill = {
        ...config,
        drill: betterDrill,
      };
      const newProduction = this.calculateProductionRates(configWithBetterDrill);
      const newCost = this.calculateCostBreakdown(configWithBetterDrill, newProduction);

      scenarios.push({
        name: 'Upgrade Drill',
        description: `Replace ${config.drill.name} with ${betterDrill.name} (${betterDrill.capacity} m/hr)`,
        changes: { replaceDrill: betterDrill },
        result: {
          newProductionRate: newProduction.effective.tonsPerHour,
          newCostPerTon: newCost.total.perTon,
          newBottleneck: newProduction.bottleneck.stage,
          productionChange: ((newProduction.effective.tonsPerHour - baseProduction.effective.tonsPerHour) / baseProduction.effective.tonsPerHour) * 100,
          costChange: ((newCost.total.perTon - baseCost.total.perTon) / baseCost.total.perTon) * 100,
        },
      });
    }

    return scenarios;
  }

  // Full planning calculation
  calculateQuarryPlan(config: QuarryConfiguration): QuarryPlanningResult {
    const productionRates = this.calculateProductionRates(config);
    const costBreakdown = this.calculateCostBreakdown(config, productionRates);
    const quarryLife = this.calculateQuarryLife(config, productionRates);
    const whatIfScenarios = this.generateWhatIfScenarios(config);

    return {
      configuration: config,
      productionRates,
      costBreakdown,
      quarryLife,
      whatIfScenarios,
    };
  }

  // Create a sample configuration for demonstration
  createSampleConfiguration(): QuarryConfiguration {
    const drills = this.getMachinesByCategory(MachineCategory.DRILL);
    const excavators = this.getMachinesByCategory(MachineCategory.EXCAVATOR);
    const trucks = this.getMachinesByCategory(MachineCategory.TRUCK);
    const crushers = this.getMachinesByCategory(MachineCategory.CRUSHER);

    return {
      drill: drills[0], // Atlas Copco FlexiROC D65
      excavator: excavators[0], // Caterpillar 390F
      trucks: [trucks[0], trucks[0]], // 2x Caterpillar 775G
      crusher: crushers[0], // Metso Nordberg C150
      rockDensity: 2.6, // tons per cubic meter
      drilledMetersToBlastVolume: 50, // cubic meters per drilled meter
      operatingHoursPerDay: 10,
      operatingDaysPerMonth: 25,
      quarryReserves: 5000000, // 5 million tons
    };
  }
}

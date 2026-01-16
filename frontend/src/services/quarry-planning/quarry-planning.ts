import { api } from '../api';

// ============================================================================
// TYPES
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
  manufacturer?: string;
  model?: string;
  yearModel?: number;
  notes?: string;
}

export interface MachinesGrouped {
  drills: QuarryMachine[];
  excavators: QuarryMachine[];
  trucks: QuarryMachine[];
  crushers: QuarryMachine[];
}

export interface QuarryConfiguration {
  drill: QuarryMachine;
  excavator: QuarryMachine;
  trucks: QuarryMachine[];
  crusher: QuarryMachine;
  rockDensity: number;
  drilledMetersToBlastVolume: number;
  operatingHoursPerDay: number;
  operatingDaysPerMonth: number;
  quarryReserves: number;
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

export interface CreateQuarryPlanDto {
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

// ============================================================================
// API SERVICE
// ============================================================================

export const quarryPlanningService = {
  // Get all machines
  getMachines: async (): Promise<QuarryMachine[]> => {
    const response = await api.get('/quarry-planning/machines');
    return response.data?.data ?? response.data;
  },

  // Get machines grouped by category
  getMachinesGrouped: async (): Promise<MachinesGrouped> => {
    const response = await api.get('/quarry-planning/machines/grouped');
    return response.data?.data ?? response.data;
  },

  // Get a single machine by ID
  getMachine: async (id: string): Promise<QuarryMachine> => {
    const response = await api.get(`/quarry-planning/machines/${id}`);
    return response.data?.data ?? response.data;
  },

  // Get sample configuration
  getSampleConfiguration: async (): Promise<QuarryConfiguration> => {
    const response = await api.get('/quarry-planning/sample-config');
    return response.data?.data ?? response.data;
  },

  // Get sample plan with calculations
  getSamplePlan: async (): Promise<QuarryPlanningResult> => {
    const response = await api.get('/quarry-planning/sample-plan');
    return response.data?.data ?? response.data;
  },

  // Calculate a custom quarry plan
  calculatePlan: async (dto: CreateQuarryPlanDto): Promise<QuarryPlanningResult> => {
    const response = await api.post('/quarry-planning/calculate', dto);
    return response.data?.data ?? response.data;
  },

  // Get quick estimate
  getEstimate: async (dto: CreateQuarryPlanDto): Promise<{
    tonsPerHour: number;
    tonsPerDay: number;
    costPerTon: number;
    bottleneck: string;
  }> => {
    const response = await api.post('/quarry-planning/estimate', dto);
    return response.data?.data ?? response.data;
  },
};

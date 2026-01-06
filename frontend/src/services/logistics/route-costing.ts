import { api, type ApiResponse, type PaginatedResponse } from '../api';
import type { VehicleType } from './routes';

export interface CostProfileConfig {
  fuel?: { costPerUnit?: number; consumptionPerKm?: number; costPerKm?: number };
  communicationsMonthly?: number;
  laborMonthly?: number;
  docsGpsMonthly?: number;
  depreciationMonthly?: number;
  overheadPerTrip?: number;
  includeEmptyLeg?: boolean;
  emptyLegFactor?: number;
  profitMarginPercent?: number;
}

export interface RouteCostProfile {
  id: string;
  name: string;
  vehicleType: VehicleType;
  currency: string;
  isActive: boolean;
  configJson: CostProfileConfig;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; firstName: string; lastName: string; email: string };
  _count?: { scenarios: number };
}

export interface CreateCostProfileDto {
  name: string;
  vehicleType: VehicleType;
  currency?: string;
  isActive?: boolean;
  config: CostProfileConfig;
}

export interface CalculateCostingDto {
  routeId: string;
  vehicleType: VehicleType;
  costProfileId: string;
  tonsPerTrip: number;
  tripsPerMonth?: number;
  includeEmptyLeg?: boolean;
  profitMarginPercentOverride?: number;
}

export interface CostingCalculationResult {
  distanceKm: string;
  timeHours: string | null;
  tollStations: Array<{ stationId: string; name: string; amount: string }>;
  tollPerTrip: string;
  tollPerMonth: string | null;
  costComponents: {
    fuel: string;
    communicationsMonthly: string;
    laborMonthly: string;
    docsGpsMonthly: string;
    depreciationMonthly: string;
    overheadPerTrip: string;
    fixedCostPerTrip: string;
  };
  totals: {
    totalCostPerTrip: string;
    totalCostPerMonth: string | null;
    costPerTonPerKm: string;
    costPerTonPerKmIncludingEmptyLeg: string;
    salesPriceWithProfitMargin: string;
    salesPricePerTon: string;
  };
}

export const routeCostingApi = {
  findAll: (vehicleType?: VehicleType, page = 1, limit = 100) =>
    api.get<ApiResponse<PaginatedResponse<RouteCostProfile>>>('/cost-profiles', { params: { vehicleType, page, limit } }),
  findOne: (id: string) => api.get<ApiResponse<RouteCostProfile>>(`/cost-profiles/${id}`),
  create: (data: CreateCostProfileDto) => api.post<ApiResponse<RouteCostProfile>>('/cost-profiles', data),
  update: (id: string, data: Partial<CreateCostProfileDto>) => api.put<ApiResponse<RouteCostProfile>>(`/cost-profiles/${id}`, data),
  activate: (id: string) => api.post<ApiResponse<RouteCostProfile>>(`/cost-profiles/${id}/activate`),
  remove: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/cost-profiles/${id}`),
  calculate: (data: CalculateCostingDto) => api.post<ApiResponse<CostingCalculationResult>>('/costing/calculate', data),
};

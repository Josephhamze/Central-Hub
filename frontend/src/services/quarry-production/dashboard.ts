import { api, type ApiResponse } from '../api';
import type { Shift } from './entries';

export interface VarianceCheckpoint {
  checkpoint: number;
  name: string;
  expected: number;
  actual: number;
  variance: number;
  variancePercent: number;
  threshold: number;
  status: 'OK' | 'WARNING' | 'ALERT';
}

export interface ProductionSummary {
  date: string;
  shift?: Shift;
  excavatorTonnage: number;
  haulingTonnage: number;
  crusherFeedTonnage: number;
  crusherOutputTonnage: number;
  variances: VarianceCheckpoint[];
}

export interface KPI {
  name: string;
  value: number;
  target?: number;
  unit: string;
  percentage?: number;
}

export interface DailySummary {
  date: string;
  day: ProductionSummary;
  night: ProductionSummary;
  total: {
    excavatorTonnage: number;
    haulingTonnage: number;
    crusherFeedTonnage: number;
    crusherOutputTonnage: number;
  };
}

export const dashboardApi = {
  getVarianceAnalysis: (params: { date: string; shift?: Shift }) =>
    api.get<ApiResponse<ProductionSummary>>('/quarry-production/dashboard/variance', { params }),

  getKPIs: (params: { dateFrom: string; dateTo: string }) =>
    api.get<ApiResponse<KPI[]>>('/quarry-production/dashboard/kpis', { params }),

  getDailySummary: (params: { date: string }) =>
    api.get<ApiResponse<DailySummary>>('/quarry-production/dashboard/daily-summary', { params }),

  getWeeklySummary: (params: { startDate: string }) =>
    api.get<ApiResponse<DailySummary[]>>('/quarry-production/dashboard/weekly-summary', { params }),
};

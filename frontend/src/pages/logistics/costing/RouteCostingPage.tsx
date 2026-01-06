import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Calculator, TrendingUp, DollarSign, Truck, Package, Calendar } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useToast } from '@contexts/ToastContext';
import { useAuth } from '@contexts/AuthContext';
import { routesApi, type Route, type VehicleType } from '@services/logistics/routes';
import { routeCostingApi, type RouteCostProfile, type CostingCalculationResult } from '@services/logistics/route-costing';
import { cn } from '@utils/cn';

export function RouteCostingPage() {
  const { error: showError } = useToast();
  const { hasPermission } = useAuth();
  const [calculation, setCalculation] = useState<CostingCalculationResult | null>(null);
  const [formData, setFormData] = useState({
    routeId: '',
    vehicleType: 'FLATBED' as VehicleType,
    costProfileId: '',
    tonsPerTrip: 0,
    tripsPerMonth: 0,
    includeEmptyLeg: false,
    profitMarginPercentOverride: 0,
  });

  const { data: routes } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const res = await routesApi.findAll(1, 100, { isActive: true });
      return res.data.data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['cost-profiles', formData.vehicleType],
    queryFn: async () => {
      const res = await routeCostingApi.findAll(formData.vehicleType, 1, 100);
      return res.data.data;
    },
    enabled: !!formData.vehicleType,
  });

  const calculateMutation = useMutation({
    mutationFn: () =>
      routeCostingApi.calculate({
        routeId: formData.routeId,
        vehicleType: formData.vehicleType,
        costProfileId: formData.costProfileId,
        tonsPerTrip: formData.tonsPerTrip,
        tripsPerMonth: formData.tripsPerMonth || undefined,
        includeEmptyLeg: formData.includeEmptyLeg || undefined,
        profitMarginPercentOverride: formData.profitMarginPercentOverride || undefined,
      }),
    onSuccess: (data) => {
      setCalculation(data.data.data);
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to calculate costing'),
  });

  const canView = hasPermission('logistics:costing:view');

  if (!canView) {
    return (
      <PageContainer>
        <Card className="p-12 text-center">
          <p className="text-content-secondary">You don't have permission to view costing</p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Route Costing Calculator</h1>
          <p className="text-content-secondary mt-1">Calculate transport costs and pricing for routes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-content-primary mb-4">Calculation Parameters</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-content-primary">Route *</label>
                <select
                  value={formData.routeId}
                  onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
                  required
                >
                  <option value="">Select route...</option>
                  {routes?.items.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.fromCity} → {route.toCity} ({route.distanceKm} km)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-content-primary">Vehicle Type *</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as VehicleType })}
                  className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
                >
                  <option value="FLATBED">Flatbed</option>
                  <option value="TIPPER">Tipper</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-content-primary">Cost Profile *</label>
                <select
                  value={formData.costProfileId}
                  onChange={(e) => setFormData({ ...formData, costProfileId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
                  required
                >
                  <option value="">Select cost profile...</option>
                  {profiles?.items
                    .filter((p) => p.isActive)
                    .map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                </select>
              </div>

              <Input
                label="Tons Per Trip *"
                type="number"
                step="0.01"
                value={formData.tonsPerTrip}
                onChange={(e) => setFormData({ ...formData, tonsPerTrip: parseFloat(e.target.value) || 0 })}
                required
              />

              <Input
                label="Trips Per Month (optional)"
                type="number"
                step="0.01"
                value={formData.tripsPerMonth}
                onChange={(e) => setFormData({ ...formData, tripsPerMonth: parseFloat(e.target.value) || 0 })}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeEmptyLeg"
                  checked={formData.includeEmptyLeg}
                  onChange={(e) => setFormData({ ...formData, includeEmptyLeg: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="includeEmptyLeg" className="text-sm text-content-primary">
                  Include empty return leg
                </label>
              </div>

              <Input
                label="Profit Margin Override % (optional)"
                type="number"
                step="0.01"
                value={formData.profitMarginPercentOverride}
                onChange={(e) => setFormData({ ...formData, profitMarginPercentOverride: parseFloat(e.target.value) || 0 })}
              />

              <Button
                onClick={() => calculateMutation.mutate()}
                loading={calculateMutation.isPending}
                className="w-full"
                icon={Calculator}
                disabled={!formData.routeId || !formData.costProfileId || !formData.tonsPerTrip}
              >
                Calculate
              </Button>
            </div>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {calculation ? (
              <>
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-content-primary mb-4">Cost Breakdown</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-content-secondary">Distance:</span>
                      <span className="text-content-primary font-medium">{calculation.distanceKm} km</span>
                    </div>
                    {calculation.timeHours && (
                      <div className="flex justify-between">
                        <span className="text-content-secondary">Time:</span>
                        <span className="text-content-primary font-medium">{calculation.timeHours} hrs</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-content-secondary">Toll Per Trip:</span>
                      <span className="text-content-primary font-medium">
                        {parseFloat(calculation.tollPerTrip).toFixed(2)}
                      </span>
                    </div>
                    {calculation.tollPerMonth && (
                      <div className="flex justify-between">
                        <span className="text-content-secondary">Toll Per Month:</span>
                        <span className="text-content-primary font-medium">
                          {parseFloat(calculation.tollPerMonth).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-content-primary mb-4">Cost Components</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-content-secondary">Fuel:</span>
                      <span className="text-content-primary">{parseFloat(calculation.costComponents.fuel).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-content-secondary">Communications (Monthly):</span>
                      <span className="text-content-primary">
                        {parseFloat(calculation.costComponents.communicationsMonthly).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-content-secondary">Labor (Monthly):</span>
                      <span className="text-content-primary">
                        {parseFloat(calculation.costComponents.laborMonthly).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-content-secondary">Docs/GPS (Monthly):</span>
                      <span className="text-content-primary">
                        {parseFloat(calculation.costComponents.docsGpsMonthly).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-content-secondary">Depreciation (Monthly):</span>
                      <span className="text-content-primary">
                        {parseFloat(calculation.costComponents.depreciationMonthly).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-content-secondary">Overhead Per Trip:</span>
                      <span className="text-content-primary">
                        {parseFloat(calculation.costComponents.overheadPerTrip).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-content-secondary">Fixed Cost Per Trip:</span>
                      <span className="text-content-primary">
                        {parseFloat(calculation.costComponents.fixedCostPerTrip).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-status-success-bg border-status-success">
                  <h2 className="text-lg font-semibold text-content-primary mb-4">Totals</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-content-secondary">Total Cost Per Trip:</span>
                      <span className="text-xl font-bold text-content-primary">
                        {parseFloat(calculation.totals.totalCostPerTrip).toFixed(2)}
                      </span>
                    </div>
                    {calculation.totals.totalCostPerMonth && (
                      <div className="flex justify-between">
                        <span className="text-content-secondary">Total Cost Per Month:</span>
                        <span className="text-xl font-bold text-content-primary">
                          {parseFloat(calculation.totals.totalCostPerMonth).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-content-secondary">Cost Per Ton Per Km:</span>
                      <span className="text-content-primary font-medium">
                        {parseFloat(calculation.totals.costPerTonPerKm).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-content-secondary">Cost Per Ton Per Km (w/ Empty Leg):</span>
                      <span className="text-content-primary font-medium">
                        {parseFloat(calculation.totals.costPerTonPerKmIncludingEmptyLeg).toFixed(4)}
                      </span>
                    </div>
                    <div className="border-t border-border-default pt-3 mt-3">
                      <div className="flex justify-between mb-2">
                        <span className="text-content-secondary">Sales Price (with margin):</span>
                        <span className="text-2xl font-bold text-status-success">
                          {parseFloat(calculation.totals.salesPriceWithProfitMargin).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-content-secondary">Sales Price Per Ton:</span>
                        <span className="text-xl font-bold text-status-success">
                          {parseFloat(calculation.totals.salesPricePerTon).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-12 text-center border-2 border-dashed border-border-default">
                <Calculator className="w-16 h-16 mx-auto mb-4 text-content-tertiary" />
                <p className="text-content-secondary">Enter parameters and click Calculate to see results</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

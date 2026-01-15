import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Calculator,
  Truck,
  HardHat,
  Drill,
  Factory,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Mountain,
  Plus,
  Minus,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import {
  quarryPlanningService,
  QuarryMachine,
  QuarryPlanningResult,
  CreateQuarryPlanDto,
} from '@services/quarry-planning/quarry-planning';

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function MachineCard({
  machine,
  selected,
  onSelect,
  count,
  onCountChange,
  showCounter = false,
}: {
  machine: QuarryMachine;
  selected: boolean;
  onSelect: () => void;
  count?: number;
  onCountChange?: (count: number) => void;
  showCounter?: boolean;
}) {
  const totalCostPerHour =
    machine.fuelCostPerHour + machine.maintenanceCostPerHour + machine.ownershipCostPerHour;

  return (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        selected
          ? 'border-accent-primary bg-accent-primary/5'
          : 'border-border-default hover:border-border-hover'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-content-primary">{machine.name}</h4>
        <Badge variant={selected ? 'success' : 'default'} size="sm">
          {machine.availabilityPercent}% avail
        </Badge>
      </div>
      <div className="text-sm text-content-secondary mb-2">
        {machine.manufacturer} {machine.model}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-content-tertiary">Capacity:</span>
          <span className="ml-1 text-content-primary font-medium">
            {machine.capacity} {machine.capacityUnit}
          </span>
        </div>
        <div>
          <span className="text-content-tertiary">Cost/hr:</span>
          <span className="ml-1 text-content-primary font-medium">${totalCostPerHour}</span>
        </div>
      </div>
      {showCounter && selected && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              if (onCountChange && count && count > 1) onCountChange(count - 1);
            }}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="w-8 text-center font-medium">{count || 1}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              if (onCountChange) onCountChange((count || 1) + 1);
            }}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  variant = 'default',
  subtext,
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  subtext?: string;
}) {
  const variantStyles = {
    default: 'bg-background-elevated',
    success: 'bg-status-success/10 border-status-success/20',
    warning: 'bg-status-warning/10 border-status-warning/20',
    danger: 'bg-status-error/10 border-status-error/20',
  };

  const iconStyles = {
    default: 'text-accent-primary',
    success: 'text-status-success',
    warning: 'text-status-warning',
    danger: 'text-status-error',
  };

  return (
    <div className={`p-4 rounded-lg border ${variantStyles[variant]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${iconStyles[variant]}`} />
        <span className="text-sm text-content-secondary">{title}</span>
      </div>
      <div className="text-2xl font-semibold text-content-primary">
        {value}
        {unit && <span className="text-sm ml-1 text-content-tertiary">{unit}</span>}
      </div>
      {subtext && <div className="text-xs text-content-tertiary mt-1">{subtext}</div>}
    </div>
  );
}

function CostBreakdownTable({ costs }: { costs: QuarryPlanningResult['costBreakdown'] }) {
  const stages = [
    { name: 'Drilling', data: costs.drilling },
    { name: 'Excavating', data: costs.excavating },
    { name: 'Hauling', data: costs.hauling },
    { name: 'Crushing', data: costs.crushing },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className="text-left py-2 px-3 text-content-secondary font-medium">Stage</th>
            <th className="text-right py-2 px-3 text-content-secondary font-medium">Fuel</th>
            <th className="text-right py-2 px-3 text-content-secondary font-medium">Maint.</th>
            <th className="text-right py-2 px-3 text-content-secondary font-medium">Owner.</th>
            <th className="text-right py-2 px-3 text-content-secondary font-medium">Total/hr</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((stage) => (
            <tr key={stage.name} className="border-b border-border-subtle">
              <td className="py-2 px-3 text-content-primary">{stage.name}</td>
              <td className="py-2 px-3 text-right text-content-secondary">
                ${stage.data.fuelPerHour.toFixed(0)}
              </td>
              <td className="py-2 px-3 text-right text-content-secondary">
                ${stage.data.maintenancePerHour.toFixed(0)}
              </td>
              <td className="py-2 px-3 text-right text-content-secondary">
                ${stage.data.ownershipPerHour.toFixed(0)}
              </td>
              <td className="py-2 px-3 text-right font-medium text-content-primary">
                ${stage.data.totalPerHour.toFixed(0)}
              </td>
            </tr>
          ))}
          <tr className="bg-background-secondary">
            <td className="py-2 px-3 font-semibold text-content-primary">TOTAL</td>
            <td className="py-2 px-3 text-right text-content-secondary">
              ${(costs.drilling.fuelPerHour + costs.excavating.fuelPerHour + costs.hauling.fuelPerHour + costs.crushing.fuelPerHour).toFixed(0)}
            </td>
            <td className="py-2 px-3 text-right text-content-secondary">
              ${(costs.drilling.maintenancePerHour + costs.excavating.maintenancePerHour + costs.hauling.maintenancePerHour + costs.crushing.maintenancePerHour).toFixed(0)}
            </td>
            <td className="py-2 px-3 text-right text-content-secondary">
              ${(costs.drilling.ownershipPerHour + costs.excavating.ownershipPerHour + costs.hauling.ownershipPerHour + costs.crushing.ownershipPerHour).toFixed(0)}
            </td>
            <td className="py-2 px-3 text-right font-bold text-content-primary">
              ${costs.total.perHour.toFixed(0)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ProductionFlowChart({ rates }: { rates: QuarryPlanningResult['productionRates'] }) {
  const stages = [
    {
      name: 'Drilling',
      tonsPerHour: rates.drilling.tonsPerHour,
      detail: `${rates.drilling.metersPerHour.toFixed(1)} m/hr`,
      icon: Drill,
    },
    {
      name: 'Excavating',
      tonsPerHour: rates.excavating.tonsPerHour,
      detail: `${rates.excavating.cubicMetersPerHour.toFixed(0)} m³/hr`,
      icon: HardHat,
    },
    {
      name: 'Hauling',
      tonsPerHour: rates.hauling.totalTonsPerHour,
      detail: `${rates.hauling.truckCount} trucks`,
      icon: Truck,
    },
    {
      name: 'Crushing',
      tonsPerHour: rates.crushing.tonsPerHour,
      detail: 'Final output',
      icon: Factory,
    },
  ];

  const maxTons = Math.max(...stages.map((s) => s.tonsPerHour));

  return (
    <div className="space-y-3">
      {stages.map((stage, index) => {
        const isBottleneck = stage.name === rates.bottleneck.stage;
        const percentage = (stage.tonsPerHour / maxTons) * 100;

        return (
          <div key={stage.name}>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <stage.icon className="w-4 h-4 text-content-tertiary" />
                <span className="text-sm font-medium text-content-primary">{stage.name}</span>
                {isBottleneck && (
                  <Badge variant="warning" size="sm">
                    Bottleneck
                  </Badge>
                )}
              </div>
              <div className="text-sm">
                <span className="font-medium text-content-primary">
                  {stage.tonsPerHour.toFixed(0)} t/hr
                </span>
                <span className="text-content-tertiary ml-2">({stage.detail})</span>
              </div>
            </div>
            <div className="h-3 bg-background-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isBottleneck ? 'bg-status-warning' : 'bg-accent-primary'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            {index < stages.length - 1 && (
              <div className="flex justify-center my-1">
                <div className="w-0.5 h-3 bg-border-default" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WhatIfScenarios({ scenarios }: { scenarios: QuarryPlanningResult['whatIfScenarios'] }) {
  return (
    <div className="space-y-3">
      {scenarios.map((scenario, index) => (
        <div
          key={index}
          className="p-4 rounded-lg border border-border-default bg-background-elevated"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-medium text-content-primary">{scenario.name}</h4>
              <p className="text-sm text-content-secondary">{scenario.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <div className="text-center p-2 bg-background-secondary rounded">
              <div className="text-xs text-content-tertiary">Production</div>
              <div className="text-sm font-medium text-content-primary">
                {scenario.result.newProductionRate.toFixed(0)} t/hr
              </div>
              <div
                className={`text-xs flex items-center justify-center gap-1 ${
                  scenario.result.productionChange >= 0 ? 'text-status-success' : 'text-status-error'
                }`}
              >
                {scenario.result.productionChange >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {scenario.result.productionChange.toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-2 bg-background-secondary rounded">
              <div className="text-xs text-content-tertiary">Cost/Ton</div>
              <div className="text-sm font-medium text-content-primary">
                ${scenario.result.newCostPerTon.toFixed(2)}
              </div>
              <div
                className={`text-xs flex items-center justify-center gap-1 ${
                  scenario.result.costChange <= 0 ? 'text-status-success' : 'text-status-error'
                }`}
              >
                {scenario.result.costChange <= 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <TrendingUp className="w-3 h-3" />
                )}
                {Math.abs(scenario.result.costChange).toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-2 bg-background-secondary rounded col-span-2">
              <div className="text-xs text-content-tertiary">New Bottleneck</div>
              <div className="text-sm font-medium text-content-primary">
                {scenario.result.newBottleneck}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export function QuarryPlanningPage() {
  // State for machine selection
  const [selectedDrill, setSelectedDrill] = useState<string | null>(null);
  const [selectedExcavator, setSelectedExcavator] = useState<string | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [truckCount, setTruckCount] = useState(2);
  const [selectedCrusher, setSelectedCrusher] = useState<string | null>(null);

  // State for parameters
  const [rockDensity, setRockDensity] = useState(2.6);
  const [drilledMetersToBlastVolume, setDrilledMetersToBlastVolume] = useState(50);
  const [operatingHoursPerDay, setOperatingHoursPerDay] = useState(10);
  const [operatingDaysPerMonth, setOperatingDaysPerMonth] = useState(25);
  const [quarryReserves, setQuarryReserves] = useState(5000000);

  // Fetch machines
  const { data: machines, isLoading: machinesLoading } = useQuery({
    queryKey: ['quarry-machines'],
    queryFn: quarryPlanningService.getMachinesGrouped,
  });

  // Calculate plan mutation
  const calculateMutation = useMutation({
    mutationFn: quarryPlanningService.calculatePlan,
  });

  // Auto-select first machines when loaded
  useMemo(() => {
    if (machines && !selectedDrill) {
      setSelectedDrill(machines.drills[0]?.id || null);
      setSelectedExcavator(machines.excavators[0]?.id || null);
      setSelectedTruck(machines.trucks[0]?.id || null);
      setSelectedCrusher(machines.crushers[0]?.id || null);
    }
  }, [machines, selectedDrill]);

  // Check if configuration is complete
  const isConfigComplete =
    selectedDrill && selectedExcavator && selectedTruck && selectedCrusher && quarryReserves > 0;

  // Handle calculate
  const handleCalculate = () => {
    if (!isConfigComplete) return;

    const dto: CreateQuarryPlanDto = {
      drillId: selectedDrill!,
      excavatorId: selectedExcavator!,
      truckIds: Array(truckCount).fill(selectedTruck!),
      crusherId: selectedCrusher!,
      rockDensity,
      drilledMetersToBlastVolume,
      operatingHoursPerDay,
      operatingDaysPerMonth,
      quarryReserves,
    };

    calculateMutation.mutate(dto);
  };

  const result = calculateMutation.data;

  if (machinesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="p-2 bg-accent-primary/10 rounded-lg">
          <Calculator className="w-6 h-6 text-accent-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-content-primary">Quarry Planning</h1>
          <p className="text-sm text-content-secondary">
            Calculate production rates, costs, and quarry life based on equipment configuration
          </p>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Selection */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-content-primary mb-4">Equipment Selection</h3>

            {/* Drill Selection */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-content-secondary mb-3 flex items-center gap-2">
                <Drill className="w-4 h-4" /> Drilling Machine
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {machines?.drills.map((machine) => (
                  <MachineCard
                    key={machine.id}
                    machine={machine}
                    selected={selectedDrill === machine.id}
                    onSelect={() => setSelectedDrill(machine.id)}
                  />
                ))}
              </div>
            </div>

            {/* Excavator Selection */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-content-secondary mb-3 flex items-center gap-2">
                <HardHat className="w-4 h-4" /> Excavator
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {machines?.excavators.map((machine) => (
                  <MachineCard
                    key={machine.id}
                    machine={machine}
                    selected={selectedExcavator === machine.id}
                    onSelect={() => setSelectedExcavator(machine.id)}
                  />
                ))}
              </div>
            </div>

            {/* Truck Selection */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-content-secondary mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Haul Trucks
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {machines?.trucks.map((machine) => (
                  <MachineCard
                    key={machine.id}
                    machine={machine}
                    selected={selectedTruck === machine.id}
                    onSelect={() => setSelectedTruck(machine.id)}
                    showCounter
                    count={selectedTruck === machine.id ? truckCount : 0}
                    onCountChange={setTruckCount}
                  />
                ))}
              </div>
            </div>

            {/* Crusher Selection */}
            <div>
              <h4 className="text-sm font-medium text-content-secondary mb-3 flex items-center gap-2">
                <Factory className="w-4 h-4" /> Crusher
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {machines?.crushers.map((machine) => (
                  <MachineCard
                    key={machine.id}
                    machine={machine}
                    selected={selectedCrusher === machine.id}
                    onSelect={() => setSelectedCrusher(machine.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Parameters */}
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-content-primary mb-4">
                Quarry Parameters
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Rock Density (t/m³)"
                  type="number"
                  step="0.1"
                  value={rockDensity}
                  onChange={(e) => setRockDensity(parseFloat(e.target.value) || 2.6)}
                />
                <Input
                  label="Blast Volume (m³/drilled m)"
                  type="number"
                  value={drilledMetersToBlastVolume}
                  onChange={(e) =>
                    setDrilledMetersToBlastVolume(parseInt(e.target.value) || 50)
                  }
                />
                <Input
                  label="Operating Hours/Day"
                  type="number"
                  value={operatingHoursPerDay}
                  onChange={(e) => setOperatingHoursPerDay(parseInt(e.target.value) || 10)}
                />
                <Input
                  label="Operating Days/Month"
                  type="number"
                  value={operatingDaysPerMonth}
                  onChange={(e) => setOperatingDaysPerMonth(parseInt(e.target.value) || 25)}
                />
                <div className="col-span-2">
                  <Input
                    label="Total Quarry Reserves (tons)"
                    type="number"
                    value={quarryReserves}
                    onChange={(e) => setQuarryReserves(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handleCalculate}
                disabled={!isConfigComplete}
                isLoading={calculateMutation.isPending}
              >
                <Calculator className="w-5 h-5 mr-2" />
                Calculate Quarry Plan
              </Button>
            </div>
          </Card>

          {/* Quick Stats Preview */}
          {result && (
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                title="Production Rate"
                value={result.productionRates.effective.tonsPerHour.toFixed(0)}
                unit="t/hr"
                icon={TrendingUp}
                variant="success"
              />
              <StatCard
                title="Cost per Ton"
                value={`$${result.costBreakdown.total.perTon.toFixed(2)}`}
                icon={DollarSign}
              />
              <StatCard
                title="Daily Output"
                value={result.productionRates.effective.tonsPerDay.toFixed(0)}
                unit="tons"
                icon={Factory}
              />
              <StatCard
                title="Quarry Life"
                value={result.quarryLife.yearsRemaining.toFixed(1)}
                unit="years"
                icon={Clock}
                variant={result.quarryLife.yearsRemaining < 5 ? 'warning' : 'default'}
              />
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <>
          {/* Bottleneck Alert */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-status-warning" />
                <h3 className="text-lg font-semibold text-content-primary">
                  Bottleneck Analysis
                </h3>
              </div>
              <div className="bg-status-warning/10 border border-status-warning/20 rounded-lg p-4">
                <p className="text-content-primary">
                  <span className="font-semibold">{result.productionRates.bottleneck.stage}</span> is
                  the limiting factor, capping production at{' '}
                  <span className="font-semibold">
                    {result.productionRates.bottleneck.limitingCapacity.toFixed(0)} tons/hour
                  </span>
                  .
                </p>
                <p className="text-sm text-content-secondary mt-2">
                  Machine: {result.productionRates.bottleneck.machine.name}
                </p>
              </div>
            </div>
          </Card>

          {/* Production Flow */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-content-primary mb-4">
                Production Flow (Material → Product)
              </h3>
              <ProductionFlowChart rates={result.productionRates} />
            </div>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-content-primary mb-4">
                Cost Breakdown ($/hour)
              </h3>
              <CostBreakdownTable costs={result.costBreakdown} />

              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border-default">
                <div className="text-center">
                  <div className="text-sm text-content-tertiary">Cost per Day</div>
                  <div className="text-xl font-semibold text-content-primary">
                    ${result.costBreakdown.total.perDay.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-content-tertiary">Cost per Month</div>
                  <div className="text-xl font-semibold text-content-primary">
                    ${result.costBreakdown.total.perMonth.toLocaleString()}
                  </div>
                </div>
                <div className="text-center bg-accent-primary/10 rounded-lg py-2">
                  <div className="text-sm text-accent-primary">Cost per Ton</div>
                  <div className="text-xl font-bold text-accent-primary">
                    ${result.costBreakdown.total.perTon.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Quarry Life */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Mountain className="w-6 h-6 text-accent-primary" />
                <h3 className="text-lg font-semibold text-content-primary">
                  Quarry Life Estimate
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-background-secondary rounded-lg text-center">
                  <div className="text-sm text-content-tertiary">Total Reserves</div>
                  <div className="text-xl font-semibold text-content-primary">
                    {(result.quarryLife.totalReserves / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-xs text-content-tertiary">tons</div>
                </div>
                <div className="p-4 bg-background-secondary rounded-lg text-center">
                  <div className="text-sm text-content-tertiary">Daily Production</div>
                  <div className="text-xl font-semibold text-content-primary">
                    {result.quarryLife.productionPerDay.toLocaleString()}
                  </div>
                  <div className="text-xs text-content-tertiary">tons/day</div>
                </div>
                <div className="p-4 bg-background-secondary rounded-lg text-center">
                  <div className="text-sm text-content-tertiary">Annual Production</div>
                  <div className="text-xl font-semibold text-content-primary">
                    {(result.quarryLife.productionPerYear / 1000000).toFixed(2)}M
                  </div>
                  <div className="text-xs text-content-tertiary">tons/year</div>
                </div>
                <div
                  className={`p-4 rounded-lg text-center ${
                    result.quarryLife.yearsRemaining < 5
                      ? 'bg-status-warning/10'
                      : 'bg-status-success/10'
                  }`}
                >
                  <div className="text-sm text-content-tertiary">Remaining Life</div>
                  <div className="text-xl font-bold text-content-primary">
                    {result.quarryLife.yearsRemaining.toFixed(1)}
                  </div>
                  <div className="text-xs text-content-tertiary">years</div>
                </div>
              </div>
            </div>
          </Card>

          {/* What-If Scenarios */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-content-primary mb-4">
                What-If Scenarios
              </h3>
              <p className="text-sm text-content-secondary mb-4">
                See how changes to your equipment configuration would affect production and costs.
              </p>
              <WhatIfScenarios scenarios={result.whatIfScenarios} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

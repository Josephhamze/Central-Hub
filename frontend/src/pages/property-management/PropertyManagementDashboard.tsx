import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  Wrench,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Home,
  Calendar,
  CreditCard,
  PieChart,
  Activity,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import propertyManagementService, {
  DashboardData,
  PropertyHealthStatus,
  PropertyStatus,
} from '@/services/property-management';

const formatCurrency = (value: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

const getHealthColor = (status: PropertyHealthStatus) => {
  switch (status) {
    case PropertyHealthStatus.HEALTHY:
      return 'text-status-success';
    case PropertyHealthStatus.AT_RISK:
      return 'text-status-warning';
    case PropertyHealthStatus.UNDERPERFORMING:
      return 'text-status-error';
    case PropertyHealthStatus.NON_PERFORMING:
      return 'text-status-error';
    default:
      return 'text-content-secondary';
  }
};

const getStatusColor = (status: PropertyStatus) => {
  switch (status) {
    case PropertyStatus.OCCUPIED:
      return 'bg-status-success/10 text-status-success';
    case PropertyStatus.VACANT:
      return 'bg-status-warning/10 text-status-warning';
    case PropertyStatus.UNDER_MAINTENANCE:
      return 'bg-status-error/10 text-status-error';
    case PropertyStatus.LISTED:
      return 'bg-accent-primary/10 text-accent-primary';
    default:
      return 'bg-content-tertiary/10 text-content-tertiary';
  }
};

export function PropertyManagementDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await propertyManagementService.getDashboardData();
      setDashboardData(data);
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-content-secondary">Failed to load dashboard data</p>
        <Button onClick={loadDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  // Provide default values to handle empty/missing data
  const portfolioKPIs = dashboardData.portfolioKPIs || {
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    portfolioOccupancyRate: 0,
    totalMarketValue: 0,
    totalMonthlyRentalIncome: 0,
    totalAnnualRentalIncome: 0,
    totalRentBilled: 0,
    totalRentCollected: 0,
    portfolioCollectionRate: 0,
    totalArrears: 0,
    arrearsPercentage: 0,
    totalOperatingExpenses: 0,
    totalMaintenanceCosts: 0,
    totalUtilityCosts: 0,
    portfolioNOI: 0,
    portfolioGrossYield: 0,
    portfolioNetYield: 0,
    propertiesByHealth: {} as Record<PropertyHealthStatus, number>,
    propertiesByStatus: {} as Record<PropertyStatus, number>,
  };
  const problemProperties = dashboardData.problemProperties || [];
  const expiringLeases = dashboardData.expiringLeases || [];
  const arrearsReport = dashboardData.arrearsReport || [];
  const recentPayments = dashboardData.recentPayments || [];
  const openMaintenanceJobs = dashboardData.openMaintenanceJobs || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Property Management</h1>
          <p className="text-content-secondary">Portfolio overview and key metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadDashboardData}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => window.location.href = '/property-management/properties/new'}>
            Add Property
          </Button>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-content-secondary">Total Properties</p>
              <p className="text-2xl font-bold text-content-primary mt-1">{portfolioKPIs.totalProperties}</p>
              <p className="text-sm text-content-tertiary mt-1">{portfolioKPIs.totalUnits} units</p>
            </div>
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <Building2 className="w-5 h-5 text-accent-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-content-secondary">Occupancy Rate</p>
              <p className="text-2xl font-bold text-content-primary mt-1">{formatPercent(portfolioKPIs.portfolioOccupancyRate)}</p>
              <p className="text-sm text-content-tertiary mt-1">
                {portfolioKPIs.occupiedUnits} / {portfolioKPIs.totalUnits} units
              </p>
            </div>
            <div className="p-2 bg-status-success/10 rounded-lg">
              <Home className="w-5 h-5 text-status-success" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-content-secondary">Monthly Income</p>
              <p className="text-2xl font-bold text-content-primary mt-1">
                {formatCurrency(portfolioKPIs.totalMonthlyRentalIncome)}
              </p>
              <p className="text-sm text-content-tertiary mt-1">
                {formatPercent(portfolioKPIs.portfolioCollectionRate)} collected
              </p>
            </div>
            <div className="p-2 bg-status-success/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-status-success" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-content-secondary">Total Arrears</p>
              <p className="text-2xl font-bold text-status-error mt-1">
                {formatCurrency(portfolioKPIs.totalArrears)}
              </p>
              <p className="text-sm text-content-tertiary mt-1">
                {formatPercent(portfolioKPIs.arrearsPercentage)} of billed
              </p>
            </div>
            <div className="p-2 bg-status-error/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-status-error" />
            </div>
          </div>
        </Card>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Financial Performance
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border-default">
              <span className="text-content-secondary">Portfolio Value</span>
              <span className="font-semibold text-content-primary">
                {formatCurrency(portfolioKPIs.totalMarketValue)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border-default">
              <span className="text-content-secondary">Annual Rental Income</span>
              <span className="font-semibold text-content-primary">
                {formatCurrency(portfolioKPIs.totalAnnualRentalIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border-default">
              <span className="text-content-secondary">Operating Expenses (MTD)</span>
              <span className="font-semibold text-status-error">
                {formatCurrency(portfolioKPIs.totalOperatingExpenses)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border-default">
              <span className="text-content-secondary">Net Operating Income</span>
              <span className={`font-semibold ${portfolioKPIs.portfolioNOI >= 0 ? 'text-status-success' : 'text-status-error'}`}>
                {formatCurrency(portfolioKPIs.portfolioNOI)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border-default">
              <span className="text-content-secondary">Gross Yield</span>
              <span className="font-semibold text-content-primary">
                {formatPercent(portfolioKPIs.portfolioGrossYield)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-content-secondary">Net Yield</span>
              <span className={`font-semibold ${portfolioKPIs.portfolioNetYield >= 5 ? 'text-status-success' : 'text-status-warning'}`}>
                {formatPercent(portfolioKPIs.portfolioNetYield)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Property Health Distribution
          </h2>
          <div className="space-y-3">
            {Object.entries(portfolioKPIs.propertiesByHealth).map(([status, count]) => {
              const total = portfolioKPIs.totalProperties || 1;
              const percentage = (count / total) * 100;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={getHealthColor(status as PropertyHealthStatus)}>{status.replace('_', ' ')}</span>
                    <span className="text-content-secondary">{count} ({formatPercent(percentage)})</span>
                  </div>
                  <div className="w-full bg-background-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        status === PropertyHealthStatus.HEALTHY ? 'bg-status-success' :
                        status === PropertyHealthStatus.AT_RISK ? 'bg-status-warning' :
                        'bg-status-error'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <h3 className="text-md font-semibold text-content-primary mt-6 mb-3">By Status</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(portfolioKPIs.propertiesByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(status as PropertyStatus)}`}>
                  {status.replace('_', ' ')}
                </span>
                <span className="text-content-secondary text-sm">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Problem Properties */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-status-error" />
            Problem Properties
          </h2>
          {problemProperties.length === 0 ? (
            <div className="text-center py-8 text-content-tertiary">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-status-success" />
              <p>All properties are performing well</p>
            </div>
          ) : (
            <div className="space-y-3">
              {problemProperties.slice(0, 5).map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-3 bg-background-secondary rounded-lg cursor-pointer hover:bg-background-tertiary"
                  onClick={() => window.location.href = `/property-management/properties/${property.id}`}
                >
                  <div>
                    <p className="font-medium text-content-primary">{property.name}</p>
                    <p className="text-sm text-content-tertiary">{property.city}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    property.healthStatus === PropertyHealthStatus.NON_PERFORMING
                      ? 'bg-status-error/10 text-status-error'
                      : 'bg-status-warning/10 text-status-warning'
                  }`}>
                    {property.healthStatus?.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Expiring Leases */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-status-warning" />
            Expiring Leases (30 days)
          </h2>
          {expiringLeases.length === 0 ? (
            <div className="text-center py-8 text-content-tertiary">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-status-success" />
              <p>No leases expiring soon</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expiringLeases.slice(0, 5).map((lease) => (
                <div
                  key={lease.id}
                  className="flex items-center justify-between p-3 bg-background-secondary rounded-lg cursor-pointer hover:bg-background-tertiary"
                  onClick={() => window.location.href = `/property-management/leases/${lease.id}`}
                >
                  <div>
                    <p className="font-medium text-content-primary">
                      {lease.tenant?.isCompany ? lease.tenant?.companyName : `${lease.tenant?.firstName} ${lease.tenant?.lastName}`}
                    </p>
                    <p className="text-sm text-content-tertiary">{lease.property?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-status-warning">
                      {new Date(lease.endDate!).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-content-tertiary">
                      {Math.ceil((new Date(lease.endDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Arrears */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-status-error" />
            Top Arrears
          </h2>
          {arrearsReport.length === 0 ? (
            <div className="text-center py-8 text-content-tertiary">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-status-success" />
              <p>No outstanding arrears</p>
            </div>
          ) : (
            <div className="space-y-3">
              {arrearsReport.slice(0, 5).map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-background-secondary rounded-lg"
                >
                  <div>
                    <p className="font-medium text-content-primary">{entry.tenantName}</p>
                    <p className="text-sm text-content-tertiary">{entry.propertyName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-status-error">
                      {formatCurrency(entry.amount)}
                    </p>
                    <p className="text-xs text-content-tertiary">
                      {entry.daysPastDue} days overdue
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-status-success" />
            Recent Payments
          </h2>
          {recentPayments.length === 0 ? (
            <p className="text-content-tertiary text-center py-4">No recent payments</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-background-secondary rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-status-success/10 rounded-full">
                      <DollarSign className="w-4 h-4 text-status-success" />
                    </div>
                    <div>
                      <p className="font-medium text-content-primary">
                        {payment.tenant?.isCompany ? payment.tenant?.companyName : `${payment.tenant?.firstName} ${payment.tenant?.lastName}`}
                      </p>
                      <p className="text-sm text-content-tertiary">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-status-success">
                    +{formatCurrency(payment.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Open Maintenance */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-status-warning" />
            Open Maintenance Jobs
          </h2>
          {openMaintenanceJobs.length === 0 ? (
            <div className="text-center py-8 text-content-tertiary">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-status-success" />
              <p>No open maintenance jobs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openMaintenanceJobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 bg-background-secondary rounded-lg cursor-pointer hover:bg-background-tertiary"
                  onClick={() => window.location.href = `/property-management/maintenance/${job.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      job.priority === 'URGENT' ? 'bg-status-error/10' :
                      job.priority === 'HIGH' ? 'bg-status-warning/10' :
                      'bg-background-tertiary'
                    }`}>
                      <Wrench className={`w-4 h-4 ${
                        job.priority === 'URGENT' ? 'text-status-error' :
                        job.priority === 'HIGH' ? 'text-status-warning' :
                        'text-content-tertiary'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-content-primary">{job.title}</p>
                      <p className="text-sm text-content-tertiary">{job.property?.name}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    job.status === 'PENDING' ? 'bg-status-warning/10 text-status-warning' :
                    job.status === 'IN_PROGRESS' ? 'bg-accent-primary/10 text-accent-primary' :
                    'bg-background-tertiary text-content-tertiary'
                  }`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-content-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Button
            variant="secondary"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => window.location.href = '/property-management/properties'}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-sm">Properties</span>
          </Button>
          <Button
            variant="secondary"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => window.location.href = '/property-management/tenants'}
          >
            <Users className="w-5 h-5" />
            <span className="text-sm">Tenants</span>
          </Button>
          <Button
            variant="secondary"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => window.location.href = '/property-management/leases'}
          >
            <FileText className="w-5 h-5" />
            <span className="text-sm">Leases</span>
          </Button>
          <Button
            variant="secondary"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => window.location.href = '/property-management/payments'}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-sm">Payments</span>
          </Button>
          <Button
            variant="secondary"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => window.location.href = '/property-management/expenses'}
          >
            <TrendingDown className="w-5 h-5" />
            <span className="text-sm">Expenses</span>
          </Button>
          <Button
            variant="secondary"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => window.location.href = '/property-management/maintenance'}
          >
            <Wrench className="w-5 h-5" />
            <span className="text-sm">Maintenance</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default PropertyManagementDashboard;

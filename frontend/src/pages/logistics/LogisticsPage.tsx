import { useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Calculator, Receipt } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { useAuth } from '@contexts/AuthContext';

export function LogisticsPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canViewRoutes = hasPermission('logistics:routes:view');
  const canViewTolls = hasPermission('logistics:tolls:view');
  const canViewCosting = hasPermission('logistics:costing:view');
  const canViewPayments = hasPermission('logistics:toll_payments:view');

  const features = [
    {
      name: 'Routes',
      description: 'Manage delivery routes, distances, and toll station assignments',
      icon: MapPin,
      path: '/logistics/routes',
      permission: canViewRoutes,
    },
    {
      name: 'Toll Stations',
      description: 'Manage toll stations and rates by vehicle type',
      icon: DollarSign,
      path: '/logistics/toll-stations',
      permission: canViewTolls,
    },
    {
      name: 'Route Costing',
      description: 'Calculate transport costs and pricing for routes',
      icon: Calculator,
      path: '/logistics/route-costing',
      permission: canViewCosting,
    },
    {
      name: 'Toll Payments',
      description: 'Record and reconcile actual toll payments',
      icon: Receipt,
      path: '/logistics/toll-payments',
      permission: canViewPayments,
    },
  ];

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Logistics & Transport</h1>
          <p className="text-content-secondary mt-1">Manage routes, tolls, and transport costing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.path}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => feature.permission && navigate(feature.path)}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-accent-primary/10">
                    <Icon className="w-6 h-6 text-accent-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-content-primary mb-1">{feature.name}</h3>
                    <p className="text-sm text-content-secondary mb-4">{feature.description}</p>
                    {feature.permission ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(feature.path);
                        }}
                      >
                        Open
                      </Button>
                    ) : (
                      <p className="text-xs text-content-tertiary">Permission required</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}



import { useQuery } from '@tanstack/react-query';
import { Calculator } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { EmptyState } from '@components/ui/EmptyState';
import { depreciationApi } from '@services/assets/depreciation';

export function DepreciationPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['depreciation', 'profiles'],
    queryFn: () => depreciationApi.findAll(1, 50),
  });

  return (
    <PageContainer
      title="Depreciation"
      description="Manage asset depreciation profiles and entries"
    >
      {isLoading ? (
        <div className="text-center py-12 text-content-secondary">Loading...</div>
      ) : !data || data.items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Calculator className="w-8 h-8" />}
            title="No Depreciation Profiles"
            description="Create depreciation profiles for assets to track their value over time"
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {data.items.map((profile) => (
            <Card key={profile.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-content-primary mb-1">
                    {profile.asset?.name || 'Unknown Asset'}
                  </h3>
                  <p className="text-sm text-content-secondary">
                    {profile.asset?.assetTag} • {profile.method.replace('_', ' ')} method
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-content-tertiary">Useful Life</p>
                  <p className="text-lg font-semibold text-content-primary">{profile.usefulLifeYears} years</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

import { useNavigate } from 'react-router-dom';
import { Building2, FolderKanban, Users, Shield } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';

export function AdministrationPage() {
  const navigate = useNavigate();

  return (
    <PageContainer
      title="Administration"
      description="System configuration and management"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/administration/companies')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-accent-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-content-primary mb-1">Companies</h3>
              <p className="text-sm text-content-secondary">Manage company directory</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/administration/projects')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-accent-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-content-primary mb-1">Projects</h3>
              <p className="text-sm text-content-secondary">Manage company projects</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/administration/users')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-content-primary mb-1">Users</h3>
              <p className="text-sm text-content-secondary">Manage system users</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/administration/roles')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-accent-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-content-primary mb-1">Roles & Permissions</h3>
              <p className="text-sm text-content-secondary">Manage roles and permissions</p>
            </div>
          </div>
        </Card>

      </div>
    </PageContainer>
  );
}

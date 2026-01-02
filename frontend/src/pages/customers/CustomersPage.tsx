import { useNavigate } from 'react-router-dom';
import { Users, UserCircle, FileText } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';

export function CustomersPage() {
  const navigate = useNavigate();

  return (
    <PageContainer
      title="Customers & Sales"
      description="Manage customer relationships and sales activities"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/customers/customers')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-content-primary mb-1">Customers</h3>
              <p className="text-sm text-content-secondary">Manage customer directory</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/customers/contacts')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-accent-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-content-primary mb-1">Contacts</h3>
              <p className="text-sm text-content-secondary">Manage customer contacts</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/sales/quotes/new')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-accent-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-content-primary mb-1">Create Quote</h3>
              <p className="text-sm text-content-secondary">Generate a new sales quote</p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

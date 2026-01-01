import { Users } from 'lucide-react';
import { ModulePlaceholder } from '@components/common/ModulePlaceholder';

export function CustomersPage() {
  return (
    <ModulePlaceholder
      title="Customers & Sales"
      description="Manage customer relationships and sales activities"
      icon={<Users className="w-8 h-8 text-content-secondary" />}
      sections={[
        {
          name: 'Customer Directory',
          description: 'Manage customer database',
        },
        {
          name: 'Orders',
          description: 'Process and track orders',
        },
        {
          name: 'Quotes',
          description: 'Create and manage quotations',
        },
        {
          name: 'Contracts',
          description: 'Manage customer contracts',
        },
        {
          name: 'Invoicing',
          description: 'Generate and track invoices',
        },
        {
          name: 'Customer Support',
          description: 'Handle customer inquiries',
        },
      ]}
      features={[
        'Customer profile management',
        'Order processing workflow',
        'Quote generation',
        'Contract lifecycle management',
        'Invoice generation and tracking',
        'Payment tracking',
        'Customer communication history',
        'Sales pipeline management',
      ]}
    />
  );
}

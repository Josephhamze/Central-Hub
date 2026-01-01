import { type ReactNode } from 'react';
import { Construction, ArrowRight } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { EmptyState } from '@components/ui/EmptyState';

interface Section {
  name: string;
  description: string;
}

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: ReactNode;
  sections: Section[];
  features?: string[];
}

export function ModulePlaceholder({
  title,
  description,
  icon,
  sections,
  features = [],
}: ModulePlaceholderProps) {
  return (
    <PageContainer
      title={title}
      description={description}
      actions={
        <Badge variant="warning">
          <Construction className="w-3 h-3 mr-1" />
          Placeholder
        </Badge>
      }
    >
      {/* Module Info */}
      <Card className="mb-6">
        <div className="flex items-start gap-6">
          <div className="p-4 rounded-2xl bg-background-tertiary">
            {icon}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-content-primary mb-2">
              {title}
            </h2>
            <p className="text-content-tertiary mb-4">{description}</p>
            <p className="text-sm text-content-muted">
              This module is a placeholder. The UI shell and API endpoints are stubbed
              and ready for implementation. Use the AI Prompt Context file to generate
              the actual features.
            </p>
          </div>
        </div>
      </Card>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {sections.map((section) => (
          <Card
            key={section.name}
            className="group cursor-pointer hover:border-accent-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-content-primary">{section.name}</h3>
              <ArrowRight className="w-4 h-4 text-content-muted group-hover:text-accent-primary transition-colors" />
            </div>
            <p className="text-sm text-content-tertiary">{section.description}</p>
            <Badge variant="default" size="sm" className="mt-3">
              Not Implemented
            </Badge>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      <Card>
        <EmptyState
          icon={<Construction className="w-8 h-8" />}
          title="Module Under Development"
          description="This module will be implemented in future iterations. The foundation is ready."
        />
      </Card>

      {/* Features Preview */}
      {features.length > 0 && (
        <Card className="mt-6">
          <h3 className="font-semibold text-content-primary mb-4">
            Planned Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-background-secondary"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-content-muted" />
                <span className="text-sm text-content-secondary">{feature}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageContainer>
  );
}

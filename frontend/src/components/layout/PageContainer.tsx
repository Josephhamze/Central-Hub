import { type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface PageContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageContainer({
  children,
  title,
  description,
  actions,
  className,
}: PageContainerProps) {
  return (
    <div className={clsx('max-w-7xl mx-auto', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            {title && (
              <h1 className="text-2xl font-semibold text-content-primary">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1 text-sm text-content-tertiary">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

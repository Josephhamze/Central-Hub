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
    <div className={clsx('max-w-7xl mx-auto w-full', className)}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            {title && (
              <h1 className="text-xl sm:text-2xl font-semibold text-content-primary">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1 text-sm text-content-tertiary">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3 flex-wrap">{actions}</div>
          )}
        </div>
      )}
      <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {children}
      </div>
    </div>
  );
}

import { Fragment, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return createPortal(
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={clsx(
            'relative w-full bg-background-elevated rounded-xl shadow-elevation-5',
            'pointer-events-auto animate-scale-in flex flex-col',
            'max-h-[90vh]', // Limit modal height to 90% of viewport
            sizes[size]
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-6 pb-4 flex-shrink-0 border-b border-border-default">
              <div>
                {title && (
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-content-primary"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="modal-description"
                    className="mt-1 text-sm text-content-tertiary"
                  >
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 -mt-1 -mr-2 rounded-lg hover:bg-background-hover transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-content-tertiary" />
                </button>
              )}
            </div>
          )}

          {/* Content - Scrollable */}
          <div className="p-6 overflow-y-auto flex-1 min-h-0">{children}</div>
        </div>
      </div>
    </Fragment>,
    document.body
  );
}

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border-default',
        className
      )}
    >
      {children}
    </div>
  );
}

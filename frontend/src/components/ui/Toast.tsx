import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export function Toast({
  message,
  type = 'info',
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-status-success" />,
    error: <AlertCircle className="w-5 h-5 text-status-error" />,
    warning: <AlertTriangle className="w-5 h-5 text-status-warning" />,
    info: <Info className="w-5 h-5 text-status-info" />,
  };

  const backgrounds = {
    success: 'bg-status-success-bg border-status-success/20',
    error: 'bg-status-error-bg border-status-error/20',
    warning: 'bg-status-warning-bg border-status-warning/20',
    info: 'bg-status-info-bg border-status-info/20',
  };

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 200);
  };

  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-elevation-3',
        'min-w-[300px] max-w-[450px]',
        backgrounds[type],
        isLeaving ? 'animate-fade-out' : 'animate-slide-in-right'
      )}
      role="alert"
    >
      {icons[type]}
      <p className="flex-1 text-sm text-content-primary">{message}</p>
      <button
        onClick={handleClose}
        className="p-1 rounded hover:bg-background-hover transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4 text-content-tertiary" />
      </button>
    </div>
  );
}

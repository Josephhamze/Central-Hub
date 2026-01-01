import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  const currentIcon = themes.find((t) => t.value === theme)?.icon || Monitor;
  const CurrentIcon = currentIcon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'p-2 rounded-lg transition-colors',
          'hover:bg-background-hover',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40'
        )}
        aria-label="Toggle theme"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <CurrentIcon className="w-5 h-5 text-content-secondary" />
      </button>

      {isOpen && (
        <div
          className={clsx(
            'absolute right-0 mt-2 w-40 py-1',
            'bg-background-elevated border border-border-default rounded-lg shadow-elevation-3',
            'animate-scale-in origin-top-right z-50'
          )}
          role="menu"
        >
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => {
                setTheme(value);
                setIsOpen(false);
              }}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2 text-sm',
                'hover:bg-background-hover transition-colors',
                theme === value
                  ? 'text-accent-primary'
                  : 'text-content-secondary'
              )}
              role="menuitem"
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{label}</span>
              {theme === value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

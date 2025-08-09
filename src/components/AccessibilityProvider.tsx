// Accessibility Provider Component for React Integration
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { 
  announcer, 
  focusManager, 
  useAnnouncer, 
  useReducedMotion,
  accessibilityTest
} from '@/lib/accessibility';

// Accessibility context
interface AccessibilityContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announcePolite: (message: string) => void;
  announceAssertive: (message: string) => void;
  storeFocus: () => void;
  restoreFocus: () => void;
  prefersReducedMotion: boolean;
  runAccessibilityCheck: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: ReactNode;
  enableDevelopmentChecks?: boolean;
}

export function AccessibilityProvider({ 
  children, 
  enableDevelopmentChecks = process.env.NODE_ENV === 'development' 
}: AccessibilityProviderProps) {
  const { announce, announcePolite, announceAssertive } = useAnnouncer();
  const { prefersReducedMotion } = useReducedMotion();

  // Development-only accessibility checks
  useEffect(() => {
    if (enableDevelopmentChecks) {
      const checkAccessibility = () => {
        const report = accessibilityTest.generateReport();
        
        if (report.missingAltText.length > 0) {
          console.warn('🔍 Accessibility: Found images without alt text:', report.missingAltText);
        }
        
        if (report.missingLabels.length > 0) {
          console.warn('🏷️ Accessibility: Found form controls without labels:', report.missingLabels);
        }
        
        if (report.contrastIssues.length > 0) {
          console.warn('🎨 Accessibility: Found color contrast issues:', report.contrastIssues);
        }
        
        console.info(`✅ Accessibility: Found ${report.focusableElements.length} focusable elements`);
      };

      // Run initial check after DOM is ready
      const timeoutId = setTimeout(checkAccessibility, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [enableDevelopmentChecks]);

  // Set up global keyboard shortcuts for accessibility
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Alt + / to focus search (common accessibility pattern)
      if (event.altKey && event.key === '/') {
        event.preventDefault();
        const searchInput = document.querySelector('input[type="search"]') as HTMLElement;
        if (searchInput) {
          searchInput.focus();
          announcePolite('Search field focused');
        }
      }
      
      // Alt + M to focus main content
      if (event.altKey && event.key === 'm') {
        event.preventDefault();
        const mainContent = document.querySelector('main, [role="main"]') as HTMLElement;
        if (mainContent) {
          mainContent.focus();
          announcePolite('Main content focused');
        }
      }
      
      // Alt + N to focus navigation
      if (event.altKey && event.key === 'n') {
        event.preventDefault();
        const navigation = document.querySelector('nav, [role="navigation"]') as HTMLElement;
        if (navigation) {
          const firstLink = navigation.querySelector('a, button') as HTMLElement;
          if (firstLink) {
            firstLink.focus();
            announcePolite('Navigation focused');
          }
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [announcePolite]);

  // Cleanup announcer on unmount
  useEffect(() => {
    return () => {
      if (announcer) {
        announcer.cleanup();
      }
    };
  }, []);

  const contextValue: AccessibilityContextType = {
    announce,
    announcePolite,
    announceAssertive,
    storeFocus: focusManager.storeFocus.bind(focusManager),
    restoreFocus: focusManager.restoreFocus.bind(focusManager),
    prefersReducedMotion,
    runAccessibilityCheck: () => {
      const report = accessibilityTest.generateReport();
      console.table(report);
    }
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {/* Skip links for keyboard navigation */}
      <div className="sr-only focus-within:not-sr-only">
        <a 
          href="#main-content" 
          className="absolute top-0 left-0 z-50 px-4 py-2 bg-primary text-primary-foreground focus:relative focus:z-auto"
        >
          Skip to main content
        </a>
        <a 
          href="#navigation" 
          className="absolute top-0 left-0 z-50 px-4 py-2 bg-primary text-primary-foreground focus:relative focus:z-auto ml-2"
        >
          Skip to navigation
        </a>
      </div>
      
      {children}
    </AccessibilityContext.Provider>
  );
}

// Accessible button component
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  className = '',
  variant = 'primary',
  ...props
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { announcePolite } = useAccessibility();
  const { prefersReducedMotion } = useReducedMotion();

  const handleClick = () => {
    if (disabled) return;
    
    onClick?.();
    
    // Provide audio feedback for screen readers
    if (ariaLabel) {
      announcePolite(`${ariaLabel} activated`);
    }
  };

  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary',
    ghost: 'hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent'
  };

  const animationClass = prefersReducedMotion ? '' : 'transition-all duration-200 hover:scale-105 active:scale-95';

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`${baseClasses} ${variantClasses[variant]} ${animationClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Accessible form input component
export function AccessibleInput({
  label,
  error,
  required = false,
  type = 'text',
  className = '',
  ...props
}: {
  label: string;
  error?: string;
  required?: boolean;
  type?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const { announceAssertive } = useAccessibility();
  const inputId = React.useId();
  const errorId = React.useId();
  const descId = React.useId();

  // Announce errors to screen readers
  useEffect(() => {
    if (error) {
      announceAssertive(`Error in ${label}: ${error}`);
    }
  }, [error, label, announceAssertive]);

  return (
    <div className="space-y-2">
      <label 
        htmlFor={inputId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      <input
        id={inputId}
        type={type}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`
          flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm 
          ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium 
          placeholder:text-muted-foreground 
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
          disabled:cursor-not-allowed disabled:opacity-50
          ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      
      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-sm text-red-600 font-medium"
        >
          {error}
        </div>
      )}
    </div>
  );
}

// Accessible modal component
export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = ''
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const { announcePolite, storeFocus, restoreFocus } = useAccessibility();
  const { prefersReducedMotion } = useReducedMotion();
  const modalRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descId = React.useId();

  useEffect(() => {
    if (isOpen) {
      storeFocus();
      announcePolite(`${title} dialog opened`);
      
      // Trap focus in modal
      const modal = modalRef.current;
      if (modal) {
        const cleanup = focusManager.trapFocus(modal);
        
        // Close on escape key
        const handleEscape = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            onClose();
          }
        };
        
        document.addEventListener('keydown', handleEscape);
        
        return () => {
          cleanup?.();
          document.removeEventListener('keydown', handleEscape);
        };
      }
    } else {
      restoreFocus();
    }
  }, [isOpen, title, storeFocus, restoreFocus, announcePolite, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`
          fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 
          bg-background p-6 rounded-lg shadow-lg border
          ${prefersReducedMotion ? '' : 'animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]'}
          ${className}
        `}
      >
        {/* Close button */}
        <AccessibleButton
          onClick={onClose}
          variant="ghost"
          ariaLabel="Close dialog"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </AccessibleButton>
        
        {/* Title */}
        <h2 id={titleId} className="text-lg font-semibold mb-2">
          {title}
        </h2>
        
        {/* Description */}
        {description && (
          <p id={descId} className="text-sm text-muted-foreground mb-4">
            {description}
          </p>
        )}
        
        {/* Content */}
        <div>{children}</div>
      </div>
    </>
  );
}

// High contrast toggle component
export function HighContrastToggle() {
  const [isHighContrast, setIsHighContrast] = React.useState(() => {
    return localStorage.getItem('high-contrast') === 'true';
  });
  
  const { announcePolite } = useAccessibility();

  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement && document.documentElement.classList) {
      if (isHighContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    }
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('high-contrast', String(isHighContrast));
    }
  }, [isHighContrast]);

  const toggle = () => {
    setIsHighContrast(!isHighContrast);
    announcePolite(`High contrast mode ${!isHighContrast ? 'enabled' : 'disabled'}`);
  };

  return (
    <AccessibleButton
      onClick={toggle}
      variant="ghost"
      ariaLabel={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
      className="p-2"
    >
      <span className="sr-only">
        {isHighContrast ? 'Disable' : 'Enable'} high contrast mode
      </span>
      <div className={`w-5 h-5 rounded border-2 ${isHighContrast ? 'bg-foreground' : 'bg-background'} border-foreground`} />
    </AccessibleButton>
  );
}

// Font size control component
export function FontSizeControl() {
  const [fontSize, setFontSize] = React.useState(() => {
    return parseInt(localStorage.getItem('font-size') || '16');
  });
  
  const { announcePolite } = useAccessibility();

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem('font-size', String(fontSize));
  }, [fontSize]);

  const adjustFontSize = (delta: number) => {
    const newSize = Math.max(12, Math.min(24, fontSize + delta));
    setFontSize(newSize);
    announcePolite(`Font size set to ${newSize} pixels`);
  };

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Font size controls">
      <AccessibleButton
        onClick={() => adjustFontSize(-2)}
        variant="ghost"
        ariaLabel="Decrease font size"
        disabled={fontSize <= 12}
        className="p-2"
      >
        <span className="text-sm">A-</span>
      </AccessibleButton>
      
      <span className="text-sm px-2" aria-live="polite">
        {fontSize}px
      </span>
      
      <AccessibleButton
        onClick={() => adjustFontSize(2)}
        variant="ghost"
        ariaLabel="Increase font size"
        disabled={fontSize >= 24}
        className="p-2"
      >
        <span className="text-lg">A+</span>
      </AccessibleButton>
    </div>
  );
}
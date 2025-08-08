// Comprehensive Accessibility Library (WCAG 2.1 AA Compliant)
import { useEffect, useRef, useState, useCallback } from 'react';

// ARIA live regions for screen readers
export class AccessibilityAnnouncer {
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;

  constructor() {
    this.createLiveRegions();
  }

  private createLiveRegions() {
    // Polite announcements (don't interrupt current speech)
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.className = 'sr-only';
    document.body.appendChild(this.politeRegion);

    // Assertive announcements (interrupt current speech)
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.className = 'sr-only';
    document.body.appendChild(this.assertiveRegion);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const region = priority === 'polite' ? this.politeRegion : this.assertiveRegion;
    if (region) {
      // Clear and set new message
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 100);
    }
  }

  cleanup() {
    if (this.politeRegion) {
      document.body.removeChild(this.politeRegion);
    }
    if (this.assertiveRegion) {
      document.body.removeChild(this.assertiveRegion);
    }
  }
}

// Global accessibility announcer instance
export const announcer = new AccessibilityAnnouncer();

// Focus management utilities
export class FocusManager {
  private focusHistory: HTMLElement[] = [];
  private trapElements: HTMLElement[] = [];

  // Store current focus for later restoration
  storeFocus() {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      this.focusHistory.push(activeElement);
    }
  }

  // Restore previously stored focus
  restoreFocus() {
    const lastFocusedElement = this.focusHistory.pop();
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      try {
        lastFocusedElement.focus();
      } catch (error) {
        // Element might not be focusable anymore
        console.warn('Could not restore focus:', error);
      }
    }
  }

  // Focus trap for modals and dialogs
  trapFocus(container: HTMLElement) {
    this.trapElements = this.getFocusableElements(container);
    if (this.trapElements.length === 0) return;

    const firstElement = this.trapElements[0];
    const lastElement = this.trapElements[this.trapElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  // Get all focusable elements within a container
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    
    return elements.filter(element => {
      return this.isVisible(element) && !element.hasAttribute('disabled');
    });
  }

  // Check if element is visible
  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
  }
}

// Global focus manager instance
export const focusManager = new FocusManager();

// Keyboard navigation utilities
export const keyboardNavigation = {
  // Handle arrow key navigation for lists/grids
  handleArrowNavigation: (
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    orientation: 'horizontal' | 'vertical' | 'grid' = 'vertical',
    columnsPerRow?: number
  ): number => {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'grid') {
          if (orientation === 'grid' && columnsPerRow) {
            newIndex = Math.max(0, currentIndex - columnsPerRow);
          } else {
            newIndex = Math.max(0, currentIndex - 1);
          }
          event.preventDefault();
        }
        break;

      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'grid') {
          if (orientation === 'grid' && columnsPerRow) {
            newIndex = Math.min(items.length - 1, currentIndex + columnsPerRow);
          } else {
            newIndex = Math.min(items.length - 1, currentIndex + 1);
          }
          event.preventDefault();
        }
        break;

      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'grid') {
          newIndex = Math.max(0, currentIndex - 1);
          event.preventDefault();
        }
        break;

      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'grid') {
          newIndex = Math.min(items.length - 1, currentIndex + 1);
          event.preventDefault();
        }
        break;

      case 'Home':
        newIndex = 0;
        event.preventDefault();
        break;

      case 'End':
        newIndex = items.length - 1;
        event.preventDefault();
        break;
    }

    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus();
    }

    return newIndex;
  },

  // Handle escape key to close modals/dropdowns
  handleEscapeKey: (event: KeyboardEvent, closeCallback: () => void) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeCallback();
    }
  },

  // Handle enter/space activation
  handleActivation: (event: KeyboardEvent, activateCallback: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateCallback();
    }
  }
};

// Color contrast utilities
export const colorContrast = {
  // Calculate contrast ratio between two colors
  calculateContrastRatio: (color1: string, color2: string): number => {
    const luminance1 = colorContrast.getLuminance(color1);
    const luminance2 = colorContrast.getLuminance(color2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  },

  // Get relative luminance of a color
  getLuminance: (color: string): number => {
    const rgb = colorContrast.hexToRgb(color);
    if (!rgb) return 0;

    const sRGB = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  },

  // Convert hex color to RGB
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  // Check if contrast meets WCAG AA standards
  meetsWCAG_AA: (color1: string, color2: string, fontSize: number = 16): boolean => {
    const ratio = colorContrast.calculateContrastRatio(color1, color2);
    
    // Large text (18pt+ or 14pt+ bold) needs 3:1, normal text needs 4.5:1
    const isLargeText = fontSize >= 18 || fontSize >= 14; // Assuming bold for 14pt+
    const requiredRatio = isLargeText ? 3 : 4.5;
    
    return ratio >= requiredRatio;
  }
};

// Screen reader utilities
export const screenReader = {
  // Create accessible description
  createDescription: (element: HTMLElement, description: string): string => {
    const descId = `desc-${Math.random().toString(36).substr(2, 9)}`;
    
    const descElement = document.createElement('div');
    descElement.id = descId;
    descElement.className = 'sr-only';
    descElement.textContent = description;
    
    document.body.appendChild(descElement);
    element.setAttribute('aria-describedby', descId);
    
    return descId;
  },

  // Remove accessible description
  removeDescription: (element: HTMLElement, descId: string) => {
    const descElement = document.getElementById(descId);
    if (descElement) {
      document.body.removeChild(descElement);
    }
    element.removeAttribute('aria-describedby');
  },

  // Check if screen reader is likely active
  isScreenReaderActive: (): boolean => {
    // This is a heuristic - not 100% reliable
    return window.navigator.userAgent.includes('NVDA') ||
           window.navigator.userAgent.includes('JAWS') ||
           window.speechSynthesis?.speaking === true ||
           document.activeElement?.getAttribute('role') === 'application';
  }
};

// Reduced motion utilities
export const reducedMotion = {
  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get animation duration based on preference
  getAnimationDuration: (normalDuration: number): number => {
    return reducedMotion.prefersReducedMotion() ? 0 : normalDuration;
  },

  // Conditional animation class
  getAnimationClass: (animationClass: string, staticClass: string = ''): string => {
    return reducedMotion.prefersReducedMotion() ? staticClass : animationClass;
  }
};

// Touch accessibility for mobile
export const touchAccessibility = {
  // Minimum touch target size (44px x 44px per WCAG)
  MINIMUM_TOUCH_SIZE: 44,

  // Check if touch target meets minimum size
  isValidTouchTarget: (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return rect.width >= touchAccessibility.MINIMUM_TOUCH_SIZE && 
           rect.height >= touchAccessibility.MINIMUM_TOUCH_SIZE;
  },

  // Add touch accessibility attributes
  enhanceForTouch: (element: HTMLElement, label?: string) => {
    if (!touchAccessibility.isValidTouchTarget(element)) {
      element.style.minWidth = `${touchAccessibility.MINIMUM_TOUCH_SIZE}px`;
      element.style.minHeight = `${touchAccessibility.MINIMUM_TOUCH_SIZE}px`;
    }

    if (label) {
      element.setAttribute('aria-label', label);
    }

    // Add touch feedback
    element.style.touchAction = 'manipulation';
  }
};

// Form accessibility utilities
export const formAccessibility = {
  // Associate label with form control
  associateLabel: (input: HTMLElement, label: HTMLElement | string) => {
    const inputId = input.id || `input-${Math.random().toString(36).substr(2, 9)}`;
    input.id = inputId;

    if (typeof label === 'string') {
      input.setAttribute('aria-label', label);
    } else {
      label.setAttribute('for', inputId);
    }
  },

  // Add error message to form control
  addErrorMessage: (input: HTMLElement, message: string): string => {
    const errorId = `error-${input.id || Math.random().toString(36).substr(2, 9)}`;
    
    const errorElement = document.createElement('div');
    errorElement.id = errorId;
    errorElement.className = 'sr-only text-red-600 text-sm mt-1';
    errorElement.textContent = message;
    errorElement.setAttribute('role', 'alert');
    
    input.parentNode?.appendChild(errorElement);
    input.setAttribute('aria-describedby', errorId);
    input.setAttribute('aria-invalid', 'true');
    
    return errorId;
  },

  // Remove error message
  removeErrorMessage: (input: HTMLElement, errorId: string) => {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
      errorElement.parentNode?.removeChild(errorElement);
    }
    input.removeAttribute('aria-describedby');
    input.removeAttribute('aria-invalid');
  },

  // Validate required field
  validateRequired: (input: HTMLInputElement | HTMLTextAreaElement): boolean => {
    return input.hasAttribute('required') ? input.value.trim().length > 0 : true;
  }
};

// React hooks for accessibility
export function useAnnouncer() {
  return {
    announce: announcer.announce.bind(announcer),
    announcePolite: (message: string) => announcer.announce(message, 'polite'),
    announceAssertive: (message: string) => announcer.announce(message, 'assertive')
  };
}

export function useFocusManagement() {
  return {
    storeFocus: focusManager.storeFocus.bind(focusManager),
    restoreFocus: focusManager.restoreFocus.bind(focusManager),
    trapFocus: focusManager.trapFocus.bind(focusManager),
    getFocusableElements: focusManager.getFocusableElements.bind(focusManager)
  };
}

export function useKeyboardNavigation(
  items: HTMLElement[],
  orientation: 'horizontal' | 'vertical' | 'grid' = 'vertical',
  columnsPerRow?: number
) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const newIndex = keyboardNavigation.handleArrowNavigation(
      event,
      items,
      currentIndex,
      orientation,
      columnsPerRow
    );
    setCurrentIndex(newIndex);
  }, [items, currentIndex, orientation, columnsPerRow]);

  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown
  };
}

export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(reducedMotion.prefersReducedMotion());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReduced(mediaQuery.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    prefersReducedMotion: prefersReduced,
    getAnimationDuration: reducedMotion.getAnimationDuration,
    getAnimationClass: reducedMotion.getAnimationClass
  };
}

// Skip link component for keyboard navigation
export function useSkipLinks() {
  const skipLinksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const skipLinks = skipLinksRef.current;
    if (!skipLinks) return;

    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches('a[href^="#"]')) {
        target.addEventListener('click', (clickEvent) => {
          clickEvent.preventDefault();
          const targetId = target.getAttribute('href')?.substring(1);
          const targetElement = targetId ? document.getElementById(targetId) : null;
          
          if (targetElement) {
            targetElement.focus();
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }
    };

    skipLinks.addEventListener('focus', handleFocus, true);
    return () => skipLinks.removeEventListener('focus', handleFocus, true);
  }, []);

  return skipLinksRef;
}

// Accessibility testing utilities
export const accessibilityTest = {
  // Check for missing alt text on images
  checkAltText: (): HTMLImageElement[] => {
    const images = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
    return images.filter(img => !img.alt && !img.hasAttribute('aria-label'));
  },

  // Check for form inputs without labels
  checkFormLabels: (): HTMLElement[] => {
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    return inputs.filter(input => {
      const hasLabel = document.querySelector(`label[for="${input.id}"]`);
      const hasAriaLabel = input.hasAttribute('aria-label');
      const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');
      
      return !hasLabel && !hasAriaLabel && !hasAriaLabelledBy;
    }) as HTMLElement[];
  },

  // Check for insufficient color contrast
  checkColorContrast: (elements?: NodeListOf<Element>): Element[] => {
    const elementsToCheck = elements || document.querySelectorAll('*');
    const problems: Element[] = [];

    elementsToCheck.forEach(element => {
      const style = window.getComputedStyle(element);
      const backgroundColor = style.backgroundColor;
      const color = style.color;
      
      if (backgroundColor !== 'rgba(0, 0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
        const fontSize = parseInt(style.fontSize);
        if (!colorContrast.meetsWCAG_AA(color, backgroundColor, fontSize)) {
          problems.push(element);
        }
      }
    });

    return problems;
  },

  // Generate accessibility report
  generateReport: (): {
    missingAltText: HTMLImageElement[];
    missingLabels: HTMLElement[];
    contrastIssues: Element[];
    focusableElements: HTMLElement[];
  } => {
    return {
      missingAltText: accessibilityTest.checkAltText(),
      missingLabels: accessibilityTest.checkFormLabels(),
      contrastIssues: accessibilityTest.checkColorContrast(),
      focusableElements: focusManager.getFocusableElements(document.body)
    };
  }
};

// Export all utilities
export default {
  AccessibilityAnnouncer,
  FocusManager,
  announcer,
  focusManager,
  keyboardNavigation,
  colorContrast,
  screenReader,
  reducedMotion,
  touchAccessibility,
  formAccessibility,
  accessibilityTest,
  useAnnouncer,
  useFocusManagement,
  useKeyboardNavigation,
  useReducedMotion,
  useSkipLinks
};
// Design System - Typography, Colors, Spacing, and Components
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Color palette
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
};

// Typography system
export const typography = {
  fonts: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", "Fira Mono", "Roboto Mono", monospace',
    display: '"Cal Sans", var(--font-sans)',
  },
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
    '7xl': '4.5rem',   // 72px
    '8xl': '6rem',     // 96px
    '9xl': '8rem',     // 128px
  },
  weights: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Spacing system (8px base)
export const spacing = {
  px: '1px',
  0: '0px',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  11: '2.75rem',   // 44px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  28: '7rem',      // 112px
  32: '8rem',      // 128px
  36: '9rem',      // 144px
  40: '10rem',     // 160px
  44: '11rem',     // 176px
  48: '12rem',     // 192px
  52: '13rem',     // 208px
  56: '14rem',     // 224px
  60: '15rem',     // 240px
  64: '16rem',     // 256px
  72: '18rem',     // 288px
  80: '20rem',     // 320px
  96: '24rem',     // 384px
};

// Border radius
export const borderRadius = {
  none: '0px',
  sm: '0.125rem',  // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
};

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
};

// Breakpoints
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Z-index scale
export const zIndex = {
  auto: 'auto',
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
  notification: 1090,
};

// Animation durations
export const durations = {
  instant: '0ms',
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  slower: '700ms',
  slowest: '1000ms',
};

// Animation easings
export const easings = {
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

// Component styles
export const components = {
  button: {
    base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    sizes: {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-11 px-8',
      icon: 'h-10 w-10',
    },
    variants: {
      default: 'bg-primary-600 text-white hover:bg-primary-700',
      destructive: 'bg-danger-600 text-white hover:bg-danger-700',
      outline: 'border border-gray-300 bg-white hover:bg-gray-50',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
      ghost: 'hover:bg-gray-100 hover:text-gray-900',
      link: 'text-primary-600 underline-offset-4 hover:underline',
    },
  },
  input: {
    base: 'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    sizes: {
      sm: 'h-9 text-sm',
      md: 'h-10',
      lg: 'h-11 text-base',
    },
  },
  card: {
    base: 'rounded-lg border border-gray-200 bg-white shadow-sm',
    paddings: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  badge: {
    base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
    variants: {
      default: 'bg-primary-100 text-primary-800',
      secondary: 'bg-gray-100 text-gray-800',
      destructive: 'bg-danger-100 text-danger-800',
      outline: 'border border-gray-300 text-gray-700',
      success: 'bg-success-100 text-success-800',
      warning: 'bg-warning-100 text-warning-800',
    },
  },
};

// Utility functions for responsive design
export const mediaQuery = {
  up: (breakpoint: keyof typeof breakpoints) => 
    `@media (min-width: ${breakpoints[breakpoint]})`,
  down: (breakpoint: keyof typeof breakpoints) => 
    `@media (max-width: ${breakpoints[breakpoint]})`,
  between: (min: keyof typeof breakpoints, max: keyof typeof breakpoints) =>
    `@media (min-width: ${breakpoints[min]}) and (max-width: ${breakpoints[max]})`,
  prefersReducedMotion: '@media (prefers-reduced-motion: reduce)',
  prefersDark: '@media (prefers-color-scheme: dark)',
  prefersLight: '@media (prefers-color-scheme: light)',
  hover: '@media (hover: hover) and (pointer: fine)',
  touch: '@media (hover: none) and (pointer: coarse)',
};

// Grid system
export const grid = {
  cols: {
    1: 'grid-template-columns: repeat(1, minmax(0, 1fr))',
    2: 'grid-template-columns: repeat(2, minmax(0, 1fr))',
    3: 'grid-template-columns: repeat(3, minmax(0, 1fr))',
    4: 'grid-template-columns: repeat(4, minmax(0, 1fr))',
    5: 'grid-template-columns: repeat(5, minmax(0, 1fr))',
    6: 'grid-template-columns: repeat(6, minmax(0, 1fr))',
    7: 'grid-template-columns: repeat(7, minmax(0, 1fr))',
    8: 'grid-template-columns: repeat(8, minmax(0, 1fr))',
    9: 'grid-template-columns: repeat(9, minmax(0, 1fr))',
    10: 'grid-template-columns: repeat(10, minmax(0, 1fr))',
    11: 'grid-template-columns: repeat(11, minmax(0, 1fr))',
    12: 'grid-template-columns: repeat(12, minmax(0, 1fr))',
    none: 'grid-template-columns: none',
  },
  gaps: spacing,
};

// Flex utilities
export const flex = {
  direction: {
    row: 'flex-direction: row',
    rowReverse: 'flex-direction: row-reverse',
    col: 'flex-direction: column',
    colReverse: 'flex-direction: column-reverse',
  },
  wrap: {
    wrap: 'flex-wrap: wrap',
    wrapReverse: 'flex-wrap: wrap-reverse',
    nowrap: 'flex-wrap: nowrap',
  },
  justify: {
    start: 'justify-content: flex-start',
    end: 'justify-content: flex-end',
    center: 'justify-content: center',
    between: 'justify-content: space-between',
    around: 'justify-content: space-around',
    evenly: 'justify-content: space-evenly',
  },
  align: {
    start: 'align-items: flex-start',
    end: 'align-items: flex-end',
    center: 'align-items: center',
    baseline: 'align-items: baseline',
    stretch: 'align-items: stretch',
  },
  grow: {
    0: 'flex-grow: 0',
    1: 'flex-grow: 1',
  },
  shrink: {
    0: 'flex-shrink: 0',
    1: 'flex-shrink: 1',
  },
};

// Theme configuration
export interface Theme {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  components: typeof components;
}

// Predefined themes
export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  mode: 'light',
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  components,
};

export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  mode: 'dark',
  colors: {
    ...colors,
    // Override colors for dark mode
    primary: colors.primary,
    gray: {
      50: '#111827',
      100: '#1f2937',
      200: '#374151',
      300: '#4b5563',
      400: '#6b7280',
      500: '#9ca3af',
      600: '#d1d5db',
      700: '#e5e7eb',
      800: '#f3f4f6',
      900: '#f9fafb',
    },
  },
  typography,
  spacing,
  borderRadius,
  shadows: {
    ...lightTheme.shadows,
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.26)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.25)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.24)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
    glow: '0 0 20px rgba(59, 130, 246, 0.7)',
    glowLg: '0 0 40px rgba(59, 130, 246, 0.9)',
  },
};

// Theme store
interface ThemeStore {
  currentTheme: Theme;
  themeMode: 'light' | 'dark' | 'auto';
  customThemes: Theme[];
  isInitialized: boolean;
  
  setTheme: (theme: Theme) => void;
  setThemeMode: (mode: 'light' | 'dark' | 'auto') => void;
  addCustomTheme: (theme: Theme) => void;
  removeCustomTheme: (themeId: string) => void;
  applyTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initialize: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: lightTheme,
      themeMode: 'auto',
      customThemes: [],
      isInitialized: false,
      
      setTheme: (theme) => {
        set({ currentTheme: theme });
        if (get().isInitialized) {
          get().applyTheme(theme);
        }
      },
      
      setThemeMode: (mode) => {
        set({ themeMode: mode });
        
        if (!get().isInitialized) return;
        
        let theme = lightTheme;
        if (mode === 'auto') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          theme = prefersDark ? darkTheme : lightTheme;
        } else {
          theme = mode === 'dark' ? darkTheme : lightTheme;
        }
        
        get().setTheme(theme);
      },
      
      addCustomTheme: (theme) => {
        set((state) => ({
          customThemes: [...state.customThemes, theme],
        }));
      },
      
      removeCustomTheme: (themeId) => {
        set((state) => ({
          customThemes: state.customThemes.filter((t) => t.id !== themeId),
        }));
      },
      
      applyTheme: (theme) => {
        // Only apply theme if we're in a browser environment
        if (typeof window === 'undefined' || typeof document === 'undefined' || !theme) {
          return;
        }
        
        // Apply CSS variables
        const root = document.documentElement;
        if (!root) return;
        
        // Apply colors
        Object.entries(theme.colors).forEach(([key, value]) => {
          if (typeof value === 'object') {
            Object.entries(value).forEach(([subKey, subValue]) => {
              root.style.setProperty(`--color-${key}-${subKey}`, subValue);
            });
          } else {
            root.style.setProperty(`--color-${key}`, value);
          }
        });
        
        // Apply spacing
        Object.entries(theme.spacing).forEach(([key, value]) => {
          root.style.setProperty(`--spacing-${key}`, value);
        });
        
        // Apply typography
        Object.entries(theme.typography.fonts).forEach(([key, value]) => {
          root.style.setProperty(`--font-${key}`, value);
        });
        
        Object.entries(theme.typography.sizes).forEach(([key, value]) => {
          root.style.setProperty(`--text-${key}`, value);
        });
        
        // Apply borders
        Object.entries(theme.borderRadius).forEach(([key, value]) => {
          root.style.setProperty(`--radius-${key}`, value);
        });
        
        // Apply shadows
        Object.entries(theme.shadows).forEach(([key, value]) => {
          root.style.setProperty(`--shadow-${key}`, value);
        });
        
        // Apply theme class
        if (root && root.classList && theme.mode) {
          root.classList.remove('light', 'dark');
          root.classList.add(theme.mode);
        }
      },
      
      toggleTheme: () => {
        const current = get().currentTheme;
        const newTheme = current?.mode === 'light' ? darkTheme : lightTheme;
        get().setTheme(newTheme);
      },
      
      initialize: () => {
        if (typeof window === 'undefined') return;
        
        set({ isInitialized: true });
        
        // Apply the current theme
        const state = get();
        state.applyTheme(state.currentTheme);
        
        // Set initial theme mode
        state.setThemeMode(state.themeMode);
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        themeMode: state.themeMode,
        customThemes: state.customThemes,
      }),
    }
  )
);

// Utility functions
export const getContrastColor = (backgroundColor: string): string => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

export const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const generateColorScale = (baseColor: string, steps = 10): Record<number, string> => {
  const scale: Record<number, string> = {};
  
  for (let i = 0; i < steps; i++) {
    const lightness = 95 - (i * 9); // From 95% to 5%
    scale[i * 100 || 50] = adjustColorLightness(baseColor, lightness);
  }
  
  return scale;
};

const adjustColorLightness = (color: string, lightness: number): string => {
  // Convert hex to HSL and adjust lightness
  // This is a simplified version - in production, use a color library
  return color; // Placeholder
};

// Export all design tokens as a single object
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  durations,
  easings,
  components,
  mediaQuery,
  grid,
  flex,
};

export default designTokens;
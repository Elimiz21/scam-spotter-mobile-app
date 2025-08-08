// Comprehensive Design System with Tokens and Theme Support
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Design token types
export interface ColorTokens {
  // Brand colors
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  secondary: typeof ColorTokens.prototype.primary;
  accent: typeof ColorTokens.prototype.primary;
  
  // Semantic colors
  success: typeof ColorTokens.prototype.primary;
  warning: typeof ColorTokens.prototype.primary;
  danger: typeof ColorTokens.prototype.primary;
  info: typeof ColorTokens.prototype.primary;
  
  // Neutral colors
  neutral: typeof ColorTokens.prototype.primary;
  
  // Surface colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    overlay: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
  };
  
  // Border colors
  border: {
    default: string;
    subtle: string;
    strong: string;
  };
}

export interface SpacingTokens {
  none: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
}

export interface TypographyTokens {
  fonts: {
    sans: string;
    serif: string;
    mono: string;
    display: string;
  };
  
  sizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    '8xl': string;
    '9xl': string;
  };
  
  weights: {
    thin: number;
    extralight: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
    black: number;
  };
  
  lineHeights: {
    none: number;
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  
  letterSpacing: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest: string;
  };
}

export interface AnimationTokens {
  durations: {
    instant: string;
    fast: string;
    normal: string;
    slow: string;
    slower: string;
  };
  
  easings: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    bounce: string;
    elastic: string;
  };
  
  transitions: {
    fade: string;
    scale: string;
    slide: string;
    rotate: string;
    blur: string;
  };
}

export interface BorderTokens {
  radius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };
  
  width: {
    none: string;
    thin: string;
    default: string;
    thick: string;
  };
}

export interface ShadowTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  glow: string;
  glowLg: string;
}

export interface BreakpointTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ZIndexTokens {
  hide: number;
  base: number;
  dropdown: number;
  sticky: number;
  overlay: number;
  modal: number;
  popover: number;
  tooltip: number;
  toast: number;
  max: number;
}

// Theme interface
export interface Theme {
  id: string;
  name: string;
  mode: 'light' | 'dark' | 'auto';
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  animation: AnimationTokens;
  borders: BorderTokens;
  shadows: ShadowTokens;
  breakpoints: BreakpointTokens;
  zIndex: ZIndexTokens;
  custom?: Record<string, any>;
}

// Light theme
export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  mode: 'light',
  colors: {
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
      950: '#172554',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    accent: {
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
      950: '#422006',
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
      950: '#052e16',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
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
      950: '#450a0a',
    },
    info: {
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
      950: '#172554',
    },
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b',
    },
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      elevated: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#94a3b8',
      disabled: '#cbd5e1',
      inverse: '#ffffff',
    },
    border: {
      default: '#e2e8f0',
      subtle: '#f1f5f9',
      strong: '#cbd5e1',
    },
  },
  spacing: {
    none: '0',
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
    '5xl': '8rem',
  },
  typography: {
    fonts: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      display: '"Cal Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
      '8xl': '6rem',
      '9xl': '8rem',
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
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },
  animation: {
    durations: {
      instant: '0ms',
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '1000ms',
    },
    easings: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
    transitions: {
      fade: 'opacity 300ms ease-in-out',
      scale: 'transform 300ms ease-in-out',
      slide: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      rotate: 'transform 300ms ease-in-out',
      blur: 'filter 300ms ease-in-out',
    },
  },
  borders: {
    radius: {
      none: '0',
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      full: '9999px',
    },
    width: {
      none: '0',
      thin: '1px',
      default: '2px',
      thick: '4px',
    },
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    glow: '0 0 20px rgba(59, 130, 246, 0.5)',
    glowLg: '0 0 40px rgba(59, 130, 246, 0.7)',
  },
  breakpoints: {
    xs: '480px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    overlay: 1200,
    modal: 1300,
    popover: 1400,
    tooltip: 1500,
    toast: 1600,
    max: 9999,
  },
};

// Dark theme
export const darkTheme: Theme = {
  ...lightTheme,
  id: 'dark',
  name: 'Dark',
  mode: 'dark',
  colors: {
    ...lightTheme.colors,
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
      elevated: '#1e293b',
      overlay: 'rgba(0, 0, 0, 0.8)',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      disabled: '#475569',
      inverse: '#0f172a',
    },
    border: {
      default: '#334155',
      subtle: '#1e293b',
      strong: '#475569',
    },
  },
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
  
  setTheme: (theme: Theme) => void;
  setThemeMode: (mode: 'light' | 'dark' | 'auto') => void;
  addCustomTheme: (theme: Theme) => void;
  removeCustomTheme: (themeId: string) => void;
  applyTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: lightTheme,
      themeMode: 'auto',
      customThemes: [],
      
      setTheme: (theme) => {
        set({ currentTheme: theme });
        get().applyTheme(theme);
      },
      
      setThemeMode: (mode) => {
        set({ themeMode: mode });
        
        if (mode === 'auto') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          get().setTheme(prefersDark ? darkTheme : lightTheme);
        } else {
          get().setTheme(mode === 'dark' ? darkTheme : lightTheme);
        }
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
        // Apply CSS variables
        if (typeof document === 'undefined' || !document.documentElement) {
          return;
        }
        const root = document.documentElement;
        
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
        Object.entries(theme.borders.radius).forEach(([key, value]) => {
          root.style.setProperty(`--radius-${key}`, value);
        });
        
        // Apply shadows
        Object.entries(theme.shadows).forEach(([key, value]) => {
          root.style.setProperty(`--shadow-${key}`, value);
        });
        
        // Apply theme class
        if (typeof document !== 'undefined' && document.documentElement) {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(theme.mode);
        }
      },
      
      toggleTheme: () => {
        const current = get().currentTheme;
        const newTheme = current.mode === 'light' ? darkTheme : lightTheme;
        get().setTheme(newTheme);
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

export const generateColorPalette = (baseColor: string): ColorTokens['primary'] => {
  // This would generate a full color palette from a base color
  // For now, returning a default palette
  return lightTheme.colors.primary;
};

export const createCustomTheme = (
  name: string,
  baseTheme: Theme,
  overrides: Partial<Theme>
): Theme => {
  return {
    ...baseTheme,
    ...overrides,
    id: `custom-${Date.now()}`,
    name,
  };
};

// Export theme utilities
export const themes = {
  light: lightTheme,
  dark: darkTheme,
};

export const getTheme = (themeId: string): Theme | undefined => {
  if (themeId === 'light') return lightTheme;
  if (themeId === 'dark') return darkTheme;
  
  const store = useThemeStore.getState();
  return store.customThemes.find((t) => t.id === themeId);
};
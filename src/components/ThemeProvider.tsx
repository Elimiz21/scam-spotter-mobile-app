// Theme Provider with Dark/Light Mode Switcher
import { useEffect, ReactNode } from 'react';
import { useThemeStore } from '@/lib/designSystem';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette,
  Check,
  Settings2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark' | 'auto';
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'auto' 
}: ThemeProviderProps) {
  const { currentTheme, themeMode, setThemeMode, initialize } = useThemeStore();

  useEffect(() => {
    // Initialize theme system when component mounts
    initialize();
    
    // Then set the default theme mode
    setThemeMode(defaultTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'auto') {
        setThemeMode('auto');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [defaultTheme, setThemeMode, themeMode]);

  useEffect(() => {
    // Apply theme changes
    applyTheme(currentTheme);
  }, [currentTheme, applyTheme]);

  return <>{children}</>;
}

// Theme Switcher Component
export function ThemeSwitcher({ 
  className,
  showLabel = false,
  variant = 'ghost',
  size = 'icon'
}: {
  className?: string;
  showLabel?: boolean;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'icon' | 'sm' | 'default';
}) {
  const { currentTheme, themeMode, setThemeMode, toggleTheme } = useThemeStore();

  const themes = [
    { 
      value: 'light', 
      label: 'Light', 
      icon: Sun, 
      description: 'Bright and clear'
    },
    { 
      value: 'dark', 
      label: 'Dark', 
      icon: Moon, 
      description: 'Easy on the eyes'
    },
    { 
      value: 'auto', 
      label: 'System', 
      icon: Monitor, 
      description: 'Match your device'
    },
  ];

  const currentThemeConfig = themes.find(t => t.value === themeMode) || themes[2];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            'relative overflow-hidden transition-all duration-300',
            className
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={themeMode}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <currentThemeConfig.icon className="h-4 w-4" />
              {showLabel && <span>{currentThemeConfig.label}</span>}
            </motion.div>
          </AnimatePresence>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Choose Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => setThemeMode(theme.value as any)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <theme.icon className="h-4 w-4" />
                <div>
                  <p className="font-medium">{theme.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {theme.description}
                  </p>
                </div>
              </div>
              {themeMode === theme.value && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer">
          <div className="flex items-center gap-3">
            <Settings2 className="h-4 w-4" />
            <span>Theme Settings</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4" />
            <span>Create Custom Theme</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Animated Theme Toggle Button
export function AnimatedThemeToggle({ 
  className 
}: { 
  className?: string 
}) {
  const { currentTheme, toggleTheme } = useThemeStore();
  const isDark = currentTheme.mode === 'dark';

  return (
    <motion.button
      className={cn(
        'relative h-10 w-10 rounded-full bg-gradient-to-br',
        isDark 
          ? 'from-indigo-500 to-purple-600' 
          : 'from-yellow-400 to-orange-500',
        'flex items-center justify-center overflow-hidden',
        'shadow-lg hover:shadow-xl transition-shadow duration-300',
        className
      )}
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Moon className="h-5 w-5 text-white" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Sun className="h-5 w-5 text-white" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              'absolute h-1 w-1 rounded-full',
              isDark ? 'bg-white' : 'bg-yellow-200'
            )}
            initial={{ 
              x: Math.random() * 40 - 20,
              y: Math.random() * 40 - 20,
              opacity: 0
            }}
            animate={{
              x: Math.random() * 40 - 20,
              y: Math.random() * 40 - 20,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
    </motion.button>
  );
}

// Theme Preview Card
export function ThemePreview({ 
  theme,
  isActive = false,
  onClick
}: {
  theme: 'light' | 'dark' | 'auto';
  isActive?: boolean;
  onClick?: () => void;
}) {
  const icons = {
    light: Sun,
    dark: Moon,
    auto: Monitor,
  };
  
  const Icon = icons[theme];
  
  const backgrounds = {
    light: 'bg-gradient-to-br from-yellow-100 to-orange-100',
    dark: 'bg-gradient-to-br from-gray-800 to-gray-900',
    auto: 'bg-gradient-to-br from-blue-100 to-purple-100',
  };

  return (
    <motion.div
      className={cn(
        'relative p-4 rounded-xl cursor-pointer overflow-hidden',
        'border-2 transition-all duration-300',
        backgrounds[theme],
        isActive 
          ? 'border-primary shadow-lg scale-105' 
          : 'border-transparent hover:border-primary/50'
      )}
      onClick={onClick}
      whileHover={{ scale: isActive ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex flex-col items-center gap-2">
        <Icon className={cn(
          'h-8 w-8',
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        )} />
        <span className={cn(
          'text-sm font-medium capitalize',
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        )}>
          {theme}
        </span>
      </div>
      
      {isActive && (
        <motion.div
          className="absolute top-2 right-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500 }}
        >
          <div className="bg-primary text-primary-foreground rounded-full p-1">
            <Check className="h-3 w-3" />
          </div>
        </motion.div>
      )}
      
      {/* Mini preview elements */}
      <div className="mt-3 space-y-1">
        <div className={cn(
          'h-1 w-full rounded-full',
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
        )} />
        <div className={cn(
          'h-1 w-3/4 rounded-full',
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
        )} />
        <div className={cn(
          'h-1 w-1/2 rounded-full',
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
        )} />
      </div>
    </motion.div>
  );
}

// Theme Settings Panel
export function ThemeSettingsPanel() {
  const { themeMode, setThemeMode, currentTheme } = useThemeStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Theme Mode</h3>
        <div className="grid grid-cols-3 gap-4">
          {(['light', 'dark', 'auto'] as const).map((mode) => (
            <ThemePreview
              key={mode}
              theme={mode}
              isActive={themeMode === mode}
              onClick={() => setThemeMode(mode)}
            />
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Appearance Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">High Contrast</label>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Reduce Motion</label>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Color Blind Mode</label>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Custom Themes</h3>
        <Button className="w-full" variant="outline">
          <Sparkles className="h-4 w-4 mr-2" />
          Create Custom Theme
        </Button>
      </div>
    </div>
  );
}
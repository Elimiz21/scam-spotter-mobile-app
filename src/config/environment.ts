// Environment configuration management

export interface AppConfig {
  environment: 'development' | 'staging' | 'production';
  supabase: {
    url: string;
    anonKey: string;
  };
  paypal: {
    clientId: string;
    environment: 'sandbox' | 'production';
  };
  apis: {
    openai: {
      baseUrl: string;
    };
    coinGecko: {
      baseUrl: string;
      apiKey?: string;
    };
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    sentryDsn?: string;
  };
  features: {
    enableAIAnalysis: boolean;
    enableExternalDatabases: boolean;
    enableUsageTracking: boolean;
    enableExportFeatures: boolean;
    enableAnalytics: boolean;
  };
  rateLimit: {
    enabled: boolean;
    strictMode: boolean;
  };
}

// Environment variables with fallbacks
const getEnvVar = (key: string, defaultValue?: string): string => {
  if (typeof window !== 'undefined') {
    // Client-side: use build-time environment variables
    return (import.meta.env as any)[`VITE_${key}`] || defaultValue || '';
  }
  
  // Server-side: use runtime environment variables
  return process.env[key] || defaultValue || '';
};

const getEnvBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = getEnvVar(key);
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};

// Determine current environment
const getCurrentEnvironment = (): AppConfig['environment'] => {
  const env = getEnvVar('NODE_ENV', 'development');
  const customEnv = getEnvVar('APP_ENV');
  
  if (customEnv === 'staging') return 'staging';
  if (env === 'production' || customEnv === 'production') return 'production';
  return 'development';
};

// Create configuration based on environment
export const createAppConfig = (): AppConfig => {
  const environment = getCurrentEnvironment();
  const isProduction = environment === 'production';
  const isStaging = environment === 'staging';

  return {
    environment,
    
    supabase: {
      url: getEnvVar('SUPABASE_URL', 'https://nhqmyapyqjwzxsqwgbvd.supabase.co'),
      anonKey: getEnvVar('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocW15YXB5cWp3enhzcXdnYnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxODAzNzEsImV4cCI6MjA1MTc1NjM3MX0.q2pz4xeJwKU4BhUa1ydUJbUVGlrOphNONY9AYKrjCdE'),
    },

    paypal: {
      clientId: isProduction 
        ? getEnvVar('PAYPAL_CLIENT_ID_PROD', '') 
        : getEnvVar('PAYPAL_CLIENT_ID', 'AaZ9M2j7n6MCkQx0Oi8X0dpVeZkvDeiVhyyY7Iumx4CpWAUhCe56ULt-Tdtxab0xakVzONSMQ2ICz74N'),
      environment: isProduction ? 'production' : 'sandbox',
    },

    apis: {
      openai: {
        baseUrl: getEnvVar('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
      },
      coinGecko: {
        baseUrl: getEnvVar('COINGECKO_BASE_URL', 'https://api.coingecko.com/api/v3'),
        apiKey: getEnvVar('COINGECKO_API_KEY'),
      },
    },

    monitoring: {
      enabled: isProduction || isStaging,
      logLevel: isProduction ? 'ERROR' : 'INFO',
      sentryDsn: getEnvVar('SENTRY_DSN'),
    },

    features: {
      enableAIAnalysis: getEnvBoolean('ENABLE_AI_ANALYSIS', true),
      enableExternalDatabases: getEnvBoolean('ENABLE_EXTERNAL_DATABASES', true),
      enableUsageTracking: getEnvBoolean('ENABLE_USAGE_TRACKING', true),
      enableExportFeatures: getEnvBoolean('ENABLE_EXPORT_FEATURES', true),
      enableAnalytics: getEnvBoolean('ENABLE_ANALYTICS', isProduction || isStaging),
    },

    rateLimit: {
      enabled: getEnvBoolean('ENABLE_RATE_LIMITING', true),
      strictMode: getEnvBoolean('RATE_LIMIT_STRICT_MODE', isProduction),
    },
  };
};

// Export singleton configuration
export const appConfig = createAppConfig();

// Validation function
export const validateConfig = (config: AppConfig): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields validation
  if (!config.supabase.url) {
    errors.push('Supabase URL is required');
  }

  if (!config.supabase.anonKey) {
    errors.push('Supabase anonymous key is required');
  }

  if (config.environment === 'production' && !config.paypal.clientId) {
    errors.push('PayPal production client ID is required');
  }

  // URL validation
  try {
    new URL(config.supabase.url);
  } catch {
    errors.push('Supabase URL is invalid');
  }

  // Feature validation
  if (config.features.enableAIAnalysis && config.environment === 'production' && !getEnvVar('OPENAI_API_KEY')) {
    errors.push('OpenAI API key is required when AI analysis is enabled in production');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Environment-specific utilities
export const isDevelopment = () => appConfig.environment === 'development';
export const isStaging = () => appConfig.environment === 'staging';
export const isProduction = () => appConfig.environment === 'production';

// Debug logging for configuration (only in development)
if (isDevelopment()) {
  console.group('🔧 App Configuration');
  console.log('Environment:', appConfig.environment);
  console.log('PayPal Mode:', appConfig.paypal.environment);
  console.log('Features:', appConfig.features);
  console.log('Monitoring:', appConfig.monitoring.enabled ? 'Enabled' : 'Disabled');
  
  const validation = validateConfig(appConfig);
  if (!validation.isValid) {
    console.warn('⚠️ Configuration Issues:', validation.errors);
  } else {
    console.log('✅ Configuration is valid');
  }
  console.groupEnd();
}

// Export types for use in other files
export type Environment = AppConfig['environment'];
export type PayPalEnvironment = AppConfig['paypal']['environment'];

// Configuration helpers
export const getApiUrl = (service: 'supabase' | 'paypal' | 'openai' | 'coinGecko'): string => {
  switch (service) {
    case 'supabase':
      return appConfig.supabase.url;
    case 'paypal':
      return appConfig.paypal.environment === 'production' 
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
    case 'openai':
      return appConfig.apis.openai.baseUrl;
    case 'coinGecko':
      return appConfig.apis.coinGecko.baseUrl;
    default:
      throw new Error(`Unknown service: ${service}`);
  }
};

export const getFeatureFlag = (feature: keyof AppConfig['features']): boolean => {
  return appConfig.features[feature];
};

export const shouldLog = (level: AppConfig['monitoring']['logLevel']): boolean => {
  const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
  const configLevel = levels.indexOf(appConfig.monitoring.logLevel);
  const requestedLevel = levels.indexOf(level);
  return requestedLevel >= configLevel;
};
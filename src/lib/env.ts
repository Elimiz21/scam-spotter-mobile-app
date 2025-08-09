// Safe environment checks for Vite
export const isDevelopment = () => {
  try {
    // Vite defines import.meta.env
    return import.meta.env?.MODE === 'development';
  } catch {
    return false;
  }
};

export const isProduction = () => {
  try {
    return import.meta.env?.MODE === 'production';
  } catch {
    return true; // Default to production for safety
  }
};

export const getEnvVar = (key: string, defaultValue = '') => {
  try {
    // Vite prefixes env vars with VITE_
    return import.meta.env[key] || defaultValue;
  } catch {
    return defaultValue;
  }
};

// For components that check process.env.NODE_ENV
export const getNodeEnv = () => {
  try {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
      return process.env.NODE_ENV;
    }
    return import.meta.env?.MODE || 'production';
  } catch {
    return 'production';
  }
};
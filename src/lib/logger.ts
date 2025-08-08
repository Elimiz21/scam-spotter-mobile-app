// Centralized logging utility that respects environment settings
import { appConfig, shouldLog } from '@/config/environment';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;
  private debugEnabled: boolean;

  constructor() {
    this.isDevelopment = appConfig.environment === 'development';
    this.debugEnabled = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    // Only log if the log level is appropriate for the environment
    if (!shouldLog(level)) {
      return;
    }

    // In production, only log errors unless explicitly enabled
    if (appConfig.environment === 'production' && level !== 'ERROR') {
      return;
    }

    // In development, respect the debug flag
    if (this.isDevelopment && !this.debugEnabled && level === 'DEBUG') {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case 'DEBUG':
        if (this.isDevelopment && this.debugEnabled) {
          console.log(formattedMessage);
        }
        break;
      case 'INFO':
        if (this.isDevelopment || appConfig.monitoring.enabled) {
          console.info(formattedMessage);
        }
        break;
      case 'WARN':
        if (this.isDevelopment || appConfig.monitoring.enabled) {
          console.warn(formattedMessage);
        }
        break;
      case 'ERROR':
        console.error(formattedMessage);
        // In production, also send to monitoring service
        if (appConfig.monitoring.enabled && appConfig.monitoring.sentryDsn) {
          this.sendToMonitoring(level, message, context);
        }
        break;
    }
  }

  private sendToMonitoring(level: LogLevel, message: string, context?: LogContext) {
    // This would integrate with Sentry or another monitoring service
    // For now, it's a placeholder
    try {
      // Future: Send to Sentry or other monitoring service
      // Sentry.captureMessage(message, level.toLowerCase());
    } catch (error) {
      // Fail silently to avoid breaking the app
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('DEBUG', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('WARN', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('ERROR', message, context);
  }

  // Special method for API errors
  apiError(endpoint: string, error: any, context?: LogContext) {
    this.error(`API Error: ${endpoint}`, {
      ...context,
      error: error.message || error,
      stack: error.stack,
    });
  }

  // Special method for validation errors
  validationError(field: string, value: any, error: string) {
    this.warn(`Validation Error: ${field}`, {
      field,
      value,
      error,
    });
  }

  // Group logging (only in development)
  group(label: string) {
    if (this.isDevelopment && this.debugEnabled) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.isDevelopment && this.debugEnabled) {
      console.groupEnd();
    }
  }

  // Table logging (only in development)
  table(data: any) {
    if (this.isDevelopment && this.debugEnabled) {
      console.table(data);
    }
  }

  // Performance timing
  time(label: string) {
    if (this.isDevelopment && this.debugEnabled) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.isDevelopment && this.debugEnabled) {
      console.timeEnd(label);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for use in other files
export type { LogLevel, LogContext };
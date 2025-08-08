// Comprehensive error handling utility for the application
import { logger } from './logger';

export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  
  // Business logic errors
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  FEATURE_DISABLED = 'FEATURE_DISABLED',
  
  // Security errors
  INVALID_TOKEN = 'INVALID_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

export interface ErrorContext {
  userId?: string;
  endpoint?: string;
  method?: string;
  payload?: any;
  timestamp?: string;
  requestId?: string;
  [key: string]: any;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: ErrorContext;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: ErrorContext,
    originalError?: Error
  ) {
    super(message);
    
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.originalError = originalError;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: new Date().toISOString(),
    };
  }
}

// Predefined error factory functions
export const createBadRequestError = (
  message: string,
  context?: ErrorContext
): AppError => {
  return new AppError(message, ErrorCode.BAD_REQUEST, 400, true, context);
};

export const createUnauthorizedError = (
  message: string = 'Unauthorized access',
  context?: ErrorContext
): AppError => {
  return new AppError(message, ErrorCode.UNAUTHORIZED, 401, true, context);
};

export const createForbiddenError = (
  message: string = 'Access forbidden',
  context?: ErrorContext
): AppError => {
  return new AppError(message, ErrorCode.FORBIDDEN, 403, true, context);
};

export const createNotFoundError = (
  resource: string,
  context?: ErrorContext
): AppError => {
  return new AppError(
    `${resource} not found`,
    ErrorCode.NOT_FOUND,
    404,
    true,
    context
  );
};

export const createRateLimitError = (
  retryAfter?: number,
  context?: ErrorContext
): AppError => {
  const ctx = context || {};
  if (retryAfter) {
    ctx.retryAfter = retryAfter;
  }
  return new AppError(
    'Rate limit exceeded. Please try again later.',
    ErrorCode.RATE_LIMITED,
    429,
    true,
    ctx
  );
};

export const createValidationError = (
  field: string,
  message: string,
  context?: ErrorContext
): AppError => {
  return new AppError(
    `Validation error: ${field} - ${message}`,
    ErrorCode.VALIDATION_ERROR,
    400,
    true,
    { ...context, field }
  );
};

export const createInternalError = (
  message: string = 'An internal error occurred',
  originalError?: Error,
  context?: ErrorContext
): AppError => {
  return new AppError(
    message,
    ErrorCode.INTERNAL_ERROR,
    500,
    false,
    context,
    originalError
  );
};

export const createDatabaseError = (
  operation: string,
  originalError?: Error,
  context?: ErrorContext
): AppError => {
  return new AppError(
    `Database operation failed: ${operation}`,
    ErrorCode.DATABASE_ERROR,
    500,
    false,
    context,
    originalError
  );
};

export const createExternalApiError = (
  service: string,
  originalError?: Error,
  context?: ErrorContext
): AppError => {
  return new AppError(
    `External API error: ${service}`,
    ErrorCode.EXTERNAL_API_ERROR,
    502,
    false,
    { ...context, service },
    originalError
  );
};

// Error handler for Express/API routes
export const handleApiError = (error: Error | AppError): {
  statusCode: number;
  body: any;
} => {
  // Log the error
  if (error instanceof AppError) {
    if (error.isOperational) {
      logger.warn('Operational error', {
        error: error.toJSON(),
      });
    } else {
      logger.error('Non-operational error', {
        error: error.toJSON(),
        stack: error.stack,
      });
    }
    
    return {
      statusCode: error.statusCode,
      body: {
        error: {
          message: error.message,
          code: error.code,
          ...(error.context?.retryAfter && { retryAfter: error.context.retryAfter }),
        },
      },
    };
  }
  
  // Unknown error
  logger.error('Unknown error', {
    message: error.message,
    stack: error.stack,
  });
  
  return {
    statusCode: 500,
    body: {
      error: {
        message: 'An unexpected error occurred',
        code: ErrorCode.INTERNAL_ERROR,
      },
    },
  };
};

// Async error wrapper for route handlers
export const asyncHandler = (
  fn: (...args: any[]) => Promise<any>
) => {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      const { statusCode, body } = handleApiError(error as Error);
      
      // For Supabase edge functions
      if (typeof Response !== 'undefined') {
        return new Response(JSON.stringify(body), {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // For other environments
      throw error;
    }
  };
};

// Error recovery strategies
export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
  shouldRetry?: (error: Error) => boolean;
}

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> => {
  const { maxAttempts, delay, backoff = 'exponential', shouldRetry } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry
      if (shouldRetry && !shouldRetry(lastError)) {
        throw lastError;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Calculate delay
      const currentDelay = backoff === 'exponential' 
        ? delay * Math.pow(2, attempt - 1)
        : delay * attempt;
      
      logger.debug(`Retrying after ${currentDelay}ms (attempt ${attempt}/${maxAttempts})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }
  
  throw lastError || new Error('Max retry attempts reached');
};

// Circuit breaker pattern for external services
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000, // 1 minute
    private readonly resetTimeout: number = 30000 // 30 seconds
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      const now = new Date();
      if (
        this.lastFailureTime &&
        now.getTime() - this.lastFailureTime.getTime() > this.timeout
      ) {
        this.state = 'HALF_OPEN';
      } else {
        throw new AppError(
          'Service temporarily unavailable',
          ErrorCode.SERVICE_UNAVAILABLE,
          503,
          true
        );
      }
    }
    
    try {
      const result = await fn();
      
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  
  private recordFailure() {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      logger.warn('Circuit breaker opened', {
        failureCount: this.failureCount,
        threshold: this.threshold,
      });
    }
  }
  
  private reset() {
    this.failureCount = 0;
    this.lastFailureTime = undefined;
    this.state = 'CLOSED';
    logger.info('Circuit breaker reset');
  }
  
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}
// Comprehensive input validation and sanitization utility
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { createValidationError } from './errorHandler';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');

export const phoneSchema = z.string().regex(
  /^\+?[1-9]\d{1,14}$/,
  'Invalid phone number format'
);

export const urlSchema = z.string().url('Invalid URL format');

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const dateSchema = z.string().datetime('Invalid date format');

// Sanitization functions
export const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
};

export const sanitizeText = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

export const sanitizeFilename = (filename: string): string => {
  // Remove any path traversal attempts
  let safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  safe = safe.replace(/\.{2,}/g, '_');
  safe = safe.replace(/^\./, '_');
  
  // Limit length
  if (safe.length > 255) {
    const ext = safe.split('.').pop();
    const name = safe.substring(0, 250 - (ext?.length || 0));
    safe = ext ? `${name}.${ext}` : name;
  }
  
  return safe;
};

export const sanitizeUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    // Prevent localhost and private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')
      ) {
        return null;
      }
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
};

// SQL injection prevention
export const sanitizeSqlInput = (input: string): string => {
  // Remove or escape dangerous SQL characters
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comments
    .replace(/\*\//g, '')
    .replace(/\bDROP\b/gi, '') // Remove DROP keyword
    .replace(/\bDELETE\b/gi, '') // Remove DELETE keyword
    .replace(/\bUPDATE\b/gi, '') // Remove UPDATE keyword
    .replace(/\bINSERT\b/gi, '') // Remove INSERT keyword
    .replace(/\bEXEC\b/gi, '') // Remove EXEC keyword
    .replace(/\bSCRIPT\b/gi, '') // Remove SCRIPT keyword
    .trim();
};

// NoSQL injection prevention
export const sanitizeMongoInput = (input: any): any => {
  if (typeof input === 'string') {
    // Remove MongoDB operators
    return input.replace(/[$]/g, '');
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = Array.isArray(input) ? [] : {};
    
    for (const key in input) {
      // Skip keys that start with $
      if (key.startsWith('$')) {
        continue;
      }
      
      sanitized[key] = sanitizeMongoInput(input[key]);
    }
    
    return sanitized;
  }
  
  return input;
};

// Command injection prevention
export const sanitizeShellInput = (input: string): string => {
  // Remove or escape shell metacharacters
  return input.replace(/[;&|`$()<>\[\]{}\\'"]/g, '');
};

// Path traversal prevention
export const sanitizePath = (path: string): string => {
  // Remove any path traversal attempts
  return path
    .replace(/\.\./g, '') // Remove ..
    .replace(/^\//, '') // Remove leading /
    .replace(/\/$/, '') // Remove trailing /
    .replace(/[^a-zA-Z0-9\/_.-]/g, ''); // Only allow safe characters
};

// Validation schemas for common inputs
export const validationSchemas = {
  // User inputs
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  
  // Financial inputs
  amount: z.number()
    .positive('Amount must be positive')
    .finite('Amount must be a finite number')
    .max(1000000, 'Amount exceeds maximum allowed'),
  
  cryptoAddress: z.string()
    .regex(/^(0x)?[0-9a-fA-F]{40}$/, 'Invalid Ethereum address format'),
  
  // Content inputs
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message is too long'),
  
  title: z.string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title is too long'),
  
  description: z.string()
    .max(1000, 'Description is too long'),
  
  // File inputs
  fileSize: z.number()
    .positive('File size must be positive')
    .max(10 * 1024 * 1024, 'File size exceeds 10MB limit'),
  
  mimeType: z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
  ]),
};

// Rate limiting input validation
export const validateRateLimit = (
  value: number,
  min: number = 1,
  max: number = 1000
): number => {
  const parsed = parseInt(String(value), 10);
  
  if (isNaN(parsed)) {
    throw createValidationError('rate_limit', 'Invalid rate limit value');
  }
  
  if (parsed < min || parsed > max) {
    throw createValidationError(
      'rate_limit',
      `Rate limit must be between ${min} and ${max}`
    );
  }
  
  return parsed;
};

// Pagination validation
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export const validatePagination = (
  page?: string | number,
  limit?: string | number,
  maxLimit: number = 100
): PaginationParams => {
  const pageNum = Math.max(1, parseInt(String(page || 1), 10) || 1);
  const limitNum = Math.min(
    maxLimit,
    Math.max(1, parseInt(String(limit || 10), 10) || 10)
  );
  const offset = (pageNum - 1) * limitNum;
  
  return {
    page: pageNum,
    limit: limitNum,
    offset,
  };
};

// Date range validation
export interface DateRange {
  start: Date;
  end: Date;
}

export const validateDateRange = (
  start?: string,
  end?: string,
  maxDays: number = 365
): DateRange => {
  const now = new Date();
  const startDate = start ? new Date(start) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const endDate = end ? new Date(end) : now;
  
  if (isNaN(startDate.getTime())) {
    throw createValidationError('start_date', 'Invalid start date');
  }
  
  if (isNaN(endDate.getTime())) {
    throw createValidationError('end_date', 'Invalid end date');
  }
  
  if (startDate > endDate) {
    throw createValidationError('date_range', 'Start date must be before end date');
  }
  
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > maxDays) {
    throw createValidationError('date_range', `Date range cannot exceed ${maxDays} days`);
  }
  
  return { start: startDate, end: endDate };
};

// Generic validation function
export const validate = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options?: {
    sanitize?: boolean;
    throwOnError?: boolean;
  }
): { success: boolean; data?: T; errors?: z.ZodError } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (options?.throwOnError) {
      throw error;
    }
    
    return {
      success: false,
      errors: error as z.ZodError,
    };
  }
};

// Input sanitization middleware
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return sanitizeText(input);
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    
    for (const key in input) {
      // Sanitize the key itself
      const sanitizedKey = sanitizeText(key);
      sanitized[sanitizedKey] = sanitizeInput(input[key]);
    }
    
    return sanitized;
  }
  
  return input;
};

// Export validators for specific use cases
export const validators = {
  isEmail: (email: string) => emailSchema.safeParse(email).success,
  isPhone: (phone: string) => phoneSchema.safeParse(phone).success,
  isUrl: (url: string) => urlSchema.safeParse(url).success,
  isUuid: (uuid: string) => uuidSchema.safeParse(uuid).success,
  isDate: (date: string) => dateSchema.safeParse(date).success,
  
  // Custom validators
  isSafeFilename: (filename: string) => {
    const safe = sanitizeFilename(filename);
    return safe === filename;
  },
  
  isSafePath: (path: string) => {
    const safe = sanitizePath(path);
    return safe === path && !path.includes('..');
  },
  
  isStrongPassword: (password: string) => {
    return validationSchemas.password.safeParse(password).success;
  },
};
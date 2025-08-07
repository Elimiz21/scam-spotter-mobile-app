import { z } from 'zod';

// Common validation schemas
export const phoneNumberSchema = z
  .string()
  .regex(/^[\+]?[(]?[\d\s\-\(\)]{10,20}$/, 'Please enter a valid phone number')
  .optional()
  .or(z.literal(''));

export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(100, 'Email must be less than 100 characters');

export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .or(z.string().regex(/^https?:\/\/.+/, 'URL must start with http:// or https://'));

export const telegramUsernameSchema = z
  .string()
  .regex(/^@?[a-zA-Z0-9_]{5,32}$/, 'Telegram username must be 5-32 characters with letters, numbers, and underscores only');

export const discordUsernameSchema = z
  .string()
  .regex(/^.{3,32}#[0-9]{4}$/, 'Discord username must be in format: username#1234');

export const cryptoSymbolSchema = z
  .string()
  .regex(/^[A-Z]{2,10}$/, 'Crypto symbol must be 2-10 uppercase letters')
  .transform(val => val.toUpperCase());

export const stockSymbolSchema = z
  .string()
  .regex(/^[A-Z]{1,5}$/, 'Stock symbol must be 1-5 uppercase letters')
  .transform(val => val.toUpperCase());

// Group Analysis Form Schema
export const groupAnalysisSchema = z.object({
  platform: z.enum(['telegram', 'discord', 'whatsapp', 'signal', 'other'], {
    errorMap: () => ({ message: 'Please select a platform' }),
  }),
  groupName: z
    .string()
    .min(2, 'Group name must be at least 2 characters')
    .max(100, 'Group name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_\.@]+$/, 'Group name contains invalid characters'),
  groupUrl: urlSchema.optional().or(z.literal('')),
  memberCount: z
    .number()
    .int('Member count must be a whole number')
    .min(1, 'Member count must be at least 1')
    .max(1000000, 'Member count seems too high')
    .optional(),
  members: z
    .string()
    .min(10, 'Please provide at least some member information')
    .max(10000, 'Member list is too long')
    .refine(
      (val) => val.split('\n').length >= 2,
      'Please provide at least 2 members'
    ),
  messages: z
    .string()
    .min(50, 'Please provide more message content for analysis')
    .max(50000, 'Message content is too long'),
  assetSymbol: z
    .string()
    .min(1, 'Asset symbol is required')
    .max(20, 'Asset symbol is too long')
    .regex(/^[A-Z0-9\-_\.]+$/i, 'Invalid asset symbol format')
    .transform(val => val.toUpperCase()),
  suspiciousActivity: z
    .string()
    .max(1000, 'Description is too long')
    .optional()
    .or(z.literal('')),
});

// Single Check Form Schema
export const singleCheckSchema = z.object({
  checkType: z.enum(['scammer-database', 'language-analysis', 'price-manipulation', 'asset-verification'], {
    errorMap: () => ({ message: 'Please select a check type' }),
  }),
  input: z
    .string()
    .min(1, 'Input is required')
    .max(5000, 'Input is too long'),
}).refine((data) => {
  // Custom validation based on check type
  switch (data.checkType) {
    case 'scammer-database':
      // Validate usernames, phone numbers, emails
      const usernameRegex = /^[a-zA-Z0-9@_\-\.]{3,50}$/;
      const phoneRegex = /^[\+]?[(]?[\d\s\-\(\)]{10,20}$/;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      const isValidInput = usernameRegex.test(data.input) || 
                          phoneRegex.test(data.input) || 
                          emailRegex.test(data.input);
      
      return isValidInput;
    
    case 'language-analysis':
      return data.input.length >= 20; // Minimum text length for analysis
    
    case 'price-manipulation':
      return /^[A-Z0-9\-_\.]{2,20}$/i.test(data.input); // Asset symbol format
    
    case 'asset-verification':
      return /^[A-Z0-9\-_\.]{2,20}$/i.test(data.input); // Asset symbol format
    
    default:
      return true;
  }
}, {
  message: 'Input format is invalid for the selected check type',
});

// Authentication Form Schemas
export const signUpSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords don\'t match',
  path: ['confirmPassword'],
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// Profile Update Schema
export const profileUpdateSchema = z.object({
  email: emailSchema.optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
    .optional()
    .or(z.literal('')),
  confirmNewPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== '') {
    return data.currentPassword && data.currentPassword !== '';
  }
  return true;
}, {
  message: 'Current password is required when setting a new password',
  path: ['currentPassword'],
}).refine((data) => {
  if (data.newPassword && data.newPassword !== '') {
    return data.newPassword === data.confirmNewPassword;
  }
  return true;
}, {
  message: 'New passwords don\'t match',
  path: ['confirmNewPassword'],
});

// Contact Form Schema
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: emailSchema,
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be less than 5000 characters'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

// Payment Form Schema
export const paymentFormSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(10000, 'Amount exceeds maximum limit'),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  paymentMethod: z.enum(['paypal', 'stripe', 'crypto']),
});

// Export Form Schema
export const exportFormSchema = z.object({
  format: z.enum(['pdf', 'json', 'csv', 'html']),
  includeDetails: z.boolean().default(true),
  includeCharts: z.boolean().default(true),
  dateRange: z.enum(['last_7_days', 'last_30_days', 'last_90_days', 'all_time']).default('last_30_days'),
});

// Admin Schemas
export const adminUserSchema = z.object({
  email: emailSchema,
  role: z.enum(['user', 'admin', 'moderator']),
  isActive: z.boolean().default(true),
});

export const scammerEntrySchema = z.object({
  identifier: z
    .string()
    .min(3, 'Identifier must be at least 3 characters')
    .max(100, 'Identifier must be less than 100 characters'),
  identifierType: z.enum(['username', 'email', 'phone', 'wallet', 'url']),
  confidence: z
    .number()
    .min(0, 'Confidence must be between 0 and 100')
    .max(100, 'Confidence must be between 0 and 100'),
  source: z
    .string()
    .min(2, 'Source must be at least 2 characters')
    .max(100, 'Source must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  tags: z.array(z.string()).optional(),
});

// Type exports for form data
export type GroupAnalysisFormData = z.infer<typeof groupAnalysisSchema>;
export type SingleCheckFormData = z.infer<typeof singleCheckSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type PaymentFormData = z.infer<typeof paymentFormSchema>;
export type ExportFormData = z.infer<typeof exportFormSchema>;
export type AdminUserFormData = z.infer<typeof adminUserSchema>;
export type ScammerEntryFormData = z.infer<typeof scammerEntrySchema>;

// Validation helper functions
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
} => {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errors: Record<string, string[]> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      });
      
      return { success: false, errors };
    }
  } catch (error) {
    return { 
      success: false, 
      errors: { general: ['Validation failed due to an unexpected error'] }
    };
  }
};

// Sanitization helpers
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:/gi, '') // Remove data: URLs
    .substring(0, 10000); // Limit length
};

export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const normalizePhoneNumber = (phone: string): string => {
  return phone.replace(/[\s\-\(\)]/g, '');
};

export const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};
// Comprehensive Security Hardening Library
import { logger } from './logger';

// Security Configuration Types
export interface SecurityConfig {
  csp: {
    enabled: boolean;
    directives: CSPDirectives;
    reportUri?: string;
    reportOnly?: boolean;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
  };
  encryption: {
    algorithm: string;
    keyLength: number;
    saltRounds: number;
  };
  headers: {
    hsts: boolean;
    noSniff: boolean;
    frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
    xssProtection: boolean;
    referrerPolicy: string;
  };
  cors: {
    origin: string | string[] | boolean;
    credentials: boolean;
    optionsSuccessStatus: number;
  };
}

export interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'media-src': string[];
  'object-src': string[];
  'child-src': string[];
  'worker-src': string[];
  'frame-ancestors': string[];
  'form-action': string[];
  'upgrade-insecure-requests': boolean;
  'block-all-mixed-content': boolean;
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  source: string;
  details: Record<string, any>;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resolved: boolean;
  resolutionNotes?: string;
}

export type SecurityEventType = 
  | 'csp_violation'
  | 'rate_limit_exceeded'
  | 'authentication_failure'
  | 'suspicious_activity'
  | 'data_breach_attempt'
  | 'malicious_upload'
  | 'sql_injection_attempt'
  | 'xss_attempt'
  | 'csrf_token_mismatch'
  | 'unauthorized_access'
  | 'session_hijack_attempt';

// Default Security Configuration
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  csp: {
    enabled: true,
    reportOnly: false,
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Remove in production, use nonces instead
        'https://apis.google.com',
        'https://www.google-analytics.com',
        'https://connect.facebook.net'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // For styled-components
        'https://fonts.googleapis.com'
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https://*.scamshiel.com',
        'https://secure.gravatar.com',
        'https://via.placeholder.com'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],
      'connect-src': [
        "'self'",
        'https://api.scamshiel.com',
        'https://analytics.scamshiel.com',
        'wss://ws.scamshiel.com'
      ],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'child-src': ["'none'"],
      'worker-src': ["'self'"],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': true,
      'block-all-mixed-content': true
    }
  },
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  encryption: {
    algorithm: 'AES-256-GCM',
    keyLength: 32,
    saltRounds: 12
  },
  headers: {
    hsts: true,
    noSniff: true,
    frameOptions: 'DENY',
    xssProtection: true,
    referrerPolicy: 'strict-origin-when-cross-origin'
  },
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://www.scamshiel.com', 'https://api.scamshiel.com']
      : true,
    credentials: true,
    optionsSuccessStatus: 200
  }
};

// Content Security Policy Manager
export class CSPManager {
  private config: SecurityConfig['csp'];
  private violations: SecurityEvent[] = [];

  constructor(config: SecurityConfig['csp']) {
    this.config = config;
    this.initialize();
  }

  private initialize() {
    if (!this.config.enabled) return;

    // Set CSP header
    this.applyCSP();
    
    // Listen for CSP violations
    this.setupViolationReporting();
  }

  private applyCSP() {
    const cspString = this.buildCSPString();
    const headerName = this.config.reportOnly 
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';

    // For client-side applications, we'll inject a meta tag
    const meta = document.createElement('meta');
    meta.httpEquiv = headerName;
    meta.content = cspString;
    document.head.appendChild(meta);

    logger.info('CSP applied', { policy: cspString });
  }

  private buildCSPString(): string {
    const directives: string[] = [];

    Object.entries(this.config.directives).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        if (value) {
          directives.push(key);
        }
      } else {
        directives.push(`${key} ${value.join(' ')}`);
      }
    });

    if (this.config.reportUri) {
      directives.push(`report-uri ${this.config.reportUri}`);
    }

    return directives.join('; ');
  }

  private setupViolationReporting() {
    document.addEventListener('securitypolicyviolation', (event) => {
      const violation: SecurityEvent = {
        id: this.generateEventId(),
        type: 'csp_violation',
        severity: this.classifyCSPViolation(event),
        timestamp: new Date(),
        source: 'csp',
        details: {
          violatedDirective: event.violatedDirective,
          originalPolicy: event.originalPolicy,
          blockedURI: event.blockedURI,
          disposition: event.disposition,
          lineNumber: event.lineNumber,
          columnNumber: event.columnNumber,
          sourceFile: event.sourceFile
        },
        resolved: false
      };

      this.violations.push(violation);
      this.reportViolation(violation);
    });
  }

  private classifyCSPViolation(event: SecurityPolicyViolationEvent): SecurityEvent['severity'] {
    // Classify severity based on violated directive
    const directive = event.violatedDirective;
    
    if (directive.includes('script-src') || directive.includes('object-src')) {
      return 'critical';
    }
    
    if (directive.includes('img-src') || directive.includes('style-src')) {
      return 'medium';
    }
    
    return 'low';
  }

  private async reportViolation(violation: SecurityEvent) {
    try {
      if (this.config.reportUri) {
        await fetch(this.config.reportUri, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(violation)
        });
      }

      logger.warn('CSP violation detected', violation);
    } catch (error) {
      logger.error('Failed to report CSP violation:', error);
    }
  }

  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getViolations(): SecurityEvent[] {
    return [...this.violations];
  }

  clearViolations(): void {
    this.violations = [];
  }
}

// Rate Limiting Manager
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: SecurityConfig['rateLimit'];

  constructor(config: SecurityConfig['rateLimit']) {
    this.config = config;
    this.startCleanupInterval();
  }

  checkRateLimit(key: string): boolean {
    if (!this.config.enabled) return true;

    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get existing requests for this key
    let requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (requests.length >= this.config.maxRequests) {
      this.logRateLimitExceeded(key);
      return false;
    }
    
    // Add current request
    requests.push(now);
    this.requests.set(key, requests);
    
    return true;
  }

  private logRateLimitExceeded(key: string) {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type: 'rate_limit_exceeded',
      severity: 'high',
      timestamp: new Date(),
      source: 'rate_limiter',
      details: {
        key,
        limit: this.config.maxRequests,
        window: this.config.windowMs
      },
      resolved: false
    };

    logger.warn('Rate limit exceeded', event);
  }

  private startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      const cutoff = now - this.config.windowMs * 2;
      
      for (const [key, requests] of this.requests.entries()) {
        const validRequests = requests.filter(timestamp => timestamp > cutoff);
        
        if (validRequests.length === 0) {
          this.requests.delete(key);
        } else {
          this.requests.set(key, validRequests);
        }
      }
    }, this.config.windowMs);
  }

  private generateEventId(): string {
    return `rl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStats(): { totalKeys: number; activeRequests: number } {
    let totalRequests = 0;
    for (const requests of this.requests.values()) {
      totalRequests += requests.length;
    }
    
    return {
      totalKeys: this.requests.size,
      activeRequests: totalRequests
    };
  }
}

// Data Encryption Manager
export class DataEncryption {
  private config: SecurityConfig['encryption'];

  constructor(config: SecurityConfig['encryption']) {
    this.config = config;
  }

  async encryptData(data: string, key?: string): Promise<string> {
    try {
      if (!crypto.subtle) {
        throw new Error('Web Crypto API not available');
      }

      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate or use provided key
      const cryptoKey = key ? 
        await this.importKey(key) : 
        await this.generateKey();
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt data
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        dataBuffer
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      
      // Convert to base64
      return btoa(String.fromCharCode(...combined));
      
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw error;
    }
  }

  async decryptData(encryptedData: string, key: string): Promise<string> {
    try {
      if (!crypto.subtle) {
        throw new Error('Web Crypto API not available');
      }

      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      // Import key
      const cryptoKey = await this.importKey(key);
      
      // Decrypt data
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encrypted
      );
      
      // Convert to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
      
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw error;
    }
  }

  async generateKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  private async importKey(keyString: string): Promise<CryptoKey> {
    const keyBuffer = new Uint8Array(
      atob(keyString).split('').map(char => char.charCodeAt(0))
    );
    
    return crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    try {
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);
      
      // Generate or use provided salt
      const saltString = salt || crypto.getRandomValues(new Uint8Array(16))
        .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
      
      const saltBuffer = encoder.encode(saltString);
      
      // Import password as key
      const key = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
      );
      
      // Derive key using PBKDF2
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: 100000,
          hash: 'SHA-256'
        },
        key,
        256
      );
      
      // Convert to hex string
      const hash = Array.from(new Uint8Array(derivedBits))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      
      return { hash, salt: saltString };
      
    } catch (error) {
      logger.error('Password hashing failed:', error);
      throw error;
    }
  }

  async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    try {
      const { hash: computedHash } = await this.hashPassword(password, salt);
      return computedHash === hash;
    } catch (error) {
      logger.error('Password verification failed:', error);
      return false;
    }
  }
}

// Security Headers Manager
export class SecurityHeaders {
  private config: SecurityConfig['headers'];

  constructor(config: SecurityConfig['headers']) {
    this.config = config;
    this.applyHeaders();
  }

  private applyHeaders() {
    // Apply security headers via meta tags (for SPA)
    this.applyMetaHeaders();
    
    // Log applied headers
    logger.info('Security headers applied', this.config);
  }

  private applyMetaHeaders() {
    const headers = [
      // X-Content-Type-Options
      { 
        name: 'http-equiv', 
        value: 'X-Content-Type-Options',
        content: 'nosniff'
      },
      
      // X-Frame-Options
      { 
        name: 'http-equiv', 
        value: 'X-Frame-Options',
        content: this.config.frameOptions
      },
      
      // X-XSS-Protection
      { 
        name: 'http-equiv', 
        value: 'X-XSS-Protection',
        content: this.config.xssProtection ? '1; mode=block' : '0'
      },
      
      // Referrer-Policy
      { 
        name: 'name', 
        value: 'referrer',
        content: this.config.referrerPolicy
      }
    ];

    headers.forEach(header => {
      const meta = document.createElement('meta');
      meta.setAttribute(header.name, header.value);
      meta.content = header.content;
      document.head.appendChild(meta);
    });

    // Apply HSTS (requires server-side implementation)
    if (this.config.hsts) {
      logger.info('HSTS should be configured at server level');
    }
  }
}

// Input Sanitization & Validation
export class InputSanitizer {
  
  static sanitizeHTML(input: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.textContent = input;
    return tempDiv.innerHTML;
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  static validateURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  static sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  static validateFileSize(file: File, maxSizeBytes: number): boolean {
    return file.size <= maxSizeBytes;
  }

  static sanitizeInput(input: string, maxLength: number = 1000): string {
    return input
      .slice(0, maxLength)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  static validateCSRFToken(token: string, expectedToken: string): boolean {
    return token === expectedToken && token.length >= 32;
  }
}

// Main Security Manager
export class SecurityManager {
  private config: SecurityConfig;
  private cspManager: CSPManager;
  private rateLimiter: RateLimiter;
  private encryption: DataEncryption;
  private headers: SecurityHeaders;
  private events: SecurityEvent[] = [];

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
    
    this.cspManager = new CSPManager(this.config.csp);
    this.rateLimiter = new RateLimiter(this.config.rateLimit);
    this.encryption = new DataEncryption(this.config.encryption);
    this.headers = new SecurityHeaders(this.config.headers);

    this.initialize();
  }

  private initialize() {
    // Monitor for security events
    this.setupSecurityMonitoring();
    
    // Initialize secure session management
    this.setupSecureSession();
    
    logger.info('Security manager initialized', {
      csp: this.config.csp.enabled,
      rateLimit: this.config.rateLimit.enabled
    });
  }

  private setupSecurityMonitoring() {
    // Monitor authentication failures
    window.addEventListener('authenticationFailure', (event: any) => {
      this.recordSecurityEvent({
        type: 'authentication_failure',
        severity: 'medium',
        details: event.detail
      });
    });

    // Monitor suspicious activity
    this.monitorSuspiciousActivity();
  }

  private monitorSuspiciousActivity() {
    let rapidClicks = 0;
    let lastClickTime = 0;

    document.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastClickTime < 100) {
        rapidClicks++;
        if (rapidClicks > 10) {
          this.recordSecurityEvent({
            type: 'suspicious_activity',
            severity: 'medium',
            details: { pattern: 'rapid_clicking', count: rapidClicks }
          });
          rapidClicks = 0;
        }
      } else {
        rapidClicks = 0;
      }
      lastClickTime = now;
    });
  }

  private setupSecureSession() {
    // Secure session token management
    const sessionToken = sessionStorage.getItem('sessionToken');
    if (sessionToken && !this.validateSessionToken(sessionToken)) {
      sessionStorage.removeItem('sessionToken');
      this.recordSecurityEvent({
        type: 'session_hijack_attempt',
        severity: 'critical',
        details: { invalidToken: true }
      });
    }
  }

  private validateSessionToken(token: string): boolean {
    // Basic token validation - in production, verify against server
    return token.length >= 32 && /^[a-zA-Z0-9+/=]+$/.test(token);
  }

  private recordSecurityEvent(event: Partial<SecurityEvent>) {
    const fullEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      source: 'security_manager',
      resolved: false,
      ...event
    } as SecurityEvent;

    this.events.push(fullEvent);
    
    if (fullEvent.severity === 'critical') {
      this.handleCriticalEvent(fullEvent);
    }

    logger.warn('Security event recorded', fullEvent);
  }

  private handleCriticalEvent(event: SecurityEvent) {
    // Handle critical security events
    if (event.type === 'session_hijack_attempt') {
      // Force re-authentication
      this.forceReauthentication();
    }
    
    // Send immediate alert
    this.sendSecurityAlert(event);
  }

  private forceReauthentication() {
    // Clear all session data
    sessionStorage.clear();
    localStorage.removeItem('authToken');
    
    // Redirect to login or show modal
    window.dispatchEvent(new CustomEvent('forceLogout', {
      detail: { reason: 'security_event' }
    }));
  }

  private async sendSecurityAlert(event: SecurityEvent) {
    try {
      // In production, send to security monitoring system
      logger.error('CRITICAL SECURITY EVENT', event);
    } catch (error) {
      logger.error('Failed to send security alert:', error);
    }
  }

  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  checkRateLimit(key: string): boolean {
    return this.rateLimiter.checkRateLimit(key);
  }

  async encryptData(data: string, key?: string): Promise<string> {
    return this.encryption.encryptData(data, key);
  }

  async decryptData(encryptedData: string, key: string): Promise<string> {
    return this.encryption.decryptData(encryptedData, key);
  }

  async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    return this.encryption.hashPassword(password);
  }

  async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    return this.encryption.verifyPassword(password, hash, salt);
  }

  getSecurityEvents(type?: SecurityEventType): SecurityEvent[] {
    return type ? 
      this.events.filter(event => event.type === type) : 
      [...this.events];
  }

  getSecurityStats() {
    const rateLimitStats = this.rateLimiter.getStats();
    const cspViolations = this.cspManager.getViolations();
    
    return {
      totalEvents: this.events.length,
      criticalEvents: this.events.filter(e => e.severity === 'critical').length,
      rateLimitStats,
      cspViolations: cspViolations.length,
      lastEvent: this.events[this.events.length - 1]?.timestamp
    };
  }

  cleanup() {
    this.events = [];
    this.cspManager.clearViolations();
  }
}

// Export singleton instance
export const securityManager = new SecurityManager();

// Export default
export default securityManager;
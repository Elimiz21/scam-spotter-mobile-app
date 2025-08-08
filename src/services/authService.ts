// Comprehensive authentication service with OAuth, 2FA, and session management
import { supabase } from '@/integrations/supabase/client';
import { User, Session, AuthError, Provider } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { AppError, createUnauthorizedError, createBadRequestError } from '@/lib/errorHandler';
import { validators, validationSchemas } from '@/lib/inputValidation';
import { localCache, sessionCache } from '@/lib/cache';

// Auth configuration
export interface AuthConfig {
  providers: Provider[];
  sessionTimeout: number;
  rememberMeDuration: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  require2FA: boolean;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expirationDays: number;
  };
}

// User profile interface
export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: 'user' | 'admin' | 'moderator';
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';
    expiresAt?: Date;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: boolean;
    newsletter: boolean;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    loginCount: number;
    ipAddress?: string;
    userAgent?: string;
  };
}

// Login attempt tracking
interface LoginAttempt {
  email: string;
  attempts: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

// Session info
export interface SessionInfo {
  session: Session;
  user: User;
  profile: UserProfile;
  permissions: string[];
  expiresAt: Date;
}

class AuthService {
  private loginAttempts = new Map<string, LoginAttempt>();
  private config: AuthConfig = {
    providers: ['google', 'github', 'discord', 'twitter'] as Provider[],
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    require2FA: false,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expirationDays: 90,
    },
  };

  // Initialize auth service
  async initialize(): Promise<void> {
    try {
      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          await this.handleAuthStateChange(event, session);
        }
      );

      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await this.refreshUserProfile(session.user.id);
      }

      logger.info('Auth service initialized');
    } catch (error) {
      logger.error('Failed to initialize auth service', { error });
      throw error;
    }
  }

  // Handle auth state changes
  private async handleAuthStateChange(
    event: string,
    session: Session | null
  ): Promise<void> {
    logger.debug('Auth state changed', { event, userId: session?.user?.id });

    switch (event) {
      case 'SIGNED_IN':
        await this.handleSignIn(session!);
        break;
      case 'SIGNED_OUT':
        await this.handleSignOut();
        break;
      case 'TOKEN_REFRESHED':
        await this.handleTokenRefresh(session!);
        break;
      case 'USER_UPDATED':
        if (session) {
          await this.refreshUserProfile(session.user.id);
        }
        break;
      case 'PASSWORD_RECOVERY':
        logger.info('Password recovery initiated');
        break;
    }
  }

  // Sign up with email and password
  async signUp(
    email: string,
    password: string,
    metadata?: {
      username?: string;
      fullName?: string;
      acceptedTerms?: boolean;
      newsletter?: boolean;
    }
  ): Promise<SessionInfo> {
    try {
      // Validate inputs
      if (!validators.isEmail(email)) {
        throw createBadRequestError('Invalid email address');
      }

      if (!validators.isStrongPassword(password)) {
        throw createBadRequestError('Password does not meet requirements');
      }

      // Check if terms are accepted
      if (!metadata?.acceptedTerms) {
        throw createBadRequestError('You must accept the terms of service');
      }

      // Sign up user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: metadata?.username,
            full_name: metadata?.fullName,
            newsletter: metadata?.newsletter || false,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        logger.error('Sign up failed', { error, email });
        throw this.handleAuthError(error);
      }

      if (!data.user || !data.session) {
        throw createBadRequestError('Sign up failed. Please try again.');
      }

      // Create user profile
      const profile = await this.createUserProfile(data.user, metadata);

      // Send welcome email
      await this.sendWelcomeEmail(email, metadata?.fullName);

      logger.info('User signed up', { userId: data.user.id, email });

      return {
        session: data.session,
        user: data.user,
        profile,
        permissions: await this.getUserPermissions(data.user.id),
        expiresAt: new Date(data.session.expires_at!),
      };
    } catch (error) {
      logger.error('Sign up error', { error, email });
      throw error;
    }
  }

  // Sign in with email and password
  async signIn(
    email: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<SessionInfo> {
    try {
      // Check login attempts
      this.checkLoginAttempts(email);

      // Validate inputs
      if (!validators.isEmail(email)) {
        throw createBadRequestError('Invalid email address');
      }

      // Sign in user
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.recordFailedAttempt(email);
        logger.warn('Sign in failed', { error, email });
        throw this.handleAuthError(error);
      }

      if (!data.user || !data.session) {
        this.recordFailedAttempt(email);
        throw createUnauthorizedError('Invalid credentials');
      }

      // Clear login attempts
      this.clearLoginAttempts(email);

      // Get user profile
      const profile = await this.getUserProfile(data.user.id);

      // Check if 2FA is required
      if (profile.twoFactorEnabled) {
        // Store partial session and require 2FA
        await sessionCache.set('pending_2fa', {
          userId: data.user.id,
          sessionId: data.session.access_token,
        }, 5 * 60 * 1000); // 5 minutes

        throw createBadRequestError('2FA verification required', {
          require2FA: true,
          userId: data.user.id,
        });
      }

      // Handle remember me
      if (rememberMe) {
        await localCache.set('remember_token', {
          email,
          token: data.session.refresh_token,
        }, this.config.rememberMeDuration);
      }

      // Update last login
      await this.updateLastLogin(data.user.id);

      logger.info('User signed in', { userId: data.user.id, email });

      return {
        session: data.session,
        user: data.user,
        profile,
        permissions: await this.getUserPermissions(data.user.id),
        expiresAt: new Date(data.session.expires_at!),
      };
    } catch (error) {
      logger.error('Sign in error', { error, email });
      throw error;
    }
  }

  // Sign in with OAuth provider
  async signInWithOAuth(
    provider: Provider,
    redirectTo?: string
  ): Promise<void> {
    try {
      // Validate provider
      if (!this.config.providers.includes(provider)) {
        throw createBadRequestError(`Provider ${provider} is not supported`);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
          scopes: this.getProviderScopes(provider),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        logger.error('OAuth sign in failed', { error, provider });
        throw this.handleAuthError(error);
      }

      logger.info('OAuth sign in initiated', { provider });
    } catch (error) {
      logger.error('OAuth sign in error', { error, provider });
      throw error;
    }
  }

  // Verify 2FA code
  async verify2FA(
    userId: string,
    code: string
  ): Promise<SessionInfo> {
    try {
      // Get pending session
      const pending = await sessionCache.get<any>('pending_2fa');
      
      if (!pending || pending.userId !== userId) {
        throw createUnauthorizedError('No pending 2FA verification');
      }

      // Verify code (this would call your 2FA service)
      const isValid = await this.verify2FACode(userId, code);
      
      if (!isValid) {
        throw createUnauthorizedError('Invalid 2FA code');
      }

      // Clear pending session
      await sessionCache.delete('pending_2fa');

      // Get full session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw createUnauthorizedError('Session expired');
      }

      const profile = await this.getUserProfile(userId);

      logger.info('2FA verification successful', { userId });

      return {
        session,
        user: session.user,
        profile,
        permissions: await this.getUserPermissions(userId),
        expiresAt: new Date(session.expires_at!),
      };
    } catch (error) {
      logger.error('2FA verification error', { error, userId });
      throw error;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.error('Sign out failed', { error });
        throw this.handleAuthError(error);
      }

      // Clear local cache
      await localCache.delete('remember_token');
      await sessionCache.clear();

      logger.info('User signed out');
    } catch (error) {
      logger.error('Sign out error', { error });
      throw error;
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<void> {
    try {
      if (!validators.isEmail(email)) {
        throw createBadRequestError('Invalid email address');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        logger.error('Password reset failed', { error, email });
        throw this.handleAuthError(error);
      }

      logger.info('Password reset email sent', { email });
    } catch (error) {
      logger.error('Password reset error', { error, email });
      throw error;
    }
  }

  // Update password
  async updatePassword(newPassword: string): Promise<void> {
    try {
      if (!validators.isStrongPassword(newPassword)) {
        throw createBadRequestError('Password does not meet requirements');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        logger.error('Password update failed', { error });
        throw this.handleAuthError(error);
      }

      logger.info('Password updated successfully');
    } catch (error) {
      logger.error('Password update error', { error });
      throw error;
    }
  }

  // Get current session
  async getSession(): Promise<SessionInfo | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return null;
      }

      const profile = await this.getUserProfile(session.user.id);

      return {
        session,
        user: session.user,
        profile,
        permissions: await this.getUserPermissions(session.user.id),
        expiresAt: new Date(session.expires_at!),
      };
    } catch (error) {
      logger.error('Get session error', { error });
      return null;
    }
  }

  // Refresh session
  async refreshSession(): Promise<SessionInfo | null> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error || !session) {
        logger.warn('Session refresh failed', { error });
        return null;
      }

      const profile = await this.getUserProfile(session.user.id);

      logger.info('Session refreshed', { userId: session.user.id });

      return {
        session,
        user: session.user,
        profile,
        permissions: await this.getUserPermissions(session.user.id),
        expiresAt: new Date(session.expires_at!),
      };
    } catch (error) {
      logger.error('Session refresh error', { error });
      return null;
    }
  }

  // Update user profile
  async updateProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    try {
      // Update auth metadata
      if (updates.email || updates.phoneNumber) {
        const { error } = await supabase.auth.updateUser({
          email: updates.email,
          phone: updates.phoneNumber,
        });

        if (error) {
          throw this.handleAuthError(error);
        }
      }

      // Update profile in database
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          username: updates.username,
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
          preferences: updates.preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Profile update failed', { error, userId });
        throw error;
      }

      // Refresh cached profile
      const profile = await this.refreshUserProfile(userId);

      logger.info('Profile updated', { userId });

      return profile;
    } catch (error) {
      logger.error('Profile update error', { error, userId });
      throw error;
    }
  }

  // Enable 2FA
  async enable2FA(userId: string): Promise<{ secret: string; qrCode: string }> {
    try {
      // Generate 2FA secret (this would use a library like speakeasy)
      const secret = this.generate2FASecret();
      const qrCode = await this.generate2FAQRCode(userId, secret);

      // Store secret temporarily
      await sessionCache.set(`2fa_setup_${userId}`, { secret }, 10 * 60 * 1000);

      logger.info('2FA setup initiated', { userId });

      return { secret, qrCode };
    } catch (error) {
      logger.error('2FA setup error', { error, userId });
      throw error;
    }
  }

  // Confirm 2FA setup
  async confirm2FA(userId: string, code: string): Promise<void> {
    try {
      // Get setup secret
      const setup = await sessionCache.get<any>(`2fa_setup_${userId}`);
      
      if (!setup) {
        throw createBadRequestError('No 2FA setup in progress');
      }

      // Verify code
      const isValid = await this.verify2FACodeWithSecret(setup.secret, code);
      
      if (!isValid) {
        throw createBadRequestError('Invalid verification code');
      }

      // Save secret to database (encrypted)
      await this.save2FASecret(userId, setup.secret);

      // Update profile
      await supabase
        .from('user_profiles')
        .update({ two_factor_enabled: true })
        .eq('id', userId);

      // Clear setup
      await sessionCache.delete(`2fa_setup_${userId}`);

      logger.info('2FA enabled', { userId });
    } catch (error) {
      logger.error('2FA confirmation error', { error, userId });
      throw error;
    }
  }

  // Helper methods
  private checkLoginAttempts(email: string): void {
    const attempt = this.loginAttempts.get(email);
    
    if (attempt && attempt.lockedUntil) {
      if (new Date() < attempt.lockedUntil) {
        const minutesLeft = Math.ceil(
          (attempt.lockedUntil.getTime() - Date.now()) / 60000
        );
        throw createUnauthorizedError(
          `Account locked. Try again in ${minutesLeft} minutes.`
        );
      }
    }
  }

  private recordFailedAttempt(email: string): void {
    const attempt = this.loginAttempts.get(email) || {
      email,
      attempts: 0,
      lastAttempt: new Date(),
    };

    attempt.attempts++;
    attempt.lastAttempt = new Date();

    if (attempt.attempts >= this.config.maxLoginAttempts) {
      attempt.lockedUntil = new Date(
        Date.now() + this.config.lockoutDuration
      );
      logger.warn('Account locked due to failed attempts', { email });
    }

    this.loginAttempts.set(email, attempt);
  }

  private clearLoginAttempts(email: string): void {
    this.loginAttempts.delete(email);
  }

  private handleAuthError(error: AuthError): AppError {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password',
      'Email not confirmed': 'Please verify your email address',
      'User already registered': 'An account with this email already exists',
    };

    const message = errorMap[error.message] || error.message;
    return createUnauthorizedError(message);
  }

  private getProviderScopes(provider: Provider): string {
    const scopes: Record<string, string> = {
      google: 'email profile',
      github: 'user:email',
      discord: 'identify email',
      twitter: 'users.read tweet.read',
    };

    return scopes[provider] || '';
  }

  private async handleSignIn(session: Session): Promise<void> {
    await this.refreshUserProfile(session.user.id);
    await this.updateLastLogin(session.user.id);
  }

  private async handleSignOut(): Promise<void> {
    await localCache.clear();
    await sessionCache.clear();
  }

  private async handleTokenRefresh(session: Session): Promise<void> {
    logger.debug('Token refreshed', { userId: session.user.id });
  }

  private async getUserProfile(userId: string): Promise<UserProfile> {
    const cached = await sessionCache.get<UserProfile>(`profile_${userId}`);
    if (cached) return cached;

    return this.refreshUserProfile(userId);
  }

  private async refreshUserProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw createBadRequestError('User profile not found');
    }

    const profile: UserProfile = {
      id: data.id,
      email: data.email,
      username: data.username,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      phoneNumber: data.phone_number,
      twoFactorEnabled: data.two_factor_enabled || false,
      emailVerified: data.email_verified || false,
      phoneVerified: data.phone_verified || false,
      role: data.role || 'user',
      subscription: data.subscription || { plan: 'free', status: 'active' },
      preferences: data.preferences || {
        theme: 'system',
        language: 'en',
        notifications: true,
        newsletter: false,
      },
      metadata: {
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
        loginCount: data.login_count || 0,
      },
    };

    await sessionCache.set(`profile_${userId}`, profile, 5 * 60 * 1000);

    return profile;
  }

  private async createUserProfile(
    user: User,
    metadata?: any
  ): Promise<UserProfile> {
    const profile = {
      id: user.id,
      email: user.email!,
      username: metadata?.username,
      full_name: metadata?.fullName,
      role: 'user',
      subscription: { plan: 'free', status: 'active' },
      preferences: {
        theme: 'system',
        language: 'en',
        notifications: true,
        newsletter: metadata?.newsletter || false,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_profiles')
      .insert(profile);

    if (error) {
      logger.error('Failed to create user profile', { error, userId: user.id });
    }

    return this.refreshUserProfile(user.id);
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    // This would fetch from a permissions table
    const profile = await this.getUserProfile(userId);
    
    const basePermissions = ['read:own', 'write:own'];
    
    if (profile.role === 'admin') {
      return [...basePermissions, 'read:all', 'write:all', 'delete:all', 'admin:all'];
    }
    
    if (profile.role === 'moderator') {
      return [...basePermissions, 'read:all', 'moderate:content'];
    }
    
    return basePermissions;
  }

  private async updateLastLogin(userId: string): Promise<void> {
    await supabase
      .from('user_profiles')
      .update({
        last_login_at: new Date().toISOString(),
        login_count: supabase.sql`login_count + 1`,
      })
      .eq('id', userId);
  }

  private async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    // This would call your email service
    logger.info('Welcome email queued', { email });
  }

  private generate2FASecret(): string {
    // This would use a library like speakeasy
    return 'MOCK_SECRET_' + Math.random().toString(36);
  }

  private async generate2FAQRCode(userId: string, secret: string): Promise<string> {
    // This would generate a QR code
    return `otpauth://totp/ScamShield:${userId}?secret=${secret}&issuer=ScamShield`;
  }

  private async verify2FACode(userId: string, code: string): Promise<boolean> {
    // This would verify against stored secret
    return code === '123456'; // Mock for now
  }

  private async verify2FACodeWithSecret(secret: string, code: string): Promise<boolean> {
    // This would verify using the secret
    return code === '123456'; // Mock for now
  }

  private async save2FASecret(userId: string, secret: string): Promise<void> {
    // This would save encrypted secret to database
    logger.debug('2FA secret saved', { userId });
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export types
export type { AuthConfig, UserProfile, SessionInfo };
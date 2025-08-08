// Enhanced authentication hook with full feature support
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authService, UserProfile, SessionInfo } from '@/services/authService';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  requires2FA: boolean;
  sessionExpiresAt: Date | null;
}

interface AuthActions {
  signUp: (
    email: string,
    password: string,
    metadata?: any
  ) => Promise<void>;
  signIn: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
  signInWithProvider: (provider: any) => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  enable2FA: () => Promise<{ secret: string; qrCode: string }>;
  confirm2FA: (code: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

interface EnhancedAuthContextType extends AuthState, AuthActions {}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | undefined>(undefined);

export function EnhancedAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    permissions: [],
    isLoading: true,
    isAuthenticated: false,
    requires2FA: false,
    sessionExpiresAt: null,
  });

  const { toast } = useToast();
  const [pending2FAUserId, setPending2FAUserId] = useState<string | null>(null);

  // Initialize auth service and load session
  useEffect(() => {
    const initAuth = async () => {
      try {
        await authService.initialize();
        const sessionInfo = await authService.getSession();
        
        if (sessionInfo) {
          setState({
            user: sessionInfo.user,
            session: sessionInfo.session,
            profile: sessionInfo.profile,
            permissions: sessionInfo.permissions,
            isLoading: false,
            isAuthenticated: true,
            requires2FA: false,
            sessionExpiresAt: sessionInfo.expiresAt,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        logger.error('Auth initialization failed', { error });
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  // Set up session refresh timer
  useEffect(() => {
    if (!state.sessionExpiresAt) return;

    const refreshTime = state.sessionExpiresAt.getTime() - Date.now() - 5 * 60 * 1000; // 5 minutes before expiry
    
    if (refreshTime > 0) {
      const timer = setTimeout(async () => {
        try {
          await refreshSession();
        } catch (error) {
          logger.error('Auto refresh failed', { error });
        }
      }, refreshTime);

      return () => clearTimeout(timer);
    }
  }, [state.sessionExpiresAt]);

  // Sign up
  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: any
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const sessionInfo = await authService.signUp(email, password, metadata);
      
      setState({
        user: sessionInfo.user,
        session: sessionInfo.session,
        profile: sessionInfo.profile,
        permissions: sessionInfo.permissions,
        isLoading: false,
        isAuthenticated: true,
        requires2FA: false,
        sessionExpiresAt: sessionInfo.expiresAt,
      });

      toast({
        title: 'Welcome to ScamShield!',
        description: 'Your account has been created successfully.',
      });
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [toast]);

  // Sign in
  const signIn = useCallback(async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const sessionInfo = await authService.signIn(email, password, rememberMe);
      
      setState({
        user: sessionInfo.user,
        session: sessionInfo.session,
        profile: sessionInfo.profile,
        permissions: sessionInfo.permissions,
        isLoading: false,
        isAuthenticated: true,
        requires2FA: false,
        sessionExpiresAt: sessionInfo.expiresAt,
      });

      toast({
        title: 'Welcome back!',
        description: 'You have been signed in successfully.',
      });
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      // Check if 2FA is required
      if (error.context?.require2FA) {
        setState(prev => ({ ...prev, requires2FA: true }));
        setPending2FAUserId(error.context.userId);
        
        toast({
          title: '2FA Required',
          description: 'Please enter your authentication code.',
        });
      } else {
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        });
      }
      
      throw error;
    }
  }, [toast]);

  // Sign in with OAuth provider
  const signInWithProvider = useCallback(async (provider: any) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      await authService.signInWithOAuth(provider);
      
      // OAuth redirects, so we don't update state here
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: 'OAuth sign in failed',
        description: error.message,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [toast]);

  // Verify 2FA
  const verify2FA = useCallback(async (code: string) => {
    if (!pending2FAUserId) {
      throw new Error('No pending 2FA verification');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const sessionInfo = await authService.verify2FA(pending2FAUserId, code);
      
      setState({
        user: sessionInfo.user,
        session: sessionInfo.session,
        profile: sessionInfo.profile,
        permissions: sessionInfo.permissions,
        isLoading: false,
        isAuthenticated: true,
        requires2FA: false,
        sessionExpiresAt: sessionInfo.expiresAt,
      });

      setPending2FAUserId(null);

      toast({
        title: '2FA Verified',
        description: 'You have been signed in successfully.',
      });
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: '2FA verification failed',
        description: error.message,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [pending2FAUserId, toast]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      await authService.signOut();
      
      setState({
        user: null,
        session: null,
        profile: null,
        permissions: [],
        isLoading: false,
        isAuthenticated: false,
        requires2FA: false,
        sessionExpiresAt: null,
      });

      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: 'Sign out failed',
        description: error.message,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [toast]);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      await authService.resetPassword(email);
      
      toast({
        title: 'Password reset email sent',
        description: 'Check your email for instructions.',
      });
    } catch (error: any) {
      toast({
        title: 'Password reset failed',
        description: error.message,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [toast]);

  // Update password
  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      await authService.updatePassword(newPassword);
      
      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Password update failed',
        description: error.message,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [toast]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!state.user) {
      throw new Error('Not authenticated');
    }

    try {
      const updatedProfile = await authService.updateProfile(state.user.id, updates);
      
      setState(prev => ({
        ...prev,
        profile: updatedProfile,
      }));

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Profile update failed',
        description: error.message,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [state.user, toast]);

  // Enable 2FA
  const enable2FA = useCallback(async () => {
    if (!state.user) {
      throw new Error('Not authenticated');
    }

    try {
      const result = await authService.enable2FA(state.user.id);
      
      toast({
        title: '2FA Setup',
        description: 'Scan the QR code with your authenticator app.',
      });

      return result;
    } catch (error: any) {
      toast({
        title: '2FA setup failed',
        description: error.message,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [state.user, toast]);

  // Confirm 2FA
  const confirm2FA = useCallback(async (code: string) => {
    if (!state.user) {
      throw new Error('Not authenticated');
    }

    try {
      await authService.confirm2FA(state.user.id, code);
      
      setState(prev => ({
        ...prev,
        profile: prev.profile ? {
          ...prev.profile,
          twoFactorEnabled: true,
        } : null,
      }));

      toast({
        title: '2FA Enabled',
        description: 'Two-factor authentication has been enabled.',
      });
    } catch (error: any) {
      toast({
        title: '2FA confirmation failed',
        description: error.message,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [state.user, toast]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const sessionInfo = await authService.refreshSession();
      
      if (sessionInfo) {
        setState({
          user: sessionInfo.user,
          session: sessionInfo.session,
          profile: sessionInfo.profile,
          permissions: sessionInfo.permissions,
          isLoading: false,
          isAuthenticated: true,
          requires2FA: false,
          sessionExpiresAt: sessionInfo.expiresAt,
        });
      } else {
        // Session expired
        setState({
          user: null,
          session: null,
          profile: null,
          permissions: [],
          isLoading: false,
          isAuthenticated: false,
          requires2FA: false,
          sessionExpiresAt: null,
        });

        toast({
          title: 'Session expired',
          description: 'Please sign in again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      logger.error('Session refresh failed', { error });
      
      setState({
        user: null,
        session: null,
        profile: null,
        permissions: [],
        isLoading: false,
        isAuthenticated: false,
        requires2FA: false,
        sessionExpiresAt: null,
      });
    }
  }, [toast]);

  // Check permission
  const hasPermission = useCallback((permission: string) => {
    return state.permissions.includes(permission);
  }, [state.permissions]);

  // Check role
  const hasRole = useCallback((role: string) => {
    return state.profile?.role === role;
  }, [state.profile]);

  const value: EnhancedAuthContextType = {
    ...state,
    signUp,
    signIn,
    signInWithProvider,
    verify2FA,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    enable2FA,
    confirm2FA,
    refreshSession,
    hasPermission,
    hasRole,
  };

  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  );
}

export function useEnhancedAuth() {
  const context = useContext(EnhancedAuthContext);
  
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider');
  }
  
  return context;
}

// Auth guard component
interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  requiredPermission,
  requiredRole,
  fallback = null,
}: AuthGuardProps) {
  const auth = useEnhancedAuth();

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (!auth.isAuthenticated) {
    return <>{fallback}</>;
  }

  if (requiredPermission && !auth.hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  if (requiredRole && !auth.hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
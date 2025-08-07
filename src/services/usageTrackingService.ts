import { supabase } from '../integrations/supabase/client';
import { monitoring } from '../lib/monitoring';

export interface UserTier {
  id: string;
  name: string;
  displayName: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly' | 'one-time';
  limits: TierLimits;
  features: string[];
}

export interface TierLimits {
  singleChecks: {
    daily: number;
    monthly: number;
  };
  groupAnalyses: {
    daily: number;
    monthly: number;
  };
  aiAnalyses: {
    daily: number;
    monthly: number;
  };
  exportReports: {
    daily: number;
    monthly: number;
  };
  apiCalls?: {
    daily: number;
    monthly: number;
  };
  maxGroupSize?: number;
  concurrentAnalyses?: number;
  retentionDays?: number;
}

export interface UsageStats {
  userId: string;
  tier: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  usage: {
    singleChecks: number;
    groupAnalyses: number;
    aiAnalyses: number;
    exportReports: number;
    apiCalls: number;
  };
  limits: TierLimits;
  percentageUsed: {
    singleChecks: number;
    groupAnalyses: number;
    aiAnalyses: number;
    exportReports: number;
    apiCalls: number;
  };
  timeToReset: number;
}

// Tier configurations
const USER_TIERS: UserTier[] = [
  {
    id: 'free',
    name: 'free',
    displayName: 'Free',
    price: 0,
    currency: 'USD',
    billingPeriod: 'monthly',
    limits: {
      singleChecks: { daily: 3, monthly: 10 },
      groupAnalyses: { daily: 1, monthly: 3 },
      aiAnalyses: { daily: 2, monthly: 5 },
      exportReports: { daily: 1, monthly: 2 },
      maxGroupSize: 50,
      concurrentAnalyses: 1,
      retentionDays: 7,
    },
    features: [
      'Basic scammer database check',
      'Simple language analysis',
      'Basic export (PDF only)',
      '7-day data retention',
    ],
  },
  {
    id: 'basic',
    name: 'basic',
    displayName: 'Basic',
    price: 9.99,
    currency: 'USD',
    billingPeriod: 'monthly',
    limits: {
      singleChecks: { daily: 20, monthly: 100 },
      groupAnalyses: { daily: 5, monthly: 25 },
      aiAnalyses: { daily: 15, monthly: 75 },
      exportReports: { daily: 10, monthly: 50 },
      maxGroupSize: 200,
      concurrentAnalyses: 2,
      retentionDays: 30,
    },
    features: [
      'Full scammer database access',
      'Advanced language analysis',
      'All export formats',
      '30-day data retention',
      'Email support',
    ],
  },
  {
    id: 'premium',
    name: 'premium',
    displayName: 'Premium',
    price: 29.99,
    currency: 'USD',
    billingPeriod: 'monthly',
    limits: {
      singleChecks: { daily: 100, monthly: 500 },
      groupAnalyses: { daily: 20, monthly: 100 },
      aiAnalyses: { daily: 50, monthly: 250 },
      exportReports: { daily: 50, monthly: 200 },
      apiCalls: { daily: 100, monthly: 500 },
      maxGroupSize: 1000,
      concurrentAnalyses: 5,
      retentionDays: 90,
    },
    features: [
      'Everything in Basic',
      'API access',
      'Bulk analysis',
      '90-day data retention',
      'Real-time alerts',
      'Priority support',
    ],
  },
  {
    id: 'pro',
    name: 'pro',
    displayName: 'Professional',
    price: 99.99,
    currency: 'USD',
    billingPeriod: 'monthly',
    limits: {
      singleChecks: { daily: 1000, monthly: 5000 },
      groupAnalyses: { daily: 100, monthly: 500 },
      aiAnalyses: { daily: 200, monthly: 1000 },
      exportReports: { daily: 200, monthly: 1000 },
      apiCalls: { daily: 1000, monthly: 5000 },
      maxGroupSize: 10000,
      concurrentAnalyses: 10,
      retentionDays: 365,
    },
    features: [
      'Everything in Premium',
      'Unlimited group size',
      'Advanced API features',
      '1-year data retention',
      'Custom integrations',
      'Dedicated support',
    ],
  },
];

class UsageTrackingService {
  async getCurrentUsage(userId: string): Promise<UsageStats | null> {
    try {
      // Get user's current tier
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_period_start, subscription_period_end')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        monitoring.error('Failed to get user profile for usage tracking', profileError);
        return null;
      }

      const userTier = this.getTierConfig(profile.subscription_tier || 'free');
      const periodStart = profile.subscription_period_start || this.getCurrentPeriodStart();
      const periodEnd = profile.subscription_period_end || this.getCurrentPeriodEnd();

      // Get current usage from database
      const { data: usage, error: usageError } = await supabase
        .rpc('get_user_usage_stats', {
          p_user_id: userId,
          p_period_start: periodStart,
          p_period_end: periodEnd,
        });

      if (usageError) {
        monitoring.error('Failed to get usage stats', usageError);
        return null;
      }

      const currentUsage = usage || {
        single_checks: 0,
        group_analyses: 0,
        ai_analyses: 0,
        export_reports: 0,
        api_calls: 0,
      };

      return {
        userId,
        tier: userTier.name,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        usage: {
          singleChecks: currentUsage.single_checks,
          groupAnalyses: currentUsage.group_analyses,
          aiAnalyses: currentUsage.ai_analyses,
          exportReports: currentUsage.export_reports,
          apiCalls: currentUsage.api_calls,
        },
        limits: userTier.limits,
        percentageUsed: {
          singleChecks: this.calculatePercentage(currentUsage.single_checks, userTier.limits.singleChecks.monthly),
          groupAnalyses: this.calculatePercentage(currentUsage.group_analyses, userTier.limits.groupAnalyses.monthly),
          aiAnalyses: this.calculatePercentage(currentUsage.ai_analyses, userTier.limits.aiAnalyses.monthly),
          exportReports: this.calculatePercentage(currentUsage.export_reports, userTier.limits.exportReports.monthly),
          apiCalls: this.calculatePercentage(currentUsage.api_calls, userTier.limits.apiCalls?.monthly || 0),
        },
        timeToReset: new Date(periodEnd).getTime() - Date.now(),
      };

    } catch (error) {
      monitoring.error('Usage tracking error', error as Error);
      return null;
    }
  }

  async checkUsageLimit(
    userId: string, 
    usageType: 'single_check' | 'group_analysis' | 'ai_analysis' | 'export_report' | 'api_call'
  ): Promise<{
    allowed: boolean;
    reason?: string;
    usage?: UsageStats;
    upgradeRequired?: boolean;
  }> {
    try {
      const currentUsage = await this.getCurrentUsage(userId);
      
      if (!currentUsage) {
        return {
          allowed: false,
          reason: 'Unable to retrieve usage information',
        };
      }

      const tierLimits = currentUsage.limits;
      let currentCount = 0;
      let dailyLimit = 0;
      let monthlyLimit = 0;

      switch (usageType) {
        case 'single_check':
          currentCount = currentUsage.usage.singleChecks;
          dailyLimit = tierLimits.singleChecks.daily;
          monthlyLimit = tierLimits.singleChecks.monthly;
          break;
        case 'group_analysis':
          currentCount = currentUsage.usage.groupAnalyses;
          dailyLimit = tierLimits.groupAnalyses.daily;
          monthlyLimit = tierLimits.groupAnalyses.monthly;
          break;
        case 'ai_analysis':
          currentCount = currentUsage.usage.aiAnalyses;
          dailyLimit = tierLimits.aiAnalyses.daily;
          monthlyLimit = tierLimits.aiAnalyses.monthly;
          break;
        case 'export_report':
          currentCount = currentUsage.usage.exportReports;
          dailyLimit = tierLimits.exportReports.daily;
          monthlyLimit = tierLimits.exportReports.monthly;
          break;
        case 'api_call':
          currentCount = currentUsage.usage.apiCalls;
          dailyLimit = tierLimits.apiCalls?.daily || 0;
          monthlyLimit = tierLimits.apiCalls?.monthly || 0;
          break;
      }

      // Check daily limit first
      const dailyUsage = await this.getDailyUsage(userId, usageType);
      if (dailyUsage >= dailyLimit) {
        return {
          allowed: false,
          reason: `Daily limit reached (${dailyLimit}/${dailyLimit})`,
          usage: currentUsage,
          upgradeRequired: currentUsage.tier === 'free',
        };
      }

      // Check monthly limit
      if (currentCount >= monthlyLimit) {
        return {
          allowed: false,
          reason: `Monthly limit reached (${monthlyLimit}/${monthlyLimit})`,
          usage: currentUsage,
          upgradeRequired: currentUsage.tier === 'free',
        };
      }

      return {
        allowed: true,
        usage: currentUsage,
      };

    } catch (error) {
      monitoring.error('Usage limit check error', error as Error);
      return {
        allowed: false,
        reason: 'Unable to check usage limits',
      };
    }
  }

  async recordUsage(
    userId: string,
    usageType: 'single_check' | 'group_analysis' | 'ai_analysis' | 'export_report' | 'api_call',
    quantity: number = 1
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('record_user_usage', {
        p_user_id: userId,
        p_usage_type: usageType,
        p_quantity: quantity,
      });

      if (error) {
        monitoring.error('Failed to record usage', error);
        throw error;
      }

      monitoring.info('Usage recorded', {
        userId,
        usageType,
        quantity,
      });

    } catch (error) {
      monitoring.error('Usage recording error', error as Error);
      throw error;
    }
  }

  async upgradeUserTier(userId: string, newTier: string, paymentId?: string): Promise<void> {
    try {
      const tierConfig = this.getTierConfig(newTier);
      const periodStart = new Date().toISOString();
      const periodEnd = this.calculatePeriodEnd(tierConfig.billingPeriod);

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_tier: newTier,
          subscription_period_start: periodStart,
          subscription_period_end: periodEnd,
        })
        .eq('id', userId);

      if (error) throw error;

      // Record the upgrade
      await supabase.from('subscription_changes').insert({
        user_id: userId,
        from_tier: 'unknown', // Would get from current profile
        to_tier: newTier,
        payment_id: paymentId,
        change_type: 'upgrade',
        effective_date: periodStart,
      });

      monitoring.info('User tier upgraded', {
        userId,
        newTier,
        paymentId,
      });

    } catch (error) {
      monitoring.error('Tier upgrade error', error as Error);
      throw error;
    }
  }

  async resetUsagePeriod(userId: string): Promise<void> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      if (!profile) throw new Error('User profile not found');

      const tierConfig = this.getTierConfig(profile.subscription_tier);
      const newPeriodStart = new Date().toISOString();
      const newPeriodEnd = this.calculatePeriodEnd(tierConfig.billingPeriod);

      await supabase
        .from('profiles')
        .update({
          subscription_period_start: newPeriodStart,
          subscription_period_end: newPeriodEnd,
        })
        .eq('id', userId);

      monitoring.info('Usage period reset', {
        userId,
        newPeriodStart,
        newPeriodEnd,
      });

    } catch (error) {
      monitoring.error('Usage period reset error', error as Error);
      throw error;
    }
  }

  private async getDailyUsage(userId: string, usageType: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('user_usage_logs')
      .select('quantity')
      .eq('user_id', userId)
      .eq('usage_type', usageType)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    if (error) {
      monitoring.error('Failed to get daily usage', error);
      return 0;
    }

    return data?.reduce((sum, record) => sum + (record.quantity || 0), 0) || 0;
  }

  private getTierConfig(tierName: string): UserTier {
    return USER_TIERS.find(tier => tier.name === tierName) || USER_TIERS[0];
  }

  private calculatePercentage(current: number, limit: number): number {
    if (limit === 0) return 0;
    return Math.round((current / limit) * 100);
  }

  private getCurrentPeriodStart(): string {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }

  private getCurrentPeriodEnd(): string {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  }

  private calculatePeriodEnd(billingPeriod: 'monthly' | 'yearly' | 'one-time'): string {
    const now = new Date();
    
    switch (billingPeriod) {
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();
      case 'yearly':
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString();
      case 'one-time':
        return new Date(2099, 11, 31).toISOString(); // Far future for one-time purchases
      default:
        return this.getCurrentPeriodEnd();
    }
  }

  // Get all available tiers for display
  getAvailableTiers(): UserTier[] {
    return USER_TIERS;
  }

  // Admin functions
  async getSystemUsageStats(days: number = 30): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_system_usage_stats', {
        p_days: days,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      monitoring.error('Failed to get system usage stats', error as Error);
      return null;
    }
  }

  async getUsersNearLimit(threshold: number = 0.8): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_users_near_limit', {
        p_threshold: threshold,
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      monitoring.error('Failed to get users near limit', error as Error);
      return [];
    }
  }
}

export const usageTrackingService = new UsageTrackingService();
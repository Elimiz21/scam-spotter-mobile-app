import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, Zap, Shield, TrendingUp, Database, FileText } from 'lucide-react';
import { usageTrackingService, UsageStats } from '../services/usageTrackingService';
import { useAuth } from '../hooks/useAuth';
import { logger } from '@/lib/logger';

interface UsageTrackerProps {
  className?: string;
  showUpgradeButton?: boolean;
}

export default function UsageTracker({ className = '', showUpgradeButton = true }: UsageTrackerProps) {
  const { user, profile } = useAuth();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tier = profile?.subscription_tier || 'free';

  useEffect(() => {
    if (user) {
      loadUsage();
      
      // Refresh usage every 30 seconds
      const interval = setInterval(loadUsage, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUsage = async () => {
    try {
      setError(null);
      const currentUsage = await usageTrackingService.getCurrentUsage(user!.id);
      setUsage(currentUsage);
    } catch (err) {
      logger.error('Failed to load usage:', { error: err, userId: user!.id });
      setError('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const getUsageColor = (used: number, limit: number): string => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'warning';
    return 'default';
  };

  const getUsageIcon = (type: 'singleChecks' | 'groupAnalyses' | 'aiAnalyses' | 'exportReports') => {
    switch (type) {
      case 'singleChecks': return <Shield className="h-4 w-4" />;
      case 'groupAnalyses': return <TrendingUp className="h-4 w-4" />;
      case 'aiAnalyses': return <Database className="h-4 w-4" />;
      case 'exportReports': return <FileText className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getUsageTitle = (type: 'singleChecks' | 'groupAnalyses' | 'aiAnalyses' | 'exportReports'): string => {
    switch (type) {
      case 'singleChecks': return 'Single Checks';
      case 'groupAnalyses': return 'Group Analysis';
      case 'aiAnalyses': return 'AI Analysis';
      case 'exportReports': return 'Export Reports';
      default: return 'Unknown';
    }
  };

  const getTierDisplayName = (tierName: string): string => {
    return tierName.charAt(0).toUpperCase() + tierName.slice(1);
  };

  const getTierColor = (tierName: string): string => {
    switch (tierName) {
      case 'free': return 'secondary';
      case 'basic': return 'outline';
      case 'premium': return 'default';
      case 'pro': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatTimeUntilReset = (resetTime: number): string => {
    if (resetTime <= 0) {
      return 'Available now';
    }

    const minutes = Math.floor(resetTime / (60 * 1000));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Usage Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Usage Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={loadUsage} variant="outline" size="sm" className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!usage) {
    return null;
  }

  const usageItems = [
    { 
      key: 'singleChecks' as const, 
      data: {
        used: usage.usage.singleChecks,
        limit: usage.limits.singleChecks.monthly,
        resetTime: usage.timeToReset,
      }
    },
    { 
      key: 'groupAnalyses' as const, 
      data: {
        used: usage.usage.groupAnalyses,
        limit: usage.limits.groupAnalyses.monthly,
        resetTime: usage.timeToReset,
      }
    },
    { 
      key: 'aiAnalyses' as const, 
      data: {
        used: usage.usage.aiAnalyses,
        limit: usage.limits.aiAnalyses.monthly,
        resetTime: usage.timeToReset,
      }
    },
    { 
      key: 'exportReports' as const, 
      data: {
        used: usage.usage.exportReports,
        limit: usage.limits.exportReports.monthly,
        resetTime: usage.timeToReset,
      }
    },
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Usage Tracking</CardTitle>
          <Badge variant={getTierColor(tier) as any}>
            {getTierDisplayName(tier)}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Current usage for your {tier} plan
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {usageItems.map(({ key, data }) => {
          const percentage = data.limit > 0 ? (data.used / data.limit) * 100 : 0;
          const isAtLimit = data.used >= data.limit;
          
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {getUsageIcon(key)}
                  <span>{getUsageTitle(key)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`font-medium ${isAtLimit ? 'text-destructive' : ''}`}>
                    {data.used}
                  </span>
                  <span className="text-muted-foreground">/ {data.limit}</span>
                </div>
              </div>
              
              <Progress 
                value={percentage} 
                className="h-2"
                // @ts-ignore - Progress component accepts color variants
                variant={getUsageColor(data.used, data.limit)}
              />
              
              {isAtLimit && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    Resets {formatTimeUntilReset(data.resetTime)}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {showUpgradeButton && tier === 'free' && (
          <div className="pt-3 border-t">
            <Button 
              onClick={() => window.location.href = '/pricing'}
              variant="outline" 
              size="sm" 
              className="w-full"
            >
              <Zap className="h-3 w-3 mr-1" />
              Upgrade Plan
            </Button>
          </div>
        )}

        <div className="pt-2 border-t">
          <Button 
            onClick={loadUsage}
            variant="ghost" 
            size="sm" 
            className="w-full text-xs"
          >
            Refresh Usage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
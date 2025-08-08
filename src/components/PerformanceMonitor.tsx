// Performance Monitoring Dashboard Component
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Zap,
  Clock,
  Eye,
  Gauge,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw,
  Settings,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { performanceMonitor, WebVitalsMetrics } from '@/lib/performance';
import { animations } from '@/lib/animations';

interface PerformanceData {
  metrics: WebVitalsMetrics;
  recommendations: string[];
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  history: Array<{
    timestamp: number;
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
  }>;
}

const METRIC_THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 }
};

const COLORS = {
  good: '#10B981',
  needsImprovement: '#F59E0B', 
  poor: '#EF4444',
  primary: '#3B82F6'
};

export function PerformanceMonitor() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadPerformanceData();
    
    const interval = setInterval(() => {
      loadPerformanceData();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = () => {
    const metrics = performanceMonitor.getMetrics();
    const recommendations = performanceMonitor.getRecommendations();
    
    // Calculate performance score
    const score = calculatePerformanceScore(metrics);
    const grade = getPerformanceGrade(score);
    
    // Generate mock history data for demo
    const history = generateHistoryData();
    
    setData({
      metrics,
      recommendations,
      score,
      grade,
      history
    });
    
    setLastUpdate(new Date());
    setIsLoading(false);
  };

  const calculatePerformanceScore = (metrics: WebVitalsMetrics): number => {
    let score = 100;
    
    // LCP scoring (25% weight)
    if (metrics.lcp) {
      if (metrics.lcp > METRIC_THRESHOLDS.lcp.needsImprovement) {
        score -= 25;
      } else if (metrics.lcp > METRIC_THRESHOLDS.lcp.good) {
        score -= 15;
      }
    }
    
    // FID scoring (25% weight)  
    if (metrics.fid) {
      if (metrics.fid > METRIC_THRESHOLDS.fid.needsImprovement) {
        score -= 25;
      } else if (metrics.fid > METRIC_THRESHOLDS.fid.good) {
        score -= 15;
      }
    }
    
    // CLS scoring (25% weight)
    if (metrics.cls) {
      if (metrics.cls > METRIC_THRESHOLDS.cls.needsImprovement) {
        score -= 25;
      } else if (metrics.cls > METRIC_THRESHOLDS.cls.good) {
        score -= 15;
      }
    }
    
    // FCP scoring (25% weight)
    if (metrics.fcp) {
      if (metrics.fcp > METRIC_THRESHOLDS.fcp.needsImprovement) {
        score -= 25;
      } else if (metrics.fcp > METRIC_THRESHOLDS.fcp.good) {
        score -= 15;
      }
    }
    
    return Math.max(0, score);
  };

  const getPerformanceGrade = (score: number): 'A' | 'B' | 'C' | 'D' | 'F' => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const generateHistoryData = () => {
    // Mock historical data - in production this would come from analytics
    return Array.from({ length: 24 }, (_, i) => ({
      timestamp: Date.now() - (23 - i) * 60 * 60 * 1000,
      lcp: 2000 + Math.random() * 1500,
      fid: 50 + Math.random() * 100,
      cls: 0.05 + Math.random() * 0.15,
      fcp: 1500 + Math.random() * 1000
    }));
  };

  const getMetricStatus = (value: number, thresholds: { good: number; needsImprovement: number }) => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  const formatMetricValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return `${Math.round(value)}ms`;
    }
    if (unit === 'score') {
      return value.toFixed(3);
    }
    return `${Math.round(value)}${unit}`;
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      loadPerformanceData();
    }, 1000);
  };

  const handleExport = () => {
    if (!data) return;
    
    const reportData = {
      timestamp: new Date().toISOString(),
      sessionId: performanceMonitor.getSessionId(),
      metrics: data.metrics,
      score: data.score,
      grade: data.grade,
      recommendations: data.recommendations
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-primary mr-2" />
        <span>Loading performance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gauge className="w-6 h-6 text-primary" />
            Performance Monitor
          </h2>
          <p className="text-muted-foreground">
            Real-time Core Web Vitals and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Score */}
      <motion.div {...animations.fadeInUp}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <div className={cn(
                'text-4xl font-bold',
                data.score >= 90 ? 'text-green-600' :
                data.score >= 70 ? 'text-yellow-600' : 'text-red-600'
              )}>
                {data.score}
              </div>
              <div className="flex flex-col">
                <div className={cn(
                  'text-2xl font-bold px-3 py-1 rounded-full',
                  data.grade === 'A' ? 'bg-green-100 text-green-800' :
                  data.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                  data.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                  data.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                )}>
                  {data.grade}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Grade
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Overall Performance Score
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Core Web Vitals Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Largest Contentful Paint"
          subtitle="LCP"
          value={data.metrics.lcp}
          unit="ms"
          thresholds={METRIC_THRESHOLDS.lcp}
          description="Time until largest content element is rendered"
          icon={Eye}
        />
        
        <MetricCard
          title="First Input Delay"
          subtitle="FID"
          value={data.metrics.fid}
          unit="ms"
          thresholds={METRIC_THRESHOLDS.fid}
          description="Time from first user interaction to browser response"
          icon={Clock}
        />
        
        <MetricCard
          title="Cumulative Layout Shift"
          subtitle="CLS"
          value={data.metrics.cls}
          unit="score"
          thresholds={METRIC_THRESHOLDS.cls}
          description="Measure of visual stability"
          icon={Zap}
        />
        
        <MetricCard
          title="First Contentful Paint"
          subtitle="FCP"
          value={data.metrics.fcp}
          unit="ms"
          thresholds={METRIC_THRESHOLDS.fcp}
          description="Time until first content is painted"
          icon={Gauge}
        />
      </div>

      {/* Performance History Chart */}
      <motion.div {...animations.fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance History (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(timestamp) => 
                    new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                  formatter={(value: number, name: string) => [
                    `${Math.round(value)}${name === 'cls' ? '' : 'ms'}`,
                    name.toUpperCase()
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="lcp" 
                  stroke={COLORS.primary} 
                  strokeWidth={2}
                  dot={false}
                  name="LCP"
                />
                <Line 
                  type="monotone" 
                  dataKey="fcp" 
                  stroke={COLORS.good} 
                  strokeWidth={2}
                  dot={false}
                  name="FCP"
                />
                <Line 
                  type="monotone" 
                  dataKey="fid" 
                  stroke={COLORS.needsImprovement} 
                  strokeWidth={2}
                  dot={false}
                  name="FID"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <motion.div {...animations.fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Performance Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recommendations.map((recommendation, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function MetricCard({
  title,
  subtitle,
  value,
  unit,
  thresholds,
  description,
  icon: Icon
}: {
  title: string;
  subtitle: string;
  value: number | null;
  unit: string;
  thresholds: { good: number; needsImprovement: number };
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  if (value === null) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" />
            {subtitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-muted-foreground">--</div>
          <p className="text-xs text-muted-foreground mt-1">Not available</p>
        </CardContent>
      </Card>
    );
  }

  const status = value <= thresholds.good ? 'good' : 
                value <= thresholds.needsImprovement ? 'needs-improvement' : 'poor';
  
  const statusColor = status === 'good' ? COLORS.good :
                     status === 'needs-improvement' ? COLORS.needsImprovement : COLORS.poor;

  const statusIcon = status === 'good' ? CheckCircle : 
                    status === 'needs-improvement' ? AlertCircle : AlertCircle;
  const StatusIcon = statusIcon;

  return (
    <motion.div {...animations.fadeInUp}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              {subtitle}
            </CardTitle>
            <StatusIcon 
              className={cn('w-4 h-4', {
                'text-green-600': status === 'good',
                'text-yellow-600': status === 'needs-improvement',
                'text-red-600': status === 'poor'
              })} 
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" style={{ color: statusColor }}>
            {formatMetricValue(value, unit)}
          </div>
          <Badge 
            variant="outline" 
            className={cn('mt-2', {
              'border-green-200 text-green-800': status === 'good',
              'border-yellow-200 text-yellow-800': status === 'needs-improvement',
              'border-red-200 text-red-800': status === 'poor'
            })}
          >
            {status === 'good' ? 'Good' : 
             status === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2" title={description}>
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function formatMetricValue(value: number, unit: string): string {
  if (unit === 'ms') {
    return `${Math.round(value)}ms`;
  }
  if (unit === 'score') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}${unit}`;
}

export default PerformanceMonitor;
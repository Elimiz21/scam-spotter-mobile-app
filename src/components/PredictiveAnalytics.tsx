// Advanced Predictive Analytics Dashboard
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Brain,
  Target,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  Calendar,
  Clock,
  Globe,
  Phone,
  Mail,
  Users,
  Eye,
  RefreshCw,
  Download,
  Filter,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { animations } from '@/lib/animations';

// Analytics Data Interfaces
export interface PredictiveMetrics {
  threatForecast: ThreatForecast;
  riskAssessment: RiskAssessment;
  behaviorAnalysis: BehaviorAnalysis;
  patternDetection: PatternDetection;
  trendAnalysis: TrendAnalysis;
  anomalyDetection: AnomalyDetection;
}

export interface ThreatForecast {
  nextWeek: ForecastPeriod;
  nextMonth: ForecastPeriod;
  nextQuarter: ForecastPeriod;
  confidence: number;
  factors: ForecastFactor[];
}

export interface ForecastPeriod {
  expectedThreats: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  breakdown: ThreatBreakdown;
}

export interface ThreatBreakdown {
  phishing: number;
  scamCalls: number;
  maliciousUrls: number;
  socialEngineering: number;
  financialFraud: number;
}

export interface ForecastFactor {
  name: string;
  impact: number; // -1 to 1
  description: string;
}

export interface RiskAssessment {
  overallRisk: number; // 0-100
  riskCategories: RiskCategory[];
  riskFactors: RiskFactor[];
  recommendations: Recommendation[];
}

export interface RiskCategory {
  name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  incidents: number;
}

export interface RiskFactor {
  factor: string;
  weight: number;
  current: number;
  target: number;
}

export interface Recommendation {
  priority: 'low' | 'medium' | 'high';
  category: string;
  action: string;
  impact: string;
  effort: string;
}

export interface BehaviorAnalysis {
  userProfile: UserProfile;
  behaviorPatterns: BehaviorPattern[];
  anomalies: BehaviorAnomaly[];
  insights: BehaviorInsight[];
}

export interface UserProfile {
  riskTolerance: number;
  activityLevel: number;
  technicalSavviness: number;
  vigilanceScore: number;
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  riskLevel: number;
  description: string;
  examples: string[];
}

export interface BehaviorAnomaly {
  timestamp: Date;
  anomalyType: string;
  severity: number;
  description: string;
  action: string;
}

export interface BehaviorInsight {
  insight: string;
  confidence: number;
  actionable: boolean;
  recommendation?: string;
}

export interface PatternDetection {
  emergingThreats: EmergingThreat[];
  campaignAnalysis: CampaignAnalysis[];
  networkPatterns: NetworkPattern[];
  temporalPatterns: TemporalPattern[];
}

export interface EmergingThreat {
  threatType: string;
  confidence: number;
  growth: number;
  indicators: string[];
  affectedUsers: number;
  firstSeen: Date;
}

export interface CampaignAnalysis {
  campaignId: string;
  threatActor: string;
  techniques: string[];
  targets: string[];
  timeline: Date[];
  success_rate: number;
}

export interface NetworkPattern {
  pattern: string;
  nodes: number;
  connections: number;
  centrality: number;
}

export interface TemporalPattern {
  timeframe: string;
  pattern: string;
  frequency: number;
  predictability: number;
}

export interface TrendAnalysis {
  shortTerm: TrendPeriod; // 7 days
  mediumTerm: TrendPeriod; // 30 days
  longTerm: TrendPeriod; // 90 days
  seasonality: SeasonalityData;
  correlations: CorrelationData[];
}

export interface TrendPeriod {
  direction: 'up' | 'down' | 'stable';
  magnitude: number;
  confidence: number;
  keyEvents: string[];
}

export interface SeasonalityData {
  weekly: number[];
  monthly: number[];
  seasonal: Record<string, number>;
}

export interface CorrelationData {
  variables: [string, string];
  correlation: number;
  significance: number;
}

export interface AnomalyDetection {
  currentAnomalies: CurrentAnomaly[];
  historicalAnomalies: HistoricalAnomaly[];
  anomalyScore: number;
  baselineMetrics: BaselineMetrics;
}

export interface CurrentAnomaly {
  id: string;
  type: string;
  severity: number;
  startTime: Date;
  duration: number;
  affected: string[];
  description: string;
}

export interface HistoricalAnomaly {
  date: Date;
  type: string;
  severity: number;
  resolved: boolean;
  resolution?: string;
}

export interface BaselineMetrics {
  averageThreats: number;
  peakActivity: number;
  normalRange: [number, number];
  lastUpdated: Date;
}

// Sample data for demonstration
const generateSampleData = (): PredictiveMetrics => {
  const now = new Date();
  const daysBack = 30;
  
  return {
    threatForecast: {
      nextWeek: {
        expectedThreats: 15,
        riskLevel: 'medium',
        probability: 0.78,
        breakdown: {
          phishing: 6,
          scamCalls: 4,
          maliciousUrls: 3,
          socialEngineering: 1,
          financialFraud: 1
        }
      },
      nextMonth: {
        expectedThreats: 65,
        riskLevel: 'high',
        probability: 0.72,
        breakdown: {
          phishing: 25,
          scamCalls: 18,
          maliciousUrls: 12,
          socialEngineering: 6,
          financialFraud: 4
        }
      },
      nextQuarter: {
        expectedThreats: 180,
        riskLevel: 'high',
        probability: 0.65,
        breakdown: {
          phishing: 70,
          scamCalls: 50,
          maliciousUrls: 35,
          socialEngineering: 15,
          financialFraud: 10
        }
      },
      confidence: 0.82,
      factors: [
        { name: 'Seasonal Increase', impact: 0.3, description: 'Holiday season typically sees 30% more scams' },
        { name: 'New Campaign Detected', impact: 0.2, description: 'AI detected emerging threat pattern' },
        { name: 'Economic Uncertainty', impact: 0.15, description: 'Economic conditions increase vulnerability' }
      ]
    },
    riskAssessment: {
      overallRisk: 67,
      riskCategories: [
        { name: 'Email Security', score: 72, trend: 'up', incidents: 23 },
        { name: 'Phone Security', score: 58, trend: 'stable', incidents: 15 },
        { name: 'Web Browsing', score: 64, trend: 'down', incidents: 18 },
        { name: 'Social Media', score: 71, trend: 'up', incidents: 12 },
        { name: 'Financial', score: 89, trend: 'up', incidents: 8 }
      ],
      riskFactors: [
        { factor: 'User Awareness', weight: 0.25, current: 65, target: 85 },
        { factor: 'Technical Controls', weight: 0.30, current: 78, target: 90 },
        { factor: 'Threat Landscape', weight: 0.20, current: 45, target: 70 },
        { factor: 'Response Time', weight: 0.25, current: 82, target: 95 }
      ],
      recommendations: [
        { priority: 'high', category: 'Training', action: 'Implement phishing simulation', impact: 'High', effort: 'Medium' },
        { priority: 'medium', category: 'Technical', action: 'Enable advanced email filtering', impact: 'Medium', effort: 'Low' },
        { priority: 'low', category: 'Process', action: 'Update incident response plan', impact: 'Medium', effort: 'High' }
      ]
    },
    behaviorAnalysis: {
      userProfile: {
        riskTolerance: 0.4,
        activityLevel: 0.7,
        technicalSavviness: 0.6,
        vigilanceScore: 0.8
      },
      behaviorPatterns: [
        { pattern: 'Weekend Activity Spike', frequency: 0.85, riskLevel: 0.3, description: 'Increased activity on weekends', examples: ['Social media usage', 'Online shopping'] },
        { pattern: 'Evening Email Checks', frequency: 0.95, riskLevel: 0.6, description: 'Regular email checking in evening hours', examples: ['7-9 PM peak activity'] },
        { pattern: 'Mobile Dominant Usage', frequency: 0.78, riskLevel: 0.4, description: 'Primarily uses mobile devices', examples: ['85% mobile traffic'] }
      ],
      anomalies: [
        { timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), anomalyType: 'Unusual Login Location', severity: 0.7, description: 'Login from unfamiliar location', action: 'Flagged for review' },
        { timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), anomalyType: 'High Activity Volume', severity: 0.5, description: 'Unusual spike in email activity', action: 'Monitored' }
      ],
      insights: [
        { insight: 'User shows good security awareness but needs mobile security training', confidence: 0.82, actionable: true, recommendation: 'Provide mobile security best practices guide' },
        { insight: 'Evening email activity correlates with higher phishing susceptibility', confidence: 0.67, actionable: true, recommendation: 'Enable enhanced filtering during evening hours' }
      ]
    },
    patternDetection: {
      emergingThreats: [
        { threatType: 'AI Voice Cloning Scams', confidence: 0.78, growth: 0.45, indicators: ['voice synthesis', 'family emergency'], affectedUsers: 127, firstSeen: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        { threatType: 'Crypto Recovery Scams', confidence: 0.85, growth: 0.67, indicators: ['bitcoin recovery', 'lost wallet'], affectedUsers: 89, firstSeen: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000) }
      ],
      campaignAnalysis: [
        { campaignId: 'CAMP-2024-001', threatActor: 'Lazarus Group', techniques: ['Spear phishing', 'Social engineering'], targets: ['Financial institutions'], timeline: [new Date(), new Date()], success_rate: 0.23 }
      ],
      networkPatterns: [
        { pattern: 'Coordinated Infrastructure', nodes: 45, connections: 123, centrality: 0.78 },
        { pattern: 'Botnet Communication', nodes: 234, connections: 567, centrality: 0.45 }
      ],
      temporalPatterns: [
        { timeframe: 'Weekday Mornings', pattern: 'Business Email Scams', frequency: 0.85, predictability: 0.92 },
        { timeframe: 'Weekend Evenings', pattern: 'Romance Scams', frequency: 0.67, predictability: 0.78 }
      ]
    },
    trendAnalysis: {
      shortTerm: { direction: 'up', magnitude: 0.15, confidence: 0.89, keyEvents: ['New phishing campaign', 'Holiday season start'] },
      mediumTerm: { direction: 'stable', magnitude: 0.05, confidence: 0.82, keyEvents: ['Increased awareness training', 'Technical controls update'] },
      longTerm: { direction: 'down', magnitude: 0.12, confidence: 0.75, keyEvents: ['Industry-wide security improvements', 'Regulatory changes'] },
      seasonality: {
        weekly: [0.8, 0.9, 1.1, 1.2, 1.3, 1.1, 0.7],
        monthly: Array.from({ length: 12 }, (_, i) => 0.8 + Math.sin(i * Math.PI / 6) * 0.3),
        seasonal: { 'Q1': 0.9, 'Q2': 1.1, 'Q3': 0.8, 'Q4': 1.4 }
      },
      correlations: [
        { variables: ['Economic Uncertainty', 'Scam Volume'], correlation: 0.73, significance: 0.95 },
        { variables: ['Holiday Season', 'Shopping Scams'], correlation: 0.86, significance: 0.98 }
      ]
    },
    anomalyDetection: {
      currentAnomalies: [
        { id: 'ANOM-001', type: 'Traffic Spike', severity: 0.6, startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), duration: 120, affected: ['Email gateway'], description: 'Unusual email volume detected' },
        { id: 'ANOM-002', type: 'Behavioral Change', severity: 0.8, startTime: new Date(now.getTime() - 30 * 60 * 1000), duration: 30, affected: ['User group A'], description: 'Abnormal click patterns observed' }
      ],
      historicalAnomalies: [
        { date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), type: 'Campaign Launch', severity: 0.9, resolved: true, resolution: 'Blocked malicious domains' },
        { date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), type: 'Data Exfiltration', severity: 0.7, resolved: true, resolution: 'Incident contained and investigated' }
      ],
      anomalyScore: 0.65,
      baselineMetrics: {
        averageThreats: 12.5,
        peakActivity: 28,
        normalRange: [8, 18],
        lastUpdated: new Date()
      }
    }
  };
};

// Chart color schemes
const CHART_COLORS = {
  primary: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
  threat: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'],
  risk: ['#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D'],
  gradient: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    danger: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)'
  }
};

// Time range options
const TIME_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' }
];

interface PredictiveAnalyticsProps {
  className?: string;
  userId?: string;
}

export function PredictiveAnalytics({ 
  className,
  userId 
}: PredictiveAnalyticsProps) {
  const { announcePolite } = useAccessibility();
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<PredictiveMetrics>(generateSampleData());

  // Generate chart data
  const chartData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const now = new Date();
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(now.getTime() - (days - i - 1) * 24 * 60 * 60 * 1000);
      const baseThreats = 10 + Math.sin(i * 0.5) * 5;
      const variance = (Math.random() - 0.5) * 4;
      
      return {
        date: date.toISOString().split('T')[0],
        threats: Math.max(0, Math.round(baseThreats + variance)),
        blocked: Math.round((baseThreats + variance) * 0.85),
        risk: Math.min(100, Math.max(0, 40 + Math.sin(i * 0.3) * 20 + variance * 2)),
        activity: Math.round(50 + Math.sin(i * 0.4) * 25 + variance * 3)
      };
    });
  }, [timeRange]);

  const handleRefresh = async () => {
    setIsLoading(true);
    announcePolite('Refreshing analytics data');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setData(generateSampleData());
    setIsLoading(false);
    announcePolite('Analytics data updated');
  };

  const handleExport = () => {
    announcePolite('Exporting analytics data');
    // Implementation would generate and download report
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Predictive Analytics
          </h2>
          <p className="text-muted-foreground">
            AI-powered insights and threat predictions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Risk Score"
          value={data.riskAssessment.overallRisk}
          unit="%"
          trend="up"
          change={+5.2}
          icon={Shield}
          color="danger"
        />
        <MetricCard
          title="Threats Predicted"
          value={data.threatForecast.nextWeek.expectedThreats}
          unit=""
          trend="up"
          change={+12}
          icon={AlertTriangle}
          color="warning"
        />
        <MetricCard
          title="Anomaly Score"
          value={Math.round(data.anomalyDetection.anomalyScore * 100)}
          unit="%"
          trend="down"
          change={-8.5}
          icon={Activity}
          color="primary"
        />
        <MetricCard
          title="Prediction Confidence"
          value={Math.round(data.threatForecast.confidence * 100)}
          unit="%"
          trend="stable"
          change={0}
          icon={Target}
          color="success"
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 lg:grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab data={data} chartData={chartData} />
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <ForecastTab data={data.threatForecast} />
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <RiskTab data={data.riskAssessment} />
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <BehaviorTab data={data.behaviorAnalysis} />
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <PatternsTab data={data.patternDetection} />
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <AnomaliesTab data={data.anomalyDetection} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  title,
  value,
  unit,
  trend,
  change,
  icon: Icon,
  color
}: {
  title: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'success' | 'warning' | 'danger';
}) {
  const colorClasses = {
    primary: 'text-blue-600 bg-blue-100',
    success: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    danger: 'text-red-600 bg-red-100'
  };

  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;
  const TrendIcon = trendIcon;
  const trendColor = trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-gray-500';

  return (
    <motion.div {...animations.fadeInUp}>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">
                  {value.toLocaleString()}{unit}
                </p>
                {change !== 0 && (
                  <div className={cn('flex items-center gap-1 text-sm', trendColor)}>
                    <TrendIcon className="w-3 h-3" />
                    {Math.abs(change)}{unit}
                  </div>
                )}
              </div>
            </div>
            <div className={cn('p-3 rounded-full', colorClasses[color])}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Overview Tab Component
function OverviewTab({ 
  data, 
  chartData 
}: { 
  data: PredictiveMetrics; 
  chartData: any[] 
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Threat Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Threat Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="threats" 
                fill="#3B82F6" 
                fillOpacity={0.3}
                stroke="#3B82F6"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="blocked" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Risk Categories Radar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Risk Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data.riskAssessment.riskCategories}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Risk Score"
                dataKey="score"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Emerging Threats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Emerging Threats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.patternDetection.emergingThreats.map((threat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{threat.threatType}</h4>
                  <p className="text-xs text-muted-foreground">
                    {threat.affectedUsers} affected users
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={threat.confidence > 0.8 ? 'destructive' : 'secondary'}>
                    {Math.round(threat.confidence * 100)}% confidence
                  </Badge>
                  <p className="text-xs text-green-600 mt-1">
                    +{Math.round(threat.growth * 100)}% growth
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.behaviorAnalysis.insights.slice(0, 3).map((insight, index) => (
              <div key={index} className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{insight.insight}</p>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline">
                    {Math.round(insight.confidence * 100)}% confidence
                  </Badge>
                  {insight.actionable && (
                    <Button size="sm" variant="ghost">
                      <Info className="w-3 h-3 mr-1" />
                      Details
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Additional tab components would be implemented here
function ForecastTab({ data }: { data: ThreatForecast }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Implementation for forecast visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Next Week Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {data.nextWeek.expectedThreats}
              </div>
              <div className="text-sm text-muted-foreground">Expected Threats</div>
            </div>
            <Badge 
              variant={data.nextWeek.riskLevel === 'high' ? 'destructive' : 'secondary'}
              className="w-full justify-center"
            >
              {data.nextWeek.riskLevel.toUpperCase()} RISK
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      {/* Add more forecast visualizations */}
    </div>
  );
}

function RiskTab({ data }: { data: RiskAssessment }) {
  return (
    <div className="space-y-6">
      {/* Risk assessment implementation */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-red-600">
              {data.overallRisk}%
            </div>
            <div className="text-muted-foreground">Overall Risk Score</div>
          </div>
          
          <div className="space-y-4">
            {data.riskCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{category.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${category.score}%` }}
                    />
                  </div>
                  <span className="text-sm">{category.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BehaviorTab({ data }: { data: BehaviorAnalysis }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Behavior analysis implementation */}
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.userProfile).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${value * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PatternsTab({ data }: { data: PatternDetection }) {
  return (
    <div className="space-y-6">
      {/* Pattern detection implementation */}
      <Card>
        <CardHeader>
          <CardTitle>Emerging Threats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.emergingThreats.map((threat, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{threat.threatType}</h4>
                  <Badge variant="destructive">
                    {Math.round(threat.confidence * 100)}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  First seen: {threat.firstSeen.toLocaleDateString()}
                </p>
                <p className="text-sm">
                  Affected {threat.affectedUsers} users with {Math.round(threat.growth * 100)}% growth
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnomaliesTab({ data }: { data: AnomalyDetection }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Anomaly detection implementation */}
      <Card>
        <CardHeader>
          <CardTitle>Current Anomalies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.currentAnomalies.map((anomaly) => (
              <div key={anomaly.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{anomaly.type}</h4>
                  <Badge variant={anomaly.severity > 0.7 ? 'destructive' : 'secondary'}>
                    Severity: {Math.round(anomaly.severity * 100)}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Started: {anomaly.startTime.toLocaleTimeString()} • 
                  Duration: {anomaly.duration}min
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Baseline Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{data.baselineMetrics.averageThreats}</div>
              <div className="text-sm text-muted-foreground">Average Daily Threats</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data.baselineMetrics.peakActivity}</div>
              <div className="text-sm text-muted-foreground">Peak Activity</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {data.baselineMetrics.normalRange[0]} - {data.baselineMetrics.normalRange[1]}
              </div>
              <div className="text-sm text-muted-foreground">Normal Range</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PredictiveAnalytics;
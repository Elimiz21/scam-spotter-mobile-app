// Security Dashboard Component for Threat Monitoring
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Lock,
  Unlock,
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Database,
  Globe,
  Server,
  Key,
  FileText,
  Download,
  RefreshCw,
  Settings,
  Zap,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { securityManager, SecurityEvent } from '@/lib/security';
import { auditLogger, AuditEvent, ComplianceMetrics } from '@/lib/auditLog';
import { gdprManager } from '@/lib/gdpr';
import { animations } from '@/lib/animations';

interface SecurityDashboardData {
  overview: {
    overallScore: number;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    activeThreats: number;
    blockedAttacks: number;
    complianceScore: number;
    lastScan: Date;
  };
  metrics: ComplianceMetrics;
  securityEvents: SecurityEvent[];
  auditEvents: AuditEvent[];
  threatAnalysis: {
    topThreats: Array<{
      type: string;
      count: number;
      severity: string;
      trend: 'up' | 'down' | 'stable';
    }>;
    recentIncidents: Array<{
      id: string;
      type: string;
      severity: string;
      timestamp: Date;
      source: string;
      status: 'open' | 'investigating' | 'resolved';
    }>;
  };
  systemHealth: {
    encryption: boolean;
    firewall: boolean;
    monitoring: boolean;
    backups: boolean;
    updates: boolean;
    accessControl: boolean;
  };
}

const SEVERITY_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#DC2626'
};

const THREAT_LEVEL_CONFIG = {
  low: { color: '#10B981', icon: ShieldCheck, label: 'Low Risk' },
  medium: { color: '#F59E0B', icon: Shield, label: 'Medium Risk' },
  high: { color: '#EF4444', icon: ShieldAlert, label: 'High Risk' },
  critical: { color: '#DC2626', icon: ShieldAlert, label: 'Critical Risk' }
};

export function SecurityDashboard() {
  const [data, setData] = useState<SecurityDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadSecurityData();
    
    const interval = setInterval(() => {
      loadSecurityData();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadSecurityData = async () => {
    try {
      // Get security events and metrics
      const securityEvents = securityManager.getSecurityEvents();
      const securityStats = securityManager.getSecurityStats();
      
      // Get audit events based on time range
      const timeRanges = {
        '1h': new Date(Date.now() - 60 * 60 * 1000),
        '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      };

      const auditEvents = auditLogger.queryEvents({
        dateRange: {
          start: timeRanges[selectedTimeRange],
          end: new Date()
        },
        limit: 1000
      });

      // Get compliance metrics
      const metrics = auditLogger.getComplianceMetrics({
        start: timeRanges[selectedTimeRange],
        end: new Date()
      });

      // Get GDPR compliance stats
      const gdprStats = gdprManager.getComplianceStats();

      // Calculate overall security score
      const overallScore = calculateOverallSecurityScore(metrics, securityStats, gdprStats);
      
      // Determine threat level
      const threatLevel = determineThreatLevel(overallScore, securityEvents, auditEvents);

      // Analyze threats
      const threatAnalysis = analyzeThreatData(securityEvents, auditEvents);

      // Check system health
      const systemHealth = assessSystemHealth();

      setData({
        overview: {
          overallScore,
          threatLevel,
          activeThreats: securityEvents.filter(e => !e.resolved).length,
          blockedAttacks: securityEvents.filter(e => e.type.includes('attempt')).length,
          complianceScore: Math.round((metrics.gdprCompliance.score + metrics.securityPosture.score + metrics.operationalRisk.score) / 3),
          lastScan: new Date()
        },
        metrics,
        securityEvents: securityEvents.slice(0, 50), // Latest 50 events
        auditEvents: auditEvents.slice(0, 50), // Latest 50 events
        threatAnalysis,
        systemHealth
      });

      setIsLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Failed to load security data:', error);
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const calculateOverallSecurityScore = (
    metrics: ComplianceMetrics,
    securityStats: any,
    gdprStats: any
  ): number => {
    const weights = {
      gdpr: 0.25,
      security: 0.35,
      operational: 0.25,
      incidents: 0.15
    };

    const incidentScore = Math.max(0, 100 - (securityStats.criticalEvents * 10));

    return Math.round(
      metrics.gdprCompliance.score * weights.gdpr +
      metrics.securityPosture.score * weights.security +
      metrics.operationalRisk.score * weights.operational +
      incidentScore * weights.incidents
    );
  };

  const determineThreatLevel = (
    score: number,
    securityEvents: SecurityEvent[],
    auditEvents: AuditEvent[]
  ): 'low' | 'medium' | 'high' | 'critical' => {
    const criticalEvents = securityEvents.filter(e => e.severity === 'critical').length;
    const highRiskAudits = auditEvents.filter(e => e.risk === 'very_high').length;

    if (score < 60 || criticalEvents > 5 || highRiskAudits > 10) return 'critical';
    if (score < 75 || criticalEvents > 2 || highRiskAudits > 5) return 'high';
    if (score < 85 || criticalEvents > 0 || highRiskAudits > 2) return 'medium';
    return 'low';
  };

  const analyzeThreatData = (
    securityEvents: SecurityEvent[],
    auditEvents: AuditEvent[]
  ) => {
    // Analyze top threats
    const threatCounts = new Map<string, number>();
    securityEvents.forEach(event => {
      threatCounts.set(event.type, (threatCounts.get(event.type) || 0) + 1);
    });

    const topThreats = Array.from(threatCounts.entries())
      .map(([type, count]) => ({
        type,
        count,
        severity: 'medium', // Would calculate based on event severities
        trend: 'stable' as const // Would calculate based on historical data
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent incidents
    const recentIncidents = securityEvents
      .filter(event => event.severity === 'critical' || event.severity === 'high')
      .slice(0, 10)
      .map(event => ({
        id: event.id,
        type: event.type,
        severity: event.severity,
        timestamp: event.timestamp,
        source: event.source,
        status: event.resolved ? 'resolved' as const : 'open' as const
      }));

    return {
      topThreats,
      recentIncidents
    };
  };

  const assessSystemHealth = () => {
    return {
      encryption: true, // Would check actual encryption status
      firewall: true,   // Would check firewall status
      monitoring: true, // Would check monitoring status
      backups: true,    // Would check backup status
      updates: false,   // Would check update status
      accessControl: true // Would check access control status
    };
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSecurityData();
  };

  const handleExportReport = () => {
    if (!data) return;

    const report = {
      timestamp: new Date().toISOString(),
      overview: data.overview,
      metrics: data.metrics,
      threatAnalysis: data.threatAnalysis,
      systemHealth: data.systemHealth,
      recentEvents: data.securityEvents.slice(0, 20)
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-primary mr-2" />
        <span>Loading security dashboard...</span>
      </div>
    );
  }

  const ThreatLevelIcon = THREAT_LEVEL_CONFIG[data.overview.threatLevel].icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Security Dashboard
          </h2>
          <p className="text-muted-foreground">
            Real-time security monitoring and threat analysis
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            {(['1h', '24h', '7d', '30d'] as const).map((range) => (
              <Button
                key={range}
                variant={selectedTimeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div {...animations.fadeInUp}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ThreatLevelIcon 
                  className="w-4 h-4" 
                  style={{ color: THREAT_LEVEL_CONFIG[data.overview.threatLevel].color }}
                />
                Threat Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div 
                  className="text-2xl font-bold"
                  style={{ color: THREAT_LEVEL_CONFIG[data.overview.threatLevel].color }}
                >
                  {THREAT_LEVEL_CONFIG[data.overview.threatLevel].label}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Overall security assessment
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <SecurityMetricCard
          title="Security Score"
          value={data.overview.overallScore}
          unit="/100"
          icon={Shield}
          color={data.overview.overallScore >= 80 ? '#10B981' : data.overview.overallScore >= 60 ? '#F59E0B' : '#EF4444'}
          description="Overall security posture"
        />

        <SecurityMetricCard
          title="Active Threats"
          value={data.overview.activeThreats}
          unit=""
          icon={AlertTriangle}
          color={data.overview.activeThreats === 0 ? '#10B981' : '#EF4444'}
          description="Unresolved security events"
        />

        <SecurityMetricCard
          title="Blocked Attacks"
          value={data.overview.blockedAttacks}
          unit=""
          icon={ShieldCheck}
          color="#10B981"
          description="Prevented malicious attempts"
        />
      </div>

      {/* Critical Alerts */}
      {data.overview.threatLevel === 'critical' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Critical Security Alert:</strong> Immediate attention required. 
            {data.overview.activeThreats} active threats detected.
          </AlertDescription>
        </Alert>
      )}

      {/* Compliance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ComplianceCard
          title="GDPR Compliance"
          score={data.metrics.gdprCompliance.score}
          metrics={[
            { label: 'Data Subject Requests', value: data.metrics.gdprCompliance.dataSubjectRequests },
            { label: 'Consent Records', value: data.metrics.gdprCompliance.consentRecords },
            { label: 'Breach Notifications', value: data.metrics.gdprCompliance.breachNotifications },
            { label: 'Retention Violations', value: data.metrics.gdprCompliance.retentionViolations }
          ]}
        />

        <ComplianceCard
          title="Security Posture"
          score={data.metrics.securityPosture.score}
          metrics={[
            { label: 'Failed Logins', value: data.metrics.securityPosture.failedLogins },
            { label: 'Unauthorized Access', value: data.metrics.securityPosture.unauthorizedAccess },
            { label: 'Privilege Escalations', value: data.metrics.securityPosture.privilegeEscalations },
            { label: 'Data Exfiltration', value: data.metrics.securityPosture.dataExfiltration }
          ]}
        />

        <ComplianceCard
          title="Operational Risk"
          score={data.metrics.operationalRisk.score}
          metrics={[
            { label: 'Config Changes', value: data.metrics.operationalRisk.configChanges },
            { label: 'System Errors', value: data.metrics.operationalRisk.systemErrors },
            { label: 'Performance Issues', value: data.metrics.operationalRisk.performanceIssues },
            { label: 'Availability Breaches', value: data.metrics.operationalRisk.availabilityBreaches }
          ]}
        />
      </div>

      {/* Threat Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Threats */}
        <motion.div {...animations.fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Security Threats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.threatAnalysis.topThreats.map((threat, index) => (
                  <div key={threat.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                        <span className="text-sm font-bold text-red-800">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{threat.type.replace(/_/g, ' ').toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">
                          {threat.count} incidents
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        threat.severity === 'high' ? 'border-red-200 text-red-800' :
                        threat.severity === 'medium' ? 'border-yellow-200 text-yellow-800' :
                        'border-green-200 text-green-800'
                      )}
                    >
                      {threat.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Health */}
        <motion.div {...animations.fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.systemHealth).map(([system, status]) => (
                  <div key={system} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSystemIcon(system)}
                      <span className="font-medium capitalize">
                        {system.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {status ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          status ? 'border-green-200 text-green-800' : 'border-red-200 text-red-800'
                        )}
                      >
                        {status ? 'Healthy' : 'Issues'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Security Events */}
      <motion.div {...animations.fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Security Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.securityEvents.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: SEVERITY_COLORS[event.severity as keyof typeof SEVERITY_COLORS] }}
                    />
                    <div>
                      <p className="font-medium">
                        {event.type.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {event.timestamp.toLocaleString()}
                        <span>•</span>
                        <span className="capitalize">{event.severity}</span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      event.resolved ? 'border-green-200 text-green-800' : 'border-orange-200 text-orange-800'
                    )}
                  >
                    {event.resolved ? 'Resolved' : 'Active'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function SecurityMetricCard({
  title,
  value,
  unit,
  icon: Icon,
  color,
  description
}: {
  title: string;
  value: number;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}) {
  return (
    <motion.div {...animations.fadeInUp}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" style={{ color }}>
            {value}{unit}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ComplianceCard({
  title,
  score,
  metrics
}: {
  title: string;
  score: number;
  metrics: Array<{ label: string; value: number }>;
}) {
  const scoreColor = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  
  return (
    <motion.div {...animations.fadeInUp}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <div className="text-2xl font-bold" style={{ color: scoreColor }}>
              {score}%
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={score} className="mb-4" />
          <div className="space-y-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{metric.label}</span>
                <span className="font-medium">{metric.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function getSystemIcon(system: string) {
  const icons = {
    encryption: <Lock className="w-5 h-5 text-green-600" />,
    firewall: <Shield className="w-5 h-5 text-blue-600" />,
    monitoring: <Eye className="w-5 h-5 text-purple-600" />,
    backups: <Database className="w-5 h-5 text-orange-600" />,
    updates: <RefreshCw className="w-5 h-5 text-red-600" />,
    accessControl: <Key className="w-5 h-5 text-indigo-600" />
  };
  
  return icons[system as keyof typeof icons] || <Server className="w-5 h-5 text-gray-600" />;
}

export default SecurityDashboard;
// Enhanced Results Dashboard with real-time updates and live data
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Clock, 
  Download, 
  RefreshCw,
  Filter,
  Search,
  Activity,
  Users,
  BarChart3,
  PieChart,
  Calendar,
  Bell,
  Wifi,
  WifiOff,
  ChevronRight,
  Eye,
  Share2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { realtimeService, RealtimeEvent } from '@/services/realtimeService';
import { exportService } from '@/services/exportService';
import { paymentService } from '@/services/paymentService';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { formatDistanceToNow } from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Types
interface AnalysisResult {
  id: string;
  type: 'single' | 'group';
  title: string;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  findings: {
    total: number;
    critical: number;
    warnings: number;
    info: number;
  };
  metadata: {
    source?: string;
    members?: number;
    messages?: number;
    duration?: number;
  };
  liveStatus?: {
    isMonitoring: boolean;
    lastUpdate: Date;
    newFindings: number;
  };
}

interface DashboardStats {
  totalScans: number;
  scamsDetected: number;
  risksPrevented: number;
  accuracyRate: number;
  averageResponseTime: number;
  activeMonitoring: number;
}

interface TimeRange {
  label: string;
  value: '24h' | '7d' | '30d' | '90d' | 'all';
}

const EnhancedResultsDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, profile } = useEnhancedAuth();

  // State
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange['value']>('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | AnalysisResult['status']>('all');
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('overview');
  const [liveUpdates, setLiveUpdates] = useState<Map<string, any>>(new Map());

  // Time range options
  const timeRanges: TimeRange[] = [
    { label: 'Last 24 Hours', value: '24h' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'All Time', value: 'all' },
  ];

  // Risk level colors
  const riskColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#7c3aed',
  };

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
      setupRealtimeSubscriptions();
    }

    return () => {
      cleanupSubscriptions();
    };
  }, [isAuthenticated, selectedTimeRange]);

  // Setup real-time subscriptions
  const setupRealtimeSubscriptions = async () => {
    try {
      // Subscribe to user's dashboard updates
      await realtimeService.subscribe({
        channel: `dashboard:${user?.id}`,
        events: [
          RealtimeEvent.ANALYSIS_COMPLETE,
          RealtimeEvent.RISK_UPDATED,
          RealtimeEvent.SCAM_DETECTED,
        ],
      });

      // Listen for real-time events
      realtimeService.on(RealtimeEvent.ANALYSIS_COMPLETE, handleAnalysisComplete);
      realtimeService.on(RealtimeEvent.RISK_UPDATED, handleRiskUpdate);
      realtimeService.on(RealtimeEvent.SCAM_DETECTED, handleScamDetected);
      realtimeService.on(RealtimeEvent.CONNECTED, () => setIsConnected(true));
      realtimeService.on(RealtimeEvent.DISCONNECTED, () => setIsConnected(false));

      logger.info('Dashboard real-time subscriptions setup');
    } catch (error) {
      logger.error('Failed to setup real-time subscriptions', { error });
    }
  };

  // Cleanup subscriptions
  const cleanupSubscriptions = () => {
    realtimeService.unsubscribe(`dashboard:${user?.id}`);
    realtimeService.removeAllListeners(RealtimeEvent.ANALYSIS_COMPLETE);
    realtimeService.removeAllListeners(RealtimeEvent.RISK_UPDATED);
    realtimeService.removeAllListeners(RealtimeEvent.SCAM_DETECTED);
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API calls - in production, these would fetch from backend
      const mockResults: AnalysisResult[] = [
        {
          id: '1',
          type: 'group',
          title: 'WhatsApp Trading Group Analysis',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'completed',
          riskScore: 85,
          riskLevel: 'high',
          findings: { total: 12, critical: 3, warnings: 6, info: 3 },
          metadata: { source: 'WhatsApp', members: 1250, messages: 5000 },
          liveStatus: {
            isMonitoring: true,
            lastUpdate: new Date(),
            newFindings: 2,
          },
        },
        {
          id: '2',
          type: 'single',
          title: 'Investment Opportunity Check',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: 'completed',
          riskScore: 45,
          riskLevel: 'medium',
          findings: { total: 5, critical: 0, warnings: 3, info: 2 },
          metadata: { duration: 15 },
        },
        {
          id: '3',
          type: 'group',
          title: 'Telegram Crypto Signals',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          status: 'processing',
          riskScore: 0,
          riskLevel: 'low',
          findings: { total: 0, critical: 0, warnings: 0, info: 0 },
          metadata: { source: 'Telegram', members: 5000 },
        },
      ];

      const mockStats: DashboardStats = {
        totalScans: 156,
        scamsDetected: 42,
        risksPrevented: 89,
        accuracyRate: 94.5,
        averageResponseTime: 2.3,
        activeMonitoring: 3,
      };

      setResults(mockResults);
      setStats(mockStats);
    } catch (error) {
      logger.error('Failed to load dashboard data', { error });
      toast({
        title: 'Error loading dashboard',
        description: 'Please try refreshing the page',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle real-time events
  const handleAnalysisComplete = (message: any) => {
    const newResult = message.payload as AnalysisResult;
    
    setResults(prev => [newResult, ...prev]);
    
    toast({
      title: 'Analysis Complete',
      description: `${newResult.title} has finished processing`,
      action: (
        <Button size="sm" onClick={() => viewDetails(newResult.id)}>
          View
        </Button>
      ),
    });
  };

  const handleRiskUpdate = (message: any) => {
    const { analysisId, riskScore, riskLevel } = message.payload;
    
    setResults(prev => prev.map(result => 
      result.id === analysisId 
        ? { ...result, riskScore, riskLevel }
        : result
    ));

    setLiveUpdates(prev => new Map(prev).set(analysisId, {
      type: 'risk_update',
      timestamp: new Date(),
    }));
  };

  const handleScamDetected = (message: any) => {
    const { analysisId, details } = message.payload;
    
    toast({
      title: '⚠️ Scam Detected!',
      description: details.message,
      variant: 'destructive',
      action: (
        <Button size="sm" onClick={() => viewDetails(analysisId)}>
          View Details
        </Button>
      ),
    });

    // Update result with new finding
    setResults(prev => prev.map(result => 
      result.id === analysisId 
        ? {
            ...result,
            findings: {
              ...result.findings,
              critical: result.findings.critical + 1,
              total: result.findings.total + 1,
            },
            liveStatus: result.liveStatus ? {
              ...result.liveStatus,
              lastUpdate: new Date(),
              newFindings: result.liveStatus.newFindings + 1,
            } : undefined,
          }
        : result
    ));
  };

  // Refresh data
  const refreshData = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
    
    toast({
      title: 'Dashboard refreshed',
      description: 'All data has been updated',
    });
  };

  // View analysis details
  const viewDetails = (id: string) => {
    navigate(`/results/${id}`);
  };

  // Export results
  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    try {
      const selectedIds = Array.from(selectedResults);
      const dataToExport = selectedIds.length > 0
        ? results.filter(r => selectedIds.includes(r.id))
        : results;

      if (dataToExport.length === 0) {
        toast({
          title: 'No data to export',
          description: 'Please select results or wait for data to load',
          variant: 'destructive',
        });
        return;
      }

      const blob = await exportService.exportAnalyses(
        dataToExport.map(r => ({ analysis: r })),
        format
      );

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scamshield-results-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: `Results exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      logger.error('Export failed', { error });
      toast({
        title: 'Export failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  // Delete results
  const handleDelete = async (ids: string[]) => {
    try {
      // In production, this would call the backend
      setResults(prev => prev.filter(r => !ids.includes(r.id)));
      setSelectedResults(new Set());
      
      toast({
        title: 'Results deleted',
        description: `${ids.length} result(s) removed`,
      });
    } catch (error) {
      logger.error('Delete failed', { error });
      toast({
        title: 'Delete failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  // Filter results
  const filteredResults = useMemo(() => {
    return results.filter(result => {
      const matchesSearch = result.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || result.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [results, searchQuery, filterStatus]);

  // Chart data preparation
  const chartData = useMemo(() => {
    // Risk distribution
    const riskDistribution = [
      { name: 'Low', value: results.filter(r => r.riskLevel === 'low').length, color: riskColors.low },
      { name: 'Medium', value: results.filter(r => r.riskLevel === 'medium').length, color: riskColors.medium },
      { name: 'High', value: results.filter(r => r.riskLevel === 'high').length, color: riskColors.high },
      { name: 'Critical', value: results.filter(r => r.riskLevel === 'critical').length, color: riskColors.critical },
    ];

    // Time series data
    const timeSeries = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        scans: Math.floor(Math.random() * 20) + 5,
        detections: Math.floor(Math.random() * 10),
      };
    });

    return { riskDistribution, timeSeries };
  }, [results]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="text-center py-12">
              <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">
                Please sign in to view your results dashboard
              </p>
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Results Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your scam detection analyses in real-time
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  Live
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </>
              )}
            </Badge>
            
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={refreshData}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-6 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Scans</p>
                    <p className="text-2xl font-bold">{stats.totalScans}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Scams Detected</p>
                    <p className="text-2xl font-bold text-destructive">{stats.scamsDetected}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Risks Prevented</p>
                    <p className="text-2xl font-bold text-green-600">{stats.risksPrevented}</p>
                  </div>
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                    <p className="text-2xl font-bold">{stats.accuracyRate}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Response</p>
                    <p className="text-2xl font-bold">{stats.averageResponseTime}s</p>
                  </div>
                  <Clock className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monitoring</p>
                    <p className="text-2xl font-bold">{stats.activeMonitoring}</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-600 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Distribution</CardTitle>
                  <CardDescription>Current risk levels across all analyses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <RePieChart>
                      <Pie
                        data={chartData.riskDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                  <CardDescription>Scans and detections over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="scans"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="detections"
                        stackId="1"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates and findings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredResults.slice(0, 5).map(result => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                      onClick={() => viewDetails(result.id)}
                    >
                      <div className="flex items-center gap-3">
                        {result.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : result.status === 'processing' ? (
                          <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
                        ) : result.status === 'failed' ? (
                          <XCircle className="w-5 h-5 text-destructive" />
                        ) : (
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        )}
                        
                        <div>
                          <p className="font-medium">{result.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(result.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {result.liveStatus?.isMonitoring && (
                          <Badge variant="outline" className="animate-pulse">
                            <Activity className="w-3 h-3 mr-1" />
                            Live
                          </Badge>
                        )}
                        
                        <Badge
                          variant={
                            result.riskLevel === 'critical' ? 'destructive' :
                            result.riskLevel === 'high' ? 'destructive' :
                            result.riskLevel === 'medium' ? 'secondary' :
                            'default'
                          }
                        >
                          {result.riskLevel}
                        </Badge>
                        
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {/* Filters and Actions */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search results..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                      <SelectTrigger className="w-40">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2">
                    {selectedResults.size > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(Array.from(selectedResults))}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete ({selectedResults.size})
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedResults(new Set())}
                        >
                          Clear Selection
                        </Button>
                      </>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport('pdf')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results List */}
            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : filteredResults.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No results found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || filterStatus !== 'all' 
                        ? 'Try adjusting your filters'
                        : 'Start a new analysis to see results here'}
                    </p>
                    <Button className="mt-4" onClick={() => navigate('/analyze')}>
                      Start New Analysis
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredResults.map(result => (
                  <Card key={result.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedResults.has(result.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedResults);
                              if (e.target.checked) {
                                newSelected.add(result.id);
                              } else {
                                newSelected.delete(result.id);
                              }
                              setSelectedResults(newSelected);
                            }}
                            className="mt-1"
                          />
                          
                          <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              {result.title}
                              {liveUpdates.has(result.id) && (
                                <Badge variant="secondary" className="animate-pulse">
                                  Updated
                                </Badge>
                              )}
                            </h3>
                            
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDistanceToNow(result.timestamp, { addSuffix: true })}
                              </span>
                              
                              {result.metadata?.source && (
                                <span>{result.metadata.source}</span>
                              )}
                              
                              {result.metadata?.members && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {result.metadata.members.toLocaleString()} members
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              result.status === 'completed' ? 'default' :
                              result.status === 'processing' ? 'secondary' :
                              result.status === 'failed' ? 'destructive' :
                              'outline'
                            }
                          >
                            {result.status}
                          </Badge>
                          
                          {result.liveStatus?.isMonitoring && (
                            <Badge variant="outline" className="animate-pulse">
                              <Activity className="w-3 h-3 mr-1" />
                              Monitoring
                            </Badge>
                          )}
                        </div>
                      </div>

                      {result.status === 'completed' && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="bg-secondary/50 rounded-lg p-3">
                              <p className="text-sm text-muted-foreground">Risk Score</p>
                              <div className="flex items-center gap-2">
                                <p className="text-2xl font-bold">{result.riskScore}</p>
                                <Badge
                                  variant={
                                    result.riskLevel === 'critical' ? 'destructive' :
                                    result.riskLevel === 'high' ? 'destructive' :
                                    result.riskLevel === 'medium' ? 'secondary' :
                                    'default'
                                  }
                                >
                                  {result.riskLevel}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="bg-secondary/50 rounded-lg p-3">
                              <p className="text-sm text-muted-foreground">Critical Findings</p>
                              <p className="text-2xl font-bold text-destructive">
                                {result.findings.critical}
                              </p>
                            </div>
                            
                            <div className="bg-secondary/50 rounded-lg p-3">
                              <p className="text-sm text-muted-foreground">Warnings</p>
                              <p className="text-2xl font-bold text-orange-600">
                                {result.findings.warnings}
                              </p>
                            </div>
                            
                            <div className="bg-secondary/50 rounded-lg p-3">
                              <p className="text-sm text-muted-foreground">Total Findings</p>
                              <p className="text-2xl font-bold">{result.findings.total}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Risk Level</span>
                              <span>{result.riskScore}%</span>
                            </div>
                            <Progress 
                              value={result.riskScore} 
                              className="h-2"
                              style={{
                                '--progress-color': 
                                  result.riskLevel === 'critical' ? riskColors.critical :
                                  result.riskLevel === 'high' ? riskColors.high :
                                  result.riskLevel === 'medium' ? riskColors.medium :
                                  riskColors.low
                              } as any}
                            />
                          </div>
                        </>
                      )}

                      {result.status === 'processing' && (
                        <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-primary animate-spin" />
                            <div className="flex-1">
                              <p className="font-medium">Analysis in progress...</p>
                              <p className="text-sm text-muted-foreground">
                                This may take a few minutes
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {result.liveStatus?.newFindings && result.liveStatus.newFindings > 0 && (
                        <Alert className="mb-4">
                          <Bell className="w-4 h-4" />
                          <AlertDescription>
                            {result.liveStatus.newFindings} new finding{result.liveStatus.newFindings > 1 ? 's' : ''} since last viewed
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => viewDetails(result.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExport('pdf')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Detection Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Detection Trends</CardTitle>
                  <CardDescription>Scam detection patterns over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="scans"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="detections"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: '#ef4444' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Source Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Source Distribution</CardTitle>
                  <CardDescription>Analysis sources breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { source: 'WhatsApp', count: 45 },
                        { source: 'Telegram', count: 32 },
                        { source: 'Email', count: 28 },
                        { source: 'SMS', count: 15 },
                        { source: 'Other', count: 10 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="source" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>System performance and accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Detection Accuracy</p>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-bold">94.5%</p>
                      <TrendingUp className="w-5 h-5 text-green-600 mb-1" />
                    </div>
                    <Progress value={94.5} className="mt-2" />
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">False Positive Rate</p>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-bold">2.3%</p>
                      <TrendingUp className="w-5 h-5 text-green-600 mb-1 rotate-180" />
                    </div>
                    <Progress value={2.3} className="mt-2" />
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Avg Processing Time</p>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-bold">2.3s</p>
                      <Clock className="w-5 h-5 text-primary mb-1" />
                    </div>
                    <Progress value={23} className="mt-2" />
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">System Uptime</p>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-bold">99.9%</p>
                      <Activity className="w-5 h-5 text-green-600 mb-1" />
                    </div>
                    <Progress value={99.9} className="mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedResultsDashboard;
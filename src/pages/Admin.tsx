import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Activity, 
  AlertTriangle, 
  Database, 
  BarChart3, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scammerEntrySchema, ScammerEntryFormData } from '../lib/validations';
import { supabase } from '../integrations/supabase/client';
import { monitoring, analytics } from '../lib/monitoring';
import Navigation from '../components/Navigation';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalAnalyses: number;
  errorRate: number;
  avgResponseTime: number;
}

interface ScammerEntry {
  id: string;
  identifier: string;
  identifierType: string;
  confidence: number;
  source: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function Admin() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [scammerEntries, setScammerEntries] = useState<ScammerEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScammerEntry | null>(null);

  const form = useForm<ScammerEntryFormData>({
    resolver: zodResolver(scammerEntrySchema),
    defaultValues: {
      identifier: '',
      identifierType: 'username',
      confidence: 80,
      source: '',
      description: '',
      tags: [],
    },
  });

  // Check admin permissions
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }

    loadAdminData();
    analytics.track('admin_dashboard_viewed');
  }, [user, profile, navigate]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadScammerEntries(),
      ]);
    } catch (error) {
      monitoring.error('Failed to load admin data', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // In a real implementation, these would be proper API calls
      const mockStats: AdminStats = {
        totalUsers: 1247,
        activeUsers: 89,
        totalAnalyses: 5634,
        errorRate: 2.3,
        avgResponseTime: 1.2,
      };
      setStats(mockStats);
    } catch (error) {
      monitoring.error('Failed to load admin stats', error as Error);
    }
  };

  const loadScammerEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('scammer_database')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setScammerEntries(data || []);
    } catch (error) {
      monitoring.error('Failed to load scammer entries', error as Error);
      // Use mock data for demo
      setScammerEntries([
        {
          id: '1',
          identifier: '@crypto_scammer123',
          identifierType: 'username',
          confidence: 95,
          source: 'FTC Report',
          description: 'Reported for pump and dump schemes',
          tags: ['telegram', 'crypto', 'pump-dump'],
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          identifier: 'scammer@example.com',
          identifierType: 'email',
          confidence: 88,
          source: 'User Reports',
          description: 'Multiple fake investment scheme reports',
          tags: ['email', 'investment', 'fraud'],
          createdAt: '2024-01-14T15:20:00Z',
          updatedAt: '2024-01-14T15:20:00Z',
        },
      ]);
    }
  };

  const handleAddEntry = async (data: ScammerEntryFormData) => {
    try {
      const { error } = await supabase
        .from('scammer_database')
        .insert([{
          identifier: data.identifier,
          identifier_type: data.identifierType,
          confidence: data.confidence,
          source: data.source,
          description: data.description || '',
          tags: data.tags || [],
        }]);

      if (error) throw error;

      analytics.track('admin_scammer_entry_added', {
        identifierType: data.identifierType,
        confidence: data.confidence,
      });

      setIsAddingEntry(false);
      form.reset();
      await loadScammerEntries();
    } catch (error) {
      monitoring.error('Failed to add scammer entry', error as Error);
    }
  };

  const handleEditEntry = async (data: ScammerEntryFormData) => {
    if (!editingEntry) return;

    try {
      const { error } = await supabase
        .from('scammer_database')
        .update({
          identifier: data.identifier,
          identifier_type: data.identifierType,
          confidence: data.confidence,
          source: data.source,
          description: data.description || '',
          tags: data.tags || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      analytics.track('admin_scammer_entry_updated', {
        entryId: editingEntry.id,
        identifierType: data.identifierType,
      });

      setEditingEntry(null);
      form.reset();
      await loadScammerEntries();
    } catch (error) {
      monitoring.error('Failed to update scammer entry', error as Error);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('scammer_database')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      analytics.track('admin_scammer_entry_deleted', { entryId });
      await loadScammerEntries();
    } catch (error) {
      monitoring.error('Failed to delete scammer entry', error as Error);
    }
  };

  const filteredEntries = scammerEntries.filter(entry => {
    const matchesSearch = entry.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || entry.identifierType === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage scammer database and monitor system performance</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-2xl font-bold">{stats.activeUsers}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Analyses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="text-2xl font-bold">{stats.totalAnalyses.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-2xl font-bold">{stats.errorRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <RefreshCw className="h-5 w-5 text-orange-600 mr-2" />
                  <span className="text-2xl font-bold">{stats.avgResponseTime}s</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="scammer-database" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scammer-database">Scammer Database</TabsTrigger>
            <TabsTrigger value="user-management">User Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="system-health">System Health</TabsTrigger>
          </TabsList>

          <TabsContent value="scammer-database" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Scammer Database Management</CardTitle>
                    <CardDescription>Manage known scammer identifiers and sources</CardDescription>
                  </div>
                  <Button onClick={() => setIsAddingEntry(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search identifiers, sources..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="username">Username</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                {/* Entries Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Identifier</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-mono text-sm">{entry.identifier}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{entry.identifierType}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={entry.confidence} className="w-16 h-2" />
                              <span className="text-sm">{entry.confidence}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{entry.source}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {entry.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingEntry(entry);
                                  form.reset({
                                    identifier: entry.identifier,
                                    identifierType: entry.identifierType as any,
                                    confidence: entry.confidence,
                                    source: entry.source,
                                    description: entry.description,
                                    tags: entry.tags,
                                  });
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteEntry(entry.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user-management">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Feature Coming Soon</AlertTitle>
                  <AlertDescription>
                    User management features will be available in the next update.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>View usage analytics and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <BarChart3 className="h-4 w-4" />
                  <AlertTitle>Analytics Integration</AlertTitle>
                  <AlertDescription>
                    Advanced analytics dashboard will be integrated with monitoring data.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system-health">
            <Card>
              <CardHeader>
                <CardTitle>System Health Monitoring</CardTitle>
                <CardDescription>Monitor application performance and errors</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertTitle>System Monitoring</AlertTitle>
                  <AlertDescription>
                    Real-time system health monitoring is being implemented.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Entry Dialog */}
      <Dialog open={isAddingEntry || !!editingEntry} onOpenChange={(open) => {
        if (!open) {
          setIsAddingEntry(false);
          setEditingEntry(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Edit Scammer Entry' : 'Add New Scammer Entry'}
            </DialogTitle>
            <DialogDescription>
              {editingEntry 
                ? 'Update the details of this scammer database entry.' 
                : 'Add a new identifier to the scammer database with source information.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(editingEntry ? handleEditEntry : handleAddEntry)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identifier</FormLabel>
                      <FormControl>
                        <Input placeholder="@username, email, phone..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="identifierType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="username">Username</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="wallet">Wallet Address</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="confidence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confidence Level (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <FormControl>
                        <Input placeholder="FTC, ScamAlert, User Report..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional details about this scammer..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsAddingEntry(false);
                  setEditingEntry(null);
                  form.reset();
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEntry ? 'Update Entry' : 'Add Entry'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
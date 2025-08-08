// Advanced Drag-and-Drop Dashboard with Customizable Widgets
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  MeasuringStrategy,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
  SortableContext as SortableProvider,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Shield,
  Phone,
  Mail,
  Globe,
  AlertTriangle,
  TrendingUp,
  Users,
  Clock,
  Star,
  Activity,
  BarChart3,
  PieChart,
  Settings,
  Plus,
  GripVertical,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  RefreshCw,
  Download,
  Filter,
  Search,
  ChevronDown,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { HapticFeedback } from '@/hooks/useMobileGestures';
import { animations } from '@/lib/animations';

// Widget types and interfaces
export interface WidgetData {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  settings: Record<string, any>;
  data?: any;
  refreshInterval?: number;
  lastUpdated?: Date;
}

export type WidgetType = 
  | 'overview'
  | 'recent-scans' 
  | 'threat-map'
  | 'statistics'
  | 'activity-feed'
  | 'quick-actions'
  | 'protection-status'
  | 'analytics'
  | 'notifications'
  | 'performance';

// Default widgets configuration
const defaultWidgets: WidgetData[] = [
  {
    id: 'overview',
    type: 'overview',
    title: 'Protection Overview',
    description: 'Your security status at a glance',
    position: { x: 0, y: 0 },
    size: { width: 2, height: 1 },
    visible: true,
    settings: { showDetails: true },
    refreshInterval: 30000,
  },
  {
    id: 'recent-scans',
    type: 'recent-scans',
    title: 'Recent Scans',
    position: { x: 2, y: 0 },
    size: { width: 1, height: 1 },
    visible: true,
    settings: { maxItems: 5 },
    refreshInterval: 10000,
  },
  {
    id: 'threat-map',
    type: 'threat-map',
    title: 'Threat Map',
    description: 'Live threat activity around you',
    position: { x: 0, y: 1 },
    size: { width: 1, height: 1 },
    visible: true,
    settings: { radius: 50 },
    refreshInterval: 60000,
  },
  {
    id: 'statistics',
    type: 'statistics',
    title: 'Statistics',
    position: { x: 1, y: 1 },
    size: { width: 1, height: 1 },
    visible: true,
    settings: { timeRange: '7d' },
    refreshInterval: 300000,
  },
  {
    id: 'activity-feed',
    type: 'activity-feed',
    title: 'Activity Feed',
    position: { x: 2, y: 1 },
    size: { width: 1, height: 2 },
    visible: true,
    settings: { maxItems: 10 },
    refreshInterval: 5000,
  },
];

// Widget size presets
const WIDGET_SIZES = {
  small: { width: 1, height: 1 },
  medium: { width: 2, height: 1 },
  large: { width: 2, height: 2 },
  wide: { width: 3, height: 1 },
  tall: { width: 1, height: 2 },
};

// Sample data for widgets
const sampleData = {
  overview: {
    threatsBlocked: 1247,
    scansToday: 43,
    protectionLevel: 'High',
    status: 'Protected',
  },
  recentScans: [
    { id: 1, type: 'Email', result: 'Clean', time: '2 minutes ago', threat: null },
    { id: 2, type: 'URL', result: 'Blocked', time: '5 minutes ago', threat: 'Phishing' },
    { id: 3, type: 'Call', result: 'Clean', time: '15 minutes ago', threat: null },
    { id: 4, type: 'SMS', result: 'Suspicious', time: '1 hour ago', threat: 'Spam' },
  ],
  statistics: {
    totalScans: 15234,
    threatsBlocked: 892,
    falsePositives: 12,
    accuracy: 98.7,
  },
  activities: [
    { id: 1, action: 'Blocked suspicious call', time: '2 min ago', severity: 'high' },
    { id: 2, action: 'Scanned email attachment', time: '15 min ago', severity: 'low' },
    { id: 3, action: 'Updated threat database', time: '1 hour ago', severity: 'info' },
    { id: 4, action: 'Detected phishing URL', time: '2 hours ago', severity: 'medium' },
  ],
};

// Sortable widget component
function SortableWidget({ 
  widget, 
  onEdit, 
  onDelete, 
  onToggleVisibility,
  onRefresh 
}: {
  widget: WidgetData;
  onEdit: (widget: WidgetData) => void;
  onDelete: (widgetId: string) => void;
  onToggleVisibility: (widgetId: string) => void;
  onRefresh: (widgetId: string) => void;
}) {
  const { announcePolite } = useAccessibility();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleAction = (action: string) => {
    HapticFeedback.light();
    announcePolite(`${action} ${widget.title}`);
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'relative group transition-all duration-200',
        isDragging && 'opacity-50 scale-105 z-50'
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: widget.visible ? 1 : 0.5, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      <Card className={cn(
        'h-full transition-all duration-200',
        'hover:shadow-lg hover:scale-[1.02]',
        !widget.visible && 'opacity-50',
        isDragging && 'shadow-2xl rotate-2'
      )}>
        {/* Widget Header */}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                {...listeners}
                className="p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
                aria-label={`Drag ${widget.title}`}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </button>
              <CardTitle className="text-sm font-semibold truncate">
                {widget.title}
              </CardTitle>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="w-4 h-4" />
                  <span className="sr-only">Widget options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Widget Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => { onRefresh(widget.id); handleAction('Refreshed'); }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => { onEdit(widget); handleAction('Opened settings for'); }}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => { onToggleVisibility(widget.id); handleAction(widget.visible ? 'Hidden' : 'Shown'); }}
                >
                  {widget.visible ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => { onDelete(widget.id); handleAction('Removed'); }}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {widget.description && (
            <p className="text-xs text-muted-foreground">{widget.description}</p>
          )}
        </CardHeader>

        {/* Widget Content */}
        <CardContent className="pt-0">
          <WidgetContent widget={widget} />
          
          {/* Last updated timestamp */}
          {widget.lastUpdated && (
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>Updated {formatTime(widget.lastUpdated)}</span>
              {widget.refreshInterval && (
                <Clock className="w-3 h-3" />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Widget content renderer
function WidgetContent({ widget }: { widget: WidgetData }) {
  switch (widget.type) {
    case 'overview':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant="default" className="bg-green-500">
              Protected
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-2xl font-bold text-green-600">1,247</div>
              <div className="text-muted-foreground">Threats Blocked</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">43</div>
              <div className="text-muted-foreground">Scans Today</div>
            </div>
          </div>
        </div>
      );

    case 'recent-scans':
      return (
        <div className="space-y-2">
          {sampleData.recentScans.slice(0, widget.settings?.maxItems || 5).map((scan) => (
            <div key={scan.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getTypeIcon(scan.type)}
                <span>{scan.type}</span>
              </div>
              <Badge 
                variant={scan.result === 'Clean' ? 'secondary' : 
                        scan.result === 'Blocked' ? 'destructive' : 'outline'}
              >
                {scan.result}
              </Badge>
            </div>
          ))}
        </div>
      );

    case 'statistics':
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-xl font-bold">15.2K</div>
            <div className="text-xs text-muted-foreground">Total Scans</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-600">892</div>
            <div className="text-xs text-muted-foreground">Blocked</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">98.7%</div>
            <div className="text-xs text-muted-foreground">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">12</div>
            <div className="text-xs text-muted-foreground">False +</div>
          </div>
        </div>
      );

    case 'threat-map':
      return (
        <div className="space-y-2">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Globe className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">Live Threat Map</div>
              <div className="text-xs text-muted-foreground">
                3 threats in 50km radius
              </div>
            </div>
          </div>
        </div>
      );

    case 'activity-feed':
      return (
        <div className="space-y-2">
          {sampleData.activities.slice(0, widget.settings?.maxItems || 10).map((activity) => (
            <div key={activity.id} className="flex items-start gap-2 text-sm">
              <div className={cn(
                'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                activity.severity === 'high' ? 'bg-red-500' :
                activity.severity === 'medium' ? 'bg-yellow-500' :
                activity.severity === 'low' ? 'bg-green-500' : 'bg-blue-500'
              )} />
              <div className="flex-1 min-w-0">
                <div className="truncate">{activity.action}</div>
                <div className="text-xs text-muted-foreground">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center h-20 text-muted-foreground">
          <Activity className="w-6 h-6 mr-2" />
          <span>Widget Content</span>
        </div>
      );
  }
}

// Helper functions
function getTypeIcon(type: string) {
  switch (type) {
    case 'Email': return <Mail className="w-4 h-4" />;
    case 'URL': return <Globe className="w-4 h-4" />;
    case 'Call': return <Phone className="w-4 h-4" />;
    case 'SMS': return <Phone className="w-4 h-4" />;
    default: return <Shield className="w-4 h-4" />;
  }
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

// Main dashboard component
interface DragDropDashboardProps {
  className?: string;
  onWidgetChange?: (widgets: WidgetData[]) => void;
}

export function DragDropDashboard({ 
  className,
  onWidgetChange 
}: DragDropDashboardProps) {
  const { announcePolite, announceAssertive } = useAccessibility();
  const [widgets, setWidgets] = useState<WidgetData[]>(defaultWidgets);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [editingWidget, setEditingWidget] = useState<WidgetData | null>(null);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Auto-refresh widgets
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    
    widgets.forEach(widget => {
      if (widget.refreshInterval && widget.visible) {
        const interval = setInterval(() => {
          setWidgets(prev => prev.map(w => 
            w.id === widget.id 
              ? { ...w, lastUpdated: new Date() }
              : w
          ));
        }, widget.refreshInterval);
        intervals.push(interval);
      }
    });

    return () => {
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [widgets]);

  // Persist widgets to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
    onWidgetChange?.(widgets);
  }, [widgets, onWidgetChange]);

  // Load widgets from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-widgets');
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved widgets:', error);
      }
    }
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
    HapticFeedback.light();
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        announcePolite(`Moved ${items[oldIndex].title} to new position`);
        HapticFeedback.medium();
        
        return newItems;
      });
    }
    
    setActiveId(null);
  }, [announcePolite]);

  const handleEditWidget = (widget: WidgetData) => {
    setEditingWidget(widget);
  };

  const handleSaveWidget = (updatedWidget: WidgetData) => {
    setWidgets(prev => prev.map(w => 
      w.id === updatedWidget.id ? updatedWidget : w
    ));
    setEditingWidget(null);
    announcePolite(`Updated ${updatedWidget.title} settings`);
    HapticFeedback.success();
  };

  const handleDeleteWidget = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    announceAssertive(`Removed ${widget?.title || 'widget'} from dashboard`);
    HapticFeedback.warning();
  };

  const handleToggleVisibility = (widgetId: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    ));
    
    const widget = widgets.find(w => w.id === widgetId);
    announcePolite(`${widget?.visible ? 'Hidden' : 'Shown'} ${widget?.title}`);
  };

  const handleRefreshWidget = (widgetId: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, lastUpdated: new Date() } : w
    ));
    
    const widget = widgets.find(w => w.id === widgetId);
    announcePolite(`Refreshed ${widget?.title}`);
    HapticFeedback.light();
  };

  const handleAddWidget = (type: WidgetType) => {
    const newWidget: WidgetData = {
      id: `widget-${Date.now()}`,
      type,
      title: `New ${type} Widget`,
      position: { x: 0, y: 0 },
      size: WIDGET_SIZES.medium,
      visible: true,
      settings: {},
      lastUpdated: new Date(),
    };

    setWidgets(prev => [...prev, newWidget]);
    setShowWidgetPicker(false);
    announcePolite(`Added ${newWidget.title} to dashboard`);
    HapticFeedback.success();
  };

  const visibleWidgets = widgets.filter(w => w.visible);
  const activeWidget = activeId ? widgets.find(w => w.id === activeId) : null;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">
            Drag and drop to customize your dashboard
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWidgetPicker(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Widget
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setWidgets(defaultWidgets);
              announcePolite('Reset dashboard to default layout');
              HapticFeedback.medium();
            }}
          >
            Reset Layout
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
      >
        <SortableContext items={widgets} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {visibleWidgets.map((widget) => (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  onEdit={handleEditWidget}
                  onDelete={handleDeleteWidget}
                  onToggleVisibility={handleToggleVisibility}
                  onRefresh={handleRefreshWidget}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeWidget ? (
            <Card className="opacity-90 rotate-2 shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{activeWidget.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <WidgetContent widget={activeWidget} />
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Widget Picker Dialog */}
      <Dialog open={showWidgetPicker} onOpenChange={setShowWidgetPicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
            <DialogDescription>
              Choose a widget to add to your dashboard
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            {Object.entries({
              overview: { icon: Shield, name: 'Overview' },
              'recent-scans': { icon: Activity, name: 'Recent Scans' },
              'threat-map': { icon: Globe, name: 'Threat Map' },
              statistics: { icon: BarChart3, name: 'Statistics' },
              'activity-feed': { icon: Clock, name: 'Activity Feed' },
              'quick-actions': { icon: Star, name: 'Quick Actions' },
            }).map(([type, config]) => (
              <Button
                key={type}
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => handleAddWidget(type as WidgetType)}
              >
                <config.icon className="w-6 h-6" />
                <span className="text-sm">{config.name}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Widget Edit Dialog */}
      {editingWidget && (
        <Dialog open={!!editingWidget} onOpenChange={() => setEditingWidget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Widget: {editingWidget.title}</DialogTitle>
              <DialogDescription>
                Customize your widget settings
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={editingWidget.title}
                  onChange={(e) => setEditingWidget({
                    ...editingWidget,
                    title: e.target.value
                  })}
                  className="w-full p-2 border rounded mt-1"
                />
              </div>
              
              {editingWidget.type === 'recent-scans' && (
                <div>
                  <label className="text-sm font-medium">Max Items</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingWidget.settings?.maxItems || 5}
                    onChange={(e) => setEditingWidget({
                      ...editingWidget,
                      settings: {
                        ...editingWidget.settings,
                        maxItems: parseInt(e.target.value)
                      }
                    })}
                    className="w-full p-2 border rounded mt-1"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingWidget(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleSaveWidget(editingWidget)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default DragDropDashboard;
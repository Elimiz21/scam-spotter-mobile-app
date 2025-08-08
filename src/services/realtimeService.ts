// Real-time WebSocket service for live features
import { RealtimeChannel, RealtimeClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { EventEmitter } from 'events';

// Event types
export enum RealtimeEvent {
  // Connection events
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
  
  // Scam detection events
  SCAM_DETECTED = 'scam_detected',
  RISK_UPDATED = 'risk_updated',
  ANALYSIS_COMPLETE = 'analysis_complete',
  
  // User events
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_TYPING = 'user_typing',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  
  // Notification events
  NOTIFICATION = 'notification',
  ALERT = 'alert',
  MESSAGE = 'message',
  
  // Collaboration events
  DOCUMENT_UPDATED = 'document_updated',
  COMMENT_ADDED = 'comment_added',
  ANNOTATION_CREATED = 'annotation_created',
  
  // System events
  MAINTENANCE = 'maintenance',
  UPDATE_AVAILABLE = 'update_available',
  RATE_LIMIT = 'rate_limit',
}

// Message interfaces
export interface RealtimeMessage<T = any> {
  id: string;
  event: RealtimeEvent;
  payload: T;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface PresenceState {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  currentPage?: string;
  metadata?: Record<string, any>;
}

export interface TypingIndicator {
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}

// Subscription options
export interface SubscriptionOptions {
  channel: string;
  events?: RealtimeEvent[];
  filters?: Record<string, any>;
  presence?: boolean;
}

// Real-time service class
class RealtimeService extends EventEmitter {
  private channels = new Map<string, RealtimeChannel>();
  private presence = new Map<string, PresenceState>();
  private typingIndicators = new Map<string, TypingIndicator>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval?: NodeJS.Timeout;
  private isConnected = false;
  private userId?: string;

  constructor() {
    super();
    this.initialize();
  }

  // Initialize real-time connection
  private async initialize(): Promise<void> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      this.userId = user?.id;

      // Set up auth state listener
      supabase.auth.onAuthStateChange((event, session) => {
        this.userId = session?.user?.id;
        
        if (event === 'SIGNED_OUT') {
          this.disconnect();
        } else if (event === 'SIGNED_IN' && !this.isConnected) {
          this.connect();
        }
      });

      // Connect if user is authenticated
      if (this.userId) {
        await this.connect();
      }

      logger.info('Realtime service initialized');
    } catch (error) {
      logger.error('Failed to initialize realtime service', { error });
    }
  }

  // Connect to real-time server
  async connect(): Promise<void> {
    try {
      if (this.isConnected) return;

      // Subscribe to system channel
      await this.subscribeToSystemChannel();

      // Start heartbeat
      this.startHeartbeat();

      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      this.emit(RealtimeEvent.CONNECTED);
      logger.info('Connected to realtime server');
    } catch (error) {
      logger.error('Failed to connect to realtime server', { error });
      this.handleConnectionError(error);
    }
  }

  // Disconnect from real-time server
  async disconnect(): Promise<void> {
    try {
      // Unsubscribe from all channels
      for (const [channelName, channel] of this.channels) {
        await this.unsubscribe(channelName);
      }

      // Stop heartbeat
      this.stopHeartbeat();

      this.isConnected = false;
      this.presence.clear();
      this.typingIndicators.clear();

      this.emit(RealtimeEvent.DISCONNECTED);
      logger.info('Disconnected from realtime server');
    } catch (error) {
      logger.error('Error disconnecting from realtime server', { error });
    }
  }

  // Subscribe to a channel
  async subscribe(options: SubscriptionOptions): Promise<void> {
    try {
      const { channel: channelName, events = [], filters = {}, presence = false } = options;

      // Check if already subscribed
      if (this.channels.has(channelName)) {
        logger.debug('Already subscribed to channel', { channelName });
        return;
      }

      // Create channel
      const channel = supabase.channel(channelName, {
        config: {
          presence: presence ? { key: this.userId } : undefined,
        },
      });

      // Set up presence tracking
      if (presence) {
        this.setupPresence(channel);
      }

      // Set up message handling
      channel.on('broadcast', { event: '*' }, (payload) => {
        this.handleMessage(channelName, payload);
      });

      // Set up database change tracking if needed
      if (channelName.startsWith('db:')) {
        const [, table, event] = channelName.split(':');
        
        channel.on(
          'postgres_changes' as any,
          {
            event: event as any,
            schema: 'public',
            table,
            filter: filters ? this.buildFilter(filters) : undefined,
          },
          (payload) => {
            this.handleDatabaseChange(table, event, payload);
          }
        );
      }

      // Subscribe to channel
      await channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Subscribed to channel', { channelName });
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Channel subscription error', { channelName });
          this.emit(RealtimeEvent.ERROR, { channel: channelName, error: 'Subscription failed' });
        }
      });

      this.channels.set(channelName, channel);
    } catch (error) {
      logger.error('Failed to subscribe to channel', { error, channel: options.channel });
      throw error;
    }
  }

  // Unsubscribe from a channel
  async unsubscribe(channelName: string): Promise<void> {
    try {
      const channel = this.channels.get(channelName);
      
      if (!channel) {
        logger.debug('Not subscribed to channel', { channelName });
        return;
      }

      await channel.unsubscribe();
      this.channels.delete(channelName);

      logger.info('Unsubscribed from channel', { channelName });
    } catch (error) {
      logger.error('Failed to unsubscribe from channel', { error, channelName });
      throw error;
    }
  }

  // Send message to channel
  async send<T = any>(
    channelName: string,
    event: RealtimeEvent,
    payload: T,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const channel = this.channels.get(channelName);
      
      if (!channel) {
        throw new Error(`Not subscribed to channel: ${channelName}`);
      }

      const message: RealtimeMessage<T> = {
        id: this.generateMessageId(),
        event,
        payload,
        timestamp: new Date(),
        userId: this.userId,
        metadata,
      };

      await channel.send({
        type: 'broadcast',
        event: event,
        payload: message,
      });

      logger.debug('Message sent', { channelName, event });
    } catch (error) {
      logger.error('Failed to send message', { error, channelName, event });
      throw error;
    }
  }

  // Update presence
  async updatePresence(
    channelName: string,
    state: Partial<PresenceState>
  ): Promise<void> {
    try {
      const channel = this.channels.get(channelName);
      
      if (!channel) {
        throw new Error(`Not subscribed to channel: ${channelName}`);
      }

      const presence: PresenceState = {
        userId: this.userId!,
        status: state.status || 'online',
        lastSeen: new Date(),
        currentPage: state.currentPage,
        metadata: state.metadata,
      };

      await channel.track(presence);

      this.presence.set(this.userId!, presence);
      logger.debug('Presence updated', { channelName, status: presence.status });
    } catch (error) {
      logger.error('Failed to update presence', { error, channelName });
      throw error;
    }
  }

  // Send typing indicator
  async sendTypingIndicator(
    channelName: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      const indicator: TypingIndicator = {
        userId: this.userId!,
        isTyping,
        timestamp: new Date(),
      };

      await this.send(channelName, RealtimeEvent.USER_TYPING, indicator);

      if (isTyping) {
        this.typingIndicators.set(this.userId!, indicator);
        
        // Auto-clear typing indicator after 5 seconds
        setTimeout(() => {
          if (this.typingIndicators.get(this.userId!)?.timestamp === indicator.timestamp) {
            this.sendTypingIndicator(channelName, false);
          }
        }, 5000);
      } else {
        this.typingIndicators.delete(this.userId!);
      }
    } catch (error) {
      logger.error('Failed to send typing indicator', { error, channelName });
    }
  }

  // Get presence for channel
  getPresence(channelName: string): PresenceState[] {
    const channel = this.channels.get(channelName);
    
    if (!channel) {
      return [];
    }

    return Array.from(this.presence.values());
  }

  // Get typing indicators
  getTypingIndicators(channelName: string): TypingIndicator[] {
    return Array.from(this.typingIndicators.values())
      .filter(indicator => indicator.isTyping);
  }

  // Subscribe to scam detection updates
  async subscribeToScamDetection(groupId: string): Promise<void> {
    await this.subscribe({
      channel: `scam-detection:${groupId}`,
      events: [
        RealtimeEvent.SCAM_DETECTED,
        RealtimeEvent.RISK_UPDATED,
        RealtimeEvent.ANALYSIS_COMPLETE,
      ],
    });
  }

  // Subscribe to notifications
  async subscribeToNotifications(): Promise<void> {
    if (!this.userId) return;

    await this.subscribe({
      channel: `notifications:${this.userId}`,
      events: [
        RealtimeEvent.NOTIFICATION,
        RealtimeEvent.ALERT,
        RealtimeEvent.MESSAGE,
      ],
    });
  }

  // Subscribe to collaboration
  async subscribeToCollaboration(documentId: string): Promise<void> {
    await this.subscribe({
      channel: `collaboration:${documentId}`,
      events: [
        RealtimeEvent.DOCUMENT_UPDATED,
        RealtimeEvent.COMMENT_ADDED,
        RealtimeEvent.ANNOTATION_CREATED,
      ],
      presence: true,
    });
  }

  // Private methods
  private async subscribeToSystemChannel(): Promise<void> {
    await this.subscribe({
      channel: 'system',
      events: [
        RealtimeEvent.MAINTENANCE,
        RealtimeEvent.UPDATE_AVAILABLE,
        RealtimeEvent.RATE_LIMIT,
      ],
    });
  }

  private setupPresence(channel: RealtimeChannel): void {
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        this.updatePresenceState(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.handlePresenceJoin(key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.handlePresenceLeave(key, leftPresences);
      });
  }

  private handleMessage(channelName: string, payload: any): void {
    const message = payload.payload as RealtimeMessage;
    
    logger.debug('Message received', {
      channel: channelName,
      event: message.event,
    });

    // Emit specific event
    this.emit(message.event, message);

    // Emit generic message event
    this.emit('message', {
      channel: channelName,
      message,
    });
  }

  private handleDatabaseChange(table: string, event: string, payload: any): void {
    logger.debug('Database change', { table, event, payload });

    this.emit('database_change', {
      table,
      event,
      data: payload,
    });
  }

  private updatePresenceState(state: any): void {
    // Update local presence state
    for (const [key, presences] of Object.entries(state)) {
      const presence = (presences as any)[0];
      
      if (presence) {
        this.presence.set(key, presence);
      }
    }

    this.emit('presence_sync', Array.from(this.presence.values()));
  }

  private handlePresenceJoin(key: string, presences: any[]): void {
    const presence = presences[0];
    
    if (presence) {
      this.presence.set(key, presence);
      this.emit(RealtimeEvent.USER_JOINED, presence);
      this.emit(RealtimeEvent.USER_ONLINE, presence);
    }
  }

  private handlePresenceLeave(key: string, presences: any[]): void {
    const presence = presences[0];
    
    if (presence) {
      this.presence.delete(key);
      this.emit(RealtimeEvent.USER_LEFT, presence);
      this.emit(RealtimeEvent.USER_OFFLINE, presence);
    }
  }

  private handleConnectionError(error: any): void {
    this.emit(RealtimeEvent.ERROR, error);

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      logger.info('Attempting to reconnect', {
        attempt: this.reconnectAttempts,
        delay,
      });

      this.emit(RealtimeEvent.RECONNECTING, {
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
      });

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      logger.error('Max reconnection attempts reached');
      this.emit(RealtimeEvent.ERROR, {
        message: 'Failed to connect after maximum attempts',
        fatal: true,
      });
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      // Send heartbeat to all channels
      for (const [channelName, channel] of this.channels) {
        channel.send({
          type: 'broadcast',
          event: 'heartbeat',
          payload: { timestamp: Date.now() },
        });
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  private buildFilter(filters: Record<string, any>): string {
    return Object.entries(filters)
      .map(([key, value]) => `${key}=eq.${value}`)
      .join(',');
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public getters
  get connected(): boolean {
    return this.isConnected;
  }

  get subscribedChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  get onlineUsers(): PresenceState[] {
    return Array.from(this.presence.values())
      .filter(p => p.status === 'online');
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// Export types
export type { RealtimeMessage, PresenceState, TypingIndicator, SubscriptionOptions };
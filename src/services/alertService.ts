// Real-time AI-Powered Alert System
import { logger } from '@/lib/logger';
import { RealtimeService } from './realtimeService';
import { AIService, AIAnalysisResult } from './aiService';
import { ThreatIntelligenceService } from './threatIntelligence';
import { HapticFeedback } from '@/hooks/useMobileGestures';
import { announcer } from '@/lib/accessibility';

// Alert Types and Interfaces
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  source: AlertSource;
  data: AlertData;
  actions: AlertAction[];
  status: AlertStatus;
  userId: string;
  expiresAt?: Date;
  acknowledged?: boolean;
  acknowledgedAt?: Date;
  metadata: AlertMetadata;
}

export type AlertType = 
  | 'scam_detected'
  | 'phishing_attempt'
  | 'suspicious_call'
  | 'malicious_url'
  | 'identity_theft'
  | 'financial_fraud'
  | 'social_engineering'
  | 'malware_detected'
  | 'data_breach'
  | 'account_compromise'
  | 'location_spoofing'
  | 'anomalous_behavior';

export type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type AlertSource = 
  | 'ai_analysis'
  | 'threat_intelligence'
  | 'user_report'
  | 'automated_scan'
  | 'real_time_monitor'
  | 'third_party_feed'
  | 'behavioral_analysis';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed' | 'escalated';

export interface AlertData {
  indicator?: string;
  confidence?: number;
  threatType?: string;
  riskScore?: number;
  affectedAssets?: string[];
  geolocation?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
  timeline?: AlertTimelineEvent[];
  evidence?: Evidence[];
  relatedAlerts?: string[];
}

export interface AlertTimelineEvent {
  timestamp: Date;
  event: string;
  details: string;
  source: string;
}

export interface Evidence {
  type: 'screenshot' | 'url' | 'file' | 'metadata' | 'log_entry';
  data: any;
  description: string;
  timestamp: Date;
}

export interface AlertAction {
  id: string;
  type: ActionType;
  label: string;
  description: string;
  primary?: boolean;
  dangerous?: boolean;
  url?: string;
  handler?: string;
}

export type ActionType = 
  | 'block_contact'
  | 'report_scam'
  | 'delete_message'
  | 'change_password'
  | 'enable_2fa'
  | 'contact_bank'
  | 'file_report'
  | 'share_alert'
  | 'mark_safe'
  | 'escalate'
  | 'dismiss';

export interface AlertMetadata {
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    location?: string;
  };
  sessionInfo?: {
    sessionId?: string;
    ipAddress?: string;
    timestamp?: Date;
  };
  contextInfo?: {
    appVersion?: string;
    feature?: string;
    userAction?: string;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: AlertCondition[];
  actions: AlertRuleAction[];
  severity: AlertSeverity;
  cooldown: number; // minutes
  tags: string[];
}

export interface AlertCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'regex';
  value: any;
  weight: number;
}

export interface AlertRuleAction {
  type: 'create_alert' | 'send_notification' | 'block_contact' | 'escalate';
  parameters: Record<string, any>;
}

export interface AlertPreferences {
  userId: string;
  enabledTypes: AlertType[];
  severityThreshold: AlertSeverity;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string;   // HH:MM
  };
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  frequency: {
    immediate: boolean;
    digest: boolean;
    digestInterval: number; // minutes
  };
  locationAlerts: boolean;
  behavioralAlerts: boolean;
  thirdPartyAlerts: boolean;
}

export interface AlertStats {
  total: number;
  byType: Record<AlertType, number>;
  bySeverity: Record<AlertSeverity, number>;
  byStatus: Record<AlertStatus, number>;
  trends: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  topThreats: Array<{
    type: AlertType;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

// Default Alert Rules
const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'high_confidence_scam',
    name: 'High Confidence Scam Detection',
    description: 'Trigger alert when AI detects scam with high confidence',
    enabled: true,
    conditions: [
      { field: 'ai_confidence', operator: 'greater_than', value: 0.8, weight: 1.0 },
      { field: 'is_scam', operator: 'equals', value: true, weight: 1.0 }
    ],
    actions: [
      { type: 'create_alert', parameters: { severity: 'high' } },
      { type: 'send_notification', parameters: { immediate: true } }
    ],
    severity: 'high',
    cooldown: 5,
    tags: ['ai', 'scam_detection']
  },
  {
    id: 'suspicious_phone_call',
    name: 'Suspicious Phone Call',
    description: 'Alert on calls from known scam numbers',
    enabled: true,
    conditions: [
      { field: 'type', operator: 'equals', value: 'call', weight: 0.5 },
      { field: 'threat_score', operator: 'greater_than', value: 0.6, weight: 0.8 }
    ],
    actions: [
      { type: 'create_alert', parameters: { severity: 'medium' } },
      { type: 'block_contact', parameters: { auto: true } }
    ],
    severity: 'medium',
    cooldown: 60,
    tags: ['phone', 'suspicious_call']
  },
  {
    id: 'phishing_url_detected',
    name: 'Phishing URL Detected',
    description: 'Alert when user clicks on known phishing URL',
    enabled: true,
    conditions: [
      { field: 'type', operator: 'equals', value: 'url', weight: 0.5 },
      { field: 'threat_type', operator: 'equals', value: 'phishing', weight: 1.0 }
    ],
    actions: [
      { type: 'create_alert', parameters: { severity: 'critical' } },
      { type: 'send_notification', parameters: { immediate: true } },
      { type: 'escalate', parameters: { to: 'security_team' } }
    ],
    severity: 'critical',
    cooldown: 1,
    tags: ['phishing', 'url', 'critical']
  },
  {
    id: 'anomalous_behavior',
    name: 'Anomalous User Behavior',
    description: 'Detect unusual patterns in user behavior',
    enabled: true,
    conditions: [
      { field: 'behavior_score', operator: 'greater_than', value: 0.7, weight: 0.8 },
      { field: 'deviation', operator: 'greater_than', value: 2.0, weight: 0.6 }
    ],
    actions: [
      { type: 'create_alert', parameters: { severity: 'medium' } }
    ],
    severity: 'medium',
    cooldown: 120,
    tags: ['behavioral', 'anomaly']
  }
];

// Main Alert Service
export class AlertService {
  private alerts = new Map<string, Alert>();
  private rules = new Map<string, AlertRule>();
  private preferences = new Map<string, AlertPreferences>();
  private realtimeService: RealtimeService;
  private aiService: AIService;
  private threatIntelService: ThreatIntelligenceService;
  private alertQueue: Alert[] = [];
  private processingQueue = false;

  constructor(
    realtimeService: RealtimeService,
    aiService: AIService,
    threatIntelService: ThreatIntelligenceService
  ) {
    this.realtimeService = realtimeService;
    this.aiService = aiService;
    this.threatIntelService = threatIntelService;
    this.initializeDefaultRules();
    this.startQueueProcessor();
  }

  private initializeDefaultRules() {
    DEFAULT_ALERT_RULES.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  private startQueueProcessor() {
    setInterval(() => {
      this.processAlertQueue();
    }, 1000); // Process every second
  }

  async createAlert(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    userId: string,
    data: Partial<AlertData> = {},
    source: AlertSource = 'automated_scan'
  ): Promise<Alert> {
    const alert: Alert = {
      id: this.generateAlertId(),
      type,
      severity,
      title,
      message,
      timestamp: new Date(),
      source,
      data: {
        ...data,
        timeline: data.timeline || [{
          timestamp: new Date(),
          event: 'Alert Created',
          details: `${severity} ${type} alert created`,
          source: source
        }]
      },
      actions: this.generateAlertActions(type, severity, data),
      status: 'active',
      userId,
      metadata: this.collectMetadata(),
      expiresAt: this.calculateExpiration(severity)
    };

    // Store alert
    this.alerts.set(alert.id, alert);

    // Add to processing queue
    this.alertQueue.push(alert);

    logger.info('Alert created:', {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      userId: alert.userId
    });

    return alert;
  }

  async processAIAnalysis(analysis: AIAnalysisResult, userId: string, context?: any): Promise<Alert[]> {
    const alerts: Alert[] = [];

    if (!analysis.isScam) {
      return alerts;
    }

    // Check alert rules
    const triggeredRules = this.evaluateRules({
      ai_confidence: analysis.confidence,
      is_scam: analysis.isScam,
      risk_level: analysis.riskLevel,
      threat_types: analysis.threatTypes,
      ...context
    });

    for (const rule of triggeredRules) {
      const alert = await this.createAlert(
        this.mapThreatTypeToAlertType(analysis.threatTypes[0] || 'scam_detected'),
        rule.severity,
        this.generateAlertTitle(analysis),
        this.generateAlertMessage(analysis),
        userId,
        {
          indicator: context?.indicator,
          confidence: analysis.confidence,
          threatType: analysis.threatTypes[0],
          riskScore: this.calculateRiskScore(analysis),
          evidence: [{
            type: 'metadata',
            data: analysis,
            description: 'AI Analysis Results',
            timestamp: new Date()
          }]
        },
        'ai_analysis'
      );

      alerts.push(alert);
    }

    return alerts;
  }

  async processThreatIntelligence(indicators: string[], userId: string): Promise<Alert[]> {
    const alerts: Alert[] = [];

    try {
      const response = await this.threatIntelService.queryIndicators({
        indicators,
        includeContext: true,
        minConfidence: 0.5
      });

      for (const result of response.results) {
        if (result.status === 'malicious' || result.status === 'suspicious') {
          const severity = this.mapThreatScoreToSeverity(result.score);
          
          const alert = await this.createAlert(
            this.mapThreatResultToAlertType(result),
            severity,
            `Threat Detected: ${result.indicator}`,
            `Our threat intelligence system has identified ${result.indicator} as ${result.status}.`,
            userId,
            {
              indicator: result.indicator,
              confidence: result.score.overall,
              riskScore: result.score.overall * 100,
              evidence: result.details.map(detail => ({
                type: 'metadata' as const,
                data: detail,
                description: `Threat intelligence from ${detail.source}`,
                timestamp: detail.lastSeen
              }))
            },
            'threat_intelligence'
          );

          alerts.push(alert);
        }
      }
    } catch (error) {
      logger.error('Error processing threat intelligence:', error);
    }

    return alerts;
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    
    if (!alert || alert.userId !== userId) {
      return false;
    }

    alert.status = 'acknowledged';
    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();

    // Add timeline event
    alert.data.timeline?.push({
      timestamp: new Date(),
      event: 'Alert Acknowledged',
      details: 'User acknowledged the alert',
      source: 'user_action'
    });

    // Notify via real-time service
    await this.notifyAlertUpdate(alert);

    return true;
  }

  async resolveAlert(alertId: string, userId: string, resolution?: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    
    if (!alert || alert.userId !== userId) {
      return false;
    }

    alert.status = 'resolved';

    // Add timeline event
    alert.data.timeline?.push({
      timestamp: new Date(),
      event: 'Alert Resolved',
      details: resolution || 'Alert marked as resolved',
      source: 'user_action'
    });

    // Notify via real-time service
    await this.notifyAlertUpdate(alert);

    return true;
  }

  async dismissAlert(alertId: string, userId: string, reason?: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    
    if (!alert || alert.userId !== userId) {
      return false;
    }

    alert.status = 'dismissed';

    // Add timeline event
    alert.data.timeline?.push({
      timestamp: new Date(),
      event: 'Alert Dismissed',
      details: reason || 'Alert dismissed by user',
      source: 'user_action'
    });

    // Notify via real-time service
    await this.notifyAlertUpdate(alert);

    return true;
  }

  async executeAlertAction(alertId: string, actionId: string, userId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    
    if (!alert || alert.userId !== userId) {
      return false;
    }

    const action = alert.actions.find(a => a.id === actionId);
    if (!action) {
      return false;
    }

    try {
      await this.processAlertAction(action, alert);
      
      // Add timeline event
      alert.data.timeline?.push({
        timestamp: new Date(),
        event: 'Action Executed',
        details: `Executed action: ${action.label}`,
        source: 'user_action'
      });

      // Notify via real-time service
      await this.notifyAlertUpdate(alert);

      return true;
    } catch (error) {
      logger.error('Error executing alert action:', error);
      return false;
    }
  }

  private async processAlertAction(action: AlertAction, alert: Alert): Promise<void> {
    switch (action.type) {
      case 'block_contact':
        await this.blockContact(alert.data.indicator);
        break;
      case 'report_scam':
        await this.reportScam(alert);
        break;
      case 'delete_message':
        await this.deleteMessage(alert);
        break;
      case 'change_password':
        // Redirect user to password change
        break;
      case 'enable_2fa':
        // Redirect user to 2FA setup
        break;
      case 'contact_bank':
        // Provide bank contact information
        break;
      case 'file_report':
        await this.fileOfficialReport(alert);
        break;
      case 'escalate':
        await this.escalateAlert(alert);
        break;
      default:
        logger.warn(`Unknown action type: ${action.type}`);
    }
  }

  private async blockContact(indicator?: string): Promise<void> {
    if (!indicator) return;
    
    // Implementation would depend on the type of contact
    logger.info(`Blocking contact: ${indicator}`);
  }

  private async reportScam(alert: Alert): Promise<void> {
    // Report to internal scam database and external authorities
    logger.info(`Reporting scam: ${alert.id}`);
  }

  private async deleteMessage(alert: Alert): Promise<void> {
    // Delete the associated message/content
    logger.info(`Deleting message related to alert: ${alert.id}`);
  }

  private async fileOfficialReport(alert: Alert): Promise<void> {
    // File report with appropriate authorities
    logger.info(`Filing official report for alert: ${alert.id}`);
  }

  private async escalateAlert(alert: Alert): Promise<void> {
    alert.status = 'escalated';
    alert.severity = 'critical';
    
    // Notify security team or escalation handler
    logger.info(`Escalated alert: ${alert.id}`);
  }

  private async processAlertQueue(): Promise<void> {
    if (this.processingQueue || this.alertQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      while (this.alertQueue.length > 0) {
        const alert = this.alertQueue.shift()!;
        await this.deliverAlert(alert);
      }
    } catch (error) {
      logger.error('Error processing alert queue:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  private async deliverAlert(alert: Alert): Promise<void> {
    const preferences = this.getUserPreferences(alert.userId);
    
    // Check if alert should be delivered
    if (!this.shouldDeliverAlert(alert, preferences)) {
      return;
    }

    // Deliver via various channels
    await Promise.all([
      this.deliverInAppNotification(alert),
      this.deliverPushNotification(alert, preferences),
      this.deliverEmailNotification(alert, preferences),
      this.deliverSMSNotification(alert, preferences)
    ]);

    // Provide haptic feedback for high severity alerts
    if (alert.severity === 'high' || alert.severity === 'critical') {
      HapticFeedback.warning();
    }

    // Announce to screen readers for accessibility
    if (alert.severity === 'critical') {
      announcer.announce(`Critical security alert: ${alert.title}`, 'assertive');
    }
  }

  private async deliverInAppNotification(alert: Alert): Promise<void> {
    try {
      await this.realtimeService.send('alerts', 'new_alert', {
        alert: this.serializeAlert(alert)
      });
    } catch (error) {
      logger.error('Failed to deliver in-app notification:', error);
    }
  }

  private async deliverPushNotification(alert: Alert, preferences: AlertPreferences): Promise<void> {
    if (!preferences.channels.push) return;

    try {
      // Implementation would integrate with push notification service
      logger.info(`Push notification sent for alert: ${alert.id}`);
    } catch (error) {
      logger.error('Failed to deliver push notification:', error);
    }
  }

  private async deliverEmailNotification(alert: Alert, preferences: AlertPreferences): Promise<void> {
    if (!preferences.channels.email) return;

    try {
      // Implementation would integrate with email service
      logger.info(`Email notification sent for alert: ${alert.id}`);
    } catch (error) {
      logger.error('Failed to deliver email notification:', error);
    }
  }

  private async deliverSMSNotification(alert: Alert, preferences: AlertPreferences): Promise<void> {
    if (!preferences.channels.sms || alert.severity !== 'critical') return;

    try {
      // Implementation would integrate with SMS service
      logger.info(`SMS notification sent for alert: ${alert.id}`);
    } catch (error) {
      logger.error('Failed to deliver SMS notification:', error);
    }
  }

  private shouldDeliverAlert(alert: Alert, preferences: AlertPreferences): boolean {
    // Check if alert type is enabled
    if (!preferences.enabledTypes.includes(alert.type)) {
      return false;
    }

    // Check severity threshold
    const severityLevels = ['info', 'low', 'medium', 'high', 'critical'];
    const alertLevel = severityLevels.indexOf(alert.severity);
    const thresholdLevel = severityLevels.indexOf(preferences.severityThreshold);
    
    if (alertLevel < thresholdLevel) {
      return false;
    }

    // Check quiet hours
    if (preferences.quietHours.enabled && this.isInQuietHours(preferences.quietHours)) {
      // Only deliver critical alerts during quiet hours
      return alert.severity === 'critical';
    }

    return true;
  }

  private isInQuietHours(quietHours: { start: string; end: string }): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours cross midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private async notifyAlertUpdate(alert: Alert): Promise<void> {
    try {
      await this.realtimeService.send('alerts', 'alert_updated', {
        alert: this.serializeAlert(alert)
      });
    } catch (error) {
      logger.error('Failed to notify alert update:', error);
    }
  }

  // Helper methods
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertActions(type: AlertType, severity: AlertSeverity, data: Partial<AlertData>): AlertAction[] {
    const actions: AlertAction[] = [
      {
        id: 'acknowledge',
        type: 'mark_safe',
        label: 'Acknowledge',
        description: 'Mark this alert as acknowledged'
      },
      {
        id: 'dismiss',
        type: 'dismiss',
        label: 'Dismiss',
        description: 'Dismiss this alert'
      }
    ];

    // Add type-specific actions
    switch (type) {
      case 'scam_detected':
      case 'phishing_attempt':
        actions.push(
          {
            id: 'block',
            type: 'block_contact',
            label: 'Block Contact',
            description: 'Block this contact',
            dangerous: true
          },
          {
            id: 'report',
            type: 'report_scam',
            label: 'Report Scam',
            description: 'Report this as a scam'
          }
        );
        break;
        
      case 'account_compromise':
        actions.push(
          {
            id: 'change_password',
            type: 'change_password',
            label: 'Change Password',
            description: 'Change your password immediately',
            primary: true
          },
          {
            id: 'enable_2fa',
            type: 'enable_2fa',
            label: 'Enable 2FA',
            description: 'Set up two-factor authentication'
          }
        );
        break;
    }

    if (severity === 'high' || severity === 'critical') {
      actions.push({
        id: 'escalate',
        type: 'escalate',
        label: 'Escalate',
        description: 'Escalate to security team',
        dangerous: true
      });
    }

    return actions;
  }

  private evaluateRules(data: any): AlertRule[] {
    const triggeredRules: AlertRule[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      let totalScore = 0;
      let totalWeight = 0;

      for (const condition of rule.conditions) {
        if (this.evaluateCondition(condition, data)) {
          totalScore += condition.weight;
        }
        totalWeight += condition.weight;
      }

      // Rule triggers if score is above threshold (e.g., 70%)
      if (totalScore / totalWeight >= 0.7) {
        triggeredRules.push(rule);
      }
    }

    return triggeredRules;
  }

  private evaluateCondition(condition: AlertCondition, data: any): boolean {
    const fieldValue = this.getNestedValue(data, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'contains':
        return Array.isArray(fieldValue) 
          ? fieldValue.includes(condition.value)
          : String(fieldValue).includes(String(condition.value));
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'regex':
        return new RegExp(condition.value).test(String(fieldValue));
      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private mapThreatTypeToAlertType(threatType: string): AlertType {
    const mapping: Record<string, AlertType> = {
      'phishing': 'phishing_attempt',
      'romance_scam': 'social_engineering',
      'investment_fraud': 'financial_fraud',
      'tech_support_scam': 'scam_detected',
      'identity_theft': 'identity_theft',
      'malware': 'malware_detected'
    };

    return mapping[threatType] || 'scam_detected';
  }

  private mapThreatResultToAlertType(result: any): AlertType {
    if (result.type === 'url' && result.status === 'malicious') {
      return 'malicious_url';
    }
    
    return 'scam_detected';
  }

  private mapThreatScoreToSeverity(score: any): AlertSeverity {
    const overall = score.overall || 0;
    
    if (overall > 0.8) return 'critical';
    if (overall > 0.6) return 'high';
    if (overall > 0.4) return 'medium';
    return 'low';
  }

  private generateAlertTitle(analysis: AIAnalysisResult): string {
    const confidence = Math.round(analysis.confidence * 100);
    return `Potential Scam Detected (${confidence}% confidence)`;
  }

  private generateAlertMessage(analysis: AIAnalysisResult): string {
    return analysis.reasoning || 'Our AI system has detected potentially fraudulent content.';
  }

  private calculateRiskScore(analysis: AIAnalysisResult): number {
    return Math.round(analysis.confidence * 100);
  }

  private calculateExpiration(severity: AlertSeverity): Date {
    const hours = {
      'info': 24,
      'low': 48,
      'medium': 72,
      'high': 168, // 1 week
      'critical': 720 // 30 days
    }[severity];

    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  private collectMetadata(): AlertMetadata {
    return {
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform
      },
      contextInfo: {
        appVersion: process.env.REACT_APP_VERSION || '1.0.0'
      }
    };
  }

  private getUserPreferences(userId: string): AlertPreferences {
    return this.preferences.get(userId) || this.getDefaultPreferences(userId);
  }

  private getDefaultPreferences(userId: string): AlertPreferences {
    return {
      userId,
      enabledTypes: [
        'scam_detected', 'phishing_attempt', 'suspicious_call',
        'malicious_url', 'identity_theft', 'financial_fraud'
      ],
      severityThreshold: 'low',
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      },
      channels: {
        push: true,
        email: true,
        sms: false,
        inApp: true
      },
      frequency: {
        immediate: true,
        digest: false,
        digestInterval: 60
      },
      locationAlerts: true,
      behavioralAlerts: true,
      thirdPartyAlerts: true
    };
  }

  private serializeAlert(alert: Alert): any {
    return {
      ...alert,
      timestamp: alert.timestamp.toISOString(),
      expiresAt: alert.expiresAt?.toISOString(),
      acknowledgedAt: alert.acknowledgedAt?.toISOString()
    };
  }

  // Public API methods
  getUserAlerts(userId: string, status?: AlertStatus): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.userId === userId)
      .filter(alert => !status || alert.status === status)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getAlertStats(userId: string): AlertStats {
    const userAlerts = this.getUserAlerts(userId);
    
    return {
      total: userAlerts.length,
      byType: this.groupByField(userAlerts, 'type'),
      bySeverity: this.groupByField(userAlerts, 'severity'),
      byStatus: this.groupByField(userAlerts, 'status'),
      trends: this.calculateTrends(userAlerts),
      topThreats: this.calculateTopThreats(userAlerts)
    };
  }

  private groupByField(alerts: Alert[], field: keyof Alert): any {
    return alerts.reduce((acc, alert) => {
      const key = alert[field] as string;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateTrends(alerts: Alert[]): AlertStats['trends'] {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    return {
      last24h: alerts.filter(a => now - a.timestamp.getTime() < day).length,
      last7d: alerts.filter(a => now - a.timestamp.getTime() < 7 * day).length,
      last30d: alerts.filter(a => now - a.timestamp.getTime() < 30 * day).length
    };
  }

  private calculateTopThreats(alerts: Alert[]): AlertStats['topThreats'] {
    const typeCounts = this.groupByField(alerts, 'type');
    
    return Object.entries(typeCounts)
      .map(([type, count]) => ({
        type: type as AlertType,
        count,
        trend: 'stable' as const // Simplified for now
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  updateUserPreferences(userId: string, preferences: Partial<AlertPreferences>): void {
    const current = this.getUserPreferences(userId);
    this.preferences.set(userId, { ...current, ...preferences });
  }

  cleanup(): void {
    // Cleanup expired alerts
    const now = Date.now();
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.expiresAt && alert.expiresAt.getTime() < now) {
        this.alerts.delete(id);
      }
    }
  }
}

export default AlertService;
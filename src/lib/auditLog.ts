// Comprehensive Audit Logging System for Compliance
import { logger } from './logger';

// Audit Event Types
export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  actor: {
    userId?: string;
    userEmail?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    role?: string;
  };
  resource: {
    type: ResourceType;
    id?: string;
    name?: string;
    path?: string;
  };
  action: AuditAction;
  details: Record<string, any>;
  outcome: 'success' | 'failure' | 'partial';
  risk: RiskLevel;
  compliance: {
    gdpr?: boolean;
    hipaa?: boolean;
    sox?: boolean;
    pci?: boolean;
    iso27001?: boolean;
  };
  metadata: {
    requestId?: string;
    correlationId?: string;
    source: string;
    version: string;
    environment: string;
  };
}

export type AuditEventType = 
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'data_deletion'
  | 'data_export'
  | 'configuration_change'
  | 'security_event'
  | 'privacy_event'
  | 'compliance_event'
  | 'system_event'
  | 'user_management'
  | 'api_access'
  | 'file_access'
  | 'payment_transaction';

export type AuditSeverity = 
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'informational';

export type ResourceType =
  | 'user_account'
  | 'personal_data'
  | 'payment_data'
  | 'system_config'
  | 'security_policy'
  | 'api_endpoint'
  | 'database'
  | 'file_system'
  | 'encryption_key'
  | 'audit_log'
  | 'backup'
  | 'application';

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'access_granted'
  | 'access_denied'
  | 'permission_changed'
  | 'password_changed'
  | 'account_locked'
  | 'account_unlocked'
  | 'data_exported'
  | 'data_imported'
  | 'backup_created'
  | 'backup_restored'
  | 'config_modified'
  | 'policy_updated'
  | 'alert_generated'
  | 'incident_created'
  | 'vulnerability_detected'
  | 'breach_reported';

export type RiskLevel = 'very_high' | 'high' | 'medium' | 'low' | 'minimal';

export interface AuditQuery {
  eventTypes?: AuditEventType[];
  severities?: AuditSeverity[];
  actors?: string[];
  resources?: { type: ResourceType; id?: string }[];
  actions?: AuditAction[];
  outcomes?: ('success' | 'failure' | 'partial')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  riskLevels?: RiskLevel[];
  limit?: number;
  offset?: number;
}

export interface AuditReport {
  id: string;
  title: string;
  description: string;
  generatedAt: Date;
  generatedBy: string;
  period: {
    start: Date;
    end: Date;
  };
  filters: AuditQuery;
  events: AuditEvent[];
  statistics: {
    totalEvents: number;
    eventsByType: Record<AuditEventType, number>;
    eventsBySeverity: Record<AuditSeverity, number>;
    eventsByOutcome: Record<string, number>;
    eventsByRisk: Record<RiskLevel, number>;
    topActors: Array<{ actor: string; count: number }>;
    topResources: Array<{ resource: string; count: number }>;
    complianceBreaches: number;
    securityIncidents: number;
  };
  recommendations: string[];
}

export interface ComplianceMetrics {
  gdprCompliance: {
    dataSubjectRequests: number;
    consentRecords: number;
    breachNotifications: number;
    retentionViolations: number;
    score: number; // 0-100
  };
  securityPosture: {
    failedLogins: number;
    unauthorizedAccess: number;
    privilegeEscalations: number;
    dataExfiltration: number;
    score: number; // 0-100
  };
  operationalRisk: {
    configChanges: number;
    systemErrors: number;
    performanceIssues: number;
    availabilityBreaches: number;
    score: number; // 0-100
  };
}

// Audit Logger Implementation
export class AuditLogger {
  private events: AuditEvent[] = [];
  private maxEvents: number = 100000; // Keep last 100k events in memory
  private environment: string;
  private version: string;

  constructor(environment: string = 'development', version: string = '1.0.0') {
    this.environment = environment;
    this.version = version;
    this.startAutomaticCleanup();
  }

  // Log audit events
  async logEvent(
    eventType: AuditEventType,
    action: AuditAction,
    actor: AuditEvent['actor'],
    resource: AuditEvent['resource'],
    outcome: AuditEvent['outcome'],
    details: Record<string, any> = {},
    options: {
      severity?: AuditSeverity;
      risk?: RiskLevel;
      requestId?: string;
      correlationId?: string;
    } = {}
  ): Promise<string> {
    
    const eventId = this.generateEventId();
    const timestamp = new Date();

    const auditEvent: AuditEvent = {
      id: eventId,
      timestamp,
      eventType,
      severity: options.severity || this.calculateSeverity(eventType, action, outcome),
      actor,
      resource,
      action,
      details,
      outcome,
      risk: options.risk || this.assessRisk(eventType, action, outcome, details),
      compliance: this.checkComplianceRequirements(eventType, action, details),
      metadata: {
        requestId: options.requestId,
        correlationId: options.correlationId,
        source: 'audit_logger',
        version: this.version,
        environment: this.environment
      }
    };

    // Store event
    this.events.push(auditEvent);
    
    // Maintain memory limit
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to system logger based on severity
    const logMethod = this.getLogMethod(auditEvent.severity);
    logMethod('Audit event recorded', {
      eventId,
      eventType,
      action,
      outcome,
      actor: actor.userId || actor.userEmail || 'anonymous',
      resource: resource.name || resource.id || resource.type
    });

    // Handle critical events immediately
    if (auditEvent.severity === 'critical' || auditEvent.risk === 'very_high') {
      await this.handleCriticalEvent(auditEvent);
    }

    // Check for compliance violations
    await this.checkComplianceViolations(auditEvent);

    return eventId;
  }

  // Convenience methods for common audit events
  async logAuthentication(
    userId: string,
    action: 'login' | 'logout' | 'failed_login',
    details: Record<string, any> = {}
  ): Promise<string> {
    return this.logEvent(
      'authentication',
      action === 'failed_login' ? 'access_denied' : action,
      { userId, ...this.getActorContext() },
      { type: 'user_account', id: userId },
      action === 'failed_login' ? 'failure' : 'success',
      details,
      { severity: action === 'failed_login' ? 'medium' : 'informational' }
    );
  }

  async logDataAccess(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    action: 'read' | 'create' | 'update' | 'delete',
    outcome: 'success' | 'failure' | 'partial',
    details: Record<string, any> = {}
  ): Promise<string> {
    return this.logEvent(
      'data_access',
      action,
      { userId, ...this.getActorContext() },
      { type: resourceType, id: resourceId },
      outcome,
      details,
      {
        severity: outcome === 'failure' ? 'medium' : 'low',
        risk: resourceType === 'personal_data' ? 'high' : 'medium'
      }
    );
  }

  async logSecurityEvent(
    eventType: 'breach_attempt' | 'vulnerability' | 'malicious_activity',
    details: Record<string, any> = {}
  ): Promise<string> {
    return this.logEvent(
      'security_event',
      'alert_generated',
      this.getActorContext(),
      { type: 'application' },
      'success',
      { ...details, eventType },
      { severity: 'critical', risk: 'very_high' }
    );
  }

  async logComplianceEvent(
    complianceType: 'gdpr' | 'hipaa' | 'sox' | 'pci',
    action: AuditAction,
    outcome: 'success' | 'failure' | 'partial',
    details: Record<string, any> = {}
  ): Promise<string> {
    return this.logEvent(
      'compliance_event',
      action,
      this.getActorContext(),
      { type: 'system_config' },
      outcome,
      { ...details, complianceType },
      { 
        severity: outcome === 'failure' ? 'high' : 'medium',
        risk: outcome === 'failure' ? 'high' : 'low'
      }
    );
  }

  // Query audit events
  queryEvents(query: AuditQuery): AuditEvent[] {
    let filteredEvents = [...this.events];

    // Apply filters
    if (query.eventTypes?.length) {
      filteredEvents = filteredEvents.filter(e => 
        query.eventTypes!.includes(e.eventType)
      );
    }

    if (query.severities?.length) {
      filteredEvents = filteredEvents.filter(e => 
        query.severities!.includes(e.severity)
      );
    }

    if (query.actors?.length) {
      filteredEvents = filteredEvents.filter(e => 
        query.actors!.some(actor => 
          e.actor.userId === actor || e.actor.userEmail === actor
        )
      );
    }

    if (query.resources?.length) {
      filteredEvents = filteredEvents.filter(e => 
        query.resources!.some(resource => 
          e.resource.type === resource.type && 
          (!resource.id || e.resource.id === resource.id)
        )
      );
    }

    if (query.actions?.length) {
      filteredEvents = filteredEvents.filter(e => 
        query.actions!.includes(e.action)
      );
    }

    if (query.outcomes?.length) {
      filteredEvents = filteredEvents.filter(e => 
        query.outcomes!.includes(e.outcome)
      );
    }

    if (query.dateRange) {
      filteredEvents = filteredEvents.filter(e => 
        e.timestamp >= query.dateRange!.start && 
        e.timestamp <= query.dateRange!.end
      );
    }

    if (query.riskLevels?.length) {
      filteredEvents = filteredEvents.filter(e => 
        query.riskLevels!.includes(e.risk)
      );
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    
    return filteredEvents.slice(offset, offset + limit);
  }

  // Generate audit reports
  async generateReport(
    title: string,
    description: string,
    query: AuditQuery,
    generatedBy: string
  ): Promise<AuditReport> {
    const events = this.queryEvents(query);
    const reportId = this.generateReportId();

    const statistics = this.calculateStatistics(events);
    const recommendations = this.generateRecommendations(events, statistics);

    return {
      id: reportId,
      title,
      description,
      generatedAt: new Date(),
      generatedBy,
      period: query.dateRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date()
      },
      filters: query,
      events,
      statistics,
      recommendations
    };
  }

  // Calculate compliance metrics
  getComplianceMetrics(period?: { start: Date; end: Date }): ComplianceMetrics {
    const events = period ? 
      this.events.filter(e => e.timestamp >= period.start && e.timestamp <= period.end) :
      this.events;

    return {
      gdprCompliance: this.calculateGDPRMetrics(events),
      securityPosture: this.calculateSecurityMetrics(events),
      operationalRisk: this.calculateOperationalMetrics(events)
    };
  }

  // Export audit logs
  exportLogs(format: 'json' | 'csv' | 'xml', query?: AuditQuery): string {
    const events = query ? this.queryEvents(query) : this.events;

    switch (format) {
      case 'json':
        return JSON.stringify(events, null, 2);
      case 'csv':
        return this.convertToCSV(events);
      case 'xml':
        return this.convertToXML(events);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Private helper methods
  private calculateSeverity(
    eventType: AuditEventType,
    action: AuditAction,
    outcome: 'success' | 'failure' | 'partial'
  ): AuditSeverity {
    // Base severity on event type
    const baseSeverity: Record<AuditEventType, AuditSeverity> = {
      authentication: 'low',
      authorization: 'medium',
      data_access: 'low',
      data_modification: 'medium',
      data_deletion: 'high',
      data_export: 'high',
      configuration_change: 'medium',
      security_event: 'critical',
      privacy_event: 'high',
      compliance_event: 'high',
      system_event: 'low',
      user_management: 'medium',
      api_access: 'low',
      file_access: 'low',
      payment_transaction: 'medium'
    };

    let severity = baseSeverity[eventType];

    // Increase severity for failures
    if (outcome === 'failure') {
      const severityOrder: AuditSeverity[] = ['informational', 'low', 'medium', 'high', 'critical'];
      const currentIndex = severityOrder.indexOf(severity);
      if (currentIndex < severityOrder.length - 1) {
        severity = severityOrder[currentIndex + 1];
      }
    }

    return severity;
  }

  private assessRisk(
    eventType: AuditEventType,
    action: AuditAction,
    outcome: 'success' | 'failure' | 'partial',
    details: Record<string, any>
  ): RiskLevel {
    let riskScore = 1; // Base risk

    // Risk factors
    const riskFactors: Record<AuditEventType, number> = {
      authentication: 1,
      authorization: 2,
      data_access: 2,
      data_modification: 3,
      data_deletion: 4,
      data_export: 4,
      configuration_change: 3,
      security_event: 5,
      privacy_event: 4,
      compliance_event: 4,
      system_event: 1,
      user_management: 3,
      api_access: 2,
      file_access: 2,
      payment_transaction: 3
    };

    riskScore *= riskFactors[eventType];

    // Increase risk for failures
    if (outcome === 'failure') {
      riskScore *= 1.5;
    }

    // Check for sensitive data
    if (details.dataTypes?.includes('personal_data') || 
        details.dataTypes?.includes('payment_data')) {
      riskScore *= 1.3;
    }

    // Convert score to risk level
    if (riskScore >= 15) return 'very_high';
    if (riskScore >= 10) return 'high';
    if (riskScore >= 6) return 'medium';
    if (riskScore >= 3) return 'low';
    return 'minimal';
  }

  private checkComplianceRequirements(
    eventType: AuditEventType,
    action: AuditAction,
    details: Record<string, any>
  ): AuditEvent['compliance'] {
    return {
      gdpr: this.isGDPRRelevant(eventType, action, details),
      hipaa: this.isHIPAARelevant(eventType, action, details),
      sox: this.isSOXRelevant(eventType, action, details),
      pci: this.isPCIRelevant(eventType, action, details),
      iso27001: this.isISO27001Relevant(eventType, action, details)
    };
  }

  private isGDPRRelevant(eventType: AuditEventType, action: AuditAction, details: Record<string, any>): boolean {
    return eventType === 'privacy_event' || 
           eventType === 'data_access' || 
           eventType === 'data_modification' || 
           eventType === 'data_deletion' ||
           details.dataTypes?.includes('personal_data');
  }

  private isHIPAARelevant(eventType: AuditEventType, action: AuditAction, details: Record<string, any>): boolean {
    return details.dataTypes?.includes('health_data') || 
           details.phi === true;
  }

  private isSOXRelevant(eventType: AuditEventType, action: AuditAction, details: Record<string, any>): boolean {
    return eventType === 'payment_transaction' || 
           details.financialData === true;
  }

  private isPCIRelevant(eventType: AuditEventType, action: AuditAction, details: Record<string, any>): boolean {
    return eventType === 'payment_transaction' || 
           details.dataTypes?.includes('payment_data') ||
           details.creditCardData === true;
  }

  private isISO27001Relevant(eventType: AuditEventType, action: AuditAction, details: Record<string, any>): boolean {
    return eventType === 'security_event' || 
           eventType === 'configuration_change' ||
           eventType === 'authorization';
  }

  private getActorContext(): Omit<AuditEvent['actor'], 'userId' | 'userEmail'> {
    return {
      sessionId: sessionStorage.getItem('sessionId') || undefined,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      role: localStorage.getItem('userRole') || undefined
    };
  }

  private getClientIP(): string | undefined {
    // In a real application, this would be passed from the server
    return undefined;
  }

  private getLogMethod(severity: AuditSeverity) {
    switch (severity) {
      case 'critical':
        return logger.error;
      case 'high':
        return logger.error;
      case 'medium':
        return logger.warn;
      case 'low':
        return logger.info;
      case 'informational':
        return logger.debug;
      default:
        return logger.info;
    }
  }

  private async handleCriticalEvent(event: AuditEvent) {
    // Send immediate alerts for critical events
    logger.error('CRITICAL AUDIT EVENT', {
      eventId: event.id,
      eventType: event.eventType,
      action: event.action,
      risk: event.risk,
      details: event.details
    });

    // In production, integrate with alerting systems
    // await this.sendAlert(event);
  }

  private async checkComplianceViolations(event: AuditEvent) {
    const violations = [];

    // Check GDPR violations
    if (event.compliance.gdpr && event.outcome === 'failure') {
      violations.push('GDPR compliance violation detected');
    }

    // Check retention violations
    if (event.action === 'delete' && event.outcome === 'failure') {
      violations.push('Data retention policy violation');
    }

    if (violations.length > 0) {
      await this.logEvent(
        'compliance_event',
        'alert_generated',
        event.actor,
        { type: 'system_config' },
        'success',
        { violations, originalEvent: event.id },
        { severity: 'high', risk: 'high' }
      );
    }
  }

  private calculateStatistics(events: AuditEvent[]): AuditReport['statistics'] {
    const stats: AuditReport['statistics'] = {
      totalEvents: events.length,
      eventsByType: {} as Record<AuditEventType, number>,
      eventsBySeverity: {} as Record<AuditSeverity, number>,
      eventsByOutcome: { success: 0, failure: 0, partial: 0 },
      eventsByRisk: {} as Record<RiskLevel, number>,
      topActors: [],
      topResources: [],
      complianceBreaches: 0,
      securityIncidents: 0
    };

    // Count by type
    events.forEach(event => {
      stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;
      stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1;
      stats.eventsByOutcome[event.outcome]++;
      stats.eventsByRisk[event.risk] = (stats.eventsByRisk[event.risk] || 0) + 1;

      if (event.eventType === 'compliance_event') {
        stats.complianceBreaches++;
      }
      if (event.eventType === 'security_event') {
        stats.securityIncidents++;
      }
    });

    // Top actors
    const actorCounts = new Map<string, number>();
    events.forEach(event => {
      const actor = event.actor.userId || event.actor.userEmail || 'anonymous';
      actorCounts.set(actor, (actorCounts.get(actor) || 0) + 1);
    });
    stats.topActors = Array.from(actorCounts.entries())
      .map(([actor, count]) => ({ actor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top resources
    const resourceCounts = new Map<string, number>();
    events.forEach(event => {
      const resource = `${event.resource.type}:${event.resource.id || event.resource.name || 'unknown'}`;
      resourceCounts.set(resource, (resourceCounts.get(resource) || 0) + 1);
    });
    stats.topResources = Array.from(resourceCounts.entries())
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  private generateRecommendations(events: AuditEvent[], stats: AuditReport['statistics']): string[] {
    const recommendations: string[] = [];

    // Security recommendations
    if (stats.securityIncidents > 10) {
      recommendations.push('High number of security incidents detected. Review security policies and monitoring.');
    }

    if (stats.eventsByOutcome.failure / stats.totalEvents > 0.1) {
      recommendations.push('High failure rate detected. Review authentication and authorization mechanisms.');
    }

    // Compliance recommendations
    if (stats.complianceBreaches > 0) {
      recommendations.push('Compliance violations detected. Conduct compliance audit and update procedures.');
    }

    // Access control recommendations
    const topActor = stats.topActors[0];
    if (topActor && topActor.count / stats.totalEvents > 0.3) {
      recommendations.push(`Single user (${topActor.actor}) responsible for ${((topActor.count / stats.totalEvents) * 100).toFixed(1)}% of activities. Review access controls.`);
    }

    return recommendations;
  }

  private calculateGDPRMetrics(events: AuditEvent[]): ComplianceMetrics['gdprCompliance'] {
    const gdprEvents = events.filter(e => e.compliance.gdpr);
    
    return {
      dataSubjectRequests: gdprEvents.filter(e => 
        e.eventType === 'privacy_event' && e.action === 'read'
      ).length,
      consentRecords: gdprEvents.filter(e => 
        e.details.consentType
      ).length,
      breachNotifications: gdprEvents.filter(e => 
        e.eventType === 'security_event' && e.severity === 'critical'
      ).length,
      retentionViolations: gdprEvents.filter(e => 
        e.outcome === 'failure' && e.action === 'delete'
      ).length,
      score: Math.max(0, 100 - (gdprEvents.filter(e => e.outcome === 'failure').length * 5))
    };
  }

  private calculateSecurityMetrics(events: AuditEvent[]): ComplianceMetrics['securityPosture'] {
    return {
      failedLogins: events.filter(e => 
        e.eventType === 'authentication' && e.outcome === 'failure'
      ).length,
      unauthorizedAccess: events.filter(e => 
        e.eventType === 'authorization' && e.outcome === 'failure'
      ).length,
      privilegeEscalations: events.filter(e => 
        e.action === 'permission_changed' && e.risk === 'high'
      ).length,
      dataExfiltration: events.filter(e => 
        e.eventType === 'data_export' && e.risk === 'very_high'
      ).length,
      score: Math.max(0, 100 - (events.filter(e => 
        e.eventType === 'security_event' && e.severity === 'critical'
      ).length * 10))
    };
  }

  private calculateOperationalMetrics(events: AuditEvent[]): ComplianceMetrics['operationalRisk'] {
    return {
      configChanges: events.filter(e => 
        e.eventType === 'configuration_change'
      ).length,
      systemErrors: events.filter(e => 
        e.eventType === 'system_event' && e.outcome === 'failure'
      ).length,
      performanceIssues: events.filter(e => 
        e.details.performanceImpact === true
      ).length,
      availabilityBreaches: events.filter(e => 
        e.details.availability === false
      ).length,
      score: Math.max(0, 100 - (events.filter(e => 
        e.outcome === 'failure' && e.severity === 'high'
      ).length * 5))
    };
  }

  private convertToCSV(events: AuditEvent[]): string {
    const headers = [
      'ID', 'Timestamp', 'Event Type', 'Action', 'Actor', 'Resource', 
      'Outcome', 'Severity', 'Risk', 'Details'
    ];

    const rows = events.map(event => [
      event.id,
      event.timestamp.toISOString(),
      event.eventType,
      event.action,
      event.actor.userId || event.actor.userEmail || 'anonymous',
      `${event.resource.type}:${event.resource.id || event.resource.name || ''}`,
      event.outcome,
      event.severity,
      event.risk,
      JSON.stringify(event.details)
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  private convertToXML(events: AuditEvent[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<auditLog>\n';
    
    events.forEach(event => {
      xml += '  <event>\n';
      xml += `    <id>${event.id}</id>\n`;
      xml += `    <timestamp>${event.timestamp.toISOString()}</timestamp>\n`;
      xml += `    <eventType>${event.eventType}</eventType>\n`;
      xml += `    <action>${event.action}</action>\n`;
      xml += `    <outcome>${event.outcome}</outcome>\n`;
      xml += `    <severity>${event.severity}</severity>\n`;
      xml += `    <risk>${event.risk}</risk>\n`;
      xml += '  </event>\n';
    });
    
    xml += '</auditLog>';
    return xml;
  }

  private startAutomaticCleanup() {
    // Clean up old events every hour
    setInterval(() => {
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
      const initialCount = this.events.length;
      this.events = this.events.filter(event => event.timestamp > cutoffDate);
      
      if (initialCount > this.events.length) {
        logger.info('Audit log cleanup completed', {
          removed: initialCount - this.events.length,
          remaining: this.events.length
        });
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup method
  cleanup() {
    // Export critical events before cleanup
    const criticalEvents = this.events.filter(e => 
      e.severity === 'critical' || e.risk === 'very_high'
    );
    
    if (criticalEvents.length > 0) {
      logger.warn('Critical audit events present during cleanup', {
        count: criticalEvents.length,
        events: criticalEvents.map(e => ({
          id: e.id,
          eventType: e.eventType,
          timestamp: e.timestamp
        }))
      });
    }
    
    this.events = [];
  }

  // Get summary statistics
  getStats() {
    return {
      totalEvents: this.events.length,
      oldestEvent: this.events[0]?.timestamp,
      newestEvent: this.events[this.events.length - 1]?.timestamp,
      criticalEvents: this.events.filter(e => e.severity === 'critical').length,
      failedEvents: this.events.filter(e => e.outcome === 'failure').length,
      complianceEvents: this.events.filter(e => 
        Object.values(e.compliance).some(Boolean)
      ).length
    };
  }
}

// Create singleton instance
export const auditLogger = new AuditLogger(
  import.meta?.env?.MODE || 'development',
  import.meta?.env?.VITE_APP_VERSION || '1.0.0'
);

export default auditLogger;
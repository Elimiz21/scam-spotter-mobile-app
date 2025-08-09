// GDPR Compliance and Data Protection Library
import { logger } from './logger';

// GDPR Data Types and Interfaces
export interface PersonalData {
  id: string;
  userId: string;
  dataType: DataType;
  data: any;
  source: DataSource;
  purposes: ProcessingPurpose[];
  legalBasis: LegalBasis;
  collectedAt: Date;
  lastAccessed?: Date;
  retentionPeriod: number; // in days
  encrypted: boolean;
  anonymized: boolean;
  deleted: boolean;
  deletedAt?: Date;
  consentId?: string;
}

export type DataType = 
  | 'identity'      // Name, address, ID numbers
  | 'contact'       // Email, phone, social media
  | 'demographic'   // Age, gender, location
  | 'financial'     // Payment info, transaction history
  | 'technical'     // IP address, device info, cookies
  | 'behavioral'    // Usage patterns, preferences
  | 'biometric'     // Fingerprints, voice patterns
  | 'health'        // Medical records, health status
  | 'criminal'      // Criminal convictions, offences
  | 'sensitive';    // Race, religion, political views

export type DataSource = 
  | 'user_input'
  | 'automatic_collection'
  | 'third_party'
  | 'public_records'
  | 'social_media'
  | 'cookies'
  | 'analytics'
  | 'surveys';

export type ProcessingPurpose = 
  | 'service_provision'
  | 'fraud_detection'
  | 'marketing'
  | 'analytics'
  | 'security'
  | 'legal_compliance'
  | 'research'
  | 'personalization';

export type LegalBasis = 
  | 'consent'
  | 'contract'
  | 'legal_obligation'
  | 'vital_interests'
  | 'public_task'
  | 'legitimate_interest';

export interface ConsentRecord {
  id: string;
  userId: string;
  purposes: ProcessingPurpose[];
  dataTypes: DataType[];
  consentDate: Date;
  expiryDate?: Date;
  withdrawnDate?: Date;
  isActive: boolean;
  consentMethod: 'explicit' | 'implied' | 'opt_in' | 'opt_out';
  consentText: string;
  ipAddress: string;
  userAgent: string;
  version: string; // Consent form version
}

export interface DataSubjectRight {
  id: string;
  userId: string;
  requestType: RightType;
  status: RequestStatus;
  requestDate: Date;
  completedDate?: Date;
  requestDetails: string;
  responseData?: any;
  verificationMethod: string;
  processedBy?: string;
  notes?: string;
}

export type RightType = 
  | 'access'           // Right to access personal data
  | 'rectification'    // Right to correct inaccurate data
  | 'erasure'          // Right to deletion (right to be forgotten)
  | 'restrict'         // Right to restrict processing
  | 'portability'      // Right to data portability
  | 'object'           // Right to object to processing
  | 'automated_decision'; // Right not to be subject to automated decision-making

export type RequestStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'partially_completed';

export interface DataBreachIncident {
  id: string;
  incidentDate: Date;
  discoveredDate: Date;
  reportedDate?: Date;
  affectedUsers: string[];
  dataTypes: DataType[];
  breachType: BreachType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  cause: string;
  containmentMeasures: string[];
  notificationRequired: boolean;
  supervisoryAuthorityNotified: boolean;
  dataSubjectsNotified: boolean;
  status: 'open' | 'investigating' | 'contained' | 'resolved';
  investigationNotes?: string;
}

export type BreachType = 
  | 'confidentiality'  // Unauthorized access/disclosure
  | 'integrity'        // Unauthorized alteration
  | 'availability';    // Accidental/unlawful destruction

// GDPR Compliance Manager
export class GDPRManager {
  private personalDataStore: Map<string, PersonalData[]>;
  private consentRecords: Map<string, ConsentRecord[]>;
  private dataSubjectRequests: DataSubjectRight[] = [];
  private breachIncidents: DataBreachIncident[] = [];
  private retentionPolicies: Map<DataType, number>;

  constructor() {
    // Initialize Maps in constructor to avoid module-level execution
    this.personalDataStore = new Map();
    this.consentRecords = new Map();
    this.retentionPolicies = new Map();
    this.initializeRetentionPolicies();
    this.startRetentionScheduler();
    this.setupBreachMonitoring();
  }

  private initializeRetentionPolicies() {
    // Set default retention periods (in days)
    this.retentionPolicies.set('identity', 2555); // 7 years
    this.retentionPolicies.set('contact', 1095);  // 3 years
    this.retentionPolicies.set('demographic', 730); // 2 years
    this.retentionPolicies.set('financial', 2555); // 7 years (regulatory requirement)
    this.retentionPolicies.set('technical', 90);   // 3 months
    this.retentionPolicies.set('behavioral', 365); // 1 year
    this.retentionPolicies.set('biometric', 30);   // 30 days (unless consent)
    this.retentionPolicies.set('health', 2555);    // 7 years
    this.retentionPolicies.set('criminal', 3650);  // 10 years
    this.retentionPolicies.set('sensitive', 365);  // 1 year
  }

  // Data Collection and Storage
  async collectPersonalData(
    userId: string,
    dataType: DataType,
    data: any,
    source: DataSource,
    purposes: ProcessingPurpose[],
    legalBasis: LegalBasis,
    consentId?: string
  ): Promise<PersonalData> {
    // Validate legal basis
    if (legalBasis === 'consent' && !consentId) {
      throw new Error('Consent ID required when legal basis is consent');
    }

    // Check if we have valid consent for this purpose
    if (legalBasis === 'consent') {
      const hasValidConsent = await this.validateConsent(userId, purposes, dataType);
      if (!hasValidConsent) {
        throw new Error('No valid consent for this data collection');
      }
    }

    const personalData: PersonalData = {
      id: this.generateId(),
      userId,
      dataType,
      data: await this.encryptIfRequired(data, dataType),
      source,
      purposes,
      legalBasis,
      collectedAt: new Date(),
      retentionPeriod: this.retentionPolicies.get(dataType) || 365,
      encrypted: this.requiresEncryption(dataType),
      anonymized: false,
      deleted: false,
      consentId
    };

    // Store the data
    const userData = this.personalDataStore.get(userId) || [];
    userData.push(personalData);
    this.personalDataStore.set(userId, userData);

    logger.info('Personal data collected', {
      userId,
      dataType,
      purposes,
      legalBasis,
      dataId: personalData.id
    });

    return personalData;
  }

  // Consent Management
  async recordConsent(
    userId: string,
    purposes: ProcessingPurpose[],
    dataTypes: DataType[],
    consentMethod: ConsentRecord['consentMethod'],
    consentText: string,
    ipAddress: string,
    userAgent: string,
    expiryDate?: Date
  ): Promise<ConsentRecord> {
    const consent: ConsentRecord = {
      id: this.generateId(),
      userId,
      purposes,
      dataTypes,
      consentDate: new Date(),
      expiryDate,
      isActive: true,
      consentMethod,
      consentText,
      ipAddress,
      userAgent,
      version: '1.0' // Should be dynamic based on consent form version
    };

    const userConsents = this.consentRecords.get(userId) || [];
    userConsents.push(consent);
    this.consentRecords.set(userId, userConsents);

    logger.info('Consent recorded', {
      userId,
      consentId: consent.id,
      purposes,
      dataTypes
    });

    return consent;
  }

  async withdrawConsent(userId: string, consentId: string): Promise<boolean> {
    const userConsents = this.consentRecords.get(userId) || [];
    const consent = userConsents.find(c => c.id === consentId);

    if (!consent) {
      return false;
    }

    consent.isActive = false;
    consent.withdrawnDate = new Date();

    // Handle data that was collected based on this consent
    await this.handleConsentWithdrawal(userId, consentId);

    logger.info('Consent withdrawn', { userId, consentId });
    return true;
  }

  private async handleConsentWithdrawal(userId: string, consentId: string) {
    const userData = this.personalDataStore.get(userId) || [];
    const affectedData = userData.filter(data => data.consentId === consentId);

    for (const data of affectedData) {
      // Check if we have another legal basis to continue processing
      if (data.legalBasis === 'consent') {
        // Mark for deletion or anonymization
        data.deleted = true;
        data.deletedAt = new Date();
      }
    }
  }

  private async validateConsent(
    userId: string,
    purposes: ProcessingPurpose[],
    dataType: DataType
  ): Promise<boolean> {
    const userConsents = this.consentRecords.get(userId) || [];
    
    const validConsent = userConsents.find(consent => 
      consent.isActive &&
      (!consent.expiryDate || consent.expiryDate > new Date()) &&
      purposes.every(purpose => consent.purposes.includes(purpose)) &&
      consent.dataTypes.includes(dataType)
    );

    return !!validConsent;
  }

  // Data Subject Rights Implementation
  async processDataSubjectRequest(
    userId: string,
    requestType: RightType,
    requestDetails: string,
    verificationMethod: string
  ): Promise<DataSubjectRight> {
    const request: DataSubjectRight = {
      id: this.generateId(),
      userId,
      requestType,
      status: 'pending',
      requestDate: new Date(),
      requestDetails,
      verificationMethod
    };

    this.dataSubjectRequests.push(request);

    // Process the request automatically where possible
    await this.autoProcessRequest(request);

    logger.info('Data subject request received', {
      userId,
      requestType,
      requestId: request.id
    });

    return request;
  }

  private async autoProcessRequest(request: DataSubjectRight) {
    switch (request.requestType) {
      case 'access':
        await this.processAccessRequest(request);
        break;
      case 'erasure':
        await this.processErasureRequest(request);
        break;
      case 'portability':
        await this.processPortabilityRequest(request);
        break;
      default:
        // Manual processing required
        break;
    }
  }

  private async processAccessRequest(request: DataSubjectRight) {
    const userData = this.personalDataStore.get(request.userId) || [];
    const consents = this.consentRecords.get(request.userId) || [];

    const accessData = {
      personalData: userData.filter(data => !data.deleted).map(data => ({
        id: data.id,
        dataType: data.dataType,
        collectedAt: data.collectedAt,
        purposes: data.purposes,
        legalBasis: data.legalBasis,
        source: data.source,
        // Don't include actual data for security
        hasData: true
      })),
      consents: consents.map(consent => ({
        id: consent.id,
        purposes: consent.purposes,
        dataTypes: consent.dataTypes,
        consentDate: consent.consentDate,
        isActive: consent.isActive,
        withdrawnDate: consent.withdrawnDate
      })),
      generatedAt: new Date()
    };

    request.responseData = accessData;
    request.status = 'completed';
    request.completedDate = new Date();
  }

  private async processErasureRequest(request: DataSubjectRight) {
    const userData = this.personalDataStore.get(request.userId) || [];
    let deletedCount = 0;

    for (const data of userData) {
      if (this.canDeleteData(data)) {
        data.deleted = true;
        data.deletedAt = new Date();
        deletedCount++;
      }
    }

    request.responseData = { deletedCount };
    request.status = deletedCount > 0 ? 'completed' : 'partially_completed';
    request.completedDate = new Date();
  }

  private async processPortabilityRequest(request: DataSubjectRight) {
    const userData = this.personalDataStore.get(request.userId) || [];
    const portableData = userData
      .filter(data => !data.deleted && this.isDataPortable(data))
      .map(data => ({
        dataType: data.dataType,
        data: data.data, // In production, decrypt if necessary
        collectedAt: data.collectedAt,
        purposes: data.purposes
      }));

    request.responseData = {
      data: portableData,
      format: 'JSON',
      generatedAt: new Date()
    };
    request.status = 'completed';
    request.completedDate = new Date();
  }

  private canDeleteData(data: PersonalData): boolean {
    // Check if we have legal obligation to retain the data
    const legalRetentionTypes: DataType[] = ['financial', 'criminal'];
    
    if (legalRetentionTypes.includes(data.dataType)) {
      const retentionEnd = new Date(data.collectedAt);
      retentionEnd.setDate(retentionEnd.getDate() + data.retentionPeriod);
      
      if (retentionEnd > new Date()) {
        return false; // Still in legal retention period
      }
    }

    return true;
  }

  private isDataPortable(data: PersonalData): boolean {
    // Data is portable if it was provided by the user or automatically collected
    return data.legalBasis === 'consent' || data.legalBasis === 'contract';
  }

  // Data Breach Management
  async reportDataBreach(
    affectedUsers: string[],
    dataTypes: DataType[],
    breachType: BreachType,
    description: string,
    cause: string
  ): Promise<DataBreachIncident> {
    const severity = this.assessBreachSeverity(affectedUsers.length, dataTypes, breachType);
    
    const incident: DataBreachIncident = {
      id: this.generateId(),
      incidentDate: new Date(),
      discoveredDate: new Date(),
      affectedUsers,
      dataTypes,
      breachType,
      severity,
      description,
      cause,
      containmentMeasures: [],
      notificationRequired: this.requiresNotification(severity, dataTypes),
      supervisoryAuthorityNotified: false,
      dataSubjectsNotified: false,
      status: 'open'
    };

    this.breachIncidents.push(incident);

    // Auto-notify if required
    if (incident.notificationRequired) {
      await this.handleBreachNotification(incident);
    }

    logger.error('Data breach reported', {
      incidentId: incident.id,
      severity,
      affectedUsers: affectedUsers.length,
      dataTypes
    });

    return incident;
  }

  private assessBreachSeverity(
    userCount: number,
    dataTypes: DataType[],
    breachType: BreachType
  ): DataBreachIncident['severity'] {
    let score = 0;

    // User count impact
    if (userCount > 10000) score += 3;
    else if (userCount > 1000) score += 2;
    else if (userCount > 100) score += 1;

    // Data type sensitivity
    const sensitiveTypes: DataType[] = ['biometric', 'health', 'criminal', 'sensitive'];
    if (dataTypes.some(type => sensitiveTypes.includes(type))) score += 3;
    else if (dataTypes.includes('financial') || dataTypes.includes('identity')) score += 2;
    else score += 1;

    // Breach type impact
    if (breachType === 'confidentiality') score += 2;
    else if (breachType === 'integrity') score += 2;
    else score += 1; // availability

    if (score >= 7) return 'critical';
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  private requiresNotification(
    severity: DataBreachIncident['severity'],
    dataTypes: DataType[]
  ): boolean {
    // High risk breaches require notification within 72 hours
    return severity === 'high' || severity === 'critical' ||
           dataTypes.some(type => ['biometric', 'health', 'criminal'].includes(type));
  }

  private async handleBreachNotification(incident: DataBreachIncident) {
    // In production, integrate with notification systems
    logger.warn('Breach notification required', {
      incidentId: incident.id,
      severity: incident.severity,
      deadline: new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours
    });
  }

  // Data Retention and Cleanup
  private startRetentionScheduler() {
    // Run daily cleanup
    setInterval(() => {
      this.performRetentionCleanup();
    }, 24 * 60 * 60 * 1000);
  }

  private async performRetentionCleanup() {
    let cleanupCount = 0;
    const now = new Date();

    for (const [userId, userData] of this.personalDataStore.entries()) {
      for (const data of userData) {
        if (data.deleted) continue;

        const retentionEnd = new Date(data.collectedAt);
        retentionEnd.setDate(retentionEnd.getDate() + data.retentionPeriod);

        if (retentionEnd <= now && this.canDeleteData(data)) {
          if (this.requiresAnonymization(data)) {
            await this.anonymizeData(data);
          } else {
            data.deleted = true;
            data.deletedAt = now;
          }
          cleanupCount++;
        }
      }
    }

    if (cleanupCount > 0) {
      logger.info('Retention cleanup completed', { deletedRecords: cleanupCount });
    }
  }

  private requiresAnonymization(data: PersonalData): boolean {
    // Anonymize instead of delete for research or statistical purposes
    return data.purposes.includes('research') || data.purposes.includes('analytics');
  }

  private async anonymizeData(data: PersonalData) {
    // Replace personal identifiers with anonymous ones
    data.data = await this.performAnonymization(data.data, data.dataType);
    data.anonymized = true;
    data.userId = 'anonymized';
  }

  private async performAnonymization(data: any, dataType: DataType): Promise<any> {
    // Implementation depends on data type and structure
    // This is a simplified example
    if (typeof data === 'object') {
      const anonymized = { ...data };
      
      // Remove or hash direct identifiers
      const identifiers = ['email', 'name', 'phone', 'address', 'ssn'];
      identifiers.forEach(field => {
        if (anonymized[field]) {
          anonymized[field] = this.hashValue(anonymized[field]);
        }
      });

      return anonymized;
    }

    return this.hashValue(data);
  }

  private setupBreachMonitoring() {
    // Monitor for potential data breaches
    window.addEventListener('error', (event) => {
      if (event.error && event.error.name === 'SecurityError') {
        logger.warn('Potential security event detected', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno
        });
      }
    });
  }

  // Utility methods
  private requiresEncryption(dataType: DataType): boolean {
    const encryptionRequired: DataType[] = [
      'financial', 'health', 'biometric', 'criminal', 'sensitive'
    ];
    return encryptionRequired.includes(dataType);
  }

  private async encryptIfRequired(data: any, dataType: DataType): Promise<any> {
    if (this.requiresEncryption(dataType)) {
      // In production, use proper encryption service
      return btoa(JSON.stringify(data));
    }
    return data;
  }

  private hashValue(value: string): string {
    // Simple hash for anonymization - use crypto.subtle in production
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `anon_${Math.abs(hash)}`;
  }

  private generateId(): string {
    return `gdpr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getPersonalData(userId: string): PersonalData[] {
    return (this.personalDataStore.get(userId) || [])
      .filter(data => !data.deleted);
  }

  getConsentRecords(userId: string): ConsentRecord[] {
    return this.consentRecords.get(userId) || [];
  }

  getDataSubjectRequests(userId?: string): DataSubjectRight[] {
    return userId ?
      this.dataSubjectRequests.filter(req => req.userId === userId) :
      this.dataSubjectRequests;
  }

  getBreachIncidents(): DataBreachIncident[] {
    return [...this.breachIncidents];
  }

  getComplianceStats() {
    const allData = Array.from(this.personalDataStore.values()).flat();
    const allConsents = Array.from(this.consentRecords.values()).flat();

    return {
      totalPersonalDataRecords: allData.length,
      deletedRecords: allData.filter(d => d.deleted).length,
      anonymizedRecords: allData.filter(d => d.anonymized).length,
      activeConsents: allConsents.filter(c => c.isActive).length,
      withdrawnConsents: allConsents.filter(c => !c.isActive).length,
      pendingRequests: this.dataSubjectRequests.filter(r => r.status === 'pending').length,
      breachIncidents: this.breachIncidents.length,
      criticalBreaches: this.breachIncidents.filter(b => b.severity === 'critical').length
    };
  }
}

// Export singleton instance
export const gdprManager = new GDPRManager();
export default gdprManager;
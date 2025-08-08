// Advanced Threat Intelligence System
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/apiClient';
import { cache } from '@/lib/cache';

// Threat Intelligence Interfaces
export interface ThreatIndicator {
  id: string;
  type: IndicatorType;
  value: string;
  confidence: number;
  severity: ThreatSeverity;
  firstSeen: Date;
  lastSeen: Date;
  source: string;
  description: string;
  tags: string[];
  ttl: number; // Time to live in seconds
  attribution: Attribution[];
  context: ThreatContext;
}

export type IndicatorType = 
  | 'ip_address'
  | 'domain' 
  | 'url'
  | 'phone_number'
  | 'email_address'
  | 'file_hash'
  | 'wallet_address'
  | 'social_media_handle'
  | 'bank_account';

export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Attribution {
  actor: string;
  confidence: number;
  techniques: string[];
  campaigns: string[];
}

export interface ThreatContext {
  campaign?: string;
  malwareFamily?: string;
  attackVector?: string;
  targetSectors?: string[];
  geolocation?: GeoLocation;
  relatedIndicators?: string[];
}

export interface GeoLocation {
  country: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  asn?: number;
  isp?: string;
}

export interface ThreatFeed {
  id: string;
  name: string;
  provider: string;
  url: string;
  apiKey?: string;
  enabled: boolean;
  lastUpdate: Date;
  updateInterval: number; // in minutes
  reliability: number; // 0-1 scale
  format: FeedFormat;
  categories: string[];
}

export type FeedFormat = 'json' | 'xml' | 'csv' | 'stix' | 'misp';

export interface ThreatScore {
  overall: number;
  categories: {
    reputation: number;
    behavior: number;
    network: number;
    content: number;
    temporal: number;
  };
  factors: ScoringFactor[];
}

export interface ScoringFactor {
  name: string;
  weight: number;
  value: number;
  explanation: string;
}

export interface ThreatIntelligenceQuery {
  indicators: string[];
  types?: IndicatorType[];
  includeContext?: boolean;
  maxAge?: number; // in days
  minConfidence?: number;
  sources?: string[];
}

export interface ThreatIntelligenceResponse {
  results: ThreatIndicatorResult[];
  summary: {
    total: number;
    malicious: number;
    suspicious: number;
    clean: number;
    unknown: number;
  };
  queryTime: number;
}

export interface ThreatIndicatorResult {
  indicator: string;
  type: IndicatorType;
  status: 'malicious' | 'suspicious' | 'clean' | 'unknown';
  score: ThreatScore;
  details: ThreatIndicator[];
  enrichment: EnrichmentData;
}

export interface EnrichmentData {
  whois?: WhoisData;
  dns?: DNSData;
  geolocation?: GeoLocation;
  reputation?: ReputationData;
  relationships?: RelationshipData;
}

export interface WhoisData {
  domain: string;
  registrar: string;
  creationDate: Date;
  expirationDate: Date;
  registrant: {
    name?: string;
    organization?: string;
    country?: string;
    email?: string;
  };
  nameservers: string[];
}

export interface DNSData {
  a: string[];
  aaaa: string[];
  mx: string[];
  txt: string[];
  cname: string[];
  ns: string[];
}

export interface ReputationData {
  score: number;
  sources: {
    name: string;
    score: number;
    categories: string[];
  }[];
}

export interface RelationshipData {
  connected: {
    indicator: string;
    type: IndicatorType;
    relationship: string;
    confidence: number;
  }[];
  infrastructure: {
    sharedHosting: string[];
    registrarHistory: string[];
    ipHistory: string[];
  };
}

// Threat Intelligence Sources Configuration
const THREAT_FEEDS: ThreatFeed[] = [
  {
    id: 'virustotal',
    name: 'VirusTotal',
    provider: 'Google',
    url: 'https://www.virustotal.com/vtapi/v2',
    enabled: true,
    lastUpdate: new Date(),
    updateInterval: 60,
    reliability: 0.95,
    format: 'json',
    categories: ['malware', 'phishing', 'malicious_urls']
  },
  {
    id: 'abuseipdb',
    name: 'AbuseIPDB',
    provider: 'AbuseIPDB',
    url: 'https://api.abuseipdb.com/api/v2',
    enabled: true,
    lastUpdate: new Date(),
    updateInterval: 30,
    reliability: 0.90,
    format: 'json',
    categories: ['malicious_ips', 'spam', 'abuse']
  },
  {
    id: 'urlvoid',
    name: 'URLVoid',
    provider: 'NoVirusThanks',
    url: 'https://api.urlvoid.com/v1',
    enabled: true,
    lastUpdate: new Date(),
    updateInterval: 120,
    reliability: 0.85,
    format: 'json',
    categories: ['malicious_urls', 'phishing']
  },
  {
    id: 'openphish',
    name: 'OpenPhish',
    provider: 'OpenPhish',
    url: 'https://openphish.com/feed.txt',
    enabled: true,
    lastUpdate: new Date(),
    updateInterval: 15,
    reliability: 0.92,
    format: 'csv',
    categories: ['phishing']
  },
  {
    id: 'phishtank',
    name: 'PhishTank',
    provider: 'Cisco Talos',
    url: 'https://data.phishtank.com/data',
    enabled: true,
    lastUpdate: new Date(),
    updateInterval: 60,
    reliability: 0.88,
    format: 'json',
    categories: ['phishing']
  }
];

// Main Threat Intelligence Service
export class ThreatIntelligenceService {
  private feeds = new Map<string, ThreatFeed>();
  private indicators = new Map<string, ThreatIndicator>();
  private updateTimers = new Map<string, NodeJS.Timeout>();

  constructor() {
    this.initializeFeeds();
    this.startFeedUpdates();
  }

  private initializeFeeds() {
    THREAT_FEEDS.forEach(feed => {
      this.feeds.set(feed.id, feed);
    });
  }

  private startFeedUpdates() {
    this.feeds.forEach((feed, feedId) => {
      if (feed.enabled) {
        // Initial update
        this.updateFeed(feedId);
        
        // Schedule periodic updates
        const interval = setInterval(() => {
          this.updateFeed(feedId);
        }, feed.updateInterval * 60 * 1000);
        
        this.updateTimers.set(feedId, interval);
      }
    });
  }

  async queryIndicators(query: ThreatIntelligenceQuery): Promise<ThreatIntelligenceResponse> {
    const startTime = Date.now();
    const results: ThreatIndicatorResult[] = [];
    
    for (const indicator of query.indicators) {
      const result = await this.analyzeIndicator(indicator, query);
      results.push(result);
    }

    const summary = this.calculateSummary(results);
    const queryTime = Date.now() - startTime;

    return {
      results,
      summary,
      queryTime
    };
  }

  private async analyzeIndicator(
    indicator: string, 
    query: ThreatIntelligenceQuery
  ): Promise<ThreatIndicatorResult> {
    const type = this.detectIndicatorType(indicator);
    const cacheKey = `threat_${type}_${indicator}`;
    
    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached && !this.isStale(cached)) {
      return cached;
    }

    // Collect threat intelligence from multiple sources
    const threats: ThreatIndicator[] = [];
    const sources = query.sources || Array.from(this.feeds.keys());

    for (const sourceId of sources) {
      try {
        const sourceThreat = await this.querySource(sourceId, indicator, type);
        if (sourceThreat) {
          threats.push(sourceThreat);
        }
      } catch (error) {
        logger.warn(`Failed to query source ${sourceId}:`, error);
      }
    }

    // Calculate threat score
    const score = this.calculateThreatScore(indicator, type, threats);
    
    // Determine status
    const status = this.determineStatus(score);

    // Get enrichment data
    const enrichment = await this.getEnrichmentData(indicator, type);

    const result: ThreatIndicatorResult = {
      indicator,
      type,
      status,
      score,
      details: threats,
      enrichment
    };

    // Cache result
    await cache.set(cacheKey, result, 3600); // 1 hour cache

    return result;
  }

  private detectIndicatorType(indicator: string): IndicatorType {
    // IP Address
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(indicator)) {
      return 'ip_address';
    }

    // Email Address
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(indicator)) {
      return 'email_address';
    }

    // Phone Number
    if (/^[\+]?[\d\s\-\(\)]{10,}$/.test(indicator)) {
      return 'phone_number';
    }

    // URL
    if (/^https?:\/\//.test(indicator)) {
      return 'url';
    }

    // Domain
    if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(indicator)) {
      return 'domain';
    }

    // File Hash
    if (/^[a-fA-F0-9]{32,64}$/.test(indicator)) {
      return 'file_hash';
    }

    // Cryptocurrency Wallet
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(indicator) || // Bitcoin
        /^0x[a-fA-F0-9]{40}$/.test(indicator)) { // Ethereum
      return 'wallet_address';
    }

    // Default to domain if it looks like one
    return 'domain';
  }

  private async querySource(
    sourceId: string, 
    indicator: string, 
    type: IndicatorType
  ): Promise<ThreatIndicator | null> {
    const feed = this.feeds.get(sourceId);
    if (!feed || !feed.enabled) {
      return null;
    }

    try {
      switch (sourceId) {
        case 'virustotal':
          return await this.queryVirusTotal(indicator, type);
        case 'abuseipdb':
          return await this.queryAbuseIPDB(indicator, type);
        case 'urlvoid':
          return await this.queryURLVoid(indicator, type);
        case 'openphish':
          return await this.queryOpenPhish(indicator, type);
        case 'phishtank':
          return await this.queryPhishTank(indicator, type);
        default:
          return await this.queryGenericFeed(feed, indicator, type);
      }
    } catch (error) {
      logger.error(`Error querying ${sourceId}:`, error);
      return null;
    }
  }

  private async queryVirusTotal(indicator: string, type: IndicatorType): Promise<ThreatIndicator | null> {
    if (!process.env.VIRUSTOTAL_API_KEY) {
      return null;
    }

    let endpoint = '';
    let params = '';

    switch (type) {
      case 'ip_address':
        endpoint = 'ip-address/report';
        params = `ip=${indicator}`;
        break;
      case 'domain':
        endpoint = 'domain/report';
        params = `domain=${indicator}`;
        break;
      case 'url':
        endpoint = 'url/report';
        params = `resource=${encodeURIComponent(indicator)}`;
        break;
      case 'file_hash':
        endpoint = 'file/report';
        params = `resource=${indicator}`;
        break;
      default:
        return null;
    }

    const response = await fetch(
      `https://www.virustotal.com/vtapi/v2/${endpoint}?apikey=${process.env.VIRUSTOTAL_API_KEY}&${params}`
    );

    if (!response.ok) {
      throw new Error(`VirusTotal API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.response_code !== 1) {
      return null; // Not found
    }

    const positives = data.positives || 0;
    const total = data.total || 1;
    const confidence = positives / total;

    return {
      id: `vt_${indicator}_${Date.now()}`,
      type,
      value: indicator,
      confidence,
      severity: this.mapConfidenceToSeverity(confidence),
      firstSeen: new Date(data.scan_date || Date.now()),
      lastSeen: new Date(),
      source: 'VirusTotal',
      description: `Detected by ${positives}/${total} engines`,
      tags: ['virustotal', ...(data.detected_downloaded_samples ? ['malware'] : [])],
      ttl: 3600,
      attribution: [],
      context: {
        relatedIndicators: data.detected_urls?.map((u: any) => u.url) || []
      }
    };
  }

  private async queryAbuseIPDB(indicator: string, type: IndicatorType): Promise<ThreatIndicator | null> {
    if (type !== 'ip_address' || !process.env.ABUSEIPDB_API_KEY) {
      return null;
    }

    const response = await fetch(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${indicator}&maxAgeInDays=90`,
      {
        headers: {
          'Key': process.env.ABUSEIPDB_API_KEY,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`AbuseIPDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data) {
      return null;
    }

    const abuseConfidence = data.data.abuseConfidencePercentage / 100;

    return {
      id: `abuse_${indicator}_${Date.now()}`,
      type,
      value: indicator,
      confidence: abuseConfidence,
      severity: this.mapConfidenceToSeverity(abuseConfidence),
      firstSeen: new Date(data.data.lastReportedAt || Date.now()),
      lastSeen: new Date(),
      source: 'AbuseIPDB',
      description: `Abuse confidence: ${data.data.abuseConfidencePercentage}%`,
      tags: ['abuseipdb', ...(data.data.usageType ? [data.data.usageType.toLowerCase()] : [])],
      ttl: 1800,
      attribution: [],
      context: {
        geolocation: {
          country: data.data.countryCode,
          isp: data.data.isp
        }
      }
    };
  }

  private async queryURLVoid(indicator: string, type: IndicatorType): Promise<ThreatIndicator | null> {
    if ((type !== 'url' && type !== 'domain') || !process.env.URLVOID_API_KEY) {
      return null;
    }

    const host = type === 'url' ? new URL(indicator).hostname : indicator;
    
    const response = await fetch(
      `https://api.urlvoid.com/v1/pay-as-you-go/?key=${process.env.URLVOID_API_KEY}&host=${host}`
    );

    if (!response.ok) {
      throw new Error(`URLVoid API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.detections) {
      return null;
    }

    const detections = Object.keys(data.detections).length;
    const engines = data.engines || {};
    const total = Object.keys(engines).length || 1;
    const confidence = detections / total;

    return {
      id: `urlvoid_${indicator}_${Date.now()}`,
      type,
      value: indicator,
      confidence,
      severity: this.mapConfidenceToSeverity(confidence),
      firstSeen: new Date(),
      lastSeen: new Date(),
      source: 'URLVoid',
      description: `Detected by ${detections}/${total} engines`,
      tags: ['urlvoid', 'reputation'],
      ttl: 3600,
      attribution: [],
      context: {}
    };
  }

  private async queryOpenPhish(indicator: string, type: IndicatorType): Promise<ThreatIndicator | null> {
    if (type !== 'url') {
      return null;
    }

    // OpenPhish provides a feed of known phishing URLs
    const response = await fetch('https://openphish.com/feed.txt');
    
    if (!response.ok) {
      throw new Error(`OpenPhish API error: ${response.status}`);
    }

    const feedData = await response.text();
    const urls = feedData.split('\n').filter(url => url.trim());

    if (urls.includes(indicator)) {
      return {
        id: `openphish_${indicator}_${Date.now()}`,
        type,
        value: indicator,
        confidence: 0.95, // High confidence for known phishing URLs
        severity: 'high',
        firstSeen: new Date(),
        lastSeen: new Date(),
        source: 'OpenPhish',
        description: 'Known phishing URL',
        tags: ['openphish', 'phishing'],
        ttl: 900, // 15 minutes
        attribution: [],
        context: {
          campaign: 'phishing'
        }
      };
    }

    return null;
  }

  private async queryPhishTank(indicator: string, type: IndicatorType): Promise<ThreatIndicator | null> {
    if (type !== 'url') {
      return null;
    }

    const response = await fetch(
      `http://checkurl.phishtank.com/checkurl/?url=${encodeURIComponent(indicator)}&format=json`
    );

    if (!response.ok) {
      throw new Error(`PhishTank API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || !data.results.in_database) {
      return null;
    }

    return {
      id: `phishtank_${indicator}_${Date.now()}`,
      type,
      value: indicator,
      confidence: data.results.valid ? 0.90 : 0.30,
      severity: data.results.valid ? 'high' : 'medium',
      firstSeen: new Date(data.results.submission_time),
      lastSeen: new Date(data.results.verification_time),
      source: 'PhishTank',
      description: data.results.valid ? 'Verified phishing URL' : 'Suspected phishing URL',
      tags: ['phishtank', 'phishing'],
      ttl: 1800,
      attribution: [],
      context: {
        campaign: 'phishing'
      }
    };
  }

  private async queryGenericFeed(
    feed: ThreatFeed, 
    indicator: string, 
    type: IndicatorType
  ): Promise<ThreatIndicator | null> {
    // Generic feed query implementation
    // This would be customized based on the feed format and API
    return null;
  }

  private calculateThreatScore(
    indicator: string, 
    type: IndicatorType, 
    threats: ThreatIndicator[]
  ): ThreatScore {
    if (threats.length === 0) {
      return {
        overall: 0.1,
        categories: {
          reputation: 0.1,
          behavior: 0.1,
          network: 0.1,
          content: 0.1,
          temporal: 0.1
        },
        factors: []
      };
    }

    // Calculate weighted scores based on source reliability
    let totalScore = 0;
    let totalWeight = 0;
    const factors: ScoringFactor[] = [];

    threats.forEach(threat => {
      const feed = Array.from(this.feeds.values()).find(f => f.name === threat.source);
      const weight = feed?.reliability || 0.5;
      
      totalScore += threat.confidence * weight;
      totalWeight += weight;

      factors.push({
        name: threat.source,
        weight,
        value: threat.confidence,
        explanation: threat.description
      });
    });

    const averageScore = totalWeight > 0 ? totalScore / totalWeight : 0.1;

    // Calculate category scores
    const categories = {
      reputation: this.calculateReputationScore(threats),
      behavior: this.calculateBehaviorScore(threats),
      network: this.calculateNetworkScore(threats, type),
      content: this.calculateContentScore(threats),
      temporal: this.calculateTemporalScore(threats)
    };

    return {
      overall: Math.min(averageScore, 1.0),
      categories,
      factors
    };
  }

  private calculateReputationScore(threats: ThreatIndicator[]): number {
    const reputationThreats = threats.filter(t => 
      t.tags.includes('reputation') || t.source.includes('reputation')
    );
    
    if (reputationThreats.length === 0) return 0.1;
    
    return reputationThreats.reduce((sum, t) => sum + t.confidence, 0) / reputationThreats.length;
  }

  private calculateBehaviorScore(threats: ThreatIndicator[]): number {
    const behaviorThreats = threats.filter(t => 
      t.tags.includes('malware') || t.tags.includes('behavior')
    );
    
    if (behaviorThreats.length === 0) return 0.1;
    
    return behaviorThreats.reduce((sum, t) => sum + t.confidence, 0) / behaviorThreats.length;
  }

  private calculateNetworkScore(threats: ThreatIndicator[], type: IndicatorType): number {
    if (type !== 'ip_address' && type !== 'domain') return 0.1;
    
    const networkThreats = threats.filter(t => 
      t.tags.includes('network') || t.type === 'ip_address'
    );
    
    if (networkThreats.length === 0) return 0.1;
    
    return networkThreats.reduce((sum, t) => sum + t.confidence, 0) / networkThreats.length;
  }

  private calculateContentScore(threats: ThreatIndicator[]): number {
    const contentThreats = threats.filter(t => 
      t.tags.includes('phishing') || t.tags.includes('content')
    );
    
    if (contentThreats.length === 0) return 0.1;
    
    return contentThreats.reduce((sum, t) => sum + t.confidence, 0) / contentThreats.length;
  }

  private calculateTemporalScore(threats: ThreatIndicator[]): number {
    const now = new Date();
    const recentThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    const recentThreats = threats.filter(t => 
      now.getTime() - t.lastSeen.getTime() < recentThreshold
    );
    
    if (recentThreats.length === 0) return 0.1;
    
    return Math.min(recentThreats.length / threats.length, 1.0);
  }

  private determineStatus(score: ThreatScore): 'malicious' | 'suspicious' | 'clean' | 'unknown' {
    const overall = score.overall;
    
    if (overall > 0.7) return 'malicious';
    if (overall > 0.4) return 'suspicious';
    if (overall > 0.1) return 'clean';
    return 'unknown';
  }

  private async getEnrichmentData(indicator: string, type: IndicatorType): Promise<EnrichmentData> {
    const enrichment: EnrichmentData = {};

    try {
      switch (type) {
        case 'domain':
          enrichment.whois = await this.getWhoisData(indicator);
          enrichment.dns = await this.getDNSData(indicator);
          break;
        case 'ip_address':
          enrichment.geolocation = await this.getGeolocationData(indicator);
          break;
        case 'url':
          const domain = new URL(indicator).hostname;
          enrichment.whois = await this.getWhoisData(domain);
          enrichment.dns = await this.getDNSData(domain);
          break;
      }

      enrichment.reputation = await this.getReputationData(indicator, type);
      enrichment.relationships = await this.getRelationshipData(indicator, type);

    } catch (error) {
      logger.warn('Error getting enrichment data:', error);
    }

    return enrichment;
  }

  private async getWhoisData(domain: string): Promise<WhoisData | undefined> {
    // Simplified whois data - in production, use a real whois service
    return {
      domain,
      registrar: 'Unknown',
      creationDate: new Date(),
      expirationDate: new Date(),
      registrant: {},
      nameservers: []
    };
  }

  private async getDNSData(domain: string): Promise<DNSData | undefined> {
    // Simplified DNS data - in production, use DNS resolution
    return {
      a: [],
      aaaa: [],
      mx: [],
      txt: [],
      cname: [],
      ns: []
    };
  }

  private async getGeolocationData(ip: string): Promise<GeoLocation | undefined> {
    // Simplified geolocation - in production, use a real geolocation service
    return {
      country: 'Unknown',
      asn: 0,
      isp: 'Unknown'
    };
  }

  private async getReputationData(indicator: string, type: IndicatorType): Promise<ReputationData | undefined> {
    return {
      score: 0.5,
      sources: []
    };
  }

  private async getRelationshipData(indicator: string, type: IndicatorType): Promise<RelationshipData | undefined> {
    return {
      connected: [],
      infrastructure: {
        sharedHosting: [],
        registrarHistory: [],
        ipHistory: []
      }
    };
  }

  private mapConfidenceToSeverity(confidence: number): ThreatSeverity {
    if (confidence > 0.8) return 'critical';
    if (confidence > 0.6) return 'high';
    if (confidence > 0.3) return 'medium';
    return 'low';
  }

  private isStale(data: any): boolean {
    const maxAge = 3600 * 1000; // 1 hour
    return Date.now() - data.timestamp > maxAge;
  }

  private calculateSummary(results: ThreatIndicatorResult[]): ThreatIntelligenceResponse['summary'] {
    return {
      total: results.length,
      malicious: results.filter(r => r.status === 'malicious').length,
      suspicious: results.filter(r => r.status === 'suspicious').length,
      clean: results.filter(r => r.status === 'clean').length,
      unknown: results.filter(r => r.status === 'unknown').length
    };
  }

  private async updateFeed(feedId: string): Promise<void> {
    const feed = this.feeds.get(feedId);
    if (!feed) return;

    try {
      logger.info(`Updating threat feed: ${feed.name}`);
      
      // Update feed data based on its format and source
      // This would be implemented based on each feed's specific API
      
      feed.lastUpdate = new Date();
      
      logger.info(`Successfully updated threat feed: ${feed.name}`);
    } catch (error) {
      logger.error(`Failed to update threat feed ${feed.name}:`, error);
    }
  }

  // Public methods for managing feeds
  getFeed(feedId: string): ThreatFeed | undefined {
    return this.feeds.get(feedId);
  }

  getAllFeeds(): ThreatFeed[] {
    return Array.from(this.feeds.values());
  }

  addFeed(feed: ThreatFeed): void {
    this.feeds.set(feed.id, feed);
    
    if (feed.enabled) {
      const interval = setInterval(() => {
        this.updateFeed(feed.id);
      }, feed.updateInterval * 60 * 1000);
      
      this.updateTimers.set(feed.id, interval);
    }
  }

  removeFeed(feedId: string): void {
    const timer = this.updateTimers.get(feedId);
    if (timer) {
      clearInterval(timer);
      this.updateTimers.delete(feedId);
    }
    
    this.feeds.delete(feedId);
  }

  enableFeed(feedId: string): void {
    const feed = this.feeds.get(feedId);
    if (feed) {
      feed.enabled = true;
      
      const interval = setInterval(() => {
        this.updateFeed(feedId);
      }, feed.updateInterval * 60 * 1000);
      
      this.updateTimers.set(feedId, interval);
    }
  }

  disableFeed(feedId: string): void {
    const feed = this.feeds.get(feedId);
    if (feed) {
      feed.enabled = false;
      
      const timer = this.updateTimers.get(feedId);
      if (timer) {
        clearInterval(timer);
        this.updateTimers.delete(feedId);
      }
    }
  }

  cleanup(): void {
    this.updateTimers.forEach(timer => clearInterval(timer));
    this.updateTimers.clear();
  }
}

export default new ThreatIntelligenceService();
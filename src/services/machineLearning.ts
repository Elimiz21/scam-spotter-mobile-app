// Advanced Machine Learning Service for Scam Pattern Recognition
import { logger } from '@/lib/logger';
import { AIAnalysisRequest, AIAnalysisResult, ThreatType } from './aiService';

// ML Model Interfaces
export interface MLModel {
  id: string;
  name: string;
  version: string;
  type: ModelType;
  accuracy: number;
  lastTrained: Date;
  features: string[];
  isActive: boolean;
}

export type ModelType = 
  | 'text_classifier' 
  | 'url_analyzer' 
  | 'phone_validator' 
  | 'sentiment_analyzer' 
  | 'pattern_matcher' 
  | 'anomaly_detector';

export interface FeatureVector {
  textFeatures: TextFeatures;
  urlFeatures: URLFeatures;
  phoneFeatures: PhoneFeatures;
  temporalFeatures: TemporalFeatures;
  contextFeatures: ContextFeatures;
  behavioralFeatures: BehavioralFeatures;
}

export interface TextFeatures {
  // Basic text statistics
  wordCount: number;
  charCount: number;
  sentenceCount: number;
  avgWordLength: number;
  avgSentenceLength: number;
  
  // Linguistic features
  readabilityScore: number;
  sentimentPolarity: number;
  sentimentSubjectivity: number;
  formalityScore: number;
  urgencyScore: number;
  
  // Pattern features
  uppercaseRatio: number;
  punctuationRatio: number;
  digitRatio: number;
  specialCharRatio: number;
  
  // Scam indicators
  scamKeywordCount: number;
  urgentPhraseCount: number;
  moneyMentionCount: number;
  contactInfoCount: number;
  
  // Language quality
  spellingErrorCount: number;
  grammarErrorCount: number;
  inconsistencyScore: number;
}

export interface URLFeatures {
  urlCount: number;
  shortUrlCount: number;
  suspiciousDomainCount: number;
  hasIPAddress: boolean;
  hasSubdomain: number;
  domainAge: number;
  domainTrust: number;
  httpsUsage: boolean;
  redirectChainLength: number;
}

export interface PhoneFeatures {
  phoneCount: number;
  internationalNumbers: number;
  premiumNumbers: number;
  voipNumbers: number;
  disposableNumbers: number;
  carrierTrust: number;
  locationConsistency: number;
}

export interface TemporalFeatures {
  hourOfDay: number;
  dayOfWeek: number;
  isWeekend: boolean;
  isHoliday: boolean;
  timeZoneOffset: number;
  communicationSpeed: number;
  responsePattern: number;
}

export interface ContextFeatures {
  senderTrust: number;
  senderHistory: number;
  communicationChannel: string;
  conversationLength: number;
  topicConsistency: number;
  relationshipDuration: number;
}

export interface BehavioralFeatures {
  communicationFrequency: number;
  responseTime: number;
  initiationPattern: number;
  persistenceLevel: number;
  escalationTactics: number;
  socialEngineeringTactics: number;
}

export interface MLPrediction {
  probability: number;
  confidence: number;
  threatType: ThreatType | null;
  features: FeatureVector;
  modelUsed: string;
  explanation: string[];
}

// Feature Extraction Service
export class FeatureExtractor {
  
  static extractFeatures(request: AIAnalysisRequest): FeatureVector {
    const content = request.content;
    const metadata = request.metadata || {};
    
    return {
      textFeatures: this.extractTextFeatures(content),
      urlFeatures: this.extractURLFeatures(content),
      phoneFeatures: this.extractPhoneFeatures(content, metadata),
      temporalFeatures: this.extractTemporalFeatures(metadata),
      contextFeatures: this.extractContextFeatures(metadata),
      behavioralFeatures: this.extractBehavioralFeatures(metadata)
    };
  }

  private static extractTextFeatures(content: string): TextFeatures {
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chars = content.length;

    return {
      // Basic statistics
      wordCount: words.length,
      charCount: chars,
      sentenceCount: sentences.length,
      avgWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length || 0,
      avgSentenceLength: words.length / sentences.length || 0,

      // Linguistic analysis
      readabilityScore: this.calculateReadability(words, sentences),
      sentimentPolarity: this.calculateSentiment(content),
      sentimentSubjectivity: this.calculateSubjectivity(content),
      formalityScore: this.calculateFormality(content),
      urgencyScore: this.calculateUrgency(content),

      // Character patterns
      uppercaseRatio: (content.match(/[A-Z]/g) || []).length / chars,
      punctuationRatio: (content.match(/[!?.,;:]/g) || []).length / chars,
      digitRatio: (content.match(/\d/g) || []).length / chars,
      specialCharRatio: (content.match(/[^a-zA-Z0-9\s]/g) || []).length / chars,

      // Scam indicators
      scamKeywordCount: this.countScamKeywords(content),
      urgentPhraseCount: this.countUrgentPhrases(content),
      moneyMentionCount: this.countMoneyMentions(content),
      contactInfoCount: this.countContactInfo(content),

      // Quality indicators
      spellingErrorCount: this.countSpellingErrors(content),
      grammarErrorCount: this.countGrammarErrors(content),
      inconsistencyScore: this.calculateInconsistency(content)
    };
  }

  private static extractURLFeatures(content: string): URLFeatures {
    const urls = content.match(/https?:\/\/[^\s]+/gi) || [];
    const shortUrls = content.match(/bit\.ly|tinyurl|t\.co|short\.link/gi) || [];
    const ipAddresses = content.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g) || [];
    
    return {
      urlCount: urls.length,
      shortUrlCount: shortUrls.length,
      suspiciousDomainCount: this.countSuspiciousDomains(urls),
      hasIPAddress: ipAddresses.length > 0,
      hasSubdomain: this.countSubdomains(urls),
      domainAge: this.estimateDomainAge(urls),
      domainTrust: this.calculateDomainTrust(urls),
      httpsUsage: urls.filter(url => url.startsWith('https')).length / (urls.length || 1),
      redirectChainLength: this.estimateRedirectChain(urls)
    };
  }

  private static extractPhoneFeatures(content: string, metadata: any): PhoneFeatures {
    const phones = content.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [];
    
    return {
      phoneCount: phones.length,
      internationalNumbers: phones.filter(p => p.startsWith('+')).length,
      premiumNumbers: this.countPremiumNumbers(phones),
      voipNumbers: this.countVoipNumbers(phones),
      disposableNumbers: this.countDisposableNumbers(phones),
      carrierTrust: this.calculateCarrierTrust(phones),
      locationConsistency: this.calculateLocationConsistency(phones, metadata)
    };
  }

  private static extractTemporalFeatures(metadata: any): TemporalFeatures {
    const now = metadata.timestamp ? new Date(metadata.timestamp) : new Date();
    
    return {
      hourOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
      isWeekend: [0, 6].includes(now.getDay()),
      isHoliday: this.isHoliday(now),
      timeZoneOffset: now.getTimezoneOffset(),
      communicationSpeed: metadata.responseTime || 0,
      responsePattern: metadata.responsePattern || 0
    };
  }

  private static extractContextFeatures(metadata: any): ContextFeatures {
    return {
      senderTrust: this.calculateSenderTrust(metadata.sender),
      senderHistory: metadata.senderHistory || 0,
      communicationChannel: metadata.channel || 'unknown',
      conversationLength: metadata.conversationLength || 1,
      topicConsistency: metadata.topicConsistency || 0.5,
      relationshipDuration: metadata.relationshipDuration || 0
    };
  }

  private static extractBehavioralFeatures(metadata: any): BehavioralFeatures {
    return {
      communicationFrequency: metadata.frequency || 0,
      responseTime: metadata.averageResponseTime || 0,
      initiationPattern: metadata.initiationPattern || 0,
      persistenceLevel: metadata.persistenceLevel || 0,
      escalationTactics: metadata.escalationTactics || 0,
      socialEngineeringTactics: metadata.socialEngineering || 0
    };
  }

  // Helper methods for text analysis
  private static calculateReadability(words: string[], sentences: string[]): number {
    // Simplified Flesch Reading Ease
    const avgWordsPerSentence = words.length / sentences.length || 0;
    const avgSyllablesPerWord = words.reduce((sum, word) => 
      sum + this.countSyllables(word), 0) / words.length || 0;
    
    return 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  }

  private static countSyllables(word: string): number {
    return word.toLowerCase().replace(/[^aeiouy]/g, '').length || 1;
  }

  private static calculateSentiment(content: string): number {
    // Simplified sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate'];
    
    const words = content.toLowerCase().split(/\s+/);
    const positive = words.filter(w => positiveWords.includes(w)).length;
    const negative = words.filter(w => negativeWords.includes(w)).length;
    
    return (positive - negative) / words.length;
  }

  private static calculateSubjectivity(content: string): number {
    // Subjective words vs objective words ratio
    const subjectiveWords = ['feel', 'think', 'believe', 'opinion', 'probably', 'might'];
    const words = content.toLowerCase().split(/\s+/);
    const subjective = words.filter(w => subjectiveWords.includes(w)).length;
    
    return subjective / words.length;
  }

  private static calculateFormality(content: string): number {
    // Formal language indicators
    const formalWords = ['therefore', 'however', 'furthermore', 'nevertheless', 'consequently'];
    const informalWords = ['gonna', 'wanna', 'yeah', 'ok', 'cool', 'awesome'];
    
    const words = content.toLowerCase().split(/\s+/);
    const formal = words.filter(w => formalWords.includes(w)).length;
    const informal = words.filter(w => informalWords.includes(w)).length;
    
    return (formal - informal) / words.length + 0.5;
  }

  private static calculateUrgency(content: string): number {
    const urgentPatterns = [
      /urgent/i, /immediate/i, /asap/i, /hurry/i, /quickly/i,
      /act now/i, /limited time/i, /expires/i, /deadline/i
    ];
    
    let score = 0;
    urgentPatterns.forEach(pattern => {
      if (pattern.test(content)) score += 0.1;
    });
    
    return Math.min(score, 1.0);
  }

  private static countScamKeywords(content: string): number {
    const scamKeywords = [
      'congratulations', 'winner', 'prize', 'lottery', 'inheritance',
      'beneficiary', 'claim', 'transfer', 'urgent', 'confidential',
      'verify', 'suspend', 'expire', 'limited', 'exclusive'
    ];
    
    const words = content.toLowerCase().split(/\s+/);
    return words.filter(word => scamKeywords.some(keyword => 
      word.includes(keyword))).length;
  }

  private static countUrgentPhrases(content: string): number {
    const urgentPhrases = [
      'act now', 'limited time', 'expires soon', 'urgent action',
      'immediate response', 'time sensitive', 'deadline approaching'
    ];
    
    const lower = content.toLowerCase();
    return urgentPhrases.filter(phrase => lower.includes(phrase)).length;
  }

  private static countMoneyMentions(content: string): number {
    const moneyPatterns = [
      /\$[\d,]+/, /\d+\s*dollars?/, /\d+\s*euros?/, /\d+\s*pounds?/,
      /money/, /cash/, /payment/, /transfer/, /wire/, /bitcoin/,
      /cryptocurrency/, /investment/, /profit/, /earnings/
    ];
    
    let count = 0;
    moneyPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      count += matches.length;
    });
    
    return count;
  }

  private static countContactInfo(content: string): number {
    let count = 0;
    
    // Phone numbers
    if (/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(content)) count++;
    
    // Email addresses
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content)) count++;
    
    // URLs
    if (/https?:\/\/[^\s]+/.test(content)) count++;
    
    return count;
  }

  private static countSpellingErrors(content: string): number {
    // Simplified spelling error detection
    const commonMisspellings = {
      'recieve': 'receive',
      'seperate': 'separate',
      'definately': 'definitely',
      'occured': 'occurred',
      'begining': 'beginning',
      'existance': 'existence',
      'succesful': 'successful'
    };
    
    const words = content.toLowerCase().split(/\s+/);
    return words.filter(word => 
      Object.keys(commonMisspellings).includes(word.replace(/[^a-z]/g, ''))
    ).length;
  }

  private static countGrammarErrors(content: string): number {
    // Basic grammar error patterns
    const grammarPatterns = [
      /\bi is\b/, // "I is" instead of "I am"
      /\byou was\b/, // "you was" instead of "you were"
      /\bthey was\b/, // "they was" instead of "they were"
      /\bdoesn't has\b/, // "doesn't has" instead of "doesn't have"
      /\bmore better\b/, // double comparative
    ];
    
    let errors = 0;
    grammarPatterns.forEach(pattern => {
      if (pattern.test(content.toLowerCase())) errors++;
    });
    
    return errors;
  }

  private static calculateInconsistency(content: string): number {
    // Look for inconsistencies in the text
    let inconsistencyScore = 0;
    
    // Mixed formal/informal language
    const formal = this.calculateFormality(content);
    if (formal > 0.3 && formal < 0.7) inconsistencyScore += 0.2;
    
    // Inconsistent capitalization
    const sentences = content.split(/[.!?]+/);
    const inconsistentCaps = sentences.filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 0 && trimmed[0] !== trimmed[0].toUpperCase();
    }).length;
    
    inconsistencyScore += (inconsistentCaps / sentences.length) * 0.3;
    
    return Math.min(inconsistencyScore, 1.0);
  }

  // URL analysis helpers
  private static countSuspiciousDomains(urls: string[]): number {
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.xyz', '.click', '.download'];
    const suspiciousKeywords = ['secure', 'account', 'verify', 'update', 'login'];
    
    return urls.filter(url => {
      const lower = url.toLowerCase();
      return suspiciousTLDs.some(tld => lower.includes(tld)) ||
             suspiciousKeywords.some(keyword => lower.includes(keyword));
    }).length;
  }

  private static countSubdomains(urls: string[]): number {
    return urls.filter(url => {
      const domain = url.replace(/https?:\/\//, '').split('/')[0];
      return (domain.match(/\./g) || []).length > 1;
    }).length;
  }

  private static estimateDomainAge(urls: string[]): number {
    // Simplified domain age estimation
    const wellKnownDomains = ['google.com', 'microsoft.com', 'apple.com', 'amazon.com'];
    const hasWellKnown = urls.some(url => 
      wellKnownDomains.some(domain => url.includes(domain))
    );
    
    return hasWellKnown ? 1.0 : Math.random() * 0.5 + 0.3;
  }

  private static calculateDomainTrust(urls: string[]): number {
    if (urls.length === 0) return 0.5;
    
    // Simplified trust calculation
    const trustScore = urls.reduce((sum, url) => {
      if (url.includes('.gov') || url.includes('.edu')) return sum + 1.0;
      if (url.includes('.org')) return sum + 0.8;
      if (url.includes('.com')) return sum + 0.6;
      return sum + 0.3;
    }, 0);
    
    return trustScore / urls.length;
  }

  private static estimateRedirectChain(urls: string[]): number {
    // Estimate redirect chain length based on URL patterns
    return urls.filter(url => 
      url.includes('bit.ly') || url.includes('tinyurl') || url.includes('t.co')
    ).length * 2 + urls.length;
  }

  // Phone analysis helpers
  private static countPremiumNumbers(phones: string[]): number {
    // Premium rate number patterns (simplified)
    const premiumPatterns = [/^1-?900/, /^1-?976/];
    
    return phones.filter(phone => 
      premiumPatterns.some(pattern => pattern.test(phone.replace(/\D/g, '')))
    ).length;
  }

  private static countVoipNumbers(phones: string[]): number {
    // VoIP number detection (simplified)
    const voipPrefixes = ['5000', '5001', '5002']; // Google Voice, etc.
    
    return phones.filter(phone => {
      const digits = phone.replace(/\D/g, '');
      return voipPrefixes.some(prefix => digits.includes(prefix));
    }).length;
  }

  private static countDisposableNumbers(phones: string[]): number {
    // Disposable/temporary number detection
    // This would integrate with external services in production
    return 0; // Placeholder
  }

  private static calculateCarrierTrust(phones: string[]): number {
    // Carrier trust scoring (simplified)
    if (phones.length === 0) return 0.5;
    return Math.random() * 0.3 + 0.7; // Placeholder
  }

  private static calculateLocationConsistency(phones: string[], metadata: any): number {
    // Check if phone locations match expected locations
    return 0.5; // Placeholder
  }

  // Temporal analysis helpers
  private static isHoliday(date: Date): boolean {
    // Simplified holiday detection
    const holidays = [
      '01-01', '07-04', '12-25', '12-31' // New Year, July 4th, Christmas, NYE
    ];
    
    const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return holidays.includes(dateStr);
  }

  // Context analysis helpers
  private static calculateSenderTrust(sender?: string): number {
    if (!sender) return 0.3;
    
    const trustedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'apple.com'];
    const domain = sender.split('@')[1]?.toLowerCase();
    
    if (!domain) return 0.2;
    if (trustedDomains.includes(domain)) return 0.7;
    if (domain.includes('bank') || domain.includes('.gov')) return 0.8;
    if (domain.length < 5) return 0.2;
    
    return 0.5;
  }
}

// Machine Learning Model Service
export class MLModelService {
  private models = new Map<string, MLModel>();
  private activeModels: MLModel[] = [];

  constructor() {
    this.initializeModels();
  }

  private initializeModels() {
    // Initialize default ML models
    const defaultModels: MLModel[] = [
      {
        id: 'text_classifier_v1',
        name: 'Text Scam Classifier',
        version: '1.0.0',
        type: 'text_classifier',
        accuracy: 0.94,
        lastTrained: new Date('2024-01-15'),
        features: ['textFeatures'],
        isActive: true
      },
      {
        id: 'url_analyzer_v1',
        name: 'URL Risk Analyzer',
        version: '1.0.0',
        type: 'url_analyzer',
        accuracy: 0.89,
        lastTrained: new Date('2024-01-10'),
        features: ['urlFeatures'],
        isActive: true
      },
      {
        id: 'phone_validator_v1',
        name: 'Phone Number Validator',
        version: '1.0.0',
        type: 'phone_validator',
        accuracy: 0.87,
        lastTrained: new Date('2024-01-12'),
        features: ['phoneFeatures'],
        isActive: true
      }
    ];

    defaultModels.forEach(model => {
      this.models.set(model.id, model);
      if (model.isActive) {
        this.activeModels.push(model);
      }
    });
  }

  async predict(features: FeatureVector): Promise<MLPrediction[]> {
    const predictions: MLPrediction[] = [];

    for (const model of this.activeModels) {
      try {
        const prediction = await this.runModelPrediction(model, features);
        predictions.push(prediction);
      } catch (error) {
        logger.error(`Model ${model.id} prediction failed:`, error);
      }
    }

    return predictions;
  }

  private async runModelPrediction(model: MLModel, features: FeatureVector): Promise<MLPrediction> {
    // Simulate ML model prediction
    // In production, this would call actual ML models
    
    const relevantFeatures = this.extractRelevantFeatures(model, features);
    const probability = this.calculateProbability(model, relevantFeatures);
    const confidence = this.calculateConfidence(model, probability);
    const threatType = this.identifyThreatType(model, relevantFeatures);
    const explanation = this.generateExplanation(model, relevantFeatures, probability);

    return {
      probability,
      confidence,
      threatType,
      features,
      modelUsed: model.id,
      explanation
    };
  }

  private extractRelevantFeatures(model: MLModel, features: FeatureVector): any {
    switch (model.type) {
      case 'text_classifier':
        return features.textFeatures;
      case 'url_analyzer':
        return features.urlFeatures;
      case 'phone_validator':
        return features.phoneFeatures;
      default:
        return features;
    }
  }

  private calculateProbability(model: MLModel, features: any): number {
    // Simplified probability calculation
    // Real implementation would use trained model weights
    
    switch (model.type) {
      case 'text_classifier':
        return this.calculateTextScamProbability(features);
      case 'url_analyzer':
        return this.calculateURLScamProbability(features);
      case 'phone_validator':
        return this.calculatePhoneScamProbability(features);
      default:
        return 0.5;
    }
  }

  private calculateTextScamProbability(features: TextFeatures): number {
    let score = 0;
    
    // Scam keyword indicators
    score += features.scamKeywordCount * 0.1;
    score += features.urgentPhraseCount * 0.15;
    score += features.moneyMentionCount * 0.12;
    
    // Language quality indicators (poor quality = higher scam probability)
    score += features.spellingErrorCount * 0.05;
    score += features.grammarErrorCount * 0.05;
    score += features.inconsistencyScore * 0.1;
    
    // Urgency and sentiment
    score += features.urgencyScore * 0.2;
    if (features.sentimentPolarity > 0.5) score += 0.1; // Overly positive
    
    // Formality (too formal or too informal can be suspicious)
    if (features.formalityScore < 0.2 || features.formalityScore > 0.8) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  private calculateURLScamProbability(features: URLFeatures): number {
    let score = 0;
    
    // Suspicious indicators
    score += features.shortUrlCount * 0.2;
    score += features.suspiciousDomainCount * 0.3;
    score += features.hasIPAddress ? 0.4 : 0;
    
    // Domain trust (inverse relationship)
    score += (1 - features.domainTrust) * 0.3;
    
    // HTTPS usage (lack of HTTPS is suspicious)
    if (features.httpsUsage < 0.5) score += 0.2;
    
    // Redirect chains
    score += Math.min(features.redirectChainLength * 0.05, 0.3);
    
    return Math.min(score, 1.0);
  }

  private calculatePhoneScamProbability(features: PhoneFeatures): number {
    let score = 0;
    
    // Premium and VoIP numbers
    score += features.premiumNumbers * 0.3;
    score += features.voipNumbers * 0.2;
    score += features.disposableNumbers * 0.4;
    
    // Carrier trust (inverse relationship)
    score += (1 - features.carrierTrust) * 0.2;
    
    // Location inconsistency
    score += (1 - features.locationConsistency) * 0.2;
    
    // International numbers can be suspicious
    score += features.internationalNumbers * 0.1;
    
    return Math.min(score, 1.0);
  }

  private calculateConfidence(model: MLModel, probability: number): number {
    // Confidence based on model accuracy and probability extremeness
    const extremeness = Math.abs(probability - 0.5) * 2; // 0 = uncertain, 1 = extreme
    return model.accuracy * extremeness;
  }

  private identifyThreatType(model: MLModel, features: any): ThreatType | null {
    // Simplified threat type identification
    switch (model.type) {
      case 'text_classifier':
        return this.identifyTextThreatType(features);
      case 'url_analyzer':
        return 'phishing';
      case 'phone_validator':
        return 'tech_support_scam';
      default:
        return null;
    }
  }

  private identifyTextThreatType(features: TextFeatures): ThreatType | null {
    // Pattern-based threat type identification
    if (features.moneyMentionCount > 2 && features.urgencyScore > 0.5) {
      return 'advance_fee_fraud';
    }
    
    if (features.scamKeywordCount > 3) {
      return 'phishing';
    }
    
    if (features.sentimentPolarity > 0.7 && features.moneyMentionCount > 0) {
      return 'romance_scam';
    }
    
    return null;
  }

  private generateExplanation(
    model: MLModel, 
    features: any, 
    probability: number
  ): string[] {
    const explanations: string[] = [];
    
    switch (model.type) {
      case 'text_classifier':
        this.addTextExplanations(explanations, features);
        break;
      case 'url_analyzer':
        this.addURLExplanations(explanations, features);
        break;
      case 'phone_validator':
        this.addPhoneExplanations(explanations, features);
        break;
    }
    
    return explanations;
  }

  private addTextExplanations(explanations: string[], features: TextFeatures) {
    if (features.scamKeywordCount > 2) {
      explanations.push(`Contains ${features.scamKeywordCount} scam-related keywords`);
    }
    
    if (features.urgencyScore > 0.3) {
      explanations.push('Uses urgent language patterns');
    }
    
    if (features.spellingErrorCount > 0) {
      explanations.push(`Contains ${features.spellingErrorCount} spelling errors`);
    }
    
    if (features.moneyMentionCount > 0) {
      explanations.push(`Mentions money/financial topics ${features.moneyMentionCount} times`);
    }
  }

  private addURLExplanations(explanations: string[], features: URLFeatures) {
    if (features.shortUrlCount > 0) {
      explanations.push('Contains shortened URLs');
    }
    
    if (features.hasIPAddress) {
      explanations.push('Contains IP address instead of domain');
    }
    
    if (features.domainTrust < 0.5) {
      explanations.push('Domain has low trust score');
    }
  }

  private addPhoneExplanations(explanations: string[], features: PhoneFeatures) {
    if (features.premiumNumbers > 0) {
      explanations.push('Contains premium rate numbers');
    }
    
    if (features.voipNumbers > 0) {
      explanations.push('Uses VoIP/internet-based numbers');
    }
    
    if (features.carrierTrust < 0.5) {
      explanations.push('Phone carrier has low trust rating');
    }
  }

  // Model management methods
  addModel(model: MLModel): void {
    this.models.set(model.id, model);
    if (model.isActive) {
      this.activeModels.push(model);
    }
  }

  removeModel(modelId: string): void {
    this.models.delete(modelId);
    this.activeModels = this.activeModels.filter(m => m.id !== modelId);
  }

  getModel(modelId: string): MLModel | undefined {
    return this.models.get(modelId);
  }

  getActiveModels(): MLModel[] {
    return [...this.activeModels];
  }

  getAllModels(): MLModel[] {
    return Array.from(this.models.values());
  }
}

export default new MLModelService();
// Advanced AI Service Integration (GPT-4, Claude, Custom ML Models)
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/apiClient';

// AI Model Types and Interfaces
export interface AIAnalysisRequest {
  content: string;
  type: 'email' | 'sms' | 'url' | 'call' | 'document' | 'image';
  metadata?: {
    sender?: string;
    timestamp?: Date;
    phoneNumber?: string;
    domain?: string;
    context?: string;
  };
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AIAnalysisResult {
  id: string;
  isScam: boolean;
  confidence: number; // 0-1 scale
  riskLevel: 'safe' | 'suspicious' | 'likely_scam' | 'confirmed_scam';
  threatTypes: ThreatType[];
  reasoning: string;
  recommendations: string[];
  detectedPatterns: DetectedPattern[];
  modelUsed: 'gpt4' | 'claude' | 'custom_ml' | 'ensemble';
  processingTime: number;
  timestamp: Date;
}

export interface DetectedPattern {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  examples: string[];
}

export type ThreatType = 
  | 'phishing' 
  | 'romance_scam' 
  | 'investment_fraud' 
  | 'tech_support_scam' 
  | 'prize_lottery_scam' 
  | 'charity_fraud' 
  | 'advance_fee_fraud' 
  | 'identity_theft' 
  | 'cryptocurrency_scam' 
  | 'job_scam'
  | 'rental_scam'
  | 'online_shopping_scam';

// AI Configuration
interface AIServiceConfig {
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  anthropic: {
    apiKey: string;
    model: string;
    maxTokens: number;
  };
  customML: {
    endpoint: string;
    apiKey: string;
    timeout: number;
  };
  fallbackStrategy: 'round_robin' | 'fastest_first' | 'confidence_weighted';
  cacheEnabled: boolean;
  rateLimits: {
    openai: number; // requests per minute
    anthropic: number;
    customML: number;
  };
}

// Scam Detection Patterns
const SCAM_PATTERNS = {
  phishing: {
    keywords: [
      'verify your account', 'suspend', 'urgent action required', 
      'click here immediately', 'limited time offer', 'act now',
      'your account will be closed', 'security alert', 'unusual activity'
    ],
    indicators: [
      'mismatched urls', 'grammatical errors', 'generic greetings',
      'pressure tactics', 'unexpected attachments', 'shortened links'
    ],
    riskFactors: ['unknown sender', 'external links', 'personal info requests']
  },
  
  romance_scam: {
    keywords: [
      'love', 'soulmate', 'destiny', 'emergency money', 'travel funds',
      'military deployment', 'hospital bills', 'stuck overseas',
      'western union', 'money transfer', 'gift cards'
    ],
    indicators: [
      'quick emotional attachment', 'professional photos', 'grammar mistakes',
      'inconsistent stories', 'money requests', 'avoids video calls'
    ],
    riskFactors: ['dating platform', 'early money requests', 'location changes']
  },

  investment_fraud: {
    keywords: [
      'guaranteed returns', 'risk-free investment', 'double your money',
      'exclusive opportunity', 'limited spots', 'cryptocurrency mining',
      'forex trading', 'binary options', 'get rich quick'
    ],
    indicators: [
      'unrealistic returns', 'pressure to invest quickly', 'unregistered advisors',
      'complex strategies', 'testimonials only', 'upfront fees'
    ],
    riskFactors: ['unverified companies', 'offshore locations', 'no documentation']
  },

  tech_support_scam: {
    keywords: [
      'microsoft support', 'apple support', 'virus detected', 'computer infected',
      'immediate assistance', 'remote access', 'security breach',
      'suspicious activity', 'frozen computer', 'expired license'
    ],
    indicators: [
      'unsolicited contact', 'remote access requests', 'generic error messages',
      'foreign accents', 'payment demands', 'scare tactics'
    ],
    riskFactors: ['cold calls', 'tech company impersonation', 'urgency claims']
  }
};

// GPT-4 Analysis Service
class GPT4AnalysisService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeContent(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildAnalysisPrompt(request);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an expert scam detection analyst. Analyze content for potential scams and fraud with high accuracy. Always respond in valid JSON format with the following structure:
              {
                "isScam": boolean,
                "confidence": number (0-1),
                "riskLevel": "safe" | "suspicious" | "likely_scam" | "confirmed_scam",
                "threatTypes": array of threat types,
                "reasoning": "detailed explanation",
                "recommendations": array of action recommendations,
                "detectedPatterns": array of pattern objects
              }`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`GPT-4 API error: ${response.status}`);
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);
      
      const processingTime = Date.now() - startTime;

      return {
        id: `gpt4_${Date.now()}`,
        ...analysis,
        modelUsed: 'gpt4',
        processingTime,
        timestamp: new Date(),
      };

    } catch (error) {
      logger.error('GPT-4 analysis failed:', error);
      throw new AIAnalysisError('GPT-4 analysis failed', 'gpt4', error);
    }
  }

  private buildAnalysisPrompt(request: AIAnalysisRequest): string {
    const context = request.metadata ? JSON.stringify(request.metadata) : 'None';
    
    return `
    Analyze the following ${request.type} for potential scam indicators:

    Content: "${request.content}"
    Type: ${request.type}
    Context: ${context}
    Urgency: ${request.urgency || 'medium'}

    Consider these scam patterns:
    ${JSON.stringify(SCAM_PATTERNS, null, 2)}

    Provide detailed analysis focusing on:
    1. Language patterns and psychological manipulation
    2. Technical indicators (URLs, sender info, etc.)
    3. Common scam characteristics
    4. Risk assessment based on content and context
    5. Actionable recommendations for the user

    Be thorough but concise in your reasoning.
    `;
  }
}

// Claude AI Analysis Service
class ClaudeAnalysisService {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeContent(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildAnalysisPrompt(request);
      
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      const analysis = JSON.parse(data.content[0].text);
      
      const processingTime = Date.now() - startTime;

      return {
        id: `claude_${Date.now()}`,
        ...analysis,
        modelUsed: 'claude',
        processingTime,
        timestamp: new Date(),
      };

    } catch (error) {
      logger.error('Claude analysis failed:', error);
      throw new AIAnalysisError('Claude analysis failed', 'claude', error);
    }
  }

  private buildAnalysisPrompt(request: AIAnalysisRequest): string {
    const context = request.metadata ? JSON.stringify(request.metadata) : 'None';
    
    return `
    I need you to analyze this ${request.type} content for potential scam indicators. Please respond only in valid JSON format.

    Content to analyze: "${request.content}"
    Type: ${request.type}
    Metadata: ${context}
    Urgency Level: ${request.urgency || 'medium'}

    Known scam patterns to check against:
    ${JSON.stringify(SCAM_PATTERNS, null, 2)}

    Please analyze and respond with this exact JSON structure:
    {
      "isScam": boolean,
      "confidence": number between 0 and 1,
      "riskLevel": one of "safe", "suspicious", "likely_scam", "confirmed_scam",
      "threatTypes": array of relevant threat types,
      "reasoning": "detailed explanation of your analysis",
      "recommendations": array of specific action recommendations,
      "detectedPatterns": array of objects with "type", "description", "severity", "examples"
    }

    Focus on:
    - Language analysis and manipulation techniques
    - Technical red flags (suspicious URLs, sender patterns)
    - Psychological pressure tactics
    - Common fraud indicators
    - User safety recommendations
    `;
  }
}

// Custom ML Model Service
class CustomMLService {
  private endpoint: string;
  private apiKey: string;

  constructor(endpoint: string, apiKey: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async analyzeContent(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    
    try {
      const features = this.extractFeatures(request);
      
      const response = await fetch(`${this.endpoint}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: request.content,
          type: request.type,
          features,
          metadata: request.metadata,
        }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Custom ML API error: ${response.status}`);
      }

      const analysis = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        id: `custom_${Date.now()}`,
        ...analysis,
        modelUsed: 'custom_ml',
        processingTime,
        timestamp: new Date(),
      };

    } catch (error) {
      logger.error('Custom ML analysis failed:', error);
      throw new AIAnalysisError('Custom ML analysis failed', 'custom_ml', error);
    }
  }

  private extractFeatures(request: AIAnalysisRequest): Record<string, any> {
    const content = request.content.toLowerCase();
    
    return {
      // Text features
      wordCount: content.split(' ').length,
      charCount: content.length,
      uppercaseRatio: (content.match(/[A-Z]/g) || []).length / content.length,
      exclamationCount: (content.match(/!/g) || []).length,
      questionCount: (content.match(/\?/g) || []).length,
      
      // URL features
      urlCount: (content.match(/https?:\/\/[^\s]+/g) || []).length,
      shortUrlCount: (content.match(/bit\.ly|tinyurl|t\.co/g) || []).length,
      ipAddress: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(content),
      
      // Pattern features
      hasUrgentWords: /urgent|immediate|asap|expire|limited|act now/i.test(content),
      hasMoneyWords: /money|cash|payment|transfer|wire|bitcoin/i.test(content),
      hasPhoneNumber: /\d{3}-?\d{3}-?\d{4}/.test(content),
      hasEmail: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content),
      
      // Scam indicators
      hasClickHere: /click here|click now|tap here/i.test(content),
      hasVerifyAccount: /verify.{0,20}account|confirm.{0,20}identity/i.test(content),
      hasSuspendedAccount: /suspend|lock|freeze|block/i.test(content),
      
      // Metadata features
      senderTrust: this.calculateSenderTrust(request.metadata?.sender),
      domainAge: this.estimateDomainAge(request.metadata?.domain),
      timeOfDay: new Date().getHours(),
    };
  }

  private calculateSenderTrust(sender?: string): number {
    if (!sender) return 0.5;
    
    // Simple trust scoring based on sender characteristics
    const knownDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'apple.com', 'microsoft.com'];
    const domain = sender.split('@')[1]?.toLowerCase();
    
    if (knownDomains.includes(domain)) return 0.7;
    if (domain && domain.includes('bank')) return 0.8;
    if (domain && domain.length < 5) return 0.2;
    
    return 0.5;
  }

  private estimateDomainAge(domain?: string): number {
    if (!domain) return 0.5;
    
    // Simplified domain age estimation
    // In production, this would use a domain age API
    const wellKnownDomains = [
      'google.com', 'microsoft.com', 'apple.com', 'amazon.com',
      'facebook.com', 'twitter.com', 'linkedin.com'
    ];
    
    if (wellKnownDomains.includes(domain.toLowerCase())) return 1.0;
    if (domain.includes('.gov') || domain.includes('.edu')) return 0.9;
    
    return Math.random() * 0.5 + 0.5; // Random for demo
  }
}

// Ensemble AI Service (combines multiple models)
class AIEnsembleService {
  private gpt4Service: GPT4AnalysisService;
  private claudeService: ClaudeAnalysisService;
  private customMLService: CustomMLService;
  private cache = new Map<string, AIAnalysisResult>();

  constructor(config: AIServiceConfig) {
    this.gpt4Service = new GPT4AnalysisService(config.openai.apiKey);
    this.claudeService = new ClaudeAnalysisService(config.anthropic.apiKey);
    this.customMLService = new CustomMLService(config.customML.endpoint, config.customML.apiKey);
  }

  async analyzeContent(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const cacheKey = this.getCacheKey(request);
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      logger.info('Returning cached AI analysis');
      return this.cache.get(cacheKey)!;
    }

    const startTime = Date.now();
    const results: AIAnalysisResult[] = [];
    const errors: Error[] = [];

    // Run analyses in parallel with error handling
    const analyses = await Promise.allSettled([
      this.gpt4Service.analyzeContent(request).catch(err => {
        errors.push(err);
        return null;
      }),
      this.claudeService.analyzeContent(request).catch(err => {
        errors.push(err);
        return null;
      }),
      this.customMLService.analyzeContent(request).catch(err => {
        errors.push(err);
        return null;
      })
    ]);

    // Collect successful results
    analyses.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    });

    if (results.length === 0) {
      throw new AIAnalysisError('All AI models failed', 'ensemble', errors);
    }

    // Combine results using ensemble logic
    const ensembleResult = this.combineResults(results, request);
    ensembleResult.processingTime = Date.now() - startTime;

    // Cache result
    this.cache.set(cacheKey, ensembleResult);
    setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000); // 5 min cache

    return ensembleResult;
  }

  private combineResults(results: AIAnalysisResult[], request: AIAnalysisRequest): AIAnalysisResult {
    const weights = {
      gpt4: 0.4,
      claude: 0.4,
      custom_ml: 0.2
    };

    // Calculate weighted confidence
    let totalConfidence = 0;
    let totalWeight = 0;

    results.forEach(result => {
      const weight = weights[result.modelUsed] || 0.33;
      totalConfidence += result.confidence * weight;
      totalWeight += weight;
    });

    const averageConfidence = totalConfidence / totalWeight;

    // Determine consensus on scam detection
    const scamVotes = results.filter(r => r.isScam).length;
    const isScam = scamVotes > results.length / 2;

    // Combine threat types
    const allThreatTypes = new Set<ThreatType>();
    results.forEach(result => {
      result.threatTypes.forEach(type => allThreatTypes.add(type));
    });

    // Combine patterns
    const allPatterns = new Set<DetectedPattern>();
    results.forEach(result => {
      result.detectedPatterns.forEach(pattern => allPatterns.add(pattern));
    });

    // Determine risk level based on consensus
    const riskLevel = this.determineRiskLevel(isScam, averageConfidence, results);

    // Combine recommendations
    const allRecommendations = new Set<string>();
    results.forEach(result => {
      result.recommendations.forEach(rec => allRecommendations.add(rec));
    });

    // Generate ensemble reasoning
    const reasoning = this.generateEnsembleReasoning(results, isScam, averageConfidence);

    return {
      id: `ensemble_${Date.now()}`,
      isScam,
      confidence: averageConfidence,
      riskLevel,
      threatTypes: Array.from(allThreatTypes),
      reasoning,
      recommendations: Array.from(allRecommendations),
      detectedPatterns: Array.from(allPatterns),
      modelUsed: 'ensemble',
      processingTime: 0, // Will be set by caller
      timestamp: new Date(),
    };
  }

  private determineRiskLevel(
    isScam: boolean, 
    confidence: number, 
    results: AIAnalysisResult[]
  ): AIAnalysisResult['riskLevel'] {
    if (!isScam && confidence < 0.3) return 'safe';
    if (!isScam && confidence < 0.7) return 'suspicious';
    if (isScam && confidence < 0.8) return 'likely_scam';
    return 'confirmed_scam';
  }

  private generateEnsembleReasoning(
    results: AIAnalysisResult[], 
    isScam: boolean, 
    confidence: number
  ): string {
    const modelCount = results.length;
    const scamCount = results.filter(r => r.isScam).length;
    
    let reasoning = `Ensemble analysis of ${modelCount} AI models. `;
    reasoning += `${scamCount}/${modelCount} models detected this as a scam. `;
    reasoning += `Average confidence: ${(confidence * 100).toFixed(1)}%. `;
    
    if (results.length > 1) {
      const confidenceRange = Math.max(...results.map(r => r.confidence)) - 
                             Math.min(...results.map(r => r.confidence));
      reasoning += `Confidence range: ${(confidenceRange * 100).toFixed(1)}% `;
      reasoning += confidenceRange < 0.2 ? '(high agreement).' : '(models disagree).';
    }

    return reasoning;
  }

  private getCacheKey(request: AIAnalysisRequest): string {
    return `${request.type}_${btoa(request.content).slice(0, 50)}`;
  }
}

// Custom Error Class
class AIAnalysisError extends Error {
  constructor(
    message: string, 
    public modelType: string, 
    public originalError?: any
  ) {
    super(message);
    this.name = 'AIAnalysisError';
  }
}

// Main AI Service
export class AIService {
  private ensembleService: AIEnsembleService;
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.ensembleService = new AIEnsembleService(config);
  }

  async analyzeContent(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    try {
      // Validate request
      this.validateRequest(request);

      // Add request to queue if rate limited
      await this.checkRateLimit();

      // Perform analysis
      const result = await this.ensembleService.analyzeContent(request);

      // Log analysis for monitoring
      logger.info('AI analysis completed', {
        type: request.type,
        isScam: result.isScam,
        confidence: result.confidence,
        modelUsed: result.modelUsed,
        processingTime: result.processingTime
      });

      return result;

    } catch (error) {
      logger.error('AI analysis failed', error);
      throw error;
    }
  }

  async batchAnalyze(requests: AIAnalysisRequest[]): Promise<AIAnalysisResult[]> {
    const batchSize = 10;
    const results: AIAnalysisResult[] = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(request => this.analyzeContent(request))
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          logger.error(`Batch analysis failed for item ${i + index}:`, result.reason);
          // Add fallback result
          results.push(this.createFallbackResult(batch[index]));
        }
      });
    }

    return results;
  }

  private validateRequest(request: AIAnalysisRequest): void {
    if (!request.content || request.content.trim().length === 0) {
      throw new Error('Content is required for AI analysis');
    }

    if (!request.type) {
      throw new Error('Content type is required for AI analysis');
    }

    if (request.content.length > 10000) {
      throw new Error('Content too long for AI analysis (max 10,000 characters)');
    }
  }

  private async checkRateLimit(): Promise<void> {
    // Simple rate limiting implementation
    // In production, this would use Redis or similar
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // This is a simplified implementation
    // Real rate limiting would be more sophisticated
    return Promise.resolve();
  }

  private createFallbackResult(request: AIAnalysisRequest): AIAnalysisResult {
    return {
      id: `fallback_${Date.now()}`,
      isScam: false,
      confidence: 0.1,
      riskLevel: 'suspicious',
      threatTypes: [],
      reasoning: 'AI analysis unavailable. Manual review recommended.',
      recommendations: ['Review content manually', 'Exercise caution'],
      detectedPatterns: [],
      modelUsed: 'ensemble',
      processingTime: 0,
      timestamp: new Date(),
    };
  }
}

// Export types and service
export { AIAnalysisError, AIEnsembleService, GPT4AnalysisService, ClaudeAnalysisService, CustomMLService };
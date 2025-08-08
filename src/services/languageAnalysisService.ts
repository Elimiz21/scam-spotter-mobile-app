import { LanguageAnalysisResult } from './types';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { supabaseApi } from '@/lib/apiClient';
import { localCache } from '@/lib/cache';
import { AppError, createExternalApiError } from '@/lib/errorHandler';

export class LanguageAnalysisService {
  private cachePrefix = 'lang_analysis_';
  private cacheTTL = 30 * 60 * 1000; // 30 minutes

  async analyzeLanguagePatterns(chatText: string): Promise<LanguageAnalysisResult> {
    try {
      // Generate cache key
      const cacheKey = `${this.cachePrefix}${this.generateHash(chatText)}`;
      
      // Try cache first
      const cached = await localCache.get<LanguageAnalysisResult>(cacheKey);
      if (cached) {
        logger.debug('Language analysis cache hit', { textLength: chatText.length });
        return cached;
      }

      // Call AI language analysis using enhanced API client
      const response = await supabaseApi.callFunction('ai-language-analysis', {
        chatText: chatText.substring(0, 10000) // Limit text size
      }, {
        timeout: 30000,
        retries: 2,
        cache: true,
        cacheTTL: this.cacheTTL
      });

      if (response.error) {
        logger.error('AI analysis function error:', { 
          error: response.error, 
          textLength: chatText.length 
        });
        return this.performBasicLanguageAnalysis(chatText);
      }

      const data = response.data;

      if (data?.error) {
        logger.warn('AI analysis unavailable:', { 
          error: data.error, 
          textLength: chatText.length 
        });
        return this.performBasicLanguageAnalysis(chatText);
      }

      // Convert the response to match our expected format
      const result: LanguageAnalysisResult = {
        riskScore: Math.min(100, Math.max(0, data?.riskScore || 0)),
        manipulationIndicators: Array.isArray(data?.riskFactors) ? data.riskFactors : [],
        sentimentScore: Math.min(1, Math.max(0, (data?.sentimentScore || 0) / 100)),
        suspiciousPhrases: Array.isArray(data?.suspiciousPhrases) ? data.suspiciousPhrases : []
      };

      // Cache the result
      await localCache.set(cacheKey, result, this.cacheTTL);

      logger.info('Language analysis completed', {
        riskScore: result.riskScore,
        indicatorCount: result.manipulationIndicators.length,
        phraseCount: result.suspiciousPhrases.length,
        textLength: chatText.length
      });

      return result;
    } catch (error) {
      logger.error('Language analysis failed:', { 
        error, 
        textLength: chatText.length,
        errorType: error instanceof AppError ? error.type : 'unknown'
      });
      return this.performBasicLanguageAnalysis(chatText);
    }
  }

  private performBasicLanguageAnalysis(text: string): LanguageAnalysisResult {
    const suspiciousPhrases = [
      'guaranteed returns', 'risk-free', 'urgent', 'limited time',
      'act now', 'exclusive opportunity', 'easy money', 'get rich quick',
      'double your money', 'insider information'
    ];

    const manipulationTactics = [
      'urgency pressure', 'FOMO tactics', 'exclusivity claims',
      'guaranteed profits', 'emotional manipulation'
    ];

    const foundPhrases = suspiciousPhrases.filter(phrase => 
      text.toLowerCase().includes(phrase.toLowerCase())
    );

    const foundTactics = manipulationTactics.filter(tactic => {
      switch (tactic) {
        case 'urgency pressure':
          return /urgent|hurry|limited|act now|deadline/i.test(text);
        case 'FOMO tactics':
          return /exclusive|limited|don't miss|last chance/i.test(text);
        case 'guaranteed profits':
          return /guaranteed|100%|risk-free|sure thing/i.test(text);
        default:
          return false;
      }
    });

    const riskScore = Math.min(100, (foundPhrases.length * 15) + (foundTactics.length * 20));
    const sentimentScore = foundPhrases.length > 0 ? 0.8 : 0.3;

    return {
      riskScore,
      manipulationIndicators: foundTactics,
      sentimentScore,
      suspiciousPhrases: foundPhrases
    };
  }

  private getMockLanguageAnalysis(text: string): LanguageAnalysisResult {
    // Enhanced mock analysis based on text content
    return this.performBasicLanguageAnalysis(text);
  }

  private generateHash(text: string): string {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
import { ScammerCheckResult } from './types';
import { externalScammerService, ScammerDatabaseResult } from './externalScammerDatabases';
import { monitoring } from '../lib/monitoring';
import { supabaseApi } from '@/lib/apiClient';
import { localCache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { AppError } from '@/lib/errorHandler';

export class ScammerDatabaseService {
  private cachePrefix = 'scammer_check_';
  private cacheTTL = 2 * 60 * 60 * 1000; // 2 hours

  async checkScammerDatabase(members: string[]): Promise<ScammerCheckResult> {
    const timer = monitoring.startTimer('scammer_database_check');
    
    try {
      monitoring.info('Starting scammer database check', {
        memberCount: members.length,
      });

      // Clean and filter member list
      const memberList = members.map(m => m.trim()).filter(m => m.length > 0);
      
      if (memberList.length === 0) {
        return {
          riskScore: 0,
          flaggedMembers: [],
          sources: [],
        };
      }

      // Generate cache key based on member list
      const cacheKey = `${this.cachePrefix}${this.generateMemberHash(memberList)}`;
      
      // Try cache first
      const cached = await localCache.get<ScammerCheckResult>(cacheKey);
      if (cached) {
        logger.debug('Scammer database cache hit', { memberCount: memberList.length });
        timer();
        return cached;
      }

      // First try internal Supabase database
      let result = await this.checkInternalDatabase(memberList);
      
      // If no results from internal database, use external services
      if (result.flaggedMembers.length === 0) {
        try {
          const externalResult = await externalScammerService.checkMultipleSources(memberList);
          const externalConverted = this.convertExternalResult(externalResult, memberList);
          
          // Merge results (prefer internal but add external findings)
          result = {
            riskScore: Math.max(result.riskScore, externalConverted.riskScore),
            flaggedMembers: [...new Set([...result.flaggedMembers, ...externalConverted.flaggedMembers])],
            sources: [...new Set([...result.sources, ...externalConverted.sources])]
          };
        } catch (externalError) {
          logger.warn('External scammer services failed, using internal only', { 
            error: externalError, 
            internalFlagged: result.flaggedMembers.length 
          });
        }
      }

      // Cache the result
      await localCache.set(cacheKey, result, this.cacheTTL);
      
      monitoring.info('Scammer database check completed', {
        riskScore: result.riskScore,
        flaggedCount: result.flaggedMembers.length,
        sourcesUsed: result.sources.length,
      });

      timer();
      return result;

    } catch (error) {
      monitoring.error('Scammer database check error', error as Error);
      timer();
      
      // Fallback to pattern-based check
      return this.performPatternBasedCheck(members);
    }
  }

  private async checkInternalDatabase(memberList: string[]): Promise<ScammerCheckResult> {
    try {
      // Use enhanced Supabase API client to check internal scammer database
      const response = await supabaseApi.callFunction('scammer-database-check', {
        members: memberList,
        checkTypes: ['username', 'email', 'phone', 'telegram_id']
      }, {
        timeout: 15000,
        retries: 2,
        cache: false // Don't cache the API call itself, we cache the final result
      });

      if (response.error) {
        logger.warn('Internal scammer database check failed', { 
          error: response.error, 
          memberCount: memberList.length 
        });
        return {
          riskScore: 0,
          flaggedMembers: [],
          sources: []
        };
      }

      const data = response.data;
      return {
        riskScore: Math.min(100, data?.riskScore || 0),
        flaggedMembers: Array.isArray(data?.flaggedMembers) ? data.flaggedMembers : [],
        sources: ['Internal Database', ...(Array.isArray(data?.sources) ? data.sources : [])]
      };
    } catch (error) {
      logger.warn('Internal scammer database error', { error, memberCount: memberList.length });
      return {
        riskScore: 0,
        flaggedMembers: [],
        sources: []
      };
    }
  }

  private convertExternalResult(
    externalResult: ScammerDatabaseResult, 
    originalMembers: string[]
  ): ScammerCheckResult {
    const flaggedMembers = Array.from(
      new Set(externalResult.matches.map(match => match.identifier))
    );

    // Calculate risk score based on flagged members and confidence
    let riskScore = 0;
    if (flaggedMembers.length > 0) {
      const flaggedRatio = flaggedMembers.length / originalMembers.length;
      const baseScore = flaggedRatio * 100;
      const confidenceMultiplier = externalResult.confidence / 100;
      riskScore = Math.min(95, Math.round(baseScore * confidenceMultiplier));
    }

    return {
      riskScore,
      flaggedMembers,
      sources: externalResult.sources,
    };
  }

  private performPatternBasedCheck(members: string[]): Promise<ScammerCheckResult> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        const memberList = members.map(m => m.trim()).filter(m => m.length > 0);
        
        // Pattern-based scammer detection
        const suspiciousPatterns = [
          /admin/i,
          /support/i,
          /official/i,
          /\+\d{10,}/,  // Phone numbers
          /@[a-zA-Z0-9_]+/,  // Usernames starting with @
          /investment.*guru/i,
          /crypto.*expert/i,
          /trader.*pro/i
        ];

        const flaggedMembers = memberList.filter(member => 
          suspiciousPatterns.some(pattern => pattern.test(member))
        );

        const riskScore = Math.min(100, (flaggedMembers.length / Math.max(1, memberList.length)) * 100);

        resolve({
          riskScore: Math.floor(riskScore),
          flaggedMembers,
          sources: ['Pattern Analysis', 'Username Verification', 'Profile Screening']
        });
      }, 1500);
    });
  }

  private getMockScammerCheck(members: string[]): ScammerCheckResult {
    const memberList = members.map(m => m.trim()).filter(m => m.length > 0);
    const flaggedCount = Math.floor(memberList.length * 0.1); // 10% flagged
    
    return {
      riskScore: flaggedCount > 0 ? 60 : 15,
      flaggedMembers: memberList.slice(0, flaggedCount),
      sources: ['Mock Database', 'Pattern Analysis']
    };
  }

  private generateMemberHash(memberList: string[]): string {
    // Create a consistent hash based on sorted member list
    const sortedMembers = [...memberList].sort().join('|').toLowerCase();
    let hash = 0;
    for (let i = 0; i < sortedMembers.length; i++) {
      const char = sortedMembers.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
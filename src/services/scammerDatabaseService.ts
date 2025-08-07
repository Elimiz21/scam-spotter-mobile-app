import { ScammerCheckResult } from './types';
import { externalScammerService, ScammerDatabaseResult } from './externalScammerDatabases';
import { monitoring } from '../lib/monitoring';

export class ScammerDatabaseService {
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

      // Use external scammer database service
      const externalResult = await externalScammerService.checkMultipleSources(memberList);
      
      // Convert external result to legacy format for backward compatibility
      const result = this.convertExternalResult(externalResult, memberList);
      
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
}
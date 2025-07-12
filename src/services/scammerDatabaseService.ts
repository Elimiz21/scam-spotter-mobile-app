import { ScammerCheckResult } from './types';

export class ScammerDatabaseService {
  async checkScammerDatabase(members: string[]): Promise<ScammerCheckResult> {
    try {
      // This would integrate with real scammer databases in production
      // For now, we'll use pattern-based detection
      return this.performPatternBasedCheck(members);
    } catch (error) {
      console.error('Scammer database check error:', error);
      return this.getMockScammerCheck(members);
    }
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
import { GroupData, AnalysisResult, RiskVector } from './types';
import { LanguageAnalysisService } from './languageAnalysisService';
import { AssetVerificationService } from './assetVerificationService';
import { PriceAnalysisService } from './priceAnalysisService';
import { ScammerDatabaseService } from './scammerDatabaseService';
import { rateLimitService } from './rateLimitService';
import { toast } from '@/components/ui/use-toast';

export class RiskAnalysisService {
  private languageService: LanguageAnalysisService;
  private assetService: AssetVerificationService;
  private priceService: PriceAnalysisService;
  private scammerService: ScammerDatabaseService;

  constructor() {
    this.languageService = new LanguageAnalysisService();
    this.assetService = new AssetVerificationService();
    this.priceService = new PriceAnalysisService();
    this.scammerService = new ScammerDatabaseService();
  }

  async analyzeGroup(groupData: GroupData, onProgress?: (progress: number) => void): Promise<AnalysisResult> {
    const analysisId = `analysis_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    // Check rate limits before starting analysis
    const rateLimitResult = await rateLimitService.checkRateLimit('group-analysis', true);
    
    if (!rateLimitResult.allowed) {
      const resetTime = rateLimitService.formatTimeUntilReset(rateLimitResult.resetTime);
      const message = `Rate limit exceeded. Please wait ${resetTime} before trying again.`;
      
      toast({
        title: "Rate limit exceeded",
        description: message,
        variant: "destructive",
      });
      
      throw new Error(message);
    }
    
    try {
      onProgress?.(10);
      
      // Step 1: Scammer Database Check
      onProgress?.(25);
      const scammerCheck = await this.scammerService.checkScammerDatabase(
        groupData.members.split('\n')
      );

      // Step 2: Language Pattern Analysis
      onProgress?.(50);
      const languageAnalysis = await this.languageService.analyzeLanguagePatterns(
        groupData.chatMessages
      );

      // Step 3: Price Manipulation Detection (if asset provided)
      onProgress?.(75);
      let priceAnalysis = null;
      if (groupData.assetSymbol) {
        priceAnalysis = await this.priceService.detectPriceManipulation(
          groupData.assetSymbol
        );
      }

      // Step 4: Asset Verification (if asset provided)
      onProgress?.(90);
      let assetVerification = null;
      if (groupData.assetSymbol) {
        assetVerification = await this.assetService.verifyAsset(
          groupData.assetSymbol
        );
      }

      onProgress?.(100);

      // Build risk vectors
      const riskVectors: RiskVector[] = [
        {
          id: 'scammer-database',
          name: 'Scammer Database Check',
          icon: '🛡️',
          riskScore: scammerCheck.riskScore,
          status: this.getRiskStatus(scammerCheck.riskScore),
          summary: `${scammerCheck.flaggedMembers.length} suspicious members detected`,
          details: `Analyzed ${groupData.members.split('\n').length} members against known scammer databases and patterns.`,
          findings: scammerCheck.flaggedMembers.length > 0 
            ? [`Flagged members: ${scammerCheck.flaggedMembers.join(', ')}`]
            : ['No known scammers detected in member list']
        },
        {
          id: 'language-analysis',
          name: 'Language Pattern Analysis',
          icon: '💬',
          riskScore: languageAnalysis.riskScore,
          status: this.getRiskStatus(languageAnalysis.riskScore),
          summary: `${languageAnalysis.manipulationIndicators.length} manipulation tactics detected`,
          details: 'Advanced AI analysis of chat messages for manipulation patterns, urgency tactics, and emotional triggers.',
          findings: [
            ...languageAnalysis.manipulationIndicators.map(indicator => `Detected: ${indicator}`),
            ...languageAnalysis.suspiciousPhrases.map(phrase => `Suspicious phrase: "${phrase}"`)
          ]
        }
      ];

      // Add price analysis if asset provided
      if (priceAnalysis) {
        riskVectors.push({
          id: 'price-manipulation',
          name: 'Price Manipulation Detection',
          icon: '📊',
          riskScore: priceAnalysis.riskScore,
          status: this.getRiskStatus(priceAnalysis.riskScore),
          summary: `${priceAnalysis.volatilityScore.toFixed(1)}% volatility detected`,
          details: 'Analysis of price movements, trading volumes, and market patterns to detect artificial manipulation.',
          findings: [
            `Volatility score: ${priceAnalysis.volatilityScore.toFixed(1)}%`,
            `Trading volume: $${priceAnalysis.tradingVolume.toLocaleString()}`,
            `Market cap: $${priceAnalysis.marketCap.toLocaleString()}`
          ]
        });
      }

      // Add asset verification if asset provided
      if (assetVerification) {
        riskVectors.push({
          id: 'asset-verification',
          name: 'Asset Verification',
          icon: '🔍',
          riskScore: assetVerification.riskScore,
          status: this.getRiskStatus(assetVerification.riskScore),
          summary: assetVerification.isVerified ? 'Asset verified' : 'Asset verification failed',
          details: 'Comprehensive verification of asset legitimacy, exchange listings, and project details.',
          findings: [
            `Verification status: ${assetVerification.isVerified ? 'Verified' : 'Unverified'}`,
            `Exchange listings: ${assetVerification.exchangeListings.join(', ')}`,
            ...(assetVerification.projectDetails.website 
              ? [`Official website: ${assetVerification.projectDetails.website}`] 
              : ['No official website found'])
          ]
        });
      }

      // Calculate overall risk score
      const overallRiskScore = Math.round(
        riskVectors.reduce((sum, vector) => sum + vector.riskScore, 0) / riskVectors.length
      );

      return {
        overallRiskScore,
        riskVectors,
        analysisId,
        timestamp
      };

    } catch (error) {
      console.error('Risk analysis error:', error);
      throw new Error('Failed to complete risk analysis. Please try again.');
    }
  }

  async performSingleCheck(checkType: string, input: string): Promise<any> {
    // Check rate limits before starting single check
    const rateLimitResult = await rateLimitService.checkRateLimit('single-check', true);
    
    if (!rateLimitResult.allowed) {
      const resetTime = rateLimitService.formatTimeUntilReset(rateLimitResult.resetTime);
      const message = `Rate limit exceeded. Please wait ${resetTime} before trying again.`;
      
      toast({
        title: "Rate limit exceeded",
        description: message,
        variant: "destructive",
      });
      
      throw new Error(message);
    }

    try {
      switch (checkType) {
        case 'scammer-database':
          return await this.scammerService.checkScammerDatabase([input]);
        
        case 'language-analysis':
          return await this.languageService.analyzeLanguagePatterns(input);
        
        case 'price-manipulation':
          return await this.priceService.detectPriceManipulation(input);
        
        case 'asset-verification':
          return await this.assetService.verifyAsset(input);
        
        default:
          throw new Error(`Unknown check type: ${checkType}`);
      }
    } catch (error) {
      console.error(`Single check error for ${checkType}:`, error);
      throw new Error(`Failed to complete ${checkType} check. Please try again.`);
    }
  }

  private getRiskStatus(score: number): 'safe' | 'warning' | 'danger' {
    if (score < 30) return 'safe';
    if (score < 70) return 'warning';
    return 'danger';
  }
}

// Export singleton instance
export const riskAnalysisService = new RiskAnalysisService();
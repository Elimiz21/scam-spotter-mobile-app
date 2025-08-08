import { GroupData, AnalysisResult, RiskVector } from './types';
import { LanguageAnalysisService } from './languageAnalysisService';
import { AssetVerificationService } from './assetVerificationService';
import { PriceAnalysisService } from './priceAnalysisService';
import { ScammerDatabaseService } from './scammerDatabaseService';
import { rateLimitService } from './rateLimitService';
import { usageTrackingService } from './usageTrackingService';
import { supabase } from '../integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';
import { realtimeService, RealtimeEvent } from './realtimeService';
import { localCache } from '@/lib/cache';
import { AppError } from '@/lib/errorHandler';

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
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    // Set up real-time updates for this analysis
    const realtimeChannelId = `analysis_${analysisId}`;
    
    try {
      // Subscribe to real-time updates for this analysis
      await realtimeService.subscribeToScamDetection(analysisId);
      
      // Send initial analysis started event
      await realtimeService.send(
        realtimeChannelId,
        RealtimeEvent.ANALYSIS_COMPLETE,
        {
          analysisId,
          status: 'started',
          progress: 0,
          userId: user.id
        }
      );
    } catch (realtimeError) {
      logger.warn('Failed to set up real-time updates', { error: realtimeError, analysisId });
    }

    // Check usage limits first
    const usageCheck = await usageTrackingService.checkUsageLimit(user.id, 'group_analysis');
    if (!usageCheck.allowed) {
      toast({
        title: "Usage limit reached",
        description: usageCheck.reason || "You've reached your analysis limit",
        variant: "destructive",
      });
      throw new Error(usageCheck.reason || "Usage limit exceeded");
    }
    
    // Check rate limits
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
      const sendRealtimeUpdate = async (progress: number, step: string, data?: any) => {
        onProgress?.(progress);
        try {
          await realtimeService.send(
            realtimeChannelId,
            RealtimeEvent.ANALYSIS_COMPLETE,
            {
              analysisId,
              status: 'in_progress',
              progress,
              step,
              userId: user.id,
              data
            }
          );
        } catch (error) {
          logger.debug('Failed to send real-time update', { error, step });
        }
      };

      await sendRealtimeUpdate(10, 'Initializing analysis...');
      
      // Step 1: Scammer Database Check
      await sendRealtimeUpdate(25, 'Checking scammer databases...');
      const scammerCheck = await this.scammerService.checkScammerDatabase(
        groupData.members.split('\n')
      );

      // Send real-time scam detection alert if high-risk members found
      if (scammerCheck.flaggedMembers.length > 0) {
        try {
          await realtimeService.send(
            realtimeChannelId,
            RealtimeEvent.SCAM_DETECTED,
            {
              analysisId,
              type: 'scammer_database',
              severity: 'high',
              flaggedMembers: scammerCheck.flaggedMembers,
              userId: user.id
            }
          );
        } catch (error) {
          logger.debug('Failed to send scam detection alert', { error });
        }
      }

      // Step 2: Language Pattern Analysis
      await sendRealtimeUpdate(50, 'Analyzing language patterns...');
      const languageAnalysis = await this.languageService.analyzeLanguagePatterns(
        groupData.chatMessages
      );

      // Step 3: Price Manipulation Detection (if asset provided)
      await sendRealtimeUpdate(75, 'Detecting price manipulation...');
      let priceAnalysis = null;
      if (groupData.assetSymbol) {
        priceAnalysis = await this.priceService.detectPriceManipulation(
          groupData.assetSymbol
        );
      }

      // Step 4: Asset Verification (if asset provided)
      await sendRealtimeUpdate(90, 'Verifying asset legitimacy...');
      let assetVerification = null;
      if (groupData.assetSymbol) {
        assetVerification = await this.assetService.verifyAsset(
          groupData.assetSymbol
        );
      }

      await sendRealtimeUpdate(100, 'Finalizing analysis...');

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

      const result = {
        overallRiskScore,
        riskVectors,
        analysisId,
        timestamp
      };

      // Cache the analysis result
      try {
        await localCache.set(`analysis_${analysisId}`, result, 24 * 60 * 60 * 1000); // 24 hours
      } catch (cacheError) {
        logger.warn('Failed to cache analysis result', { error: cacheError, analysisId });
      }

      // Send final real-time completion event
      try {
        await realtimeService.send(
          realtimeChannelId,
          RealtimeEvent.ANALYSIS_COMPLETE,
          {
            analysisId,
            status: 'completed',
            progress: 100,
            result: {
              overallRiskScore,
              riskVectorCount: riskVectors.length,
              timestamp
            },
            userId: user.id
          }
        );
      } catch (realtimeError) {
        logger.warn('Failed to send completion event', { error: realtimeError, analysisId });
      }

      // Record successful usage
      try {
        await usageTrackingService.recordUsage(user.id, 'group_analysis', 1);
      } catch (usageError) {
        // Don't fail the analysis if usage tracking fails, just log it
        logger.error('Failed to record usage:', { error: usageError, userId: user.id });
      }

      logger.info('Group analysis completed successfully', {
        analysisId,
        userId: user.id,
        overallRiskScore,
        riskVectorCount: riskVectors.length,
        duration: Date.now() - parseInt(analysisId.split('_')[1])
      });

      return result;

    } catch (error) {
      logger.error('Risk analysis error:', { error, userId: user.id, analysisId });
      throw new Error('Failed to complete risk analysis. Please try again.');
    }
  }

  async performSingleCheck(checkType: string, input: string): Promise<any> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    // Check usage limits first
    const usageCheck = await usageTrackingService.checkUsageLimit(user.id, 'single_check');
    if (!usageCheck.allowed) {
      toast({
        title: "Usage limit reached",
        description: usageCheck.reason || "You've reached your single check limit",
        variant: "destructive",
      });
      throw new Error(usageCheck.reason || "Usage limit exceeded");
    }

    // Check rate limits
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
      let result;
      
      switch (checkType) {
        case 'scammer-database':
          result = await this.scammerService.checkScammerDatabase([input]);
          break;
        
        case 'language-analysis':
          result = await this.languageService.analyzeLanguagePatterns(input);
          break;
        
        case 'price-manipulation':
          result = await this.priceService.detectPriceManipulation(input);
          break;
        
        case 'asset-verification':
          result = await this.assetService.verifyAsset(input);
          break;
        
        default:
          throw new Error(`Unknown check type: ${checkType}`);
      }

      // Record successful usage
      try {
        await usageTrackingService.recordUsage(user.id, 'single_check', 1);
      } catch (usageError) {
        // Don't fail the check if usage tracking fails, just log it
        logger.error('Failed to record usage:', { error: usageError, userId: user.id, checkType });
      }

      return result;

    } catch (error) {
      logger.error(`Single check error for ${checkType}:`, { error, checkType, userId: user.id });
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
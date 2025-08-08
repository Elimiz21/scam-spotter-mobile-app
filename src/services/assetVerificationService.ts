import { AssetVerificationResult } from './types';
import { logger } from '@/lib/logger';
import { externalApiClient } from '@/lib/apiClient';
import { localCache } from '@/lib/cache';
import { AppError, createExternalApiError } from '@/lib/errorHandler';

export class AssetVerificationService {
  private cachePrefix = 'asset_verification_';
  private cacheTTL = 60 * 60 * 1000; // 1 hour

  async verifyAsset(assetSymbol: string): Promise<AssetVerificationResult> {
    try {
      const normalizedSymbol = assetSymbol.toLowerCase().trim();
      const cacheKey = `${this.cachePrefix}${normalizedSymbol}`;

      // Try cache first
      const cached = await localCache.get<AssetVerificationResult>(cacheKey);
      if (cached) {
        logger.debug('Asset verification cache hit', { assetSymbol: normalizedSymbol });
        return cached;
      }

      // Use enhanced API client for external calls with retry and circuit breaker
      const response = await externalApiClient.get(
        `https://api.coingecko.com/api/v3/coins/${normalizedSymbol}`,
        {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: true,
          developer_data: true,
          sparkline: false
        },
        {
          timeout: 20000,
          retries: 3,
          cache: true,
          cacheTTL: this.cacheTTL,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ScamShield-App/1.0'
          }
        }
      );

      if (response.error) {
        logger.warn('CoinGecko API error for asset verification', { 
          error: response.error, 
          assetSymbol: normalizedSymbol 
        });
        
        // Try alternative verification methods
        const fallbackResult = await this.tryAlternativeVerification(normalizedSymbol);
        if (fallbackResult) {
          await localCache.set(cacheKey, fallbackResult, this.cacheTTL / 4); // Shorter cache for fallback
          return fallbackResult;
        }
        
        return this.performBasicAssetVerification(assetSymbol);
      }

      if (!response.data || !response.data.id) {
        logger.warn('Invalid asset data received', { assetSymbol: normalizedSymbol });
        return this.performBasicAssetVerification(assetSymbol);
      }

      const coinData = response.data;
      const result: AssetVerificationResult = {
        riskScore: this.calculateAssetRiskScore(coinData),
        isVerified: true,
        exchangeListings: this.extractExchangeListings(coinData),
        projectDetails: {
          website: coinData.links?.homepage?.[0] || undefined,
          whitepaper: coinData.links?.whitepaper || undefined,
          team: this.extractTeamInfo(coinData),
          description: coinData.description?.en?.substring(0, 500) || undefined,
          social: {
            twitter: coinData.links?.twitter_screen_name || undefined,
            telegram: coinData.links?.telegram_channel_identifier || undefined,
            github: coinData.links?.repos_url?.github?.[0] || undefined,
            discord: coinData.links?.chat_url?.find((url: string) => url.includes('discord')) || undefined
          }
        },
        marketData: {
          marketCap: coinData.market_data?.market_cap?.usd || 0,
          volume24h: coinData.market_data?.total_volume?.usd || 0,
          marketCapRank: coinData.market_data?.market_cap_rank || 0,
          price: coinData.market_data?.current_price?.usd || 0,
          priceChange24h: coinData.market_data?.price_change_percentage_24h || 0
        }
      };

      // Cache the result
      await localCache.set(cacheKey, result, this.cacheTTL);

      logger.info('Asset verification completed', {
        assetSymbol: normalizedSymbol,
        isVerified: result.isVerified,
        riskScore: result.riskScore,
        marketCapRank: result.marketData?.marketCapRank
      });

      return result;
    } catch (error) {
      logger.error('Asset verification failed:', { 
        error, 
        assetSymbol,
        errorType: error instanceof AppError ? error.type : 'unknown'
      });
      return this.performBasicAssetVerification(assetSymbol);
    }
  }

  private calculateAssetRiskScore(coinData: any): number {
    let riskScore = 0;

    // No market cap rank = higher risk
    if (!coinData.market_data?.market_cap_rank) {
      riskScore += 30;
    } else if (coinData.market_data.market_cap_rank > 1000) {
      riskScore += 20;
    }

    // No official website = higher risk
    if (!coinData.links?.homepage?.[0]) {
      riskScore += 25;
    }

    // Low trading volume = higher risk
    if (coinData.market_data?.total_volume?.usd < 1000000) {
      riskScore += 20;
    }

    // No whitepaper = higher risk
    if (!coinData.links?.whitepaper) {
      riskScore += 15;
    }

    return Math.min(100, riskScore);
  }

  private performBasicAssetVerification(assetSymbol: string): AssetVerificationResult {
    // Basic verification based on symbol patterns
    const commonScamPatterns = [
      'safe', 'moon', 'doge', 'shib', 'floki', 'elon', 'baby', 'mini'
    ];

    const hasScamPattern = commonScamPatterns.some(pattern => 
      assetSymbol.toLowerCase().includes(pattern)
    );

    const riskScore = hasScamPattern ? 75 : 25;

    return {
      riskScore,
      isVerified: !hasScamPattern,
      exchangeListings: hasScamPattern ? ['Unknown/DEX Only'] : ['Verification Needed'],
      projectDetails: {
        website: undefined,
        whitepaper: undefined,
        team: []
      }
    };
  }

  private async tryAlternativeVerification(assetSymbol: string): Promise<AssetVerificationResult | null> {
    try {
      // Try CoinMarketCap API as fallback (if available)
      // For now, return null to fallback to basic verification
      logger.debug('Alternative verification methods not available', { assetSymbol });
      return null;
    } catch (error) {
      logger.debug('Alternative verification failed', { error, assetSymbol });
      return null;
    }
  }

  private extractExchangeListings(coinData: any): string[] {
    const exchanges: string[] = [];
    
    if (coinData.market_data?.market_cap_rank && coinData.market_data.market_cap_rank <= 100) {
      exchanges.push('Major Exchanges');
    }
    
    if (coinData.tickers && Array.isArray(coinData.tickers)) {
      const uniqueExchanges = new Set<string>();
      coinData.tickers.slice(0, 10).forEach((ticker: any) => {
        if (ticker.market?.name) {
          uniqueExchanges.add(ticker.market.name);
        }
      });
      exchanges.push(...Array.from(uniqueExchanges));
    }
    
    return exchanges.length > 0 ? exchanges : ['Unknown'];
  }

  private extractTeamInfo(coinData: any): any[] {
    // CoinGecko doesn't provide detailed team info in the basic API
    // This could be enhanced with additional API calls or data sources
    return [];
  }
}
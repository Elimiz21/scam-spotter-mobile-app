import { AssetVerificationResult } from './types';

export class AssetVerificationService {
  async verifyAsset(assetSymbol: string): Promise<AssetVerificationResult> {
    try {
      // Use CoinGecko API for crypto asset verification
      const coinGeckoResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/${assetSymbol.toLowerCase()}`
      );

      if (coinGeckoResponse.ok) {
        const coinData = await coinGeckoResponse.json();
        return {
          riskScore: this.calculateAssetRiskScore(coinData),
          isVerified: true,
          exchangeListings: coinData.market_data?.market_cap_rank ? ['Major Exchanges'] : ['Unknown'],
          projectDetails: {
            website: coinData.links?.homepage?.[0],
            whitepaper: coinData.links?.whitepaper,
            team: []
          }
        };
      }

      // Fallback to basic verification
      return this.performBasicAssetVerification(assetSymbol);
    } catch (error) {
      console.error('Asset verification error:', error);
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
}
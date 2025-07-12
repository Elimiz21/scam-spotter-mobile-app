export interface GroupData {
  platform: string;
  groupName: string;
  members: string;
  chatMessages: string;
  assetSymbol?: string;
}

export interface RiskVector {
  id: string;
  name: string;
  icon: string;
  riskScore: number;
  status: 'safe' | 'warning' | 'danger';
  summary: string;
  details: string;
  findings: string[];
}

export interface AnalysisResult {
  overallRiskScore: number;
  riskVectors: RiskVector[];
  analysisId: string;
  timestamp: string;
}

export interface ScammerCheckResult {
  riskScore: number;
  flaggedMembers: string[];
  sources: string[];
}

export interface LanguageAnalysisResult {
  riskScore: number;
  manipulationIndicators: string[];
  sentimentScore: number;
  suspiciousPhrases: string[];
}

export interface PriceAnalysisResult {
  riskScore: number;
  volatilityScore: number;
  marketCap: number;
  tradingVolume: number;
  priceHistory: Array<{ date: string; price: number }>;
}

export interface AssetVerificationResult {
  riskScore: number;
  isVerified: boolean;
  exchangeListings: string[];
  projectDetails: {
    website?: string;
    whitepaper?: string;
    team?: string[];
  };
}
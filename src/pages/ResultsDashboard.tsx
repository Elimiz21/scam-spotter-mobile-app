import { useState } from "react";
import { ArrowLeft, AlertTriangle, Shield, Info, TrendingUp, Users, Database, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate, useLocation } from "react-router-dom";

interface RiskVector {
  id: string;
  name: string;
  icon: any;
  riskScore: number;
  status: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  details: string;
  findings: string[];
}

const ResultsDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedVector, setSelectedVector] = useState<RiskVector | null>(null);
  
  // Mock analysis results - in real app this would come from API
  const analysisResults: RiskVector[] = [
    {
      id: "scammer-check",
      name: "Scammer Database",
      icon: Database,
      riskScore: 85,
      status: "critical",
      summary: "2 members found in scammer databases",
      details: "Cross-referenced 12 group members against known scammer databases and found 2 matches with high confidence.",
      findings: [
        "User '@crypto_expert123' found in ScamAlert database (Confidence: 94%)",
        "Phone number +1-555-0199 linked to 3 previous scam reports",
        "10 members have no negative records",
        "Database coverage: ScamAlert, BBB, FTC reports"
      ]
    },
    {
      id: "language-analysis", 
      name: "Language Patterns",
      icon: Users,
      riskScore: 72,
      status: "high",
      summary: "High-pressure tactics and manipulation detected",
      details: "AI analysis detected multiple manipulation tactics and scam language patterns in group communications.",
      findings: [
        "Urgency pressure: 'Act fast!' mentioned 8 times",
        "Guaranteed returns promises: 4 instances detected", 
        "Fear of missing out (FOMO) tactics: 6 instances",
        "Emotional manipulation score: 8.2/10",
        "Typical pump-and-dump language patterns found"
      ]
    },
    {
      id: "price-manipulation",
      name: "Price Manipulation", 
      icon: TrendingUp,
      riskScore: 45,
      status: "medium",
      summary: "Moderate price volatility detected",
      details: "Analysis of trading patterns shows some unusual activity but not extreme manipulation indicators.",
      findings: [
        "Price volatility: 23% above normal range",
        "Volume spike detected 2 days ago (+340%)",
        "No coordinated pump pattern found",
        "Trading behavior within normal parameters",
        "Price correlation with group activity: Low"
      ]
    },
    {
      id: "asset-verification",
      name: "Asset Verification",
      icon: Shield,
      riskScore: 15,
      status: "low", 
      summary: "Asset verified and legitimate",
      details: "The promoted asset exists and has legitimate trading history on major exchanges.",
      findings: [
        "Asset confirmed on 5 major exchanges",
        "Trading volume: $2.4M (24h)",
        "Market cap: $45M",
        "Project team verified",
        "No red flags in asset fundamentals"
      ]
    }
  ];

  const overallRiskScore = Math.round(
    analysisResults.reduce((sum, vector) => sum + vector.riskScore, 0) / analysisResults.length
  );

  const getRiskColor = (score: number) => {
    if (score >= 80) return "risk-critical";
    if (score >= 60) return "risk-high"; 
    if (score >= 40) return "risk-medium";
    return "risk-low";
  };

  const getRiskBadgeColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/analyze')}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Risk Analysis Results</h1>
                <p className="text-sm text-muted-foreground">Comprehensive scam detection report</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Overall Risk Score */}
        <Card className={`mb-8 ${getRiskColor(overallRiskScore)} border-2`}>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              {overallRiskScore >= 70 ? (
                <AlertTriangle className="w-12 h-12 text-current" />
              ) : (
                <Shield className="w-12 h-12 text-current" />
              )}
            </div>
            <CardTitle className="text-2xl">
              Overall Risk Score: {overallRiskScore}/100
            </CardTitle>
            <CardDescription className="text-current/80">
              {overallRiskScore >= 80 && "CRITICAL RISK - Avoid this group immediately"}
              {overallRiskScore >= 60 && overallRiskScore < 80 && "HIGH RISK - Exercise extreme caution"}
              {overallRiskScore >= 40 && overallRiskScore < 60 && "MEDIUM RISK - Proceed with caution"}
              {overallRiskScore < 40 && "LOW RISK - Group appears relatively safe"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={overallRiskScore} className="h-3" />
          </CardContent>
        </Card>

        {/* Risk Vectors Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {analysisResults.map((vector) => {
            const IconComponent = vector.icon;
            return (
              <Card 
                key={vector.id}
                className="card-elevated cursor-pointer hover:shadow-xl transition-all duration-200"
                onClick={() => setSelectedVector(vector)}
              >
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      vector.status === 'critical' ? 'bg-red-100 dark:bg-red-900/20' :
                      vector.status === 'high' ? 'bg-orange-100 dark:bg-orange-900/20' :
                      vector.status === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                      'bg-green-100 dark:bg-green-900/20'
                    }`}>
                      <IconComponent className={`w-5 h-5 ${
                        vector.status === 'critical' ? 'text-red-600 dark:text-red-400' :
                        vector.status === 'high' ? 'text-orange-600 dark:text-orange-400' :
                        vector.status === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-green-600 dark:text-green-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{vector.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getRiskBadgeColor(vector.status)}>
                          {vector.status.toUpperCase()}
                        </Badge>
                        <span className="text-2xl font-bold text-foreground">
                          {vector.riskScore}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {vector.summary}
                  </p>
                  <Progress value={vector.riskScore} className="h-2" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate('/analyze')}
            className="btn-financial"
          >
            Analyze Another Group
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/how-it-works')}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Learn About Our Analysis
          </Button>
        </div>

      </div>

      {/* Detailed Analysis Modal */}
      <Dialog open={!!selectedVector} onOpenChange={() => setSelectedVector(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedVector && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-3">
                  <selectedVector.icon className="w-6 h-6" />
                  <span>{selectedVector.name} Analysis</span>
                  <Badge className={getRiskBadgeColor(selectedVector.status)}>
                    {selectedVector.status.toUpperCase()} RISK
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedVector.details}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center space-x-2">
                    <Info className="w-4 h-4" />
                    <span>Detailed Findings</span>
                  </h4>
                  <ul className="space-y-2">
                    {selectedVector.findings.map((finding, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                        <span className="text-sm text-muted-foreground">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Risk Score Breakdown</h4>
                  <Progress value={selectedVector.riskScore} className="h-3 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Score: {selectedVector.riskScore}/100 - {selectedVector.status.toUpperCase()} risk level
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResultsDashboard;
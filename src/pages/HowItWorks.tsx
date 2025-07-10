import { ArrowLeft, Shield, Database, Users, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const HowItWorks = () => {
  const navigate = useNavigate();

  const analysisVectors = [
    {
      icon: Database,
      title: "Scammer Database Check",
      description: "Cross-reference against known fraud databases",
      process: [
        "Extract member names, usernames, and contact information",
        "Query multiple scammer databases (ScamAlert, BBB, FTC reports)", 
        "Check phone numbers against fraud reporting services",
        "Analyze account creation patterns and suspicious behaviors",
        "Generate confidence scores for each potential match"
      ],
      indicators: [
        "Previous scam reports or complaints",
        "Multiple identity variations", 
        "Suspicious account creation patterns",
        "Association with known fraudulent schemes"
      ]
    },
    {
      icon: Users,
      title: "Language Pattern Analysis", 
      description: "AI-powered detection of manipulation tactics",
      process: [
        "Parse group chat messages and communication patterns",
        "Identify urgency and pressure tactics ('Act now!', 'Limited time')",
        "Detect guaranteed return promises and unrealistic claims",
        "Analyze emotional manipulation techniques (FOMO, fear, greed)",
        "Compare against known scam communication patterns"
      ],
      indicators: [
        "High-pressure sales tactics",
        "Guaranteed or unrealistic return promises",
        "Emotional manipulation (urgency, fear, greed)",
        "Typical pump-and-dump language patterns",
        "Requests for secrecy or exclusive access"
      ]
    },
    {
      icon: TrendingUp,
      title: "Price Manipulation Detection",
      description: "Identify artificial price pumps and market manipulation",
      process: [
        "Analyze recent price and volume movements",
        "Compare trading patterns to historical norms",
        "Identify coordinated buying/selling activities", 
        "Detect unusual volume spikes correlating with group activity",
        "Cross-reference with pump-and-dump patterns"
      ],
      indicators: [
        "Unusual price volatility (>3x normal range)",
        "Volume spikes coinciding with group promotions",
        "Coordinated trading patterns",
        "Price movements inconsistent with market fundamentals",
        "Evidence of wash trading or artificial volume"
      ]
    },
    {
      icon: Shield,
      title: "Asset Verification",
      description: "Verify legitimacy of promoted investments",
      process: [
        "Check asset existence on major exchanges",
        "Verify project team and company registration",
        "Analyze trading volume and market capitalization",
        "Review project fundamentals and documentation",
        "Cross-check against known fraudulent tokens/schemes"
      ],
      indicators: [
        "Asset not found on legitimate exchanges",
        "Anonymous or unverified project team",
        "Missing or plagiarized documentation",
        "Extremely low liquidity or trading volume",
        "Previous history of rug pulls or exit scams"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">How Our Analysis Works</h1>
                <p className="text-sm text-muted-foreground">Understanding our scam detection methodology</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Introduction */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Multi-Vector Scam Detection</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our comprehensive analysis system examines investment groups across four critical dimensions 
            to identify potential scams and protect your investments.
          </p>
        </div>

        {/* Analysis Vectors */}
        <div className="space-y-12">
          {analysisVectors.map((vector, index) => {
            const IconComponent = vector.icon;
            return (
              <Card key={index} className="card-financial">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <span>{vector.title}</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    {vector.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  
                  {/* Analysis Process */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>How We Analyze</span>
                    </h4>
                    <ul className="space-y-2">
                      {vector.process.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mt-0.5">
                            <span className="text-xs font-medium text-primary">{stepIndex + 1}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Red Flags */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Red Flags We Detect</span>
                    </h4>
                    <ul className="space-y-2">
                      {vector.indicators.map((indicator, indicatorIndex) => (
                        <li key={indicatorIndex} className="flex items-start space-x-3">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2" />
                          <span className="text-sm text-muted-foreground">{indicator}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Risk Scoring */}
        <Card className="mt-12 card-financial">
          <CardHeader>
            <CardTitle className="text-xl">Risk Score Calculation</CardTitle>
            <CardDescription>
              How we combine multiple analysis vectors into a comprehensive risk assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">0-39</div>
                <div className="text-sm font-medium text-green-700 dark:text-green-300">LOW RISK</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">Generally safe</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">40-59</div>
                <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">MEDIUM RISK</div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Proceed with caution</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">60-79</div>
                <div className="text-sm font-medium text-orange-700 dark:text-orange-300">HIGH RISK</div>
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">Exercise extreme caution</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">80-100</div>
                <div className="text-sm font-medium text-red-700 dark:text-red-300">CRITICAL RISK</div>
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">Avoid immediately</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Our algorithm weighs each analysis vector based on severity and combines them into a final risk score. 
              Multiple high-risk indicators compound to create higher overall scores.
            </p>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-12">
          <h3 className="text-xl font-semibold mb-4">Ready to Analyze a Group?</h3>
          <Button 
            onClick={() => navigate('/analyze')}
            className="btn-financial text-lg px-8 py-4"
          >
            Start Analysis Now
          </Button>
        </div>

      </div>
    </div>
  );
};

export default HowItWorks;
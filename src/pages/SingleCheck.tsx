import { useState, useEffect } from "react";
import { ArrowLeft, Shield, AlertCircle } from "lucide-react";
import Navigation from "../components/Navigation";
import { ApiKeyDialog } from "../components/ApiKeyDialog";
import LegalDisclaimer from "../components/LegalDisclaimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SingleCheck = () => {
  const [checkType, setCheckType] = useState<string>("");
  const [inputData, setInputData] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    if (type) {
      setCheckType(type);
    }
  }, []);

  const handleCheck = async () => {
    // Check if OpenAI API key is available for enhanced analysis
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (!savedApiKey && (checkType === 'language-analysis' || checkType === 'price-manipulation')) {
      setShowApiKeyDialog(true);
      return;
    }

    performCheck(savedApiKey);
  };

  const performCheck = async (apiKey?: string) => {
    setIsAnalyzing(true);
    
    try {
      // Import the specific service based on check type
      let result;
      
      switch (checkType) {
        case 'scammer-database': {
          const { ScammerDatabaseService } = await import('../services/scammerDatabaseService');
          const service = new ScammerDatabaseService();
          const members = inputData.split(',').map(m => m.trim()).filter(Boolean);
          result = await service.checkScammerDatabase(members);
          break;
        }
        case 'language-analysis': {
          const { LanguageAnalysisService } = await import('../services/languageAnalysisService');
          const service = new LanguageAnalysisService(apiKey);
          result = await service.analyzeLanguagePatterns(inputData);
          break;
        }
        case 'price-manipulation': {
          const { PriceAnalysisService } = await import('../services/priceAnalysisService');
          const service = new PriceAnalysisService();
          result = await service.detectPriceManipulation(inputData);
          break;
        }
        case 'asset-verification': {
          const { AssetVerificationService } = await import('../services/assetVerificationService');
          const service = new AssetVerificationService();
          result = await service.verifyAsset(inputData);
          break;
        }
        default:
          throw new Error('Unknown check type');
      }

      localStorage.setItem('single_check_result', JSON.stringify({
        type: checkType,
        result: result,
        timestamp: new Date().toISOString()
      }));
      
      setIsAnalyzing(false);
      window.location.href = '/results';
    } catch (error) {
      console.error('Check failed:', error);
      setIsAnalyzing(false);
      alert('Check failed. Please try again.');
    }
  };

  const handleApiKeySave = (apiKey: string) => {
    localStorage.setItem('openai_api_key', apiKey);
    performCheck(apiKey);
  };

  const getCheckConfig = () => {
    switch (checkType) {
      case 'scammer-database':
        return {
          title: 'Scammer Database Check',
          description: 'Check names against known scammer databases',
          placeholder: 'Enter names (comma-separated)\nExample: John Smith, Maria Garcia, @crypto_expert123',
          inputType: 'textarea',
          icon: '🚨'
        };
      case 'language-analysis':
        return {
          title: 'Language Pattern Analysis',
          description: 'Analyze text for manipulation tactics and scam patterns',
          placeholder: 'Paste messages or text to analyze...\n\nExample:\nBig announcement coming! 🚀\nThis coin will 10x next week guaranteed!\nInside information, but act fast!',
          inputType: 'textarea',
          icon: '👥'
        };
      case 'price-manipulation':
        return {
          title: 'Price Manipulation Detection',
          description: 'Check for artificial price pumps and suspicious trading activity',
          placeholder: 'Enter asset symbol (e.g., BTC, AAPL, SAFEMOON)',
          inputType: 'input',
          icon: '📈'
        };
      case 'asset-verification':
        return {
          title: 'Asset Verification',
          description: 'Verify the legitimacy of investment assets',
          placeholder: 'Enter asset symbol or name (e.g., BTC, SafeMoon, XYZ Token)',
          inputType: 'input',
          icon: '🛡️'
        };
      default:
        return {
          title: 'Single Check',
          description: 'Perform a specific check',
          placeholder: 'Enter data to check',
          inputType: 'input',
          icon: '🔍'
        };
    }
  };

  const config = getCheckConfig();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.href = '/'}
              className="hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                {config.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{config.title}</h1>
                <p className="text-muted-foreground">{config.description}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Security Notice */}
          <Card className="border-financial-warning/20 bg-financial-warning/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-financial-warning/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-financial-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-financial-warning mb-2">
                    Security & Privacy Notice
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    All data is processed securely and deleted after analysis. We do not store personal information.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Check Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center text-white">
                  {config.icon}
                </div>
                Input Data for Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {config.inputType === 'textarea' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Enter text to analyze:
                    </label>
                    <Textarea
                      placeholder={config.placeholder}
                      value={inputData}
                      onChange={(e) => setInputData(e.target.value)}
                      className="min-h-[200px] font-mono resize-vertical"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Enter asset or identifier:
                    </label>
                    <Input
                      placeholder={config.placeholder}
                      value={inputData}
                      onChange={(e) => setInputData(e.target.value)}
                      className="text-base"
                    />
                  </div>
                )}

                <Button 
                  onClick={handleCheck}
                  disabled={!inputData.trim() || isAnalyzing}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-3" />
                      Start Security Check
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Progress */}
          {isAnalyzing && (
            <Card className="border-primary/20 bg-primary/5 animate-fade-in">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-2">Security Analysis in Progress</h3>
                    <p className="text-muted-foreground">Please wait while we perform comprehensive checks...</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-card rounded-lg">
                      <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                      <span className="text-sm">
                        {checkType === 'scammer-database' && 'Checking against known scammer databases...'}
                        {checkType === 'language-analysis' && 'Analyzing text patterns and manipulation tactics...'}
                        {checkType === 'price-manipulation' && 'Detecting price manipulation signals...'}
                        {checkType === 'asset-verification' && 'Verifying asset legitimacy and authenticity...'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-card rounded-lg">
                      <div className="w-3 h-3 bg-primary rounded-full animate-pulse delay-300" />
                      <span className="text-sm">Generating comprehensive analysis report...</span>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-card rounded-lg">
                      <div className="w-3 h-3 bg-primary rounded-full animate-pulse delay-500" />
                      <span className="text-sm">Calculating risk scores and recommendations...</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legal Disclaimer */}
          <div className="pt-4">
            <LegalDisclaimer variant="compact" />
          </div>

        </div>
      </div>

      <ApiKeyDialog
        isOpen={showApiKeyDialog}
        onClose={() => setShowApiKeyDialog(false)}
        onSave={handleApiKeySave}
      />
    </div>
  );
};

export default SingleCheck;
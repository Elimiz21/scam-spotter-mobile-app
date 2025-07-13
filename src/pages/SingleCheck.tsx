import { useState, useEffect } from "react";
import { ArrowLeft, Shield, AlertCircle } from "lucide-react";
import Navigation from "../components/Navigation";
import { ApiKeyDialog } from "../components/ApiKeyDialog";
import LegalDisclaimer from "../components/LegalDisclaimer";
import { Button } from "@/components/ui/button";

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
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50 p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.href = '/'}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-lg">
              {config.icon}
            </div>
            <div>
              <h1 className="text-lg font-semibold">{config.title}</h1>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        
        {/* Security Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 mb-1">
                Security Notice
              </p>
              <p className="text-sm text-yellow-700">
                All data is processed securely and deleted after analysis. We do not store personal information.
              </p>
            </div>
          </div>
        </div>

        {/* Check Form */}
        <div className="bg-card border rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">{config.icon}</span>
              Input Data
            </h2>
            <p className="text-muted-foreground text-sm">
              {config.description}
            </p>
          </div>
          
          <div className="space-y-4">
            {config.inputType === 'textarea' ? (
              <textarea
                placeholder={config.placeholder}
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                className="w-full min-h-[200px] p-3 border rounded-lg resize-vertical font-mono text-sm"
              />
            ) : (
              <input
                type="text"
                placeholder={config.placeholder}
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                className="w-full p-3 border rounded-lg text-sm"
              />
            )}

            <Button 
              onClick={handleCheck}
              disabled={!inputData.trim() || isAnalyzing}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  <span>Run Check</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="bg-card border rounded-xl p-6">
            <div className="space-y-4">
              <h3 className="font-medium text-center">Analysis in Progress</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-sm text-muted-foreground">
                    {checkType === 'scammer-database' && 'Checking against scammer databases...'}
                    {checkType === 'language-analysis' && 'Analyzing language patterns...'}
                    {checkType === 'price-manipulation' && 'Detecting price manipulation signals...'}
                    {checkType === 'asset-verification' && 'Verifying asset information...'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-300" />
                  <span className="text-sm text-muted-foreground">Generating analysis report...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legal Disclaimer */}
        <div className="mt-8">
          <LegalDisclaimer variant="compact" />
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
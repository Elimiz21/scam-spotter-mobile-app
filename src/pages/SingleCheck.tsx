import { useState, useEffect } from "react";
import { ArrowLeft, Shield, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    if (type) {
      setCheckType(type);
    }
  }, []);

  const handleCheck = async () => {
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
      navigate('/results');
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '20px' }}>
      <Navigation />
      
      {/* Header */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            background: '#f3f4f6',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            backgroundColor: '#3b82f6', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            {config.icon}
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
              {config.title}
            </h1>
            <p style={{ color: '#64748b', margin: 0 }}>
              {config.description}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '24px', 
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          Input Data for Analysis
        </h2>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            {config.inputType === 'textarea' ? 'Enter text to analyze:' : 'Enter asset or identifier:'}
          </label>
          
          {config.inputType === 'textarea' ? (
            <textarea
              placeholder={config.placeholder}
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}
            />
          ) : (
            <input
              type="text"
              placeholder={config.placeholder}
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          )}
        </div>

        <button 
          onClick={handleCheck}
          disabled={!inputData.trim() || isAnalyzing}
          style={{
            width: '100%',
            backgroundColor: isAnalyzing ? '#9ca3af' : '#3b82f6',
            color: 'white',
            padding: '12px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isAnalyzing ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%'
              }} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Shield size={20} />
              Start Security Check
            </>
          )}
        </button>
      </div>

      {isAnalyzing && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '8px',
          marginTop: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            Security Analysis in Progress
          </h3>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>
            Please wait while we perform comprehensive checks...
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '50%' }} />
              <span>
                {checkType === 'scammer-database' && 'Checking against known scammer databases...'}
                {checkType === 'language-analysis' && 'Analyzing text patterns and manipulation tactics...'}
                {checkType === 'price-manipulation' && 'Detecting price manipulation signals...'}
                {checkType === 'asset-verification' && 'Verifying asset legitimacy and authenticity...'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '50%' }} />
              <span>Generating comprehensive analysis report...</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '50%' }} />
              <span>Calculating risk scores and recommendations...</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <LegalDisclaimer variant="compact" />
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
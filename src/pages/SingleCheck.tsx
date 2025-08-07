import { useState, useEffect } from "react";
import { ArrowLeft, Shield, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Navigation from "../components/Navigation";
import LegalDisclaimer from "../components/LegalDisclaimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { singleCheckSchema, SingleCheckFormData, sanitizeInput } from "../lib/validations";
import storageManager from "../lib/storage";

const SingleCheck = () => {
  const [checkType, setCheckType] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  
  const form = useForm<SingleCheckFormData>({
    resolver: zodResolver(singleCheckSchema),
    defaultValues: {
      checkType: 'scammer-database' as const,
      input: '',
    },
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    if (type && ['scammer-database', 'language-analysis', 'price-manipulation', 'asset-verification'].includes(type)) {
      setCheckType(type);
      form.setValue('checkType', type as SingleCheckFormData['checkType']);
    }
  }, [form]);

  const onSubmit = async (data: SingleCheckFormData) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Sanitize input
      const sanitizedInput = sanitizeInput(data.input);
      
      let result;
      
      switch (data.checkType) {
        case 'scammer-database': {
          const { ScammerDatabaseService } = await import('../services/scammerDatabaseService');
          const service = new ScammerDatabaseService();
          const members = sanitizedInput.split(',').map(m => m.trim()).filter(Boolean);
          result = await service.checkScammerDatabase(members);
          break;
        }
        case 'language-analysis': {
          const { LanguageAnalysisService } = await import('../services/languageAnalysisService');
          const service = new LanguageAnalysisService();
          result = await service.analyzeLanguagePatterns(sanitizedInput);
          break;
        }
        case 'price-manipulation': {
          const { PriceAnalysisService } = await import('../services/priceAnalysisService');
          const service = new PriceAnalysisService();
          result = await service.detectPriceManipulation(sanitizedInput);
          break;
        }
        case 'asset-verification': {
          const { AssetVerificationService } = await import('../services/assetVerificationService');
          const service = new AssetVerificationService();
          result = await service.verifyAsset(sanitizedInput);
          break;
        }
        default:
          throw new Error('Unknown check type');
      }

      // Use storageManager instead of localStorage
      await storageManager.setPreference('single_check_result', {
        type: data.checkType,
        result: result,
        timestamp: new Date().toISOString()
      });
      
      setIsAnalyzing(false);
      navigate('/results');
    } catch (error) {
      console.error('Check failed:', error);
      setIsAnalyzing(false);
      setError(error instanceof Error ? error.message : 'Check failed. Please try again.');
    }
  };


  const getCheckConfig = () => {
    const currentCheckType = form.watch('checkType') || checkType;
    switch (currentCheckType) {
      case 'scammer-database':
        return {
          title: 'Scammer Database Check',
          description: 'Check names against known scammer databases',
          placeholder: 'Enter names (comma-separated)\nExample: John Smith, Maria Garcia, @crypto_expert123',
          inputType: 'textarea',
          icon: '🚨',
          helpText: 'Enter usernames, phone numbers, or email addresses to check against our scammer database.'
        };
      case 'language-analysis':
        return {
          title: 'Language Pattern Analysis',
          description: 'Analyze text for manipulation tactics and scam patterns',
          placeholder: 'Paste messages or text to analyze...\n\nExample:\nBig announcement coming! 🚀\nThis coin will 10x next week guaranteed!\nInside information, but act fast!',
          inputType: 'textarea',
          icon: '👥',
          helpText: 'Minimum 20 characters required for effective analysis.'
        };
      case 'price-manipulation':
        return {
          title: 'Price Manipulation Detection',
          description: 'Check for artificial price pumps and suspicious trading activity',
          placeholder: 'Enter asset symbol (e.g., BTC, AAPL, SAFEMOON)',
          inputType: 'input',
          icon: '📈',
          helpText: 'Enter a valid asset symbol (2-20 characters, letters, numbers, hyphens, dots, underscores).'
        };
      case 'asset-verification':
        return {
          title: 'Asset Verification',
          description: 'Verify the legitimacy of investment assets',
          placeholder: 'Enter asset symbol or name (e.g., BTC, SafeMoon, XYZ Token)',
          inputType: 'input',
          icon: '🛡️',
          helpText: 'Enter a valid asset symbol (2-20 characters, letters, numbers, hyphens, dots, underscores).'
        };
      default:
        return {
          title: 'Single Check',
          description: 'Perform a specific check',
          placeholder: 'Enter data to check',
          inputType: 'input',
          icon: '🔍',
          helpText: 'Please select a check type first.'
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
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Hidden field for check type */}
            <FormField
              control={form.control}
              name="checkType"
              render={({ field }) => (
                <input type="hidden" {...field} value={checkType || 'scammer-database'} />
              )}
            />
            
            <FormField
              control={form.control}
              name="input"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {config.inputType === 'textarea' ? 'Enter text to analyze:' : 'Enter asset or identifier:'}
                  </FormLabel>
                  <FormControl>
                    {config.inputType === 'textarea' ? (
                      <Textarea
                        placeholder={config.placeholder}
                        className="min-h-[200px] font-mono text-sm resize-y"
                        {...field}
                      />
                    ) : (
                      <Input
                        type="text"
                        placeholder={config.placeholder}
                        {...field}
                      />
                    )}
                  </FormControl>
                  <FormDescription>
                    {config.helpText}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit"
              disabled={isAnalyzing}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield size={20} className="mr-2" />
                  Start Security Check
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>

      {isAnalyzing && (
        <Card className="mt-5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <h3 className="text-lg font-semibold">
                Security Analysis in Progress
              </h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Please wait while we perform comprehensive checks...
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-sm">
                  {form.watch('checkType') === 'scammer-database' && 'Checking against known scammer databases...'}
                  {form.watch('checkType') === 'language-analysis' && 'Analyzing text patterns and manipulation tactics...'}
                  {form.watch('checkType') === 'price-manipulation' && 'Detecting price manipulation signals...'}
                  {form.watch('checkType') === 'asset-verification' && 'Verifying asset legitimacy and authenticity...'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-sm">Generating comprehensive analysis report...</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-sm">Calculating risk scores and recommendations...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div style={{ marginTop: '24px' }}>
        <LegalDisclaimer variant="compact" />
      </div>


    </div>
  );
};

export default SingleCheck;
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Shield, AlertCircle, Wifi, WifiOff } from "lucide-react";
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
import { logger } from '@/lib/logger';
import { useEnhancedAuth } from '../hooks/useEnhancedAuth';
import { realtimeService, RealtimeEvent } from '../services/realtimeService';
import { toast } from '@/components/ui/use-toast';
import { riskAnalysisService } from '../services/riskAnalysisService';

const SingleCheck = () => {
  const [checkType, setCheckType] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [checkProgress, setCheckProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  
  const navigate = useNavigate();
  const { session, loading } = useEnhancedAuth();
  
  const form = useForm<SingleCheckFormData>({
    resolver: zodResolver(singleCheckSchema),
    defaultValues: {
      checkType: 'scammer-database' as const,
      input: '',
    },
  });

  // Real-time event handling
  const handleRealtimeEvent = useCallback((event: any) => {
    const { event: eventType, payload } = event;
    
    switch (eventType) {
      case RealtimeEvent.CONNECTED:
        setRealtimeConnected(true);
        break;
        
      case RealtimeEvent.DISCONNECTED:
        setRealtimeConnected(false);
        break;
        
      case RealtimeEvent.ERROR:
        logger.warn('Real-time error:', payload);
        break;
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    if (type && ['scammer-database', 'language-analysis', 'price-manipulation', 'asset-verification'].includes(type)) {
      setCheckType(type);
      form.setValue('checkType', type as SingleCheckFormData['checkType']);
    }

    // Set up real-time connection
    if (session && !loading) {
      realtimeService.connect().then(() => {
        setRealtimeConnected(true);
      }).catch(error => {
        logger.error('Failed to connect to real-time service', { error });
      });

      // Set up event listeners
      realtimeService.on(RealtimeEvent.CONNECTED, handleRealtimeEvent);
      realtimeService.on(RealtimeEvent.DISCONNECTED, handleRealtimeEvent);
      realtimeService.on(RealtimeEvent.ERROR, handleRealtimeEvent);
    }

    // Cleanup
    return () => {
      realtimeService.off(RealtimeEvent.CONNECTED, handleRealtimeEvent);
      realtimeService.off(RealtimeEvent.DISCONNECTED, handleRealtimeEvent);
      realtimeService.off(RealtimeEvent.ERROR, handleRealtimeEvent);
    };
  }, [form, session, loading, handleRealtimeEvent]);

  const onSubmit = async (data: SingleCheckFormData) => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to perform security checks",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setCheckProgress(0);
    setCurrentStep("Preparing security check...");
    
    try {
      // Sanitize input
      const sanitizedInput = sanitizeInput(data.input);
      
      // Use the enhanced risk analysis service for unified handling
      const result = await riskAnalysisService.performSingleCheck(data.checkType, sanitizedInput);

      // Store result using storageManager
      await storageManager.setPreference('single_check_result', {
        type: data.checkType,
        result: result,
        timestamp: new Date().toISOString(),
        userId: session.user.id
      });

      setCheckProgress(100);
      setCurrentStep("Check completed!");
      setIsAnalyzing(false);
      
      toast({
        title: "✅ Security Check Complete",
        description: "Redirecting to results...",
      });

      setTimeout(() => {
        navigate('/results');
      }, 1000);

    } catch (error) {
      logger.error('Check failed:', { 
        error, 
        checkType: data.checkType, 
        input: sanitizedInput?.substring(0, 50),
        userId: session?.user?.id 
      });
      
      setIsAnalyzing(false);
      setCheckProgress(0);
      setCurrentStep("");
      
      const errorMessage = error instanceof Error ? error.message : 'Check failed. Please try again.';
      setError(errorMessage);
      
      toast({
        title: "❌ Check Failed",
        description: errorMessage,
        variant: "destructive",
      });
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
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
              {config.title}
            </h1>
            <p style={{ color: '#64748b', margin: 0 }}>
              {config.description}
            </p>
          </div>
          
          {/* Real-time connection indicator */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: realtimeConnected ? '#dcfce7' : '#fee2e2',
            borderRadius: '20px',
            border: `1px solid ${realtimeConnected ? '#16a34a' : '#dc2626'}`
          }}>
            {realtimeConnected ? (
              <Wifi style={{ width: '16px', height: '16px', color: '#16a34a' }} />
            ) : (
              <WifiOff style={{ width: '16px', height: '16px', color: '#dc2626' }} />
            )}
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500',
              color: realtimeConnected ? '#16a34a' : '#dc2626' 
            }}>
              {realtimeConnected ? 'Live' : 'Offline'}
            </span>
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <h3 className="text-lg font-semibold">
                  Security Analysis in Progress
                </h3>
              </div>
              <div style={{
                padding: '4px 12px',
                backgroundColor: realtimeConnected ? '#dcfce7' : '#f3f4f6',
                borderRadius: '16px',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: realtimeConnected ? '#16a34a' : '#6b7280'
              }}>
                {realtimeConnected ? 'Live Updates' : 'Standard Mode'}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: '#f3f4f6', 
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '16px'
            }}>
              <div style={{
                width: `${checkProgress}%`,
                height: '100%',
                backgroundColor: checkProgress === 100 ? '#16a34a' : '#3b82f6',
                borderRadius: '4px',
                transition: 'width 0.3s ease, background-color 0.3s ease'
              }} />
            </div>
            
            {/* Progress Text */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-muted-foreground">
                {currentStep || "Performing comprehensive security check..."}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round(checkProgress)}%
              </span>
            </div>
            
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
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Upload, AlertCircle, Shield, Wifi, WifiOff } from "lucide-react";
import Navigation from "../components/Navigation";
import LegalDisclaimer from "../components/LegalDisclaimer";
import { logger } from '@/lib/logger';
import { realtimeService, RealtimeEvent } from '../services/realtimeService';
import { useEnhancedAuth } from '../hooks/useEnhancedAuth';
import { toast } from '@/components/ui/use-toast';

const GroupAnalysis = () => {
  const [formData, setFormData] = useState({
    platform: "",
    groupName: "",
    members: "",
    chatMessages: "",
    assetSymbol: ""
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState<string>("");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  const { session, loading } = useEnhancedAuth();
  // Set up real-time event handling
  const handleRealtimeEvent = useCallback((event: any) => {
    const { event: eventType, payload } = event;
    
    switch (eventType) {
      case RealtimeEvent.ANALYSIS_COMPLETE:
        if (payload.status === 'in_progress') {
          setAnalysisProgress(payload.progress);
          setCurrentStep(payload.step);
        } else if (payload.status === 'completed') {
          setAnalysisProgress(100);
          setCurrentStep('Analysis completed!');
          setTimeout(() => {
            window.location.href = '/results';
          }, 1000);
        }
        break;
        
      case RealtimeEvent.SCAM_DETECTED:
        toast({
          title: "⚠️ Scam Alert",
          description: `Detected ${payload.type}: ${payload.flaggedMembers?.length || 0} suspicious members found`,
          variant: "destructive",
        });
        break;
        
      case RealtimeEvent.CONNECTED:
        setRealtimeConnected(true);
        toast({
          title: "🔗 Connected",
          description: "Real-time updates enabled",
        });
        break;
        
      case RealtimeEvent.DISCONNECTED:
        setRealtimeConnected(false);
        toast({
          title: "📡 Disconnected",
          description: "Real-time updates disabled",
          variant: "destructive",
        });
        break;
        
      case RealtimeEvent.ERROR:
        logger.warn('Real-time error:', payload);
        break;
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    if (type) {
      setAnalysisType(type);
    }

    // Set up real-time connection
    if (session && !loading) {
      // Connect to real-time service
      realtimeService.connect().then(() => {
        setRealtimeConnected(true);
      }).catch(error => {
        logger.error('Failed to connect to real-time service', { error });
      });

      // Set up event listeners
      realtimeService.on(RealtimeEvent.CONNECTED, handleRealtimeEvent);
      realtimeService.on(RealtimeEvent.DISCONNECTED, handleRealtimeEvent);
      realtimeService.on(RealtimeEvent.ANALYSIS_COMPLETE, handleRealtimeEvent);
      realtimeService.on(RealtimeEvent.SCAM_DETECTED, handleRealtimeEvent);
      realtimeService.on(RealtimeEvent.ERROR, handleRealtimeEvent);
    }

    // Cleanup
    return () => {
      realtimeService.off(RealtimeEvent.CONNECTED, handleRealtimeEvent);
      realtimeService.off(RealtimeEvent.DISCONNECTED, handleRealtimeEvent);
      realtimeService.off(RealtimeEvent.ANALYSIS_COMPLETE, handleRealtimeEvent);
      realtimeService.off(RealtimeEvent.SCAM_DETECTED, handleRealtimeEvent);
      realtimeService.off(RealtimeEvent.ERROR, handleRealtimeEvent);
    };
  }, [session, loading, handleRealtimeEvent]);

  const handleAnalyze = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to perform analysis",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentStep("Preparing analysis...");
    
    try {
      const { riskAnalysisService } = await import('../services/riskAnalysisService');

      // Generate analysis ID for tracking
      const newAnalysisId = `analysis_${Date.now()}`;
      setAnalysisId(newAnalysisId);

      // Subscribe to real-time updates for this specific analysis
      if (realtimeConnected) {
        await realtimeService.subscribeToScamDetection(newAnalysisId);
      }

      const analysisResult = await riskAnalysisService.analyzeGroup(
        formData,
        (progress) => {
          // Local progress updates (fallback if real-time fails)
          if (!realtimeConnected) {
            setAnalysisProgress(progress);
            
            // Update step based on progress
            if (progress <= 25) setCurrentStep("Checking scammer databases...");
            else if (progress <= 50) setCurrentStep("Analyzing language patterns...");
            else if (progress <= 75) setCurrentStep("Detecting price manipulation...");
            else if (progress <= 90) setCurrentStep("Verifying assets...");
            else setCurrentStep("Finalizing analysis...");
          }
        }
      );

      // Store result
      localStorage.setItem('latest_analysis', JSON.stringify(analysisResult));
      
      // If real-time didn't handle completion, redirect manually
      if (!realtimeConnected) {
        setIsAnalyzing(false);
        setAnalysisProgress(100);
        setCurrentStep("Analysis completed!");
        setTimeout(() => {
          window.location.href = '/results';
        }, 1000);
      }

    } catch (error) {
      logger.error('Analysis failed:', { 
        error, 
        formData: { 
          platform: formData.platform, 
          groupName: formData.groupName 
        },
        analysisId 
      });
      
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setCurrentStep("");
      
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    }
  };

  const platforms = [
    "WhatsApp",
    "Telegram", 
    "Discord",
    "Signal",
    "WeChat",
    "Facebook Messenger",
    "Other"
  ];

  const getAnalysisTitle = () => {
    switch (analysisType) {
      case 'scammer-database': return 'Scammer Database Check';
      case 'language-analysis': return 'Language Pattern Analysis';
      case 'price-manipulation': return 'Price Manipulation Detection';
      case 'asset-verification': return 'Asset Verification';
      default: return 'Group Analysis';
    }
  };

  const getAnalysisDescription = () => {
    switch (analysisType) {
      case 'scammer-database': return 'Check group members against known scammer databases';
      case 'language-analysis': return 'Analyze chat messages for manipulation tactics';
      case 'price-manipulation': return 'Detect artificial price pumps and suspicious trading activity';
      case 'asset-verification': return 'Verify the legitimacy of promoted assets';
      default: return 'Analyze investment group for scam indicators';
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Navigation />
      {/* Header */}
      <header style={{ 
        borderBottom: '1px solid #e2e8f0', 
        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '1rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => window.location.href = '/'}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowLeft style={{ width: '20px', height: '20px' }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              backgroundColor: '#3b82f6', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield style={{ width: '16px', height: '16px', color: 'white' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>{getAnalysisTitle()}</h1>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>{getAnalysisDescription()}</p>
            </div>
            
            {/* Real-time connection indicator */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '4px 8px',
              backgroundColor: realtimeConnected ? '#dcfce7' : '#fee2e2',
              borderRadius: '20px',
              border: `1px solid ${realtimeConnected ? '#16a34a' : '#dc2626'}`
            }}>
              {realtimeConnected ? (
                <Wifi style={{ width: '14px', height: '14px', color: '#16a34a' }} />
              ) : (
                <WifiOff style={{ width: '14px', height: '14px', color: '#dc2626' }} />
              )}
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: '500',
                color: realtimeConnected ? '#16a34a' : '#dc2626' 
              }}>
                {realtimeConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* Security Notice */}
        <div style={{ 
          backgroundColor: '#fefce8', 
          border: '1px solid #facc15',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertCircle style={{ width: '20px', height: '20px', color: '#ca8a04', marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#92400e', margin: '0 0 4px' }}>
                Security Notice
              </p>
              <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>
                All data is processed securely and deleted after analysis. We do not store personal information or group content.
              </p>
            </div>
          </div>
        </div>

        {/* Analysis Form */}
        <div style={{ 
          backgroundColor: 'white', 
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: '600', margin: '0 0 8px' }}>
              <Upload style={{ width: '20px', height: '20px' }} />
              <span>Group Information</span>
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              Provide details about the investment group you want to analyze
            </p>
          </div>
          
          {/* Submit Error Display */}
          {submitError && (
            <div style={{ 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <AlertTriangle style={{ width: '20px', height: '20px', color: '#dc2626', marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#7f1d1d', margin: '0 0 4px' }}>
                    Analysis Failed
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#7f1d1d', margin: 0 }}>
                    {submitError}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit(handleAnalyze)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Platform Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
                Platform *
              </label>
              <select 
                {...register('platform')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: errors.platform ? '1px solid #dc2626' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  backgroundColor: 'white'
                }}
              >
                {platforms.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
              <FieldError error={errors.platform?.message} />
            </div>

            {/* Group Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
                Group Name *
              </label>
              <input
                type="text"
                placeholder="Enter the investment group name"
                value={formData.groupName}
                onChange={(e) => setFormData(prev => ({ ...prev, groupName: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {/* Members */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
                Group Members
              </label>
              <textarea
                placeholder="Enter member names (comma-separated)&#10;Example: John Smith, Maria Garcia, @crypto_expert123"
                value={formData.members}
                onChange={(e) => setFormData(prev => ({ ...prev, members: e.target.value }))}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                Include usernames, display names, or phone numbers if available
              </p>
            </div>

            {/* Chat Content */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
                Group Chat Messages *
              </label>
              <textarea
                placeholder="Paste recent group chat messages here...&#10;&#10;Example:&#10;[10:30] @expert_trader: Big announcement coming! 🚀&#10;[10:31] @expert_trader: This coin will 10x next week guaranteed!&#10;[10:32] Member1: How do you know?&#10;[10:33] @expert_trader: Inside information, but act fast!"
                value={formData.chatMessages}
                onChange={(e) => setFormData(prev => ({ ...prev, chatMessages: e.target.value }))}
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                Include timestamps and usernames if possible. More content = better analysis.
              </p>
            </div>

            {/* Asset Symbol */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
                Asset/Stock Symbol
              </label>
              <input
                type="text"
                placeholder="e.g., BTC, AAPL, SAFEMOON, etc."
                value={formData.assetSymbol}
                onChange={(e) => setFormData(prev => ({ ...prev, assetSymbol: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                The cryptocurrency, stock, or asset being promoted in the group
              </p>
            </div>

            {/* Analyze Button */}
            <button 
              onClick={handleAnalyze}
              disabled={!formData.platform || !formData.groupName || !formData.chatMessages || isAnalyzing}
              style={{
                width: '100%',
                background: (!formData.platform || !formData.groupName || !formData.chatMessages || isAnalyzing)
                  ? '#9ca3af' 
                  : 'linear-gradient(to right, #3b82f6, #1d4ed8)',
                color: 'white',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '500',
                border: 'none',
                borderRadius: '8px',
                cursor: (!formData.platform || !formData.groupName || !formData.chatMessages || isAnalyzing) ? 'not-allowed' : 'pointer',
                marginTop: '2rem',
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
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <span>Analyzing Group...</span>
                </>
              ) : (
                <>
                  <Shield style={{ width: '20px', height: '20px' }} />
                  <span>Analyze for Scam Indicators</span>
                </>
              )}  
            </button>

          </form>
        </div>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.5rem',
            marginTop: '1.5rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontWeight: '500', margin: 0 }}>Analysis in Progress</h3>
                <div style={{
                  padding: '2px 8px',
                  backgroundColor: realtimeConnected ? '#dcfce7' : '#f3f4f6',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
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
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${analysisProgress}%`,
                  height: '100%',
                  backgroundColor: analysisProgress === 100 ? '#16a34a' : '#3b82f6',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease, background-color 0.3s ease'
                }} />
              </div>
              
              {/* Progress Text */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {currentStep || "Preparing analysis..."}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                  {Math.round(analysisProgress)}%
                </span>
              </div>
              
              {/* Analysis ID */}
              {analysisId && (
                <div style={{ 
                  padding: '8px', 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem', 
                  color: '#6b7280',
                  fontFamily: 'monospace'
                }}>
                  Analysis ID: {analysisId}
                </div>
              )}
            </div>
          </div>
        )}

        
        {/* Legal Disclaimer */}
        <div className="mt-8">
          <LegalDisclaimer variant="compact" />
        </div>

      </div>


      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default GroupAnalysis;
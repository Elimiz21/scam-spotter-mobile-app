import { useState, useEffect } from "react";
import { ArrowLeft, AlertTriangle, Shield, Info, TrendingUp, Users, Database, ExternalLink, Download, FileText, ChevronDown, X } from "lucide-react";
import Navigation from "../components/Navigation";
import LegalDisclaimer from "../components/LegalDisclaimer";
import { AnalysisResult, RiskVector } from '../services/types';
import storageManager from '../lib/storage';
import { exportService, ExportOptions } from '../lib/exportService';
import { logger } from '@/lib/logger';

const ResultsDashboard = () => {
  const [selectedVector, setSelectedVector] = useState<RiskVector | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadAnalysisData = async () => {
      try {
        // Check if this is a single check result
        const singleCheckData = await storageManager.getPreference('single_check_result');
        const groupAnalysisData = await storageManager.getPreference('analysis_result');
        
        if (singleCheckData) {
          try {
            // Convert single check to analysis format
            const singleCheckAnalysis = createSingleCheckAnalysis(singleCheckData);
            setAnalysisData(singleCheckAnalysis);
          } catch (error) {
            logger.error('Failed to parse single check data:', { error });
            setAnalysisData(getMockAnalysisData());
          }
        } else if (groupAnalysisData) {
          try {
            setAnalysisData(groupAnalysisData);
          } catch (error) {
            logger.error('Failed to parse analysis data:', { error });
            setAnalysisData(getMockAnalysisData());
          }
        } else {
          // Try to get analysis results from the new storage format
          const analysisResults = await storageManager.getAnalysisResults();
          if (analysisResults) {
            setAnalysisData(analysisResults);
          } else {
            setAnalysisData(getMockAnalysisData());
          }
        }
      } catch (error) {
        logger.error('Failed to load analysis data:', { error });
        setAnalysisData(getMockAnalysisData());
      }
    };

    loadAnalysisData();
  }, []);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportOptions) {
        const exportButton = document.querySelector('[data-export-dropdown]');
        if (exportButton && !exportButton.contains(event.target as Node)) {
          setShowExportOptions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportOptions]);

  // Mock analysis results - in real app this would come from API
  const analysisResults: RiskVector[] = [
    {
      id: "scammer-check",
      name: "Scammer Database",
      icon: "🛡️",
      riskScore: 85,
      status: "danger",
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
      icon: "💬",
      riskScore: 72,
      status: "danger",
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
      icon: "📊",
      riskScore: 45,
      status: "warning",
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
      icon: "🔍",
      riskScore: 15,
      status: "safe", 
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

  const createSingleCheckAnalysis = (singleCheck: any): AnalysisResult => {
    const checkTypeMap: Record<string, { name: string; icon: string }> = {
      'scammer-database': { name: 'Scammer Database Check', icon: '🚨' },
      'language-analysis': { name: 'Language Analysis', icon: '💬' },
      'price-manipulation': { name: 'Price Manipulation Check', icon: '📈' },
      'asset-verification': { name: 'Asset Verification', icon: '✅' }
    };

    const checkInfo = checkTypeMap[singleCheck.type] || { name: 'Unknown Check', icon: '❓' };
    const riskScore = singleCheck.result?.riskScore || 0;
    
    return {
      overallRiskScore: -1, // Special value to indicate single check
      riskVectors: [{
        id: singleCheck.type,
        name: checkInfo.name,
        icon: checkInfo.icon,
        riskScore: riskScore,
        status: riskScore > 70 ? 'danger' : riskScore > 40 ? 'warning' : 'safe',
        summary: getSingleCheckSummary(singleCheck.type, singleCheck.result),
        details: getSingleCheckDetails(singleCheck.type, singleCheck.result),
        findings: getSingleCheckFindings(singleCheck.type, singleCheck.result)
      }],
      analysisId: `single-${singleCheck.type}-${Date.now()}`,
      timestamp: singleCheck.timestamp,
      isSingleCheck: true
    } as any;
  };

  const getSingleCheckSummary = (type: string, result: any): string => {
    switch (type) {
      case 'scammer-database':
        return result?.flaggedMembers?.length > 0 
          ? `Found ${result.flaggedMembers.length} flagged members`
          : 'No known scammers detected';
      case 'language-analysis':
        return `Risk score: ${result?.riskScore || 0}/100 based on language patterns`;
      case 'price-manipulation':
        return `Market analysis shows ${result?.riskScore > 50 ? 'high' : 'low'} manipulation risk`;
      case 'asset-verification':
        return result?.isVerified ? 'Asset verified on exchanges' : 'Asset verification failed';
      default:
        return 'Analysis completed';
    }
  };

  const getSingleCheckDetails = (type: string, result: any): string => {
    switch (type) {
      case 'scammer-database':
        return result?.flaggedMembers?.length > 0
          ? `Flagged members: ${result.flaggedMembers.join(', ')}`
          : 'No matches found in scammer databases';
      case 'language-analysis':
        return `Manipulation indicators detected: ${result?.manipulationIndicators?.join(', ') || 'None'}`;
      case 'price-manipulation':
        return `Volatility score: ${result?.volatilityScore || 0}`;
      case 'asset-verification':
        return `Exchange listings: ${result?.exchangeListings?.join(', ') || 'None found'}`;
      default:
        return 'Check completed successfully';
    }
  };

  const getSingleCheckFindings = (type: string, result: any): string[] => {
    switch (type) {
      case 'scammer-database':
        return result?.sources || [];
      case 'language-analysis':
        return result?.suspiciousPhrases || [];
      case 'price-manipulation':
        return [`Trading volume: ${result?.tradingVolume || 'Unknown'}`];
      case 'asset-verification':
        return result?.projectDetails ? Object.entries(result.projectDetails).map(([key, value]) => `${key}: ${value}`) : [];
      default:
        return [];
    }
  };

  const getMockAnalysisData = (): AnalysisResult => {
    return {
      overallRiskScore: 74,
      analysisId: 'mock_analysis',
      timestamp: new Date().toISOString(),
      riskVectors: analysisResults
    };
  };

  const handleExport = async (format: 'pdf' | 'json' | 'csv' | 'html', includeDetails: boolean = true) => {
    if (!analysisData) return;
    
    setIsExporting(true);
    setShowExportOptions(false);
    
    try {
      const exportOptions: ExportOptions = {
        format,
        includeDetails,
        includeCharts: false,
        dateRange: 'all_time'
      };
      
      await exportService.exportAnalysisResults(analysisData, exportOptions);
    } catch (error) {
      logger.error('Export failed:', { error, format });
      // You might want to add a toast notification here
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportFormats = [
    { value: 'pdf', label: 'PDF Report', icon: FileText, description: 'Professional formatted report' },
    { value: 'json', label: 'JSON Data', icon: FileText, description: 'Machine-readable format' },
    { value: 'csv', label: 'CSV Spreadsheet', icon: FileText, description: 'For analysis in Excel/Sheets' },
    { value: 'html', label: 'HTML Report', icon: FileText, description: 'Web-viewable format' }
  ] as const;

  if (!analysisData) {
    return <div>Loading analysis results...</div>;
  }

  const { overallRiskScore, riskVectors } = analysisData;

  const getRiskColor = (score: number) => {
    if (score >= 80) return { bg: '#fef2f2', border: '#f87171', text: '#dc2626' };
    if (score >= 60) return { bg: '#fff7ed', border: '#fb923c', text: '#ea580c' };
    if (score >= 40) return { bg: '#fefce8', border: '#facc15', text: '#ca8a04' };
    return { bg: '#f0fdf4', border: '#4ade80', text: '#16a34a' };
  };

  const getRiskBadgeColor = (status: string) => {
    switch (status) {
      case 'danger': return { bg: '#fef2f2', text: '#dc2626' };
      case 'warning': return { bg: '#fefce8', text: '#ca8a04' };
      case 'safe': return { bg: '#f0fdf4', text: '#16a34a' };
      default: return { bg: '#f9fafb', text: '#374151' };
    }
  };

  const overallColors = getRiskColor(overallRiskScore);

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
            onClick={() => window.location.href = '/analyze'}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
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
              <div>
                <h1 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>Risk Analysis Results</h1>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Comprehensive scam detection report</p>
              </div>
            </div>
            
            {/* Export Button */}
            <div style={{ position: 'relative' }} data-export-dropdown>
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                disabled={isExporting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isExporting ? '#f3f4f6' : 'linear-gradient(to right, #059669, #047857)',
                  color: isExporting ? '#6b7280' : 'white',
                  padding: '8px 16px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!isExporting) {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isExporting) {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }
                }}
              >
                <Download style={{ width: '16px', height: '16px' }} />
                {isExporting ? 'Exporting...' : 'Export Report'}
                {!isExporting && <ChevronDown style={{ width: '16px', height: '16px' }} />}
              </button>
              
              {/* Export Options Dropdown */}
              {showExportOptions && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  zIndex: 1000,
                  minWidth: '280px',
                  padding: '8px 0'
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', margin: '0 0 4px', color: '#1f2937' }}>
                      Export Format
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                      Choose your preferred export format
                    </p>
                  </div>
                  
                  {exportFormats.map((format) => {
                    const IconComponent = format.icon;
                    return (
                      <button
                        key={format.value}
                        onClick={() => handleExport(format.value as any)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb';
                        }}
                        onMouseOut={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                      >
                        <IconComponent style={{ width: '18px', height: '18px', color: '#059669' }} />
                        <div style={{ textAlign: 'left', flex: 1 }}>
                          <div style={{ fontWeight: '500', color: '#1f2937' }}>{format.label}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{format.description}</div>
                        </div>
                      </button>
                    );
                  })}
                  
                  <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                    <button
                      onClick={() => setShowExportOptions(false)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb';
                      }}
                      onMouseOut={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      <X style={{ width: '14px', height: '14px' }} />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* Overall Risk Score or Single Check Notice */}
        {(analysisData as any)?.isSingleCheck ? (
          <div style={{ 
            backgroundColor: '#f8fafc',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Info style={{ width: '48px', height: '48px', color: '#3b82f6' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px' }}>
              Single Check Results
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '1.1rem' }}>
              Only 1 out of 4 security checks was performed
            </p>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              For comprehensive analysis, use the "Group Analysis" feature
            </p>
          </div>
        ) : (
          <div style={{ 
            backgroundColor: overallColors.bg,
            border: `2px solid ${overallColors.border}`,
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              {overallRiskScore >= 70 ? (
                <AlertTriangle style={{ width: '48px', height: '48px', color: overallColors.text }} />
              ) : (
                <Shield style={{ width: '48px', height: '48px', color: overallColors.text }} />
              )}
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: overallColors.text, margin: '0 0 8px' }}>
              Overall Risk Score: {overallRiskScore}/100
            </h2>
            <p style={{ color: overallColors.text, marginBottom: '1rem' }}>
              {overallRiskScore >= 80 && "CRITICAL RISK - Avoid this group immediately"}
              {overallRiskScore >= 60 && overallRiskScore < 80 && "HIGH RISK - Exercise extreme caution"}
              {overallRiskScore >= 40 && overallRiskScore < 60 && "MEDIUM RISK - Proceed with caution"}
              {overallRiskScore < 40 && "LOW RISK - Group appears relatively safe"}
            </p>
            <div style={{ 
              width: '100%', 
              height: '12px', 
              backgroundColor: 'rgba(0,0,0,0.1)', 
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${overallRiskScore}%`, 
                height: '100%', 
                backgroundColor: overallColors.text,
                transition: 'width 1s ease'
              }} />
            </div>
          </div>
        )}

        {/* Risk Vectors Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: (analysisData as any)?.isSingleCheck 
            ? '1fr' 
            : 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2rem',
          maxWidth: (analysisData as any)?.isSingleCheck ? '600px' : 'none',
          margin: (analysisData as any)?.isSingleCheck ? '0 auto 2rem auto' : '0 0 2rem 0'
        }}>
          {riskVectors.map((vector) => {
            const badgeColors = getRiskBadgeColor(vector.status);
            const iconColors = getRiskColor(vector.riskScore);
            
            return (
              <div 
                key={vector.id}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                onClick={() => setSelectedVector(vector)}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                     <div style={{ 
                       width: '40px', 
                       height: '40px', 
                       backgroundColor: iconColors.bg,
                       borderRadius: '8px',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       fontSize: '20px'
                     }}>
                       {vector.icon}
                     </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 8px' }}>{vector.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: badgeColors.bg,
                          color: badgeColors.text,
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          {vector.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                          {vector.riskScore}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ExternalLink style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '12px' }}>
                  {vector.summary}
                </p>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${vector.riskScore}%`, 
                    height: '100%', 
                    backgroundColor: iconColors.text,
                    transition: 'width 1s ease'
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={() => window.location.href = '/analyze'}
              style={{
                background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
                color: 'white',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '500',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Analyze Another Group
            </button>
            
            {/* Additional Export Button for Mobile */}
            <button 
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              style={{
                background: isExporting ? '#f3f4f6' : 'linear-gradient(to right, #059669, #047857)',
                color: isExporting ? '#6b7280' : 'white',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '500',
                border: 'none',
                borderRadius: '8px',
                cursor: isExporting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download style={{ width: '16px', height: '16px' }} />
              {isExporting ? 'Exporting PDF...' : 'Quick Export PDF'}
            </button>
          </div>
          
          <button 
            onClick={() => window.location.href = '/how-it-works'}
            style={{
              backgroundColor: 'transparent',
              color: '#3b82f6',
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: '500',
              border: '1px solid #3b82f6',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Learn About Our Analysis
          </button>
        </div>

        {/* Legal Disclaimer */}
        <div style={{ margin: '2rem 0' }}>
          <LegalDisclaimer variant="results" />
        </div>

      </div>

      {/* Detailed Analysis Modal */}
      {selectedVector && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}
        onClick={() => setSelectedVector(null)}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
          >
             <div style={{ marginBottom: '1.5rem' }}>
               <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', fontWeight: '600', margin: '0 0 8px' }}>
                 <span style={{ fontSize: '24px' }}>{selectedVector.icon}</span>
                 <span>{selectedVector.name} Analysis</span>
                <span style={{ 
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  backgroundColor: getRiskBadgeColor(selectedVector.status).bg,
                  color: getRiskBadgeColor(selectedVector.status).text,
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  {selectedVector.status.toUpperCase()} RISK
                </span>
              </h3>
              <p style={{ color: '#6b7280', margin: 0 }}>
                {selectedVector.details}
              </p>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', margin: '0 0 12px' }}>
                <Info style={{ width: '16px', height: '16px' }} />
                <span>Detailed Findings</span>
              </h4>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {selectedVector.findings.map((finding, index) => (
                  <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '6px', height: '6px', backgroundColor: '#3b82f6', borderRadius: '50%', marginTop: '8px' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Risk Score Breakdown</h4>
              <div style={{ 
                width: '100%', 
                height: '12px', 
                backgroundColor: '#f3f4f6', 
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '8px'
              }}>
                <div style={{ 
                  width: `${selectedVector.riskScore}%`, 
                  height: '100%', 
                  backgroundColor: getRiskColor(selectedVector.riskScore).text
                }} />
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                Score: {selectedVector.riskScore}/100 - {selectedVector.status.toUpperCase()} risk level
              </p>
            </div>
            
            <button 
              onClick={() => setSelectedVector(null)}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDashboard;
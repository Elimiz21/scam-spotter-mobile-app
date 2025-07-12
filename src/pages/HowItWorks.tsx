import { ArrowLeft, Shield, Database, Users, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";
import Navigation from "../components/Navigation";
import LegalDisclaimer from "../components/LegalDisclaimer";

const HowItWorks = () => {
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
            <div>
              <h1 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>How Our Analysis Works</h1>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Understanding our scam detection methodology</p>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* Introduction */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Multi-Vector Scam Detection</h2>
          <p style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
            Our comprehensive analysis system examines investment groups across four critical dimensions 
            to identify potential scams and protect your investments.
          </p>
        </div>

        {/* Analysis Vectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {analysisVectors.map((vector, index) => {
            const IconComponent = vector.icon;
            return (
              <div key={index} style={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.5rem'
              }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem', fontWeight: '600', margin: '0 0 8px' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComponent style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                    </div>
                    <span>{vector.title}</span>
                  </h3>
                  <p style={{ fontSize: '1rem', color: '#64748b', margin: 0 }}>
                    {vector.description}
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Analysis Process */}
                  <div>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', margin: '0 0 12px' }}>
                      <CheckCircle style={{ width: '16px', height: '16px', color: '#16a34a' }} />
                      <span>How We Analyze</span>
                    </h4>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {vector.process.map((step, stepIndex) => (
                        <li key={stepIndex} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                          <div style={{ 
                            width: '24px', 
                            height: '24px', 
                            backgroundColor: 'rgba(59, 130, 246, 0.2)', 
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: '2px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            color: '#3b82f6'
                          }}>
                            {stepIndex + 1}
                          </div>
                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Red Flags */}
                  <div>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', margin: '0 0 12px' }}>
                      <AlertTriangle style={{ width: '16px', height: '16px', color: '#dc2626' }} />
                      <span>Red Flags We Detect</span>
                    </h4>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {vector.indicators.map((indicator, indicatorIndex) => (
                        <li key={indicatorIndex} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                          <div style={{ width: '6px', height: '6px', backgroundColor: '#dc2626', borderRadius: '50%', marginTop: '8px' }} />
                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{indicator}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Risk Scoring */}
        <div style={{ 
          backgroundColor: 'white', 
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.5rem',
          marginTop: '3rem'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 8px' }}>Risk Score Calculation</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
            How we combine multiple analysis vectors into a comprehensive risk assessment
          </p>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem'
          }}>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>0-39</div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#15803d' }}>LOW RISK</div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px' }}>Generally safe</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fefce8', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ca8a04' }}>40-59</div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#a16207' }}>MEDIUM RISK</div>
              <div style={{ fontSize: '0.75rem', color: '#ca8a04', marginTop: '4px' }}>Proceed with caution</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fff7ed', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ea580c' }}>60-79</div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#c2410c' }}>HIGH RISK</div>
              <div style={{ fontSize: '0.75rem', color: '#ea580c', marginTop: '4px' }}>Exercise extreme caution</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>80-100</div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#b91c1c' }}>CRITICAL RISK</div>
              <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px' }}>Avoid immediately</div>
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem' }}>
            Our algorithm weighs each analysis vector based on severity and combines them into a final risk score. 
            Multiple high-risk indicators compound to create higher overall scores.
          </p>
        </div>

        {/* Legal Disclaimer */}
        <div style={{ margin: '2rem 0' }}>
          <LegalDisclaimer variant="full" />
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Ready to Analyze a Group?</h3>
          <button 
            onClick={() => window.location.href = '/analyze'}
            style={{
              background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
              color: 'white',
              padding: '1rem 2rem',
              fontSize: '1.125rem',
              fontWeight: '500',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Start Analysis Now
          </button>
          <LegalDisclaimer variant="compact" className="mt-4" />
        </div>

      </div>
    </div>
  );
};

export default HowItWorks;
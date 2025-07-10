import { useState } from "react";
import { ArrowLeft, Upload, AlertCircle, Shield } from "lucide-react";

const GroupAnalysis = () => {
  const [formData, setFormData] = useState({
    platform: "",
    groupName: "",
    members: "",
    chatText: "",
    assetSymbol: ""
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // Simulate analysis time
    setTimeout(() => {
      setIsAnalyzing(false);
      window.location.href = '/results';
    }, 3000);
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
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
              <h1 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>Group Analysis</h1>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Analyze investment group for scam indicators</p>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* Warning Notice */}
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
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Platform Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
                Platform *
              </label>
              <select 
                value={formData.platform} 
                onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select the messaging platform</option>
                {platforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
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
                value={formData.chatText}
                onChange={(e) => setFormData(prev => ({ ...prev, chatText: e.target.value }))}
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
              disabled={!formData.platform || !formData.groupName || !formData.chatText || isAnalyzing}
              style={{
                width: '100%',
                background: (!formData.platform || !formData.groupName || !formData.chatText || isAnalyzing) 
                  ? '#9ca3af' 
                  : 'linear-gradient(to right, #3b82f6, #1d4ed8)',
                color: 'white',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '500',
                border: 'none',
                borderRadius: '8px',
                cursor: (!formData.platform || !formData.groupName || !formData.chatText || isAnalyzing) ? 'not-allowed' : 'pointer',
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

          </div>
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
              <h3 style={{ fontWeight: '500', textAlign: 'center', margin: 0 }}>Analysis in Progress</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  "Checking members against scammer databases...",
                  "Analyzing language patterns for manipulation...",
                  "Verifying asset information...",
                  "Detecting price manipulation signals...",
                  "Generating risk assessment report..."
                ].map((step, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                      animation: 'pulse 2s infinite'
                    }} />
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
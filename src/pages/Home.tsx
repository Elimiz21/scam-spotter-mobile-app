import { Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import LegalDisclaimer from "../components/LegalDisclaimer";
import { ScamDunkBadge } from "../components/ScamDunkBadge";
import PolicyFooter from "../components/PolicyFooter";

const Home = () => {
  const navigate = useNavigate();
  
  return (
    <div style={{ minHeight: '100vh', padding: '20px', backgroundColor: '#f8fafc' }}>
      <Navigation />
      {/* Simple Header */}
      <header style={{ 
        borderBottom: '1px solid #e2e8f0', 
        backgroundColor: 'white', 
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <ScamDunkBadge size="md" variant="full" />
      </header>

      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <h2 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '1.5rem',
          background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Protect Your Investments from Financial Scams
        </h2>
        <p style={{ fontSize: '1.25rem', color: '#64748b', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Analyze investment groups and opportunities with advanced AI-powered risk assessment. 
          Get instant alerts for potential scams before it's too late.
        </p>
        <button style={{
          background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
          color: 'white',
          padding: '1rem 2rem',
          fontSize: '1.125rem',
          fontWeight: '500',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => (e.target as HTMLElement).style.transform = 'translateY(-2px)'}
        onMouseOut={(e) => (e.target as HTMLElement).style.transform = 'translateY(0)'}
        onClick={() => navigate('/analyze')}
        >
          Start Group Analysis
        </button>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '3rem 1rem', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
        <h3 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '3rem' }}>
          How ScamShield Protects You
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          
          <div 
            style={{ 
              backgroundColor: 'white', 
              padding: '1.5rem', 
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}
          >
            <div style={{ 
              width: '48px', 
              height: '48px', 
              backgroundColor: '#fef2f2', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              🚨
            </div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Scammer Database</h4>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem', flex: '1' }}>
              Cross-reference group members against known scammer databases and blacklists
            </p>
            <button
              onClick={() => navigate('/check?type=scammer-database')}
              style={{
                background: 'linear-gradient(to right, #dc2626, #b91c1c)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s',
                marginTop: 'auto'
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Check Now
            </button>
          </div>

          <div 
            style={{ 
              backgroundColor: 'white', 
              padding: '1.5rem', 
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}
          >
            <div style={{ 
              width: '48px', 
              height: '48px', 
              backgroundColor: '#eff6ff', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              👥
            </div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Language Analysis</h4>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem', flex: '1' }}>
              AI analysis of group communications for manipulation tactics and scam language patterns
            </p>
            <button
              onClick={() => navigate('/check?type=language-analysis')}
              style={{
                background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s',
                marginTop: 'auto'
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Check Now
            </button>
          </div>

          <div 
            style={{ 
              backgroundColor: 'white', 
              padding: '1.5rem', 
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}
          >
            <div style={{ 
              width: '48px', 
              height: '48px', 
              backgroundColor: '#fefce8', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              📈
            </div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Price Manipulation</h4>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem', flex: '1' }}>
              Detection of artificial price pumps and suspicious trading activity patterns
            </p>
            <button
              onClick={() => navigate('/check?type=price-manipulation')}
              style={{
                background: 'linear-gradient(to right, #ca8a04, #a16207)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s',
                marginTop: 'auto'
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Check Now
            </button>
          </div>

          <div 
            style={{ 
              backgroundColor: 'white', 
              padding: '1.5rem', 
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}
          >
            <div style={{ 
              width: '48px', 
              height: '48px', 
              backgroundColor: '#f0fdf4', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              🛡️
            </div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Asset Verification</h4>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem', flex: '1' }}>
              Verify the existence and legitimacy of promoted assets and investment opportunities
            </p>
            <button
              onClick={() => navigate('/check?type=asset-verification')}
              style={{
                background: 'linear-gradient(to right, #16a34a, #15803d)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s',
                marginTop: 'auto'
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Check Now
            </button>
          </div>

        </div>
      </section>

      {/* Legal Disclaimer */}
      <div style={{ margin: '2rem 0' }}>
        <LegalDisclaimer variant="full" />
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '2rem 1rem', borderTop: '1px solid #e2e8f0', marginTop: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '1rem' }}>
          <ScamDunkBadge size="sm" variant="full" />
        </div>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Protecting investors from financial scams with advanced AI analysis
        </p>
        <LegalDisclaimer variant="compact" className="mt-4" />
        <div className="mt-6">
          <PolicyFooter />
        </div>
      </footer>
    </div>
  );
};

export default Home;
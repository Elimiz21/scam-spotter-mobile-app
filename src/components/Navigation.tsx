import { Home, Search, BarChart3, HelpCircle, Menu, X, LogIn, LogOut, User, CreditCard } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Analyze", href: "/analyze", icon: Search },
    { name: "Results", href: "/results", icon: BarChart3 },
    { name: "Pricing", href: "/pricing", icon: CreditCard },
    { name: "How It Works", href: "/how-it-works", icon: HelpCircle },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate("/");
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1000,
          width: '44px',
          height: '44px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998
          }}
        />
      )}

      {/* Navigation Menu */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? 0 : '-300px',
          width: '280px',
          height: '100vh',
          backgroundColor: 'white',
          borderLeft: '1px solid #e2e8f0',
          zIndex: 999,
          transition: 'right 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          padding: '4rem 0 2rem',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Navigation Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 1rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = window.location.pathname === item.href;
            
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? '#3b82f6' : '#374151',
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    (e.target as HTMLElement).style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    (e.target as HTMLElement).style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </a>
            );
          })}
        </div>

        {/* Auth Section */}
        <div style={{ 
          marginTop: 'auto', 
          padding: '1rem', 
          borderTop: '1px solid #e2e8f0'
        }}>
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 12px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}>
                <User size={16} />
                <span style={{ color: '#374151', fontWeight: '500' }}>
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#fef2f2';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                navigate("/auth");
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: '100%',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                (e.target as HTMLElement).style.backgroundColor = '#2563eb';
              }}
              onMouseOut={(e) => {
                (e.target as HTMLElement).style.backgroundColor = '#3b82f6';
              }}
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '1rem', 
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <p style={{ 
            fontSize: '0.75rem', 
            color: '#64748b', 
            margin: 0,
            lineHeight: '1.4'
          }}>
            ScamShield v1.0<br />
            Investment Protection
          </p>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
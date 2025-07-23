import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail, Lock, User } from "lucide-react";
import { ScamDunkBadge } from "@/components/ScamDunkBadge";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      if (error.message.includes("already registered")) {
        setError("An account with this email already exists. Please sign in instead.");
      } else {
        setError(error.message);
      }
    } else {
      toast({
        title: "Welcome to Scam Dunk",
        description: "Check your email to confirm your account and start protecting your investments.",
      });
      // Navigate to home after successful signup
      navigate("/");
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please check your credentials and try again.");
      } else {
        setError(error.message);
      }
    } else {
      navigate("/");
      toast({
        title: "Welcome back",
        description: "You're ready to analyze potential scams.",
      });
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '20px', backgroundColor: '#f8fafc' }}>
      {/* Header matching other pages */}
      <header style={{ 
        borderBottom: '1px solid #e2e8f0', 
        backgroundColor: 'white', 
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <ScamDunkBadge size="md" variant="full" />
      </header>

      {/* Main Auth Form */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 'calc(100vh - 200px)' 
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '3rem', 
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: '480px',
          border: '1px solid #e2e8f0'
        }}>
          {/* Logo and Title */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              <Shield style={{ width: '40px', height: '40px', color: 'white' }} />
            </div>
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              marginBottom: '0.5rem',
              background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {mode === "signin" ? "Welcome back" : "Join Scam Dunk"}
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>
              {mode === "signin" 
                ? "Sign in to access your investment protection tools" 
                : "Create your account to start protecting your investments"}
            </p>
          </div>

          {/* Mode Toggle */}
          <div style={{ 
            display: 'flex', 
            backgroundColor: '#f1f5f9', 
            borderRadius: '12px', 
            padding: '4px',
            marginBottom: '2rem'
          }}>
            <button
              style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '500',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mode === "signin" ? 'white' : 'transparent',
                color: mode === "signin" ? '#1e293b' : '#64748b',
                boxShadow: mode === "signin" ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
              }}
              onClick={() => {
                setMode("signin");
                setError("");
              }}
            >
              <User style={{ width: '16px', height: '16px', display: 'inline', marginRight: '8px' }} />
              Sign In
            </button>
            <button
              style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '500',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mode === "signup" ? 'white' : 'transparent',
                color: mode === "signup" ? '#1e293b' : '#64748b',
                boxShadow: mode === "signup" ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
              }}
              onClick={() => {
                setMode("signup");
                setError("");
              }}
            >
              <Shield style={{ width: '16px', height: '16px', display: 'inline', marginRight: '8px' }} />
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} style={{ marginBottom: '1.5rem' }}>
            {/* Email Field */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                <Mail style={{ width: '16px', height: '16px', display: 'inline', marginRight: '8px' }} />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                <Lock style={{ width: '16px', height: '16px', display: 'inline', marginRight: '8px' }} />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder={mode === "signup" ? "Create a secure password (min 6 characters)" : "Enter your password"}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div style={{ 
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: loading ? '#94a3b8' : 'linear-gradient(to right, #3b82f6, #1d4ed8)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? (
                <>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    border: '2px solid white', 
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  {mode === "signin" ? "Signing In..." : "Creating Account..."}
                </>
              ) : (
                <>
                  {mode === "signin" ? "Sign In" : "Create Account"}
                  <Shield style={{ width: '20px', height: '20px' }} />
                </>
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
            {mode === "signup" ? (
              <p>
                By creating an account, you agree to protect your investments with our advanced AI-powered scam detection.
              </p>
            ) : (
              <p>
                Secure access to your investment protection dashboard.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add CSS for spin animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
import { Shield, Star, CheckCircle, X, Zap } from "lucide-react";
import { useState } from "react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Pricing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePayPerCheck = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase checks.",
        variant: "destructive",
      });
      window.location.href = '/auth';
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-paypal-order", {
        body: { payment_type: "pay_per_check" },
      });

      if (error) throw error;

      if (data.approveUrl) {
        window.open(data.approveUrl, "_blank");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Error", 
        description: "Failed to create payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscription = async (planType: "premium" | "pro") => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe.",
        variant: "destructive",
      });
      window.location.href = '/auth';
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-paypal-subscription", {
        body: { plan_type: planType },
      });

      if (error) throw error;

      if (data.approveUrl) {
        window.open(data.approveUrl, "_blank");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for trying out our service",
      features: [
        "3 lifetime scam checks",
        "Basic scam detection", 
        "Email support",
      ],
      limitations: [
        "Limited to 3 checks total",
        "No advanced features",
      ],
      cta: "0/3 checks used",
      disabled: true,
      isPopular: false,
      action: null,
    },
    {
      name: "Pay-Per-Check",
      price: "$4.99",
      description: "Pay only when you need it",
      features: [
        "1 comprehensive scam check",
        "Advanced AI analysis",
        "Detailed risk assessment",
        "Priority support",
      ],
      limitations: [],
      cta: "Buy 1 Check",
      disabled: false,
      isPopular: false,
      action: handlePayPerCheck,
    },
    {
      name: "Premium",
      price: "$9.99",
      period: "/month",
      description: "Best for regular users",
      features: [
        "Unlimited scam checks",
        "Advanced AI analysis",
        "Priority support",
        "API access",
        "Export reports",
      ],
      limitations: [],
      cta: "Subscribe",
      disabled: false,
      isPopular: true,
      action: () => handleSubscription("premium"),
    },
    {
      name: "Pro",
      price: "$29.99",
      period: "/month",
      description: "For power users and businesses",
      features: [
        "Everything in Premium",
        "Bulk checking (up to 100)",
        "White-label reports",
        "Dedicated support",
        "Custom integrations",
        "Team management",
      ],
      limitations: [],
      cta: "Subscribe",
      disabled: false,
      isPopular: false,
      action: () => handleSubscription("pro"),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', padding: '20px', backgroundColor: '#f8fafc' }}>
      <Navigation />
      
      {/* Header */}
      <header style={{ 
        borderBottom: '1px solid #e2e8f0', 
        backgroundColor: 'white', 
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            backgroundColor: '#3b82f6', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield style={{ width: '24px', height: '24px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Investment Protection Plans</h1>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Choose your level of protection</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '2rem 1rem', marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Choose Your Protection Level
        </h2>
        <p style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
          From basic scam detection to comprehensive business protection, 
          we have a plan that fits your investment security needs.
        </p>
      </section>

      {/* Pricing Cards */}
      <section style={{ padding: '2rem 1rem', backgroundColor: '#f1f5f9', borderRadius: '12px', marginBottom: '2rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.5rem',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {pricingPlans.map((plan) => (
            <div 
              key={plan.name}
              style={{ 
                backgroundColor: 'white', 
                padding: '1.5rem', 
                borderRadius: '12px',
                boxShadow: plan.isPopular 
                  ? '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -2px rgba(59, 130, 246, 0.1)' 
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: plan.isPopular ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                position: 'relative',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Star style={{ width: '12px', height: '12px' }} />
                  Most Popular
                </div>
              )}

              {/* Plan Header */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {plan.name}
                </h3>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{ fontSize: '1rem', color: '#64748b' }}>{plan.period}</span>
                  )}
                </div>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <div style={{ marginBottom: '1.5rem' }}>
                {plan.features.map((feature) => (
                  <div 
                    key={feature} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '8px',
                      marginBottom: '8px'
                    }}
                  >
                    <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: '#374151' }}>{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limitation) => (
                  <div 
                    key={limitation} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '8px',
                      marginBottom: '8px',
                      opacity: 0.6
                    }}
                  >
                    <X style={{ width: '16px', height: '16px', color: '#64748b', marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{limitation}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                style={{
                  width: '100%',
                  background: plan.disabled 
                    ? '#f1f5f9' 
                    : plan.isPopular 
                      ? 'linear-gradient(to right, #3b82f6, #1d4ed8)' 
                      : 'white',
                  color: plan.disabled 
                    ? '#64748b' 
                    : plan.isPopular 
                      ? 'white' 
                      : '#3b82f6',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  border: plan.disabled 
                    ? '1px solid #e2e8f0' 
                    : plan.isPopular 
                      ? 'none' 
                      : '2px solid #3b82f6',
                  borderRadius: '8px',
                  cursor: (plan.disabled || loading) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                disabled={plan.disabled || loading}
                onClick={plan.action}
                onMouseOver={(e) => {
                  if (!plan.disabled && !loading) {
                    (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                    if (!plan.isPopular) {
                      (e.target as HTMLElement).style.backgroundColor = '#3b82f6';
                      (e.target as HTMLElement).style.color = 'white';
                    }
                  }
                }}
                onMouseOut={(e) => {
                  if (!plan.disabled && !loading) {
                    (e.target as HTMLElement).style.transform = 'translateY(0)';
                    if (!plan.isPopular) {
                      (e.target as HTMLElement).style.backgroundColor = 'white';
                      (e.target as HTMLElement).style.color = '#3b82f6';
                    }
                  }
                }}
              >
                {loading && plan.action ? (
                  <>
                    <Zap style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    Processing...
                  </>
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Indicators */}
      <section style={{ textAlign: 'center', padding: '2rem 1rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
            <Shield style={{ width: '16px', height: '16px' }} />
            <span style={{ fontSize: '0.875rem' }}>SSL Secured</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
            <CheckCircle style={{ width: '16px', height: '16px' }} />
            <span style={{ fontSize: '0.875rem' }}>PayPal Protected</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
            <Star style={{ width: '16px', height: '16px' }} />
            <span style={{ fontSize: '0.875rem' }}>Trusted by Investors</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '2rem 1rem', borderTop: '1px solid #e2e8f0', marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '1rem' }}>
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
          <span style={{ fontWeight: '600' }}>ScamShield</span>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Protecting investors from financial scams with advanced AI analysis
        </p>
      </footer>
    </div>
  );
};

export default Pricing;
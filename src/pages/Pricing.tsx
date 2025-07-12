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
    console.log("handleSubscription called with planType:", planType);
    
    if (!user) {
      console.log("No user found, redirecting to auth");
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe.",
        variant: "destructive",
      });
      window.location.href = '/auth';
      return;
    }

    console.log("User found, proceeding with subscription:", user.id);
    setLoading(true);
    
    try {
      console.log("Calling create-paypal-subscription edge function...");
      const { data, error } = await supabase.functions.invoke("create-paypal-subscription", {
        body: { plan_type: planType },
      });

      console.log("Edge function response:", { data, error });

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      if (data && data.approveUrl) {
        console.log("Opening PayPal approval URL:", data.approveUrl);
        window.open(data.approveUrl, "_blank");
      } else {
        console.error("No approval URL received:", data);
        throw new Error("No approval URL received from PayPal");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log("Setting loading to false");
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
      
      {/* Header matching Home page */}
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
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>ScamShield</h1>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Choose Your Protection Level</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '2rem 1rem', marginBottom: '3rem' }}>
        <h2 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '1.5rem',
          background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Choose Your Protection Level
        </h2>
        <p style={{ fontSize: '1.25rem', color: '#64748b', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          From basic scam detection to comprehensive business protection, 
          we have a plan that fits your investment security needs.
        </p>
      </section>

      {/* Pricing Grid */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '1.5rem',
        maxWidth: '1200px',
        margin: '0 auto 3rem'
      }}>
        {pricingPlans.map((plan) => (
          <div 
            key={plan.name}
            style={{ 
              position: 'relative',
              backgroundColor: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: plan.isPopular 
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: plan.isPopular ? '2px solid #3b82f6' : '1px solid #e2e8f0',
              transform: plan.isPopular ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s',
              cursor: plan.disabled ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={(e) => {
              if (!plan.disabled) {
                e.currentTarget.style.transform = plan.isPopular ? 'scale(1.07)' : 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = plan.isPopular ? 'scale(1.05)' : 'scale(1)';
              e.currentTarget.style.boxShadow = plan.isPopular 
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
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
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <Star style={{ width: '16px', height: '16px' }} />
                Most Popular
              </div>
            )}

            {/* Plan Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
                {plan.name}
              </h3>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span style={{ fontSize: '1rem', color: '#64748b', marginLeft: '4px' }}>{plan.period}</span>
                )}
              </div>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                {plan.description}
              </p>
            </div>

            {/* Features List */}
            <div style={{ marginBottom: '2rem' }}>
              {plan.features.map((feature) => (
                <div key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ color: '#1e293b', fontSize: '0.875rem' }}>{feature}</span>
                </div>
              ))}
              {plan.limitations.map((limitation) => (
                <div key={limitation} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', opacity: 0.7 }}>
                  <X style={{ width: '20px', height: '20px', color: '#64748b', marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{limitation}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              style={{
                width: '100%',
                padding: '1rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                cursor: plan.disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                ...(plan.disabled 
                  ? {
                      backgroundColor: '#f1f5f9',
                      color: '#64748b'
                    }
                  : plan.isPopular 
                    ? {
                        background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
                        color: 'white',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }
                    : {
                        backgroundColor: 'white',
                        color: '#3b82f6',
                        border: '2px solid #3b82f6'
                      }
                )
              }}
              disabled={plan.disabled || loading}
              onClick={plan.action}
              onMouseOver={(e) => {
                if (!plan.disabled && !plan.isPopular) {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseOut={(e) => {
                if (!plan.disabled && !plan.isPopular) {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = '#3b82f6';
                }
              }}
            >
              {loading && plan.action ? (
                <>
                  <Zap style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                  Processing...
                </>
              ) : (
                plan.cta
              )}
            </button>
          </div>
        ))}
      </section>

      {/* Trust Indicators */}
      <section style={{ 
        textAlign: 'center', 
        padding: '2rem 1rem', 
        backgroundColor: '#f1f5f9', 
        borderRadius: '12px',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b' }}>
            <Shield style={{ width: '24px', height: '24px' }} />
            <span style={{ fontWeight: '500' }}>SSL Secured</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b' }}>
            <CheckCircle style={{ width: '24px', height: '24px' }} />
            <span style={{ fontWeight: '500' }}>PayPal Protected</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b' }}>
            <Star style={{ width: '24px', height: '24px' }} />
            <span style={{ fontWeight: '500' }}>Trusted by Investors</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
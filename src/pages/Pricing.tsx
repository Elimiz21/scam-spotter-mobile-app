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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="bg-card border-b border-border rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Investment Protection Plans</h1>
              <p className="text-sm text-muted-foreground">Choose your level of protection</p>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="text-center py-8 mb-8">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Choose Your Protection Level
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From basic scam detection to comprehensive business protection, 
            we have a plan that fits your investment security needs.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="bg-secondary/20 rounded-xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {pricingPlans.map((plan) => (
              <div 
                key={plan.name}
                className={`bg-card rounded-xl p-6 relative transition-all duration-200 hover:-translate-y-1 ${
                  plan.isPopular 
                    ? 'border-2 border-primary shadow-lg shadow-primary/20' 
                    : 'border border-border shadow-md'
                }`}
              >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                    <Star className="w-3 h-3" />
                    Most Popular
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2 text-foreground">
                    {plan.name}
                  </h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-primary">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-base text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <div className="mb-6">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <div key={limitation} className="flex items-start gap-2 mb-2 opacity-60">
                      <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  className={`w-full py-3 px-6 text-base font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    plan.disabled 
                      ? 'bg-secondary text-muted-foreground cursor-not-allowed border border-border' 
                      : plan.isPopular 
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg' 
                        : 'bg-background text-primary border-2 border-primary hover:bg-primary hover:text-primary-foreground'
                  }`}
                  disabled={plan.disabled || loading}
                  onClick={plan.action}
                >
                  {loading && plan.action ? (
                    <>
                      <Zap className="w-4 h-4 animate-spin" />
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
        <section className="text-center py-8">
          <div className="flex justify-center items-center gap-8 flex-wrap">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span className="text-sm">SSL Secured</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">PayPal Protected</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="w-4 h-4" />
              <span className="text-sm">Trusted by Investors</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-border mt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">ScamShield</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Protecting investors from financial scams with advanced AI analysis
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Pricing;
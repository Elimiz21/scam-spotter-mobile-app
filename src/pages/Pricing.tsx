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
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Choose Your Protection Level
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From basic scam detection to comprehensive business protection, 
            we have a plan that fits your investment security needs.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-16">
          {pricingPlans.map((plan) => (
            <div 
              key={plan.name}
              className={`relative bg-card rounded-2xl p-8 border transition-all duration-300 hover:shadow-xl ${
                plan.isPopular 
                  ? 'border-primary shadow-lg ring-2 ring-primary/20 scale-105' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-primary">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-lg text-muted-foreground ml-1">{plan.period}</span>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limitation) => (
                  <div key={limitation} className="flex items-start gap-3 opacity-70">
                    <X className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{limitation}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                className={`w-full py-4 px-6 text-lg font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  plan.disabled 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                    : plan.isPopular 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl' 
                      : 'bg-background text-primary border-2 border-primary hover:bg-primary hover:text-primary-foreground'
                }`}
                disabled={plan.disabled || loading}
                onClick={plan.action}
              >
                {loading && plan.action ? (
                  <>
                    <Zap className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="text-center">
          <div className="flex justify-center items-center gap-12 flex-wrap">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Shield className="w-6 h-6" />
              <span className="font-medium">SSL Secured</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <CheckCircle className="w-6 h-6" />
              <span className="font-medium">PayPal Protected</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Star className="w-6 h-6" />
              <span className="font-medium">Trusted by Investors</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
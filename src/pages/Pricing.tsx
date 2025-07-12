import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, Star, Shield, Zap, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  free_checks_used: number;
  id: string;
}

interface Subscription {
  plan_type: string;
  status: string;
  next_billing_date?: string;
}

const Pricing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      setProfile(profileData);

      // Fetch active subscription
      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .single();

      setSubscription(subscriptionData);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handlePayPerCheck = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase checks.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-paypal-order", {
        body: { payment_type: "pay_per_check" },
      });

      if (error) throw error;

      // Open PayPal in new tab
      if (data.approveUrl) {
        window.open(data.approveUrl, "_blank");
      }
    } catch (error) {
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
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-paypal-subscription", {
        body: { plan_type: planType },
      });

      if (error) throw error;

      // Open PayPal in new tab
      if (data.approveUrl) {
        window.open(data.approveUrl, "_blank");
      }
    } catch (error) {
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
      current: !subscription && (profile?.free_checks_used || 0) < 3,
      cta: `${profile?.free_checks_used || 0}/3 checks used`,
      disabled: true,
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
      current: false,
      cta: "Buy 1 Check",
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
      current: subscription?.plan_type === "premium",
      cta: subscription?.plan_type === "premium" ? "Current Plan" : "Subscribe",
      action: () => handleSubscription("premium"),
      popular: true,
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
      current: subscription?.plan_type === "pro",
      cta: subscription?.plan_type === "pro" ? "Current Plan" : "Subscribe",
      action: () => handleSubscription("pro"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-financial-secondary/10">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        {/* Header Section */}
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Shield className="w-4 h-4 mr-2" />
            Investment Protection Plans
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Choose Your Protection Level
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From basic scam detection to comprehensive business protection, 
            we have a plan that fits your investment security needs.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 max-w-7xl mx-auto mb-20">
          {pricingPlans.map((plan, index) => (
            <Card 
              key={plan.name}
              className={`relative group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
                plan.current 
                  ? "border-primary ring-2 ring-primary/20 shadow-xl bg-gradient-to-br from-card to-primary/5" 
                  : plan.popular 
                    ? "border-primary shadow-lg bg-gradient-to-br from-card to-primary/5 scale-105" 
                    : "border-border hover:border-primary/50 bg-card"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1 text-sm font-semibold shadow-lg">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {/* Current Plan Badge */}
              {plan.current && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground px-4 py-1 text-sm font-semibold shadow-lg">
                    <Shield className="w-3 h-3 mr-1 fill-current" />
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  {plan.period && (
                    <span className="text-lg text-muted-foreground ml-1">{plan.period}</span>
                  )}
                </div>
                <CardDescription className="text-base leading-relaxed">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 px-6">
                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div 
                      key={feature} 
                      className="flex items-start gap-3 group-hover:translate-x-1 transition-transform duration-200"
                      style={{ animationDelay: `${(index * 100) + (idx * 50)}ms` }}
                    >
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation, idx) => (
                    <div 
                      key={limitation} 
                      className="flex items-start gap-3 opacity-60"
                      style={{ animationDelay: `${(index * 100) + (idx * 50)}ms` }}
                    >
                      <X className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground leading-relaxed">{limitation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="pt-6 pb-8 px-6">
                <Button
                  className={`w-full h-12 font-semibold transition-all duration-200 ${
                    plan.current 
                      ? "bg-secondary hover:bg-secondary/80" 
                      : plan.popular 
                        ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl" 
                        : "border-2 hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  }`}
                  variant={plan.current ? "secondary" : plan.popular ? "default" : "outline"}
                  disabled={plan.disabled || plan.current || loading}
                  onClick={plan.action}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      {plan.cta}
                      {!plan.disabled && !plan.current && (
                        <span className="ml-1 group-hover:translate-x-1 transition-transform duration-200">→</span>
                      )}
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Account Status Section */}
        {user && (
          <div className="flex justify-center animate-fade-in">
            <Card className="w-full max-w-lg bg-gradient-to-br from-card to-secondary/10 border-secondary shadow-lg">
              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center gap-2 text-xl">
                  <User className="w-5 h-5 text-primary" />
                  Your Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-background/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Free checks used:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{profile?.free_checks_used || 0}/3</span>
                      <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                          style={{ width: `${((profile?.free_checks_used || 0) / 3) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {subscription && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Current plan:</span>
                        <Badge className="capitalize bg-primary/10 text-primary">
                          {subscription.plan_type}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Status:</span>
                        <Badge 
                          variant={subscription.status === "active" ? "default" : "destructive"}
                          className={subscription.status === "active" ? "bg-financial-accent text-white" : ""}
                        >
                          {subscription.status}
                        </Badge>
                      </div>
                      {subscription.next_billing_date && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Next billing:</span>
                          <span className="font-medium text-foreground">
                            {new Date(subscription.next_billing_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="mt-20 text-center">
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>PayPal Protected</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4" />
              <span>Trusted by Investors</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
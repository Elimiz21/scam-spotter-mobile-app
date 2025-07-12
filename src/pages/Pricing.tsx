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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Shield className="w-4 h-4 mr-2" />
            Investment Protection Plans
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Choose Your Protection Level
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From basic scam detection to comprehensive business protection, 
            we have a plan that fits your investment security needs.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 max-w-7xl mx-auto mb-16">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative transition-all duration-300 hover:shadow-lg ${
                plan.current 
                  ? "border-primary ring-2 ring-primary/20 shadow-md" 
                  : plan.popular 
                    ? "border-primary shadow-md scale-105" 
                    : "border-border hover:border-primary/50"
              }`}
            >
              {/* Badges */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {plan.current && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-secondary text-secondary-foreground px-3 py-1">
                    <Shield className="w-3 h-3 mr-1" />
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold mb-3">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  {plan.period && (
                    <span className="text-lg text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <div key={limitation} className="flex items-start gap-3 opacity-60">
                      <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="px-6 pb-6">
                <Button
                  className="w-full h-11 font-medium"
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
                    plan.cta
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Account Status */}
        {user && (
          <div className="flex justify-center">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Your Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Free checks used:</span>
                  <span className="font-medium">{profile?.free_checks_used || 0}/3</span>
                </div>
                
                {subscription && (
                  <>
                    <div className="flex justify-between items-center">
                      <span>Current plan:</span>
                      <Badge className="capitalize">{subscription.plan_type}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Status:</span>
                      <Badge variant={subscription.status === "active" ? "default" : "destructive"}>
                        {subscription.status}
                      </Badge>
                    </div>
                    {subscription.next_billing_date && (
                      <div className="flex justify-between items-center">
                        <span>Next billing:</span>
                        <span className="font-medium">
                          {new Date(subscription.next_billing_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              SSL Secured
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              PayPal Protected
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Trusted by Investors
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
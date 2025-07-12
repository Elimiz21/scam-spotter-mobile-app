import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  const orderId = searchParams.get("order_id");
  const subscriptionId = searchParams.get("subscription_id");

  useEffect(() => {
    if ((orderId || subscriptionId) && user) {
      verifyPayment();
    }
  }, [orderId, subscriptionId, user]);

  const verifyPayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: { 
          order_id: orderId,
          subscription_id: subscriptionId 
        },
      });

      if (error) throw error;

      if (data.success) {
        setVerified(true);
        toast({
          title: "Payment Successful!",
          description: data.message,
        });
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Please contact support if payment was processed.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              {verifying ? (
                <>
                  <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                  <CardTitle>Verifying Payment...</CardTitle>
                  <CardDescription>
                    Please wait while we confirm your payment
                  </CardDescription>
                </>
              ) : verified ? (
                <>
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <CardTitle>Payment Successful!</CardTitle>
                  <CardDescription>
                    {orderId ? "Your check credit has been added to your account" : "Your subscription is now active"}
                  </CardDescription>
                </>
              ) : (
                <>
                  <CardTitle>Payment Processing</CardTitle>
                  <CardDescription>
                    Your payment is being processed. Please check back in a few minutes.
                  </CardDescription>
                </>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  {orderId ? (
                    <>Payment ID: {orderId}</>
                  ) : subscriptionId ? (
                    <>Subscription ID: {subscriptionId}</>
                  ) : (
                    "Processing payment details..."
                  )}
                </p>
                
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link to="/analyze">Start Analyzing</Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/pricing">View Pricing</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;
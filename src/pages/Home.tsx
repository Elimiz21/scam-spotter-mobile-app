import { Shield, AlertTriangle, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">ScamShield</h1>
                <p className="text-sm text-muted-foreground">Investment Protection</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Protect Your Investments from Financial Scams
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Analyze investment groups and opportunities with advanced AI-powered risk assessment. 
              Get instant alerts for potential scams before it's too late.
            </p>
            <Button 
              onClick={() => navigate('/analyze')}
              className="btn-financial text-lg px-8 py-4 mb-12"
            >
              Start Group Analysis
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h3 className="text-2xl font-bold text-center mb-12">How ScamShield Protects You</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <Card className="card-elevated text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-lg">Scammer Database</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Cross-reference group members against known scammer databases and blacklists
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-elevated text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">Language Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AI analysis of group communications for manipulation tactics and scam language patterns
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-elevated text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <CardTitle className="text-lg">Price Manipulation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Detection of artificial price pumps and suspicious trading activity patterns
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-elevated text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-lg">Asset Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Verify the existence and legitimacy of promoted assets and investment opportunities
                </CardDescription>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Ready to Analyze a Group?</h3>
            <p className="text-muted-foreground mb-8">
              Start protecting your investments today with our comprehensive scam detection system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/analyze')}
                className="btn-financial"
              >
                Analyze Investment Group
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/how-it-works')}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Learn How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">ScamShield</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Protecting investors from financial scams with advanced AI analysis
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
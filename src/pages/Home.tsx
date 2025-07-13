import { Shield } from "lucide-react";
import Navigation from "../components/Navigation";
import LegalDisclaimer from "../components/LegalDisclaimer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Home = () => {
  return (
    <div className="min-h-screen p-5 bg-background">
      <Navigation />
      {/* Simple Header */}
      <header className="border-b bg-card p-4 rounded-lg mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">ScamShield</h1>
            <p className="text-sm text-muted-foreground">Investment Protection</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center py-16 px-4">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Protect Your Investments from Financial Scams
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          Analyze investment groups and opportunities with advanced AI-powered risk assessment. 
          Get instant alerts for potential scams before it's too late.
        </p>
        <Button 
          size="lg" 
          className="px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          onClick={() => window.location.href = '/analyze'}
        >
          Start Group Analysis
        </Button>
      </section>

      {/* Features Grid */}
      <section className="py-12 px-4 bg-muted/30 rounded-xl">
        <h3 className="text-3xl font-bold text-center mb-12">
          How ScamShield Protects You
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          
          <Card className="text-center h-full flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-destructive/20">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl">
                🚨
              </div>
              <h4 className="text-lg font-semibold mb-2">Scammer Database</h4>
              <p className="text-muted-foreground text-sm mb-4 flex-1">
                Cross-reference group members against known scammer databases and blacklists
              </p>
              <Button
                onClick={() => window.location.href = '/check?type=scammer-database'}
                variant="destructive"
                className="w-full mt-auto"
              >
                Check Now
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center h-full flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/20">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl">
                👥
              </div>
              <h4 className="text-lg font-semibold mb-2">Language Analysis</h4>
              <p className="text-muted-foreground text-sm mb-4 flex-1">
                AI analysis of group communications for manipulation tactics and scam language patterns
              </p>
              <Button
                onClick={() => window.location.href = '/check?type=language-analysis'}
                className="w-full mt-auto"
              >
                Check Now
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center h-full flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-amber-500/20">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl">
                📈
              </div>
              <h4 className="text-lg font-semibold mb-2">Price Manipulation</h4>
              <p className="text-muted-foreground text-sm mb-4 flex-1">
                Detection of artificial price pumps and suspicious trading activity patterns
              </p>
              <Button
                onClick={() => window.location.href = '/check?type=price-manipulation'}
                variant="secondary"
                className="w-full mt-auto"
              >
                Check Now
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center h-full flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-green-500/20">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl">
                🛡️
              </div>
              <h4 className="text-lg font-semibold mb-2">Asset Verification</h4>
              <p className="text-muted-foreground text-sm mb-4 flex-1">
                Verify the existence and legitimacy of promoted assets and investment opportunities
              </p>
              <Button
                onClick={() => window.location.href = '/check?type=asset-verification'}
                variant="outline"
                className="w-full mt-auto"
              >
                Check Now
              </Button>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Legal Disclaimer */}
      <div className="my-8">
        <LegalDisclaimer variant="full" />
      </div>

      {/* Footer */}
      <footer className="text-center py-8 px-4 border-t mt-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">ScamShield</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Protecting investors from financial scams with advanced AI analysis
        </p>
        <LegalDisclaimer variant="compact" />
      </footer>
    </div>
  );
};

export default Home;
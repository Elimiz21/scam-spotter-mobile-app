import { Shield } from "lucide-react";
import Navigation from "../components/Navigation";
import LegalDisclaimer from "../components/LegalDisclaimer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4">
        <Navigation />
        
        {/* Hero Header */}
        <header className="text-center py-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                ScamShield
              </h1>
              <p className="text-muted-foreground">Investment Protection Platform</p>
            </div>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
            Protect Your Investments<br />
            <span className="text-primary">from Financial Scams</span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Advanced AI-powered risk assessment to analyze investment groups and opportunities. 
            Get instant alerts for potential scams before it's too late.
          </p>
          
          <Button 
            size="lg" 
            className="px-12 py-6 text-xl font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 rounded-xl"
            onClick={() => window.location.href = '/analyze'}
          >
            Start Analysis Now
          </Button>
        </header>

        {/* Features Section */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              How ScamShield <span className="text-primary">Protects You</span>
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive analysis covers multiple risk vectors to keep your investments safe
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            
            {/* Scammer Database Card */}
            <Card className="group relative overflow-hidden border-2 border-destructive/20 hover:border-destructive/40 bg-gradient-to-br from-card to-destructive/5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <CardContent className="p-8 text-center h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-destructive to-destructive/80 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  🚨
                </div>
                <h4 className="text-xl font-bold mb-4 text-foreground">Scammer Database</h4>
                <p className="text-muted-foreground mb-8 flex-1 leading-relaxed">
                  Cross-reference group members against known scammer databases and global blacklists
                </p>
                <Button
                  onClick={() => window.location.href = '/check?type=scammer-database'}
                  variant="destructive"
                  className="w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Check Database
                </Button>
              </CardContent>
            </Card>

            {/* Language Analysis Card */}
            <Card className="group relative overflow-hidden border-2 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-card to-primary/5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <CardContent className="p-8 text-center h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  👥
                </div>
                <h4 className="text-xl font-bold mb-4 text-foreground">Language Analysis</h4>
                <p className="text-muted-foreground mb-8 flex-1 leading-relaxed">
                  AI analysis of group communications for manipulation tactics and scam language patterns
                </p>
                <Button
                  onClick={() => window.location.href = '/check?type=language-analysis'}
                  className="w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Analyze Language
                </Button>
              </CardContent>
            </Card>

            {/* Price Manipulation Card */}
            <Card className="group relative overflow-hidden border-2 border-amber-500/20 hover:border-amber-500/40 bg-gradient-to-br from-card to-amber-500/5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <CardContent className="p-8 text-center h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  📈
                </div>
                <h4 className="text-xl font-bold mb-4 text-foreground">Price Manipulation</h4>
                <p className="text-muted-foreground mb-8 flex-1 leading-relaxed">
                  Detection of artificial price pumps and suspicious trading activity patterns
                </p>
                <Button
                  onClick={() => window.location.href = '/check?type=price-manipulation'}
                  variant="secondary"
                  className="w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-amber-500/20 hover:border-amber-500/40"
                >
                  Check Prices
                </Button>
              </CardContent>
            </Card>

            {/* Asset Verification Card */}
            <Card className="group relative overflow-hidden border-2 border-green-500/20 hover:border-green-500/40 bg-gradient-to-br from-card to-green-500/5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <CardContent className="p-8 text-center h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  🛡️
                </div>
                <h4 className="text-xl font-bold mb-4 text-foreground">Asset Verification</h4>
                <p className="text-muted-foreground mb-8 flex-1 leading-relaxed">
                  Verify the existence and legitimacy of promoted assets and investment opportunities
                </p>
                <Button
                  onClick={() => window.location.href = '/check?type=asset-verification'}
                  variant="outline"
                  className="w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-green-500/20 hover:border-green-500/40"
                >
                  Verify Assets
                </Button>
              </CardContent>
            </Card>

          </div>
        </section>
      </div>

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
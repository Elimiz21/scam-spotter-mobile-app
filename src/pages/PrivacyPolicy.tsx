import Navigation from "@/components/Navigation";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-card rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-4 mb-8">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          </div>
          
          <div className="flex gap-4 mb-8">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                const element = document.createElement('a');
                const content = document.querySelector('.policy-content')?.textContent || '';
                const file = new Blob([content], { type: 'text/plain' });
                element.href = URL.createObjectURL(file);
                element.download = 'privacy-policy.txt';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                const content = document.querySelector('.policy-content')?.innerHTML || '';
                const newWindow = window.open('', '_blank');
                if (newWindow) {
                  newWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>Privacy Policy - Scam Dunk</title>
                      <style>
                        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                        h2 { color: #555; margin-top: 30px; }
                        h3 { color: #666; }
                      </style>
                    </head>
                    <body>
                      <h1>Privacy Policy</h1>
                      ${content}
                    </body>
                    </html>
                  `);
                  newWindow.document.close();
                }
              }}
            >
              <FileText className="w-4 h-4" />
              View HTML Version
            </Button>
          </div>
          
          <div className="prose prose-lg max-w-none text-foreground policy-content">
            <div className="space-y-6">
              <section>
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Effective Date:</strong> [Insert Date]<br />
                  <strong>Website:</strong> www.scamshiel.com<br />
                  <strong>Owner:</strong> Scam Dunk
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
                <p>Scam Dunk ("we," "our," or "us") operates the website www.scamshiel.com, which helps users detect potential pump-and-dump scams in stocks and WhatsApp groups. This Privacy Policy outlines how we collect, use, and protect your information.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
                <h3 className="text-lg font-medium text-foreground mb-2">a. Personal Information</h3>
                <p className="mb-3">- Email addresses (submitted via forms or newsletter subscriptions)</p>
                
                <h3 className="text-lg font-medium text-foreground mb-2">b. Non-Personal Information</h3>
                <div className="space-y-1">
                  <p>- Browser type, IP address, and device information</p>
                  <p>- User behavior on the site (via analytics tools)</p>
                  <p>- Cookies and session data</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
                <p className="mb-2">We use your information to:</p>
                <div className="space-y-1">
                  <p>- Improve our website functionality and content</p>
                  <p>- Send scam alerts or updates (if you've subscribed)</p>
                  <p>- Analyze user activity and protect against misuse</p>
                  <p>- Comply with legal obligations</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Cookies and Tracking Technologies</h2>
                <p className="mb-2">We use cookies and similar technologies for:</p>
                <div className="space-y-1">
                  <p>- Performance and analytics (e.g., Google Analytics)</p>
                  <p>- Remembering user preferences</p>
                  <p>- Enhancing website security</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Sharing of Information</h2>
                <p className="mb-2">We do not sell your personal data. We may share information:</p>
                <div className="space-y-1">
                  <p>- With trusted service providers for analytics or email campaigns</p>
                  <p>- To comply with law enforcement or legal processes</p>
                  <p>- In the event of a business transfer (e.g., acquisition)</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Data Retention</h2>
                <p>We retain your data only for as long as necessary for the purposes stated in this policy or as required by law.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Your Rights</h2>
                <p className="mb-2">You have the right to:</p>
                <div className="space-y-1">
                  <p>- Request access or correction of your personal data</p>
                  <p>- Request deletion of your data (see our Data Deletion Policy)</p>
                  <p>- Opt out of email communications at any time</p>
                </div>
                <p className="mt-3">To exercise these rights, contact us at:</p>
                <p className="font-semibold text-primary">privacy@scamshiel.com</p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
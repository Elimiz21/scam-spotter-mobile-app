import Navigation from "@/components/Navigation";
import { Download, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const DataDeletionPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-card rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-4 mb-8">
            <Trash2 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Data Deletion Policy</h1>
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
                element.download = 'data-deletion-policy.txt';
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
                      <title>Data Deletion Policy - Scam Dunk</title>
                      <style>
                        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                        h2 { color: #555; margin-top: 30px; }
                        h3 { color: #666; }
                      </style>
                    </head>
                    <body>
                      <h1>Data Deletion Policy</h1>
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
                <p className="text-muted-foreground mb-4">
                  - Opt out of email communications at any time
                </p>
                <p>To exercise these rights, contact us at:</p>
                <p className="font-semibold text-primary">privacy@scamshiel.com</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Third-Party Services</h2>
                <p>We may use services like Google Analytics or email marketing platforms that collect anonymized user data. These services are governed by their own privacy policies.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Data Security</h2>
                <p>We implement industry-standard security practices to protect your data. However, no method of transmission is 100% secure.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
                <p>We may update this Privacy Policy at any time. Any changes will be posted on this page with an updated revision date.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact Us</h2>
                <p>If you have questions or requests about this Privacy Policy or your data, contact:</p>
                <p className="font-semibold text-primary">privacy@scamshiel.com</p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDeletionPolicy;
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import Navigation from "@/components/Navigation";

const TermsOfService = () => {
  const downloadAsText = () => {
    const element = document.getElementById('terms-content');
    if (element) {
      const text = element.innerText;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scam_dunk_terms_of_service.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const viewAsHTML = () => {
    const element = document.getElementById('terms-content');
    if (element) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Scam Dunk Terms of Service</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #555; margin-top: 30px; }
            p { margin-bottom: 15px; }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
        </html>
      `;
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
            <div className="flex gap-2">
              <Button onClick={downloadAsText} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download TXT
              </Button>
              <Button onClick={viewAsHTML} variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                View HTML
              </Button>
            </div>
          </div>
          
          <div id="terms-content" className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-lg font-semibold mb-6">Effective Date: July 30, 2025</p>
            
            <p className="mb-6">
              Welcome to Scam Dunk ("we", "our", or "us"). These Terms of Service ("Terms") govern your access to and use of our website and application that assess the risk of stocks being involved in pump-and-dump scams ("Service"). By accessing or using our Service, you agree to be bound by these Terms.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">1. Use of the Service</h2>
            <p className="mb-4">
              You must be at least 18 years old to use the Service. You agree to use the Service only for lawful purposes and in compliance with all applicable laws.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. No Investment Advice</h2>
            <p className="mb-4">
              The information provided by the Service is for informational purposes only. It does not constitute financial, investment, or legal advice. You should consult with a qualified professional before making any investment decisions.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. Accuracy of Information</h2>
            <p className="mb-4">
              We strive to provide accurate and up-to-date information but do not guarantee the completeness, accuracy, or reliability of any content provided by the Service.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. User Responsibilities</h2>
            <p className="mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree not to misuse the Service or attempt to interfere with its proper functioning.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. Intellectual Property</h2>
            <p className="mb-4">
              All content and software on the Service are the property of Scam Dunk and are protected by copyright and other intellectual property laws. You may not copy, modify, distribute, or reverse-engineer any part of the Service without prior written consent.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
            <p className="mb-4">
              To the maximum extent permitted by law, we disclaim all warranties and shall not be liable for any indirect, incidental, or consequential damages arising out of or related to your use of the Service.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">7. Termination</h2>
            <p className="mb-4">
              We reserve the right to suspend or terminate your access to the Service at our sole discretion, without notice or liability, for any reason, including breach of these Terms.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">8. Changes to Terms</h2>
            <p className="mb-4">
              We may update these Terms from time to time. Continued use of the Service after any changes constitutes your acceptance of the new Terms.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">9. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us at support@scamdunk.com.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
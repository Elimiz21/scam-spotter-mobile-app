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
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              View HTML Version
            </Button>
          </div>
          
          <div className="prose prose-lg max-w-none">
            <div className="text-muted-foreground">
              <p>Data deletion policy content will be loaded here...</p>
              <p>Please upload your data deletion policy HTML and PDF files to display them on this page.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDeletionPolicy;
import { useState } from "react";
import { AlertTriangle, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LegalDisclaimerProps {
  variant?: "compact" | "full" | "results";
  className?: string;
}

export const LegalDisclaimer = ({ variant = "compact", className = "" }: LegalDisclaimerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed && variant === "compact") return null;

  const disclaimerContent = {
    compact: "Not investment advice. For informational purposes only.",
    full: `ScamShield provides risk analysis tools for informational and educational purposes only. This service does not constitute investment advice, financial advice, trading advice, or any other sort of advice. The analysis results should not be relied upon as the sole basis for investment decisions. All investments carry risk, and past performance does not guarantee future results.`,
    results: `IMPORTANT DISCLAIMER: The risk analysis provided by ScamShield is for informational purposes only and should not be considered as investment advice, financial advice, or a recommendation to buy, sell, or hold any asset. The accuracy of our analysis cannot be guaranteed, and users should conduct their own research and consult with qualified financial advisors before making investment decisions. ScamShield and its operators disclaim all liability for any losses or damages arising from the use of this analysis.`
  };

  if (variant === "full") {
    return (
      <Card className={`bg-muted/30 border-border ${className}`}>
        <div className="p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-foreground mb-1">
                Legal Disclaimer
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {disclaimerContent.full}
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === "results") {
    return (
      <Card className={`bg-destructive/5 border-destructive/20 ${className}`}>
        <div className="p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-destructive mb-1">
                Risk Analysis Disclaimer
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {disclaimerContent.results}
              </p>
              <div className="mt-2 p-2 bg-destructive/10 rounded border border-destructive/20">
                <p className="text-xs text-destructive font-medium">
                  ⚠️ FALSE POSITIVES AND NEGATIVES: Our analysis may incorrectly flag legitimate opportunities as risky or fail to detect actual scams. Always verify information independently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Compact variant - appears as a small banner
  return (
    <div className={`bg-muted/30 border-l-2 border-primary px-3 py-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="h-3 w-3 text-primary" />
          <p className="text-xs text-muted-foreground">
            {disclaimerContent.compact}
          </p>
          {!isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="text-xs p-0.5 h-auto text-primary hover:text-primary/80"
            >
              Read more
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDismissed(true)}
          className="p-0.5 h-auto text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {disclaimerContent.full}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-xs p-0.5 h-auto text-primary hover:text-primary/80 mt-1"
          >
            Collapse
          </Button>
        </div>
      )}
    </div>
  );
};

export default LegalDisclaimer;
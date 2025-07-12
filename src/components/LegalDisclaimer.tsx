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
      <Card className={`border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 ${className}`}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                Important Legal Disclaimer
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                {disclaimerContent.full}
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed mt-2">
                <strong>No Liability:</strong> ScamShield and its operators accept no responsibility for any investment losses, damages, or consequences arising from the use of our analysis tools. Users acknowledge that all investment decisions are made at their own risk.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === "results") {
    return (
      <Card className={`border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 ${className}`}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                Critical Risk Analysis Disclaimer
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                {disclaimerContent.results}
              </p>
              <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-md">
                <p className="text-xs text-red-700 dark:text-red-300 font-medium">
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
    <div className={`bg-slate-100 dark:bg-slate-800 border-l-4 border-blue-500 px-4 py-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <p className="text-xs text-slate-700 dark:text-slate-300">
            {disclaimerContent.compact}
          </p>
          {!isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="text-xs p-1 h-auto text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              Read full disclaimer
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDismissed(true)}
          className="p-1 h-auto text-slate-500 hover:text-slate-700"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {disclaimerContent.full}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-xs p-1 h-auto text-blue-600 hover:text-blue-800 dark:text-blue-400 mt-1"
          >
            Collapse
          </Button>
        </div>
      )}
    </div>
  );
};

export default LegalDisclaimer;
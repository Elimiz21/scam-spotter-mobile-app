import { LanguageAnalysisResult } from './types';
import { supabase } from '@/integrations/supabase/client';

export class LanguageAnalysisService {
  async analyzeLanguagePatterns(chatText: string): Promise<LanguageAnalysisResult> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-language-analysis', {
        body: { chatText }
      });

      if (error) {
        console.error('AI analysis function error:', error);
        return this.performBasicLanguageAnalysis(chatText);
      }

      if (data.error) {
        console.warn('AI analysis unavailable:', data.error);
        return this.performBasicLanguageAnalysis(chatText);
      }

      // Convert the response to match our expected format
      return {
        riskScore: data.riskScore || 0,
        manipulationIndicators: data.riskFactors || [],
        sentimentScore: (data.sentimentScore || 0) / 100, // Convert to 0-1 scale
        suspiciousPhrases: data.suspiciousPhrases || []
      };
    } catch (error) {
      console.error('Language analysis failed:', error);
      return this.performBasicLanguageAnalysis(chatText);
    }
  }

  private performBasicLanguageAnalysis(text: string): LanguageAnalysisResult {
    const suspiciousPhrases = [
      'guaranteed returns', 'risk-free', 'urgent', 'limited time',
      'act now', 'exclusive opportunity', 'easy money', 'get rich quick',
      'double your money', 'insider information'
    ];

    const manipulationTactics = [
      'urgency pressure', 'FOMO tactics', 'exclusivity claims',
      'guaranteed profits', 'emotional manipulation'
    ];

    const foundPhrases = suspiciousPhrases.filter(phrase => 
      text.toLowerCase().includes(phrase.toLowerCase())
    );

    const foundTactics = manipulationTactics.filter(tactic => {
      switch (tactic) {
        case 'urgency pressure':
          return /urgent|hurry|limited|act now|deadline/i.test(text);
        case 'FOMO tactics':
          return /exclusive|limited|don't miss|last chance/i.test(text);
        case 'guaranteed profits':
          return /guaranteed|100%|risk-free|sure thing/i.test(text);
        default:
          return false;
      }
    });

    const riskScore = Math.min(100, (foundPhrases.length * 15) + (foundTactics.length * 20));
    const sentimentScore = foundPhrases.length > 0 ? 0.8 : 0.3;

    return {
      riskScore,
      manipulationIndicators: foundTactics,
      sentimentScore,
      suspiciousPhrases: foundPhrases
    };
  }

  private getMockLanguageAnalysis(text: string): LanguageAnalysisResult {
    // Enhanced mock analysis based on text content
    return this.performBasicLanguageAnalysis(text);
  }
}
import { LanguageAnalysisResult } from './types';

export class LanguageAnalysisService {
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeLanguagePatterns(chatText: string): Promise<LanguageAnalysisResult> {
    if (!this.apiKey) {
      // Return mock data if no API key provided
      return this.getMockLanguageAnalysis(chatText);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a scam detection expert. Analyze the following chat messages for manipulation tactics, urgency patterns, and suspicious language. Return a JSON response with:
              - riskScore (0-100)
              - manipulationIndicators (array of strings)
              - sentimentScore (0-1)
              - suspiciousPhrases (array of strings)
              
              Focus on: urgency tactics, too-good-to-be-true promises, pressure to invest quickly, guaranteed returns, FOMO tactics, grammatical inconsistencies, and emotional manipulation.`
            },
            {
              role: 'user',
              content: chatText
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;
      
      // Parse the JSON response from OpenAI
      try {
        const analysis = JSON.parse(analysisText);
        return {
          riskScore: Math.min(100, Math.max(0, analysis.riskScore || 50)),
          manipulationIndicators: analysis.manipulationIndicators || [],
          sentimentScore: Math.min(1, Math.max(0, analysis.sentimentScore || 0.5)),
          suspiciousPhrases: analysis.suspiciousPhrases || []
        };
      } catch (parseError) {
        // Fallback to pattern-based analysis if JSON parsing fails
        return this.performBasicLanguageAnalysis(chatText);
      }
    } catch (error) {
      console.error('Language analysis error:', error);
      return this.getMockLanguageAnalysis(chatText);
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
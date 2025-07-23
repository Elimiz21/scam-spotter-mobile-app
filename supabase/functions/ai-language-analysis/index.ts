import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chatText } = await req.json();

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'AI analysis not available - API key not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a financial scam detection expert. Analyze the provided chat messages for scam indicators and manipulation tactics. Return your analysis as a JSON object with the following structure:
            {
              "riskScore": number (0-100),
              "manipulationIndicators": {
                "urgency": number (0-100),
                "exclusivity": number (0-100), 
                "guarantees": number (0-100),
                "socialProof": number (0-100),
                "authority": number (0-100)
              },
              "sentimentScore": number (-100 to 100),
              "suspiciousPhrases": string[],
              "riskFactors": string[],
              "overallAssessment": string
            }`
          },
          { role: 'user', content: `Analyze this chat content for scam indicators: ${chatText}` }
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      // Fallback to basic analysis
      analysisResult = {
        riskScore: chatText.toLowerCase().includes('guaranteed') ? 75 : 25,
        manipulationIndicators: {
          urgency: chatText.toLowerCase().includes('act fast') ? 80 : 20,
          exclusivity: chatText.toLowerCase().includes('exclusive') ? 70 : 15,
          guarantees: chatText.toLowerCase().includes('guaranteed') ? 90 : 10,
          socialProof: chatText.toLowerCase().includes('everyone') ? 60 : 20,
          authority: chatText.toLowerCase().includes('expert') ? 65 : 25
        },
        sentimentScore: 30,
        suspiciousPhrases: [],
        riskFactors: ['AI analysis parsing failed - using basic detection'],
        overallAssessment: 'Basic analysis performed due to parsing error'
      };
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-language-analysis function:', error);
    return new Response(JSON.stringify({ 
      error: 'Analysis failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
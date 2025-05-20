export interface RecommendationResult {
  insights: string[];
  recommendations: string[];
  detailedReasoning?: string;
}

const RECOMMENDATION_PROMPT = `You are a customer service improvement agent. Given the following analysis report and the original chatlogs, provide:
- Actionable insights (what does the analysis reveal?).
- Concrete recommendations for improving customer service.
- A detailed reasoning for your suggestions.

Respond in JSON with keys: insights, recommendations, detailedReasoning.`;

export async function generateRecommendations(
  apiKey: string,
  modelId: string,
  input: { chatlogs: any[]; analysis: any }
): Promise<RecommendationResult> {
  const prompt = `${RECOMMENDATION_PROMPT}\n\nAnalysis Report:\n${JSON.stringify(input.analysis, null, 2)}\n\nChatlogs:\n${JSON.stringify(input.chatlogs, null, 2)}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
      })
    }
  );

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  try {
    return JSON.parse(text);
  } catch {
    return { insights: ["Could not parse recommendations."], recommendations: [], detailedReasoning: text };
  }
} 
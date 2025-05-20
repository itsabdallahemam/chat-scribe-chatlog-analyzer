export interface AnalysisResult {
  summary: string;
  trends: string[];
  correlations: string[];
  anomalies?: string[];
  detailedReport?: string;
}

const ANALYSIS_PROMPT = `You are a data analysis agent. Given a list of customer service chat logs (with metadata such as scenario, shift, dateTime, and evaluation scores), analyze the data and provide:
- A concise summary of overall patterns.
- Notable trends (e.g., time-of-day effects, scenario frequency, escalation rates).
- Any correlations between metrics (e.g., politeness vs. resolution).
- Any anomalies or outliers.
- A detailed report for further review by another agent.

Respond in JSON with keys: summary, trends, correlations, anomalies, detailedReport.`;

export async function analyzeChatlogs(
  apiKey: string,
  modelId: string,
  chatlogs: any[]
): Promise<AnalysisResult> {
  const chatlogData = chatlogs.map(log => ({
    scenario: log.scenario,
    shift: log.shift,
    dateTime: log.dateTime,
    coherence: log.coherence,
    politeness: log.politeness,
    relevance: log.relevance,
    resolution: log.resolution,
    escalated: log.escalated,
  }));

  const prompt = `${ANALYSIS_PROMPT}\n\nData:\n${JSON.stringify(chatlogData, null, 2)}`;

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
    return { summary: "Could not parse analysis.", trends: [], correlations: [], detailedReport: text };
  }
} 
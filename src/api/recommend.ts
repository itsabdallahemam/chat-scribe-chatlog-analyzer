import { GoogleGenerativeAI } from '@google/generative-ai';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model, temperature, maxOutputTokens } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model: model || 'gemini-pro' });

    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: temperature || 0.7,
        maxOutputTokens: maxOutputTokens || 1024,
      },
    });

    const response = result.response;
    const text = response.text();

    try {
      // Parse the response as JSON
      const recommendationResult = JSON.parse(text);
      return res.status(200).json(recommendationResult);
    } catch (parseError) {
      console.error('Error parsing model response:', parseError);
      return res.status(500).json({ error: 'Failed to parse model response' });
    }
  } catch (error) {
    console.error('Error in recommend endpoint:', error);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
} 